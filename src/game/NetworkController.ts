import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { GameState } from './types';

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
  type: 'cast_spell' | 'cancel_cast' | 'select_target' | 'use_ability' | 'evacuate_to_safe_zone';
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
  };
}

/**
 * Apply compressed state to local game state (client-side)
 */
export function applyCompressedState(
  compressed: CompressedGameState,
  state: GameState
): void {
  // Update raid health
  for (let i = 0; i < compressed.rh.length && i < state.raid.length; i++) {
    state.raid[i].currentHealth = compressed.rh[i];
    state.raid[i].maxHealth = compressed.rm[i];
    state.raid[i].isAlive = !compressed.rd[i];
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
