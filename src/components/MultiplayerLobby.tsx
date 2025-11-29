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
import type { Equipment } from '../game/types';
import type { GearItem } from '../game/items';

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
  onStartGame: (session: GameSession, players: SessionPlayer[], localPlayer: SessionPlayer) => void;
  onCancel: () => void;
  initialPlayerName?: string;
  hostEquipment?: Equipment;  // Host's current equipment to share with others
}

type LobbyView = 'menu' | 'create' | 'join' | 'lobby';

export function MultiplayerLobby({ onStartGame, onCancel, initialPlayerName = '', hostEquipment }: MultiplayerLobbyProps) {
  const [view, setView] = useState<LobbyView>('menu');
  const [playerName, setPlayerName] = useState(initialPlayerName);
  const [playerClass, setPlayerClass] = useState<SessionPlayer['player_class']>('paladin');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Lobby state
  const [session, setSession] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<SessionPlayer[]>([]);
  const [localPlayer, setLocalPlayer] = useState<SessionPlayer | null>(null);

  // Refs for cleanup - so cleanup only runs on actual unmount, not on state changes
  const sessionRef = useRef<GameSession | null>(null);
  const localPlayerRef = useRef<SessionPlayer | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    localPlayerRef.current = localPlayer;
  }, [localPlayer]);

  // Subscribe to player changes in lobby
  useEffect(() => {
    if (!session) return;

    // Initial fetch
    getSessionPlayers(session.id).then(setPlayers);

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`lobby:${session.id}`)
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

          // If game started, trigger callback
          if (updatedSession.status === 'playing' && localPlayer) {
            getSessionPlayers(session.id).then((currentPlayers) => {
              onStartGame(updatedSession, currentPlayers, localPlayer);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, localPlayer, onStartGame]);

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

    const result = await createGameSession(playerName.trim(), playerClass);
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

    const result = await joinGameSession(roomCode.trim(), playerName.trim(), playerClass);
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

  // Host shares their gear with all other players
  const handleShareGear = async () => {
    if (!localPlayer?.is_host || !hostEquipment) {
      setError('Only the host can share gear');
      return;
    }

    const gearScore = calculateGearScore(hostEquipment);
    const equipmentRecord = equipmentToRecord(hostEquipment);
    setLoading(true);
    setError(null);

    try {
      // Update all players (including host) with host's equipment
      await Promise.all(
        players.map(p =>
          updatePlayerEquipment(p.id, equipmentRecord, gearScore)
        )
      );
      // Update local state
      setLocalPlayer({ ...localPlayer, equipment: equipmentRecord, gear_score: gearScore });
    } catch (err) {
      setError('Failed to share gear. Try again.');
    }
    setLoading(false);
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

            <label className="mp-label">Healer Class</label>
            <div className="mp-class-select">
              {(['paladin', 'priest', 'druid', 'shaman'] as const).map((cls) => {
                const isDisabled = cls === 'priest' || cls === 'druid';
                return (
                  <button
                    key={cls}
                    className={`mp-class-btn ${playerClass === cls ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                    style={{
                      borderColor: playerClass === cls ? CLASS_COLORS[cls] : undefined,
                      color: isDisabled ? '#666' : CLASS_COLORS[cls],
                      opacity: isDisabled ? 0.5 : 1,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => !isDisabled && setPlayerClass(cls)}
                    disabled={isDisabled}
                    title={isDisabled ? 'Coming soon!' : undefined}
                  >
                    {cls.charAt(0).toUpperCase() + cls.slice(1)}
                    {isDisabled && ' (Soon)'}
                  </button>
                );
              })}
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

            <label className="mp-label">Healer Class</label>
            <div className="mp-class-select">
              {(['paladin', 'priest', 'druid', 'shaman'] as const).map((cls) => {
                const isDisabled = cls === 'priest' || cls === 'druid';
                return (
                  <button
                    key={cls}
                    className={`mp-class-btn ${playerClass === cls ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                    style={{
                      borderColor: playerClass === cls ? CLASS_COLORS[cls] : undefined,
                      color: isDisabled ? '#666' : CLASS_COLORS[cls],
                      opacity: isDisabled ? 0.5 : 1,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => !isDisabled && setPlayerClass(cls)}
                    disabled={isDisabled}
                    title={isDisabled ? 'Coming soon!' : undefined}
                  >
                    {cls.charAt(0).toUpperCase() + cls.slice(1)}
                    {isDisabled && ' (Soon)'}
                  </button>
                );
              })}
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

                {hostEquipment && players.length > 1 && (
                  <button
                    className="mp-btn mp-btn-secondary"
                    onClick={handleShareGear}
                    disabled={loading}
                    title="Share your equipped gear with all players"
                  >
                    {loading ? 'Sharing...' : 'Share Your Gear'}
                  </button>
                )}
              </>
            )}

            <button className="mp-btn mp-btn-leave" onClick={handleLeave}>
              {localPlayer.is_host ? 'Close Room' : 'Leave'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
