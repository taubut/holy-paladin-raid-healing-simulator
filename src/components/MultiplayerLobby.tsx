import { useState, useEffect, useCallback, useRef } from 'react';
import {
  supabase,
  createGameSession,
  joinGameSession,
  getSessionPlayers,
  updatePlayerReady,
  updateSessionStatus,
  leaveSession,
  deleteSession,
  updatePlayerEquipment,
} from '../lib/supabase';
import type { GameSession, SessionPlayer } from '../lib/supabase';
import type { Equipment, RaidMember } from '../game/types';
import type { GearItem } from '../game/items';

// Simplified raid member data for syncing (only persistent properties)
export interface SyncableRaidMember {
  id: string;
  name: string;
  class: RaidMember['class'];
  spec: RaidMember['spec'];
  role: RaidMember['role'];
  group: number;
  equipment: Equipment;
  gearScore: number;
  positionZone: RaidMember['positionZone'];
}

// Simple gear score calculation: sum of item levels
function calculateGearScore(equipment: Equipment): number {
  let total = 0;
  const slots = Object.values(equipment) as (GearItem | null)[];
  for (const item of slots) {
    if (item) {
      total += item.itemLevel || 0;
    }
  }
  return total;
}

// Convert Equipment to a JSON-safe format for Supabase
function equipmentToRecord(equipment: Equipment): Record<string, unknown> {
  return JSON.parse(JSON.stringify(equipment));
}

// Class colors matching WoW
const CLASS_COLORS: Record<string, string> = {
  paladin: '#F58CBA',
  shaman: '#0070DE',
  priest: '#FFFFFF',
  druid: '#FF7D0A',
};

interface MultiplayerLobbyProps {
  onStartGame: (session: GameSession, players: SessionPlayer[], localPlayer: SessionPlayer, hostSpectating?: boolean) => void;
  onCancel: () => void;
  initialPlayerName?: string;
  initialPlayerClass?: SessionPlayer['player_class'];  // Player's class from save file
  hostEquipment?: Equipment;  // Host's current equipment to share with others
  hostRaid?: SyncableRaidMember[];  // Host's raid composition
  onRaidSync?: (raid: SyncableRaidMember[]) => void;  // Callback when client accepts raid sync
  faction?: 'alliance' | 'horde';  // Player's faction - determines available healer classes
}

type LobbyView = 'menu' | 'create' | 'join' | 'lobby';

export function MultiplayerLobby({ onStartGame, onCancel, initialPlayerName = '', initialPlayerClass, hostEquipment, hostRaid, onRaidSync, faction = 'alliance' }: MultiplayerLobbyProps) {
  const [view, setView] = useState<LobbyView>('menu');
  const [playerName, setPlayerName] = useState(initialPlayerName);
  // Use player's class from their save file, fallback to faction-appropriate class
  const playerClass: SessionPlayer['player_class'] = initialPlayerClass ?? (faction === 'horde' ? 'shaman' : 'paladin');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Lobby state
  const [session, setSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [localPlayer, setLocalPlayer] = useState<SessionPlayer | null>(null);

  // Gear share confirmation state
  const [showGearShareConfirm, setShowGearShareConfirm] = useState(false);
  const [gearShareHostName, setGearShareHostName] = useState('');
  const [_gearSharePending, setGearSharePending] = useState(false); // Host waiting for responses
  const [pendingRaidSync, setPendingRaidSync] = useState<SyncableRaidMember[] | null>(null);

  // Spectator mode state (host only toggles this, clients receive it)
  const [hostSpectating, setHostSpectating] = useState(false);
  const [receivedHostSpectating, setReceivedHostSpectating] = useState<boolean | null>(null);

  // Refs for cleanup - so cleanup only runs on actual unmount, not on state changes
  const sessionRef = useRef<GameSession | null>(null);
  const localPlayerRef = useRef<SessionPlayer | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const channelRef = useRef<any>(null);
  const onStartGameRef = useRef(onStartGame);
  const hostEquipmentRef = useRef(hostEquipment);
  const hostRaidRef = useRef(hostRaid);
  const onRaidSyncRef = useRef(onRaidSync);
  const hostSpectatingRef = useRef(hostSpectating);
  const receivedHostSpectatingRef = useRef<boolean | null>(null);
  const previousPlayerIdsRef = useRef<Set<string>>(new Set());

  // Keep callback refs in sync
  useEffect(() => {
    onStartGameRef.current = onStartGame;
  }, [onStartGame]);

  useEffect(() => {
    hostEquipmentRef.current = hostEquipment;
  }, [hostEquipment]);

  useEffect(() => {
    hostRaidRef.current = hostRaid;
  }, [hostRaid]);

  useEffect(() => {
    onRaidSyncRef.current = onRaidSync;
  }, [onRaidSync]);

  useEffect(() => {
    hostSpectatingRef.current = hostSpectating;
  }, [hostSpectating]);

  useEffect(() => {
    receivedHostSpectatingRef.current = receivedHostSpectating;
  }, [receivedHostSpectating]);

  // Keep refs in sync with state
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    localPlayerRef.current = localPlayer;
  }, [localPlayer]);

  // Auto-share raid composition when a new player joins (host only)
  // This shares the raid NPCs and their gear, NOT the host's player equipment
  useEffect(() => {
    if (!localPlayer?.is_host || !hostRaid || !channelRef.current) return;

    // Get current player IDs
    const currentIds = new Set(players.map(p => p.id));
    const previousIds = previousPlayerIdsRef.current;

    // Check if there's a new non-host player
    const newPlayerIds = [...currentIds].filter(id => !previousIds.has(id));
    const hasNewNonHostPlayer = newPlayerIds.some(id => {
      const player = players.find(p => p.id === id);
      return player && !player.is_host;
    });

    if (hasNewNonHostPlayer && players.length > 1) {
      // Auto-send gear share request to sync raid composition
      setGearSharePending(true);
      channelRef.current.send({
        type: 'broadcast',
        event: 'gear_share_request',
        payload: {
          hostName: localPlayer.player_name,
          raid: hostRaid  // Only the raid composition (NPCs), not player equipment
        }
      });
    }

    // Update previous player IDs
    previousPlayerIdsRef.current = currentIds;
  }, [players, localPlayer, hostRaid]);

  // Subscribe to player changes in lobby
  useEffect(() => {
    if (!session) return;

    // Initial fetch
    getSessionPlayers(session.id).then(setPlayers);

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`lobby:${session.id}`, {
        config: { broadcast: { self: false } },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_players',
          filter: `session_id=eq.${session.id}`,
        },
        () => {
          // Refetch players on any change
          getSessionPlayers(session.id).then(setPlayers);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          const updatedSession = payload.new as GameSession;
          setSession(updatedSession);

          // If game started, trigger callback - use ref for current player
          const currentPlayer = localPlayerRef.current;
          if (updatedSession.status === 'playing' && currentPlayer) {
            getSessionPlayers(session.id).then((currentPlayers) => {
              // Host uses their local hostSpectating, clients use the received value
              const spectating = currentPlayer.is_host
                ? hostSpectatingRef.current
                : (receivedHostSpectatingRef.current ?? false);
              onStartGameRef.current(updatedSession, currentPlayers, currentPlayer, spectating);
            });
          }
        }
      )
      // Listen for game start broadcast (contains hostSpectating info)
      .on(
        'broadcast',
        { event: 'game_start' },
        (payload) => {
          // Clients receive hostSpectating from host's broadcast
          if (payload.payload?.hostSpectating !== undefined) {
            setReceivedHostSpectating(payload.payload.hostSpectating);
          }
        }
      )
      // Listen for gear share request from host
      .on(
        'broadcast',
        { event: 'gear_share_request' },
        (payload) => {
          // Non-host players see confirmation modal
          // Use ref to get current value
          const currentPlayer = localPlayerRef.current;
          if (!currentPlayer?.is_host && payload.payload?.hostName) {
            setGearShareHostName(payload.payload.hostName);
            // Store the raid data for when client accepts
            if (payload.payload?.raid) {
              setPendingRaidSync(payload.payload.raid as SyncableRaidMember[]);
            }
            setShowGearShareConfirm(true);
          }
        }
      )
      // Listen for gear share acceptance (host listens to clear pending state)
      .on(
        'broadcast',
        { event: 'gear_share_response' },
        (payload) => {
          // Just track that someone responded - no longer copying host's player equipment
          const currentPlayer = localPlayerRef.current;
          if (currentPlayer?.is_host && payload.payload?.accepted) {
            // Raid composition sync is complete, clear the pending state
            setGearSharePending(false);
          }
        }
      )
      .subscribe();

    // Save channel ref for broadcasting
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]); // Only re-subscribe when session changes

  // Cleanup on unmount only (empty dependency array)
  useEffect(() => {
    return () => {
      const player = localPlayerRef.current;
      const sess = sessionRef.current;
      if (player && sess) {
        if (player.is_host) {
          deleteSession(sess.id);
        } else {
          leaveSession(player.id);
        }
      }
    };
  }, []);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    setLoading(true);
    setError(null);

    const result = await createGameSession(playerName.trim(), playerClass, faction);
    if (result) {
      setSession(result.session);
      setLocalPlayer(result.player);
      setPlayers([result.player]);
      setView('lobby');
    } else {
      setError('Failed to create room. Try again.');
    }
    setLoading(false);
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }
    setLoading(true);
    setError(null);

    const result = await joinGameSession(roomCode.trim(), playerName.trim(), playerClass, faction);
    if ('error' in result && result.error) {
      setError(result.error);
    } else {
      setSession(result.session);
      setLocalPlayer(result.player);
      setView('lobby');
    }
    setLoading(false);
  };

  const handleToggleReady = async () => {
    if (!localPlayer) return;
    const newReady = !localPlayer.is_ready;
    await updatePlayerReady(localPlayer.id, newReady);
    setLocalPlayer({ ...localPlayer, is_ready: newReady });
  };

  const handleStartGame = async () => {
    if (!session || !localPlayer?.is_host) return;

    // Check if all players are ready
    const allReady = players.every((p) => p.is_ready);
    if (!allReady) {
      setError('All players must be ready to start');
      return;
    }

    // Broadcast game_start with hostSpectating info before updating session status
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'game_start',
        payload: { hostSpectating }
      });
    }

    await updateSessionStatus(session.id, 'playing');
    // The realtime subscription will handle the transition
  };

  const handleLeave = useCallback(async () => {
    if (localPlayer && session) {
      if (localPlayer.is_host) {
        await deleteSession(session.id);
      } else {
        await leaveSession(localPlayer.id);
      }
    }
    setSession(null);
    setLocalPlayer(null);
    setPlayers([]);
    setView('menu');
  }, [localPlayer, session]);

  const copyRoomCode = () => {
    if (session) {
      navigator.clipboard.writeText(session.room_code);
    }
  };

  // Host shares their raid setup with all other players (with confirmation)
  // @ts-expect-error Reserved for future use
  const _handleShareGear = async () => {
    if (!localPlayer?.is_host || !hostEquipment) {
      setError('Only the host can share gear');
      return;
    }

    // If there are other players, broadcast a request for confirmation
    const otherPlayers = players.filter(p => !p.is_host);
    if (otherPlayers.length > 0 && channelRef.current) {
      setGearSharePending(true);
      // Broadcast gear share request to all clients (including raid composition)
      channelRef.current.send({
        type: 'broadcast',
        event: 'gear_share_request',
        payload: {
          hostName: localPlayer.player_name,
          raid: hostRaid  // Include full raid composition
        }
      });
      // Also update host's own gear immediately
      const gearScore = calculateGearScore(hostEquipment);
      const equipmentRecord = equipmentToRecord(hostEquipment);
      await updatePlayerEquipment(localPlayer.id, equipmentRecord, gearScore);
      setLocalPlayer({ ...localPlayer, equipment: equipmentRecord, gear_score: gearScore });
    } else {
      // No other players, just update host's gear
      const gearScore = calculateGearScore(hostEquipment);
      const equipmentRecord = equipmentToRecord(hostEquipment);
      setLoading(true);
      try {
        await updatePlayerEquipment(localPlayer.id, equipmentRecord, gearScore);
        setLocalPlayer({ ...localPlayer, equipment: equipmentRecord, gear_score: gearScore });
      } catch {
        setError('Failed to update gear. Try again.');
      }
      setLoading(false);
    }
  };

  // Client accepts gear share
  const handleAcceptGearShare = () => {
    if (channelRef.current && localPlayer) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'gear_share_response',
        payload: { playerId: localPlayer.id, accepted: true }
      });
    }
    // Apply the raid sync if we have pending raid data
    if (pendingRaidSync && onRaidSync) {
      onRaidSync(pendingRaidSync);
    }
    setPendingRaidSync(null);
    setShowGearShareConfirm(false);
  };

  // Client declines gear share
  const handleDeclineGearShare = () => {
    if (channelRef.current && localPlayer) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'gear_share_response',
        payload: { playerId: localPlayer.id, accepted: false }
      });
    }
    setPendingRaidSync(null);
    setShowGearShareConfirm(false);
  };

  // Main menu
  if (view === 'menu') {
    return (
      <div className="multiplayer-modal">
        <div className="multiplayer-content">
          <h2 className="multiplayer-title">Multiplayer</h2>
          <p className="multiplayer-subtitle">Heal together with friends!</p>

          <div className="multiplayer-buttons">
            <button className="mp-btn mp-btn-primary" onClick={() => setView('create')}>
              Create Room
            </button>
            <button className="mp-btn mp-btn-secondary" onClick={() => setView('join')}>
              Join Room
            </button>
          </div>

          <button className="mp-btn mp-btn-cancel" onClick={onCancel}>
            Back to Solo
          </button>
        </div>
      </div>
    );
  }

  // Create room form
  if (view === 'create') {
    return (
      <div className="multiplayer-modal">
        <div className="multiplayer-content">
          <h2 className="multiplayer-title">Create Room</h2>

          <div className="mp-form">
            <label className="mp-label">Your Name</label>
            <input
              type="text"
              className="mp-input"
              placeholder="Enter your name..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
            />

            <div className="mp-class-display">
              <span className="mp-class-label">Playing as: </span>
              <span className="mp-class-name" style={{ color: CLASS_COLORS[playerClass] }}>
                {playerClass.charAt(0).toUpperCase() + playerClass.slice(1)}
              </span>
            </div>

            {error && <div className="mp-error">{error}</div>}

            <div className="mp-form-buttons">
              <button
                className="mp-btn mp-btn-primary"
                onClick={handleCreateRoom}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
              <button className="mp-btn mp-btn-cancel" onClick={() => setView('menu')}>
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Join room form
  if (view === 'join') {
    return (
      <div className="multiplayer-modal">
        <div className="multiplayer-content">
          <h2 className="multiplayer-title">Join Room</h2>

          <div className="mp-form">
            <label className="mp-label">Your Name</label>
            <input
              type="text"
              className="mp-input"
              placeholder="Enter your name..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
            />

            <div className="mp-class-display">
              <span className="mp-class-label">Playing as: </span>
              <span className="mp-class-name" style={{ color: CLASS_COLORS[playerClass] }}>
                {playerClass.charAt(0).toUpperCase() + playerClass.slice(1)}
              </span>
            </div>

            <label className="mp-label">Room Code</label>
            <input
              type="text"
              className="mp-input mp-input-code"
              placeholder="ABC123"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
            />

            {error && <div className="mp-error">{error}</div>}

            <div className="mp-form-buttons">
              <button
                className="mp-btn mp-btn-primary"
                onClick={handleJoinRoom}
                disabled={loading}
              >
                {loading ? 'Joining...' : 'Join Room'}
              </button>
              <button className="mp-btn mp-btn-cancel" onClick={() => setView('menu')}>
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Lobby view
  if (view === 'lobby' && session && localPlayer) {
    const allReady = players.every((p) => p.is_ready);
    const canStart = localPlayer.is_host && allReady && players.length >= 1;

    return (
      <div className="multiplayer-modal multiplayer-lobby">
        <div className="multiplayer-content">
          <div className="lobby-header">
            <h2 className="multiplayer-title">Raid Lobby</h2>
            <div className="room-code-display" onClick={copyRoomCode} title="Click to copy">
              <span className="room-code-label">Room Code:</span>
              <span className="room-code-value">{session.room_code}</span>
              <span className="room-code-copy">📋</span>
            </div>
          </div>

          <div className="lobby-players">
            <h3 className="lobby-section-title">Healers ({players.length}/4)</h3>
            <div className="player-list">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`player-card ${player.is_ready ? 'ready' : ''} ${
                    player.id === localPlayer.id ? 'is-you' : ''
                  }`}
                >
                  <div className="player-info">
                    <span
                      className="player-name"
                      style={{ color: CLASS_COLORS[player.player_class] }}
                    >
                      {player.player_name}
                      {player.is_host && <span className="host-badge">HOST</span>}
                      {player.id === localPlayer.id && <span className="you-badge">YOU</span>}
                    </span>
                    <span className="player-class">
                      {player.player_class.charAt(0).toUpperCase() + player.player_class.slice(1)}
                    </span>
                  </div>
                  <div className="player-status">
                    {player.is_ready ? (
                      <span className="status-ready">✓ Ready</span>
                    ) : (
                      <span className="status-waiting">Waiting...</span>
                    )}
                  </div>
                  {player.gear_score > 0 && (
                    <div className="player-gear-score">GS: {player.gear_score}</div>
                  )}
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: 4 - players.length }).map((_, i) => (
                <div key={`empty-${i}`} className="player-card empty">
                  <span className="empty-slot">Waiting for player...</span>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="mp-error">{error}</div>}

          <div className="lobby-actions">
            {!localPlayer.is_host && (
              <button
                className={`mp-btn ${localPlayer.is_ready ? 'mp-btn-ready' : 'mp-btn-primary'}`}
                onClick={handleToggleReady}
              >
                {localPlayer.is_ready ? '✓ Ready!' : 'Ready Up'}
              </button>
            )}

            {localPlayer.is_host && (
              <>
                <button
                  className="mp-btn mp-btn-start"
                  onClick={handleStartGame}
                  disabled={!canStart}
                  title={!allReady ? 'All players must be ready' : ''}
                >
                  {allReady ? 'Start Raid!' : 'Waiting for Ready...'}
                </button>

                <label className="mp-spectate-toggle" title="Watch the raid without playing - an AI healer will take your spot">
                  <input
                    type="checkbox"
                    checked={hostSpectating}
                    onChange={(e) => setHostSpectating(e.target.checked)}
                  />
                  <span className="mp-spectate-label">Spectate Only</span>
                </label>
              </>
            )}

            <button className="mp-btn mp-btn-leave" onClick={handleLeave}>
              {localPlayer.is_host ? 'Close Room' : 'Leave'}
            </button>
          </div>

          {/* Gear Share Confirmation Modal (shown to non-host players) */}
          {showGearShareConfirm && (
            <div className="gear-share-confirm-overlay">
              <div className="gear-share-confirm-modal">
                <div className="gear-share-icon">⚠️</div>
                <h3 className="gear-share-title">Gear Sync Request</h3>
                <p className="gear-share-message">
                  <strong>{gearShareHostName}</strong> wants to sync their raid composition and gear with your save file.
                </p>
                <p className="gear-share-warning">
                  This will <strong>COMPLETELY OVERWRITE</strong> your current raiders and their equipment!
                </p>
                <p className="gear-share-hint">
                  Consider making a new character save for multiplayer if you want to keep your current progress.
                </p>
                <div className="gear-share-buttons">
                  <button className="mp-btn mp-btn-danger" onClick={handleDeclineGearShare}>
                    Decline
                  </button>
                  <button className="mp-btn mp-btn-primary" onClick={handleAcceptGearShare}>
                    Accept & Sync
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
