import React from 'react';
import type { DramaEvent, DramaOption } from '../../game/franchiseTypes';
import { CLASS_COLORS } from '../../game/types';
import './DramaEventModal.css';

interface DramaEventModalProps {
  drama: DramaEvent;
  onResolve: (optionId: string) => void;
  // Get class color for instigator
  instigatorClass?: string;
}

// Get spec icon for a class (simplified - uses class icon)
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


export const DramaEventModal: React.FC<DramaEventModalProps> = ({
  drama,
  onResolve,
  instigatorClass = 'warrior',
}) => {
  const classColor = CLASS_COLORS[instigatorClass as keyof typeof CLASS_COLORS] || '#ffffff';

  // Format outcome preview
  const formatOutcome = (outcome: { playerName: string; moraleChange: number }) => {
    const changeStr = outcome.moraleChange > 0 ? `+${outcome.moraleChange}` : `${outcome.moraleChange}`;
    return `${outcome.playerName}: ${changeStr} morale`;
  };

  // Get CSS class for option
  const getOptionClass = (optionId: string) => {
    return `drama-option ${optionId}`;
  };

  return (
    <div className="drama-modal-overlay">
      <div className="drama-modal">
        {/* Header */}
        <div className="drama-header">
          <div className="drama-header-left">
            <span className="drama-warning-icon">⚠️</span>
            <h2>Guild Drama!</h2>
          </div>
          <span className={`drama-severity ${drama.severity}`}>
            {drama.severity}
          </span>
        </div>

        {/* Content */}
        <div className="drama-content">
          {/* Instigator */}
          <div className="drama-instigator">
            <div className="drama-portrait">
              <div className="drama-portrait-glow" />
              <img
                src={getClassIcon(instigatorClass)}
                alt={drama.instigatorName}
                style={{ borderColor: classColor }}
              />
            </div>
            <div className="drama-speech">
              <div className="drama-speaker-name" style={{ color: classColor }}>
                {drama.instigatorName}
              </div>
              <div className="drama-quote">
                {drama.quote}
              </div>
            </div>
          </div>

          {/* Item involved (if any) */}
          {drama.itemName && (
            <div className="drama-item-involved">
              <img
                src={drama.itemIcon || '/icons/inv_misc_questionmark.jpg'}
                alt={drama.itemName}
                className="drama-item-icon"
              />
              <div className="drama-item-info">
                <div className="drama-item-name">{drama.itemName}</div>
                <div className="drama-item-context">
                  Awarded to {drama.targetName}
                </div>
              </div>
            </div>
          )}

          {/* Options */}
          <div className="drama-options">
            {drama.options.map((option: DramaOption) => (
              <div
                key={option.id}
                className={getOptionClass(option.id)}
                onClick={() => onResolve(option.id)}
              >
                <img
                  src={option.icon}
                  alt={option.label}
                  className="drama-option-icon"
                />
                <div className="drama-option-content">
                  <div className="drama-option-label">{option.label}</div>
                  <div className="drama-option-desc">{option.description}</div>
                </div>
                <div className="drama-option-outcomes">
                  {option.outcomes.slice(0, 2).map((outcome, idx) => (
                    <span
                      key={idx}
                      className={`drama-outcome ${outcome.moraleChange > 0 ? 'positive' : outcome.moraleChange < 0 ? 'negative' : 'neutral'}`}
                    >
                      {formatOutcome(outcome)}
                    </span>
                  ))}
                  {option.reputationChange !== 0 && (
                    <span className={`drama-option-rep ${option.reputationChange < 0 ? 'negative' : ''}`}>
                      Rep: {option.reputationChange > 0 ? '+' : ''}{option.reputationChange}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="drama-footer">
          <div className="drama-footer-hint">
            Choose wisely - your decision affects morale and guild reputation
          </div>
        </div>
      </div>
    </div>
  );
};

export default DramaEventModal;
