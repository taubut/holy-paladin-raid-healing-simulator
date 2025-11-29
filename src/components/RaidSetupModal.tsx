import { useEffect } from 'react';

interface RaidSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Faction
  faction: 'alliance' | 'horde';
  onFactionChange: (faction: 'alliance' | 'horde') => void;
  // Raid size
  raidSize: number;
  onRaidSizeChange: (size: number) => void;
  canChangeRaidSize: boolean;
  // AI Healers
  aiHealersEnabled: boolean;
  aiHealerCount: number;
  onAiHealersToggle: () => void;
  // Reset
  onResetLockout: () => void;
  canResetLockout: boolean;
  // Encounter running state
  isEncounterRunning: boolean;
}

export function RaidSetupModal({
  isOpen,
  onClose,
  faction,
  onFactionChange,
  raidSize,
  onRaidSizeChange,
  canChangeRaidSize,
  aiHealersEnabled,
  aiHealerCount,
  onAiHealersToggle,
  onResetLockout,
  canResetLockout,
  isEncounterRunning,
}: RaidSetupModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="raid-setup-modal-backdrop" onClick={onClose}>
      <div className="raid-setup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="raid-setup-header">
          <h2>Raid Setup</h2>
          <button className="raid-setup-close" onClick={onClose}>×</button>
        </div>

        <div className="raid-setup-content">
          {/* Faction Section */}
          <div className="raid-setup-section">
            <h3 className="raid-setup-section-title">Faction</h3>
            <div className="raid-setup-faction-buttons">
              <button
                className={`raid-setup-faction-btn alliance ${faction === 'alliance' ? 'active' : ''}`}
                onClick={() => !isEncounterRunning && onFactionChange('alliance')}
                disabled={isEncounterRunning}
              >
                <span className="faction-icon">⚔</span>
                <span className="faction-name">Alliance</span>
                <span className="faction-class">Holy Paladin</span>
              </button>
              <button
                className={`raid-setup-faction-btn horde ${faction === 'horde' ? 'active' : ''}`}
                onClick={() => !isEncounterRunning && onFactionChange('horde')}
                disabled={isEncounterRunning}
              >
                <span className="faction-icon">🪓</span>
                <span className="faction-name">Horde</span>
                <span className="faction-class">Resto Shaman</span>
              </button>
            </div>
            {isEncounterRunning && (
              <p className="raid-setup-note">Cannot change faction during encounter</p>
            )}
          </div>

          {/* Raid Size Section */}
          <div className="raid-setup-section">
            <h3 className="raid-setup-section-title">Raid Size</h3>
            <div className="raid-setup-size-buttons">
              <button
                className={`raid-setup-size-btn ${raidSize === 20 ? 'active' : ''}`}
                onClick={() => canChangeRaidSize && onRaidSizeChange(20)}
                disabled={!canChangeRaidSize || isEncounterRunning}
              >
                20-Man
              </button>
              <button
                className={`raid-setup-size-btn ${raidSize === 40 ? 'active' : ''}`}
                onClick={() => canChangeRaidSize && onRaidSizeChange(40)}
                disabled={!canChangeRaidSize || isEncounterRunning}
              >
                40-Man
              </button>
            </div>
            {!canChangeRaidSize && (
              <p className="raid-setup-note">Reset lockout to change raid size</p>
            )}
          </div>

          {/* AI Healers Section */}
          <div className="raid-setup-section">
            <h3 className="raid-setup-section-title">AI Healers</h3>
            <label className="raid-setup-checkbox">
              <input
                type="checkbox"
                checked={aiHealersEnabled}
                onChange={onAiHealersToggle}
                disabled={isEncounterRunning}
              />
              <span className="checkbox-label">
                Other Healers Active
                {aiHealersEnabled && (
                  <span className="healer-count">({aiHealerCount} healers in raid)</span>
                )}
              </span>
            </label>
            <p className="raid-setup-description">
              {aiHealersEnabled
                ? 'AI healers will help heal the raid during encounters'
                : 'You will be the only healer - harder difficulty'}
            </p>
          </div>

          {/* Reset Lockout Section */}
          <div className="raid-setup-section">
            <h3 className="raid-setup-section-title">Lockout</h3>
            <button
              className="raid-setup-reset-btn"
              onClick={() => {
                onResetLockout();
                onClose();
              }}
              disabled={!canResetLockout || isEncounterRunning}
            >
              Reset Lockout
            </button>
            {!canResetLockout && (
              <p className="raid-setup-note">No bosses defeated yet</p>
            )}
            {canResetLockout && (
              <p className="raid-setup-description">
                Clear all boss progress and start fresh
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
