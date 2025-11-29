import type { PlayerSyncState } from '../game/NetworkController';

// Class colors matching WoW
const CLASS_COLORS: Record<string, string> = {
  paladin: '#F58CBA',
  shaman: '#0070DE',
  priest: '#FFFFFF',
  druid: '#FF7D0A',
};

interface HealingMeterProps {
  players: PlayerSyncState[];
  localPlayerId: string;
  isVisible: boolean;
  onToggle: () => void;
}

export function HealingMeter({ players, localPlayerId, isVisible, onToggle }: HealingMeterProps) {
  // Sort players by healing done (descending)
  const sortedPlayers = [...players].sort((a, b) => b.healingDone - a.healingDone);

  // Find max healing for bar scaling
  const maxHealing = sortedPlayers.length > 0 ? sortedPlayers[0].healingDone : 1;

  // Calculate total healing
  const totalHealing = players.reduce((sum, p) => sum + p.healingDone, 0);

  // Format number for display (e.g., 1234567 -> 1.23M)
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (!isVisible) {
    return (
      <button className="healing-meter-toggle" onClick={onToggle} title="Show Healing Meters">
        HPS
      </button>
    );
  }

  return (
    <div className="healing-meter">
      <div className="healing-meter-header">
        <span className="healing-meter-title">Healing Done</span>
        <button className="healing-meter-close" onClick={onToggle}>x</button>
      </div>

      <div className="healing-meter-list">
        {sortedPlayers.map((player, index) => {
          const percentage = maxHealing > 0 ? (player.healingDone / maxHealing) * 100 : 0;
          const sharePercentage = totalHealing > 0 ? (player.healingDone / totalHealing) * 100 : 0;
          const isLocal = player.id === localPlayerId;
          const classColor = CLASS_COLORS[player.class] || '#FFFFFF';

          return (
            <div
              key={player.id}
              className={`healing-meter-row ${isLocal ? 'is-local' : ''}`}
            >
              <div
                className="healing-meter-bar"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: classColor,
                  opacity: 0.3,
                }}
              />
              <div className="healing-meter-content">
                <span className="healing-meter-rank">{index + 1}.</span>
                <span
                  className="healing-meter-name"
                  style={{ color: classColor }}
                >
                  {player.name}
                  {isLocal && <span className="healing-meter-you"> (You)</span>}
                </span>
                <span className="healing-meter-value">
                  {formatNumber(player.healingDone)}
                </span>
                <span className="healing-meter-percent">
                  ({sharePercentage.toFixed(1)}%)
                </span>
              </div>

              {/* Show casting indicator */}
              {player.casting && player.spellName && (
                <div className="healing-meter-casting">
                  <div
                    className="healing-meter-cast-bar"
                    style={{ width: `${player.castProgress * 100}%` }}
                  />
                  <span className="healing-meter-spell-name">{player.spellName}</span>
                </div>
              )}
            </div>
          );
        })}

        {sortedPlayers.length === 0 && (
          <div className="healing-meter-empty">
            No healers connected
          </div>
        )}
      </div>

      <div className="healing-meter-footer">
        <span>Total: {formatNumber(totalHealing)}</span>
      </div>
    </div>
  );
}

// Optional: A simplified inline version for the header/HUD
interface HealingMeterInlineProps {
  players: PlayerSyncState[];
  localPlayerId: string;
}

export function HealingMeterInline({ players, localPlayerId }: HealingMeterInlineProps) {
  const localPlayer = players.find(p => p.id === localPlayerId);
  const sortedPlayers = [...players].sort((a, b) => b.healingDone - a.healingDone);
  const rank = sortedPlayers.findIndex(p => p.id === localPlayerId) + 1;

  if (!localPlayer) return null;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="healing-meter-inline">
      <span className="hmi-rank">#{rank}</span>
      <span className="hmi-healing">{formatNumber(localPlayer.healingDone)}</span>
      <span className="hmi-label">HPS</span>
    </div>
  );
}
