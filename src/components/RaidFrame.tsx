import React, { useEffect, useState } from 'react';
import type { RaidMember } from '../types/game';
import { getResourceType } from '../types/game';
import { CLASS_COLORS } from '../data/raid';
import './RaidFrame.css';

interface RaidFrameProps {
  member: RaidMember;
  isSelected: boolean;
  onClick: () => void;
}

// Resource bar color mapping
const RESOURCE_COLORS = {
  mana: 'linear-gradient(180deg, #0066cc 0%, #003366 100%)',
  rage: 'linear-gradient(180deg, #cc0000 0%, #660000 100%)',
  energy: 'linear-gradient(180deg, #cccc00 0%, #666600 100%)',
};

export const RaidFrame: React.FC<RaidFrameProps> = ({ member, isSelected, onClick }) => {
  const [showCritAnim, setShowCritAnim] = useState(false);
  const [lastCritTime, setLastCritTime] = useState<number | undefined>(undefined);

  // Debug log for specific member updates (e.g. the first tank)
  useEffect(() => {
    if (member.role === 'tank' && member.group === 1 && member.id.endsWith('0')) {
      console.log(`[RaidFrame] ${member.name} updated. HP: ${member.currentHealth}/${member.maxHealth}. Debuffs: ${member.debuffs.length}`);
    }
  }, [member]);

  // Track crit heal animation
  useEffect(() => {
    if (member.lastCritHealTime && member.lastCritHealTime !== lastCritTime) {
      setLastCritTime(member.lastCritHealTime);
      setShowCritAnim(true);
      const timer = setTimeout(() => setShowCritAnim(false), 500);
      return () => clearTimeout(timer);
    }
  }, [member.lastCritHealTime, lastCritTime]);

  const healthPercent = Math.max(0, Math.min(100, (member.currentHealth / member.maxHealth) * 100));
  const classColor = CLASS_COLORS[member.class];
  const resourceType = getResourceType(member.class, member.role);
  const resourceColor = RESOURCE_COLORS[resourceType];

  // Check if member has a dispellable debuff (magic, poison, or disease)
  const hasDispellableDebuff = member.debuffs.some(
    d => d.type === 'magic' || d.type === 'poison' || d.type === 'disease'
  );

  // Determine health bar color based on percentage
  const getHealthColor = () => {
    if (healthPercent > 50) return '#00ff00';
    if (healthPercent > 25) return '#ffff00';
    return '#ff0000';
  };

  const getMissingHealthText = () => {
    const missing = member.maxHealth - member.currentHealth;
    if (missing <= 0) return '';
    return `-${Math.floor(missing)}`;
  };

  return (
    <div
      className={`raid-frame ${isSelected ? 'selected' : ''} ${!member.isAlive ? 'dead' : ''} ${hasDispellableDebuff ? 'has-dispellable' : ''} ${showCritAnim ? 'crit-heal' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      data-hp={member.currentHealth}
      data-max-hp={member.maxHealth}
    >
      {/* Class colored top border */}
      <div className="class-indicator" style={{ backgroundColor: classColor }} />

      {/* Name */}
      <div className="member-name" style={{ color: classColor }}>
        {member.name}
      </div>

      {/* Health bar container */}
      <div className="health-bar-container">
        <div
          className="health-bar"
          style={{
            width: `${healthPercent}%`,
            backgroundColor: getHealthColor(),
          }}
        />
        <div className="health-text">
          {member.isAlive ? (
            <>
              <span className="current-health">{Math.floor(member.currentHealth)}</span>
              <span className="missing-health">{getMissingHealthText()}</span>
            </>
          ) : (
            <span className="dead-text">DEAD</span>
          )}
        </div>
      </div>

      {/* Resource bar - shows mana/rage/energy with appropriate color */}
      <div className="resource-bar-container">
        <div
          className={`resource-bar resource-${resourceType}`}
          style={{ background: resourceColor }}
        />
      </div>

      {/* Role indicator */}
      <div className={`role-indicator role-${member.role}`}>
        {member.role === 'tank' && '🛡️'}
        {member.role === 'healer' && '💚'}
        {member.role === 'dps' && '⚔️'}
      </div>

      {/* Buffs */}
      {member.buffs.length > 0 && (
        <div className="buff-container">
          {member.buffs.map((buff, idx) => (
            <div key={`${buff.id}-${idx}`} className="buff-icon" title={buff.name}>
              <img src={buff.icon} alt={buff.name} />
              <span className="buff-duration">{Math.ceil(buff.duration)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Debuffs */}
      {member.debuffs.length > 0 && (
        <div className="debuff-container">
          {member.debuffs.map((debuff, idx) => (
            <div
              key={`${debuff.id}-${idx}`}
              className={`debuff-icon debuff-${debuff.type}`}
              title={`${debuff.name} (${debuff.type})`}
            >
              <img src={debuff.icon} alt={debuff.name} />
              <span className="debuff-duration">{Math.ceil(debuff.duration)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


