import React from 'react';
import type { LeaveWarning, PlayerDeparture } from '../../game/franchiseTypes';
import { CLASS_COLORS, type WoWClass } from '../../game/types';
import './LeaveWarningModal.css';

// Get class icon for display
function getClassIcon(className: string): string {
  const classIcons: Record<string, string> = {
    warrior: '/icons/classicon_warrior.jpg',
    paladin: '/icons/classicon_paladin.jpg',
    hunter: '/icons/classicon_hunter.jpg',
    rogue: '/icons/classicon_rogue.jpg',
    priest: '/icons/classicon_priest.jpg',
    shaman: '/icons/classicon_shaman.jpg',
    mage: '/icons/classicon_mage.jpg',
    warlock: '/icons/classicon_warlock.jpg',
    druid: '/icons/classicon_druid.jpg',
  };
  return classIcons[className.toLowerCase()] || '/icons/inv_misc_questionmark.jpg';
}

interface LeaveWarningModalProps {
  warnings: LeaveWarning[];
  departures: PlayerDeparture[];
  onDismissWarning: (index: number) => void;
  onDismissAllWarnings: () => void;
  onProcessDeparture: (playerId: string) => void;
  onTryToConvince: (playerId: string) => void;
  renown: number;
  // Get class for a player
  getPlayerClass: (playerId: string) => WoWClass | undefined;
}

export const LeaveWarningModal: React.FC<LeaveWarningModalProps> = ({
  warnings,
  departures,
  onDismissWarning,
  onDismissAllWarnings,
  onProcessDeparture,
  onTryToConvince,
  renown,
  getPlayerClass,
}) => {
  // Show departures first (more urgent), then warnings
  const hasDepartures = departures.length > 0;
  const hasWarnings = warnings.length > 0;

  if (!hasDepartures && !hasWarnings) return null;

  return (
    <div className="leave-modal-overlay">
      <div className="leave-modal">
        {/* Header */}
        <div className="leave-header">
          <div className="leave-header-left">
            <span className="leave-warning-icon">{hasDepartures ? '🚪' : '⚠️'}</span>
            <h2>{hasDepartures ? 'Player Leaving!' : 'Morale Warning'}</h2>
          </div>
          {hasWarnings && warnings.length > 1 && !hasDepartures && (
            <button className="leave-dismiss-all" onClick={onDismissAllWarnings}>
              Dismiss All ({warnings.length})
            </button>
          )}
        </div>

        <div className="leave-content">
          {/* Departures (urgent - players leaving) */}
          {departures.map((departure, index) => {
            const playerClass = departure.playerClass;
            const classColor = CLASS_COLORS[playerClass as keyof typeof CLASS_COLORS] || '#ffffff';
            const canAffordConvince = renown >= 25;

            return (
              <div key={`departure-${index}`} className="leave-card departure">
                <div className="leave-portrait">
                  <div className="leave-portrait-glow departure" />
                  <img
                    src={getClassIcon(playerClass)}
                    alt={departure.playerName}
                    style={{ borderColor: classColor }}
                  />
                </div>
                <div className="leave-info">
                  <div className="leave-player-name" style={{ color: classColor }}>
                    {departure.playerName}
                  </div>
                  <div className="leave-reason">
                    {departure.reason}
                  </div>
                  <div className="leave-gear-loss">
                    <span className="leave-gear-icon">🎒</span>
                    They're taking their gear (GS: {departure.gearScoreLost})
                  </div>
                </div>
                <div className="leave-actions">
                  <button
                    className={`leave-action-btn convince ${!canAffordConvince ? 'disabled' : ''}`}
                    onClick={() => canAffordConvince && onTryToConvince(departure.playerId)}
                    disabled={!canAffordConvince}
                    title={canAffordConvince ? 'Spend 25 renown to try to convince them to stay' : 'Need 25 renown'}
                  >
                    <span className="action-icon">💬</span>
                    <span className="action-label">Convince (25 ⭐)</span>
                  </button>
                  <button
                    className="leave-action-btn let-go"
                    onClick={() => onProcessDeparture(departure.playerId)}
                  >
                    <span className="action-icon">👋</span>
                    <span className="action-label">Let them go</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Warnings (less urgent - at risk of leaving) */}
          {warnings.map((warning, index) => {
            const playerClass = getPlayerClass(warning.playerId);
            const classColor = playerClass ? CLASS_COLORS[playerClass] : '#ffffff';
            const warningLevel = warning.warningNumber;

            return (
              <div key={`warning-${index}`} className={`leave-card warning level-${warningLevel}`}>
                <div className="leave-portrait">
                  <div className={`leave-portrait-glow warning level-${warningLevel}`} />
                  <img
                    src={getClassIcon(playerClass || 'warrior')}
                    alt={warning.playerName}
                    style={{ borderColor: classColor }}
                  />
                </div>
                <div className="leave-info">
                  <div className="leave-player-header">
                    <span className="leave-player-name" style={{ color: classColor }}>
                      {warning.playerName}
                    </span>
                    <span className={`leave-warning-badge level-${warningLevel}`}>
                      Warning {warningLevel}/3
                    </span>
                  </div>
                  <div className="leave-quote">
                    "{warning.reason}"
                  </div>
                  <div className="leave-stats">
                    <span className="leave-stat morale">
                      <span className="stat-label">Morale:</span>
                      <span className={`stat-value ${warning.morale < 20 ? 'critical' : 'low'}`}>
                        {warning.morale}%
                      </span>
                    </span>
                    <span className="leave-stat risk">
                      <span className="stat-label">Leave Risk:</span>
                      <span className="stat-value">
                        {Math.round(warning.leaveRisk * 100)}%
                      </span>
                    </span>
                  </div>
                  {warningLevel >= 3 && (
                    <div className="leave-critical-warning">
                      ⚠️ Final warning! They may leave at any moment!
                    </div>
                  )}
                </div>
                <button
                  className="leave-dismiss-btn"
                  onClick={() => onDismissWarning(index)}
                  title="Acknowledge warning"
                >
                  ✓
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="leave-footer">
          <div className="leave-footer-hint">
            {hasDepartures
              ? 'Convince them to stay or let them leave with their gear'
              : 'Boost morale to prevent players from leaving! Give them loot, avoid wipes, and win boss fights.'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveWarningModal;
