import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { GameState } from './types';

// Compressed HoT for sync
export interface CompressedHoT {
  id: string;
  spellId: string;
  spellName: string;
  icon: string;
  rem: number; // remaining duration
  max: number; // max duration
}

// Compressed Buff for sync (Power Infusion, etc.)
export interface CompressedBuff {
  id: string;
  name: string;
  icon: string;
  dur: number; // duration
}

// Compressed Debuff for sync
export interface CompressedDebuff {
  id: string;
  name: string;
  icon: string;
  type: string;
  dur: number; // remaining duration
  max: number; // max duration
}

// Compressed state for network efficiency
export interface CompressedGameState {
  // Raid health - just the numbers by member index
  rh: number[]; // raid health array
  rm: number[]; // raid max health array
  rd: boolean[]; // raid dead status

  // Boss state
  bh: number; // boss health
  bmh: number; // boss max health
  bp: number; // boss phase
  be: boolean; // boss enraged

  // Timing
  t: number; // elapsed time
  r: boolean; // isRunning

  // Recent heals for combat log (last 1 second)
  hl: CompressedHealEvent[];

  // All players' casting state and stats
  ps: PlayerSyncState[];

  // Living Bomb safe zone - member IDs in safe zone
  sz: string[];

  // HoTs on raid members - sparse array (only indices with HoTs)
  hots?: { [index: number]: CompressedHoT[] };

  // Debuffs on raid members - sparse array (only indices with debuffs)
  debuffs?: { [index: number]: CompressedDebuff[] };

  // Absorb shields on raid members - sparse array (only indices with shields)
  shields?: { [index: number]: { current: number; max: number } };

  // Weakened Soul debuff duration - sparse array (for PW:Shield cooldown display)
  weakenedSoul?: { [index: number]: number };

  // Buffs on raid members - sparse array (Power Infusion, etc.)
  buffs?: { [index: number]: CompressedBuff[] };

  // Innervate availability (cooldown of first available druid, -1 if none)
  innervateCd?: number;
}

export interface CompressedHealEvent {
  pid: string; // player id who healed
  tid: number; // target index in raid
  a: number; // amount
  s: string; // spell name
  c: boolean; // crit
  o: number; // overheal
}

export interface PlayerSyncState {
  id: string;
  name: string;
  class: string;
  mana: number;
  maxMana: number;
  casting: boolean;
  spellName: string | null;
  castProgress: number;
  healingDone: number;
  overhealing: number;
}

export interface PlayerAction {
  type: 'cast_spell' | 'cancel_cast' | 'select_target' | 'use_ability' | 'evacuate_to_safe_zone' | 'request_innervate';
  playerId: string;
  spellId?: string;
  targetId?: string;
  memberId?: string; // For evacuate_to_safe_zone
  timestamp: number;
}

export type NetworkRole = 'host' | 'client';

export class NetworkController {
  private channel: RealtimeChannel | null = null;
  private role: NetworkRole = 'client';
  private localPlayerId: string = '';
  private broadcastInterval: number | null = null;

  // Callbacks
  private onStateUpdate: ((state: CompressedGameState) => void) | null = null;
  private onPlayerAction: ((action: PlayerAction) => void) | null = null;
  private onPlayerJoin: ((playerId: string, playerName: string) => void) | null = null;
  private onPlayerLeave: ((playerId: string) => void) | null = null;

  constructor() {}

  /**
   * Join a multiplayer game room
   */
  async joinRoom(
    roomCode: string,
    playerId: string,
    isHost: boolean
  ): Promise<boolean> {
    this.localPlayerId = playerId;
    this.role = isHost ? 'host' : 'client';

    // Create realtime channel for this room
    this.channel = supabase.channel(`game:${roomCode}`, {
      config: {
        broadcast: {
          self: false, // Don't receive own broadcasts
        },
      },
    });

    // Subscribe to game state updates (host → clients)
    this.channel.on('broadcast', { event: 'game_state' }, (payload) => {
      if (this.role === 'client' && this.onStateUpdate) {
        this.onStateUpdate(payload.payload as CompressedGameState);
      }
    });

    // Subscribe to player actions (clients → host)
    this.channel.on('broadcast', { event: 'player_action' }, (payload) => {
      if (this.role === 'host' && this.onPlayerAction) {
        this.onPlayerAction(payload.payload as PlayerAction);
      }
    });

    // Subscribe to player presence
    this.channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      if (this.onPlayerJoin) {
        for (const presence of newPresences) {
          if (presence.playerId !== this.localPlayerId) {
            this.onPlayerJoin(presence.playerId, presence.playerName);
          }
        }
      }
    });

    this.channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      if (this.onPlayerLeave) {
        for (const presence of leftPresences) {
          this.onPlayerLeave(presence.playerId);
        }
      }
    });

    // Subscribe and track presence
    let subscribed = false;
    await this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        subscribed = true;
        // Track our presence
        await this.channel?.track({
          playerId: this.localPlayerId,
          online_at: new Date().toISOString(),
        });
      }
    });

    return subscribed;
  }

  /**
   * Leave the current room
   */
  async leaveRoom(): Promise<void> {
    this.stopBroadcasting();
    if (this.channel) {
      await supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  /**
   * Set callback for receiving state updates (client only)
   */
  setOnStateUpdate(callback: (state: CompressedGameState) => void): void {
    this.onStateUpdate = callback;
  }

  /**
   * Set callback for receiving player actions (host only)
   */
  setOnPlayerAction(callback: (action: PlayerAction) => void): void {
    this.onPlayerAction = callback;
  }

  /**
   * Set callback for player join events
   */
  setOnPlayerJoin(callback: (playerId: string, playerName: string) => void): void {
    this.onPlayerJoin = callback;
  }

  /**
   * Set callback for player leave events
   */
  setOnPlayerLeave(callback: (playerId: string) => void): void {
    this.onPlayerLeave = callback;
  }

  /**
   * Host: Start broadcasting game state at regular intervals
   */
  startBroadcasting(getState: () => CompressedGameState, intervalMs: number = 50): void {
    if (this.role !== 'host') {
      console.warn('Only host can broadcast state');
      return;
    }

    this.stopBroadcasting();

    this.broadcastInterval = window.setInterval(() => {
      this.broadcastState(getState());
    }, intervalMs);
  }

  /**
   * Host: Stop broadcasting
   */
  stopBroadcasting(): void {
    if (this.broadcastInterval !== null) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
  }

  /**
   * Host: Broadcast current game state to all clients
   */
  broadcastState(state: CompressedGameState): void {
    if (!this.channel || this.role !== 'host') return;

    this.channel.send({
      type: 'broadcast',
      event: 'game_state',
      payload: state,
    });
  }

  /**
   * Client: Send an action to the host
   */
  sendAction(action: Omit<PlayerAction, 'playerId' | 'timestamp'>): void {
    if (!this.channel) return;

    const fullAction: PlayerAction = {
      ...action,
      playerId: this.localPlayerId,
      timestamp: Date.now(),
    };

    this.channel.send({
      type: 'broadcast',
      event: 'player_action',
      payload: fullAction,
    });
  }

  /**
   * Check if we're the host
   */
  isHost(): boolean {
    return this.role === 'host';
  }

  /**
   * Get local player ID
   */
  getLocalPlayerId(): string {
    return this.localPlayerId;
  }
}

/**
 * Compress game state for network transmission
 */
export function compressGameState(
  state: GameState,
  players: PlayerSyncState[],
  recentHeals: CompressedHealEvent[]
): CompressedGameState {
  // Build sparse arrays (only include indices with data)
  const hots: { [index: number]: CompressedHoT[] } = {};
  const debuffs: { [index: number]: CompressedDebuff[] } = {};
  const shields: { [index: number]: { current: number; max: number } } = {};
  const weakenedSoul: { [index: number]: number } = {};
  const buffs: { [index: number]: CompressedBuff[] } = {};

  state.raid.forEach((member, index) => {
    // Compress HoTs (Renew, Rejuvenation, Regrowth, etc.)
    if (member.activeHoTs && member.activeHoTs.length > 0) {
      hots[index] = member.activeHoTs.map(hot => ({
        id: hot.id,
        spellId: hot.spellId,
        spellName: hot.spellName || hot.spellId, // Include spell name for tooltip
        icon: hot.icon,
        rem: hot.remainingDuration,
        max: hot.maxDuration,
      }));
    }

    // Compress debuffs
    if (member.debuffs && member.debuffs.length > 0) {
      debuffs[index] = member.debuffs.map(d => ({
        id: d.id,
        name: d.name,
        icon: d.icon || '',
        type: d.type,
        dur: d.duration,
        max: d.maxDuration || d.duration,
      }));
    }

    // Compress absorb shields (Power Word: Shield)
    if (member.absorbShield && member.absorbShield > 0) {
      shields[index] = {
        current: member.absorbShield,
        max: member.absorbShieldMax || member.absorbShield,
      };
    }

    // Compress Weakened Soul debuff (for PW:Shield cooldown)
    if (member.weakenedSoulDuration && member.weakenedSoulDuration > 0) {
      weakenedSoul[index] = member.weakenedSoulDuration;
    }

    // Compress buffs (Power Infusion, etc.)
    if (member.buffs && member.buffs.length > 0) {
      buffs[index] = member.buffs.map(b => ({
        id: b.id,
        name: b.name,
        icon: b.icon,
        dur: b.duration,
      }));
    }
  });

  return {
    rh: state.raid.map(m => m.currentHealth),
    rm: state.raid.map(m => m.maxHealth),
    rd: state.raid.map(m => !m.isAlive),
    bh: state.boss?.currentHealth ?? 0,
    bmh: state.boss?.maxHealth ?? 0,
    bp: state.boss?.currentPhase ?? 1,
    be: state.bossEnraged,
    t: state.elapsedTime,
    r: state.isRunning,
    hl: recentHeals,
    ps: players,
    sz: Array.from(state.membersInSafeZone),
    // Include HoTs, debuffs, shields, and buffs (only if there are any)
    hots: Object.keys(hots).length > 0 ? hots : undefined,
    debuffs: Object.keys(debuffs).length > 0 ? debuffs : undefined,
    shields: Object.keys(shields).length > 0 ? shields : undefined,
    weakenedSoul: Object.keys(weakenedSoul).length > 0 ? weakenedSoul : undefined,
    buffs: Object.keys(buffs).length > 0 ? buffs : undefined,
  };
}

/**
 * Apply compressed state to local game state (client-side)
 */
export function applyCompressedState(
  compressed: CompressedGameState,
  state: GameState
): void {
  // Update raid health and clear old buffs/debuffs
  for (let i = 0; i < compressed.rh.length && i < state.raid.length; i++) {
    state.raid[i].currentHealth = compressed.rh[i];
    state.raid[i].maxHealth = compressed.rm[i];
    state.raid[i].isAlive = !compressed.rd[i];

    // Apply HoTs from host
    if (compressed.hots && compressed.hots[i]) {
      state.raid[i].activeHoTs = compressed.hots[i].map(h => ({
        id: h.id,
        spellId: h.spellId,
        spellName: h.spellName, // Include spell name for tooltip display
        icon: h.icon,
        casterId: '', // Not needed for display
        casterName: '', // Not needed for display
        remainingDuration: h.rem,
        maxDuration: h.max,
        tickInterval: 3, // Default tick interval
        timeSinceLastTick: 0, // Not needed for display
        healPerTick: 0, // Not needed for display
      }));
    } else {
      state.raid[i].activeHoTs = [];
    }

    // Apply debuffs from host
    if (compressed.debuffs && compressed.debuffs[i]) {
      state.raid[i].debuffs = compressed.debuffs[i].map(d => ({
        id: d.id,
        name: d.name,
        icon: d.icon,
        type: d.type as 'magic' | 'disease' | 'poison' | 'curse',
        duration: d.dur,
        maxDuration: d.max,
        damagePerTick: 0, // Not needed for display
        tickInterval: 3,
      }));
    } else {
      state.raid[i].debuffs = [];
    }

    // Apply absorb shields from host (Power Word: Shield)
    if (compressed.shields && compressed.shields[i]) {
      state.raid[i].absorbShield = compressed.shields[i].current;
      state.raid[i].absorbShieldMax = compressed.shields[i].max;
    } else {
      state.raid[i].absorbShield = 0;
      state.raid[i].absorbShieldMax = 0;
    }

    // Apply Weakened Soul debuff from host
    if (compressed.weakenedSoul && compressed.weakenedSoul[i]) {
      state.raid[i].weakenedSoulDuration = compressed.weakenedSoul[i];
    } else {
      state.raid[i].weakenedSoulDuration = 0;
    }

    // Apply buffs from host (Power Infusion, etc.)
    if (compressed.buffs && compressed.buffs[i]) {
      state.raid[i].buffs = compressed.buffs[i].map(b => ({
        id: b.id,
        name: b.name,
        icon: b.icon,
        duration: b.dur,
        maxDuration: b.dur,
      }));
    } else {
      state.raid[i].buffs = [];
    }
  }

  // Update boss
  if (state.boss) {
    state.boss.currentHealth = compressed.bh;
    state.boss.maxHealth = compressed.bmh;
    state.boss.currentPhase = compressed.bp;
  }

  // Update timing
  state.elapsedTime = compressed.t;
  state.isRunning = compressed.r;
  state.bossEnraged = compressed.be;
}

// Singleton instance
export const networkController = new NetworkController();
