import { useState } from 'react';
import type { PersonalityTraitId } from '../../game/franchiseTypes';
import { PERSONALITY_TRAITS } from '../../game/franchiseTypes';
import './PersonalityBadge.css';

interface PersonalityBadgeProps {
  traitId: PersonalityTraitId;
  size?: 'small' | 'medium' | 'large';
}

// Category colors for badge backgrounds
const CATEGORY_COLORS = {
  positive: { border: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)' },
  negative: { border: '#f87171', bg: 'rgba(248, 113, 113, 0.15)' },
  neutral: { border: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
};

// Simple badge icon - no click behavior, just displays the trait
export function PersonalityBadge({
  traitId,
  size = 'medium',
}: PersonalityBadgeProps) {
  const trait = PERSONALITY_TRAITS[traitId];

  if (!trait) return null;

  const colors = CATEGORY_COLORS[trait.category];

  const sizeClasses = {
    small: 'personality-badge-small',
    medium: 'personality-badge-medium',
    large: 'personality-badge-large',
  };

  return (
    <div
      className={`personality-badge ${sizeClasses[size]}`}
      style={{
        borderColor: colors.border,
        backgroundColor: colors.bg,
      }}
      title={trait.name}
    >
      <img
        src={trait.icon}
        alt={trait.name}
        className="personality-badge-icon"
      />
    </div>
  );
}

// Format modifier for display
const formatModifier = (value: number): string => {
  if (value === 0) return '0';
  if (value === 1) return '+0%';
  if (value < 1) {
    const reduction = Math.round((1 - value) * 100);
    return `-${reduction}%`;
  }
  const increase = Math.round((value - 1) * 100);
  return `+${increase}%`;
};

// Simple display-only list of badges (no reroll, just hover for info)
interface PersonalityBadgeRowProps {
  traits: PersonalityTraitId[];
  size?: 'small' | 'medium' | 'large';
  maxVisible?: number;
  showHoverInfo?: boolean; // Show expanded info on hover (for LFG inspection)
}

export function PersonalityBadgeRow({
  traits,
  size = 'small',
  maxVisible = 3,
  showHoverInfo = false,
}: PersonalityBadgeRowProps) {
  const [hoveredTraitId, setHoveredTraitId] = useState<PersonalityTraitId | null>(null);
  const visibleTraits = traits.slice(0, maxVisible);
  const hiddenCount = traits.length - maxVisible;

  const expandedTrait = hoveredTraitId ? PERSONALITY_TRAITS[hoveredTraitId] : null;
  const expandedColors = expandedTrait ? CATEGORY_COLORS[expandedTrait.category] : null;

  // Simple version without hover info
  if (!showHoverInfo) {
    return (
      <div className="personality-badge-list">
        {visibleTraits.map((traitId) => (
          <PersonalityBadge key={traitId} traitId={traitId} size={size} />
        ))}
        {hiddenCount > 0 && (
          <span className="personality-badge-more">+{hiddenCount}</span>
        )}
      </div>
    );
  }

  // Version with hover info (for LFG inspection etc)
  return (
    <div
      className="personality-badge-list-container"
      onMouseLeave={() => setHoveredTraitId(null)}
    >
      <div className="personality-badge-list">
        {visibleTraits.map((traitId) => {
          const trait = PERSONALITY_TRAITS[traitId];
          if (!trait) return null;
          const colors = CATEGORY_COLORS[trait.category];
          const isExpanded = hoveredTraitId === traitId;

          return (
            <div
              key={traitId}
              className={`personality-badge personality-badge-${size} ${isExpanded ? 'active' : ''}`}
              style={{
                borderColor: colors.border,
                backgroundColor: colors.bg,
              }}
              onMouseEnter={() => setHoveredTraitId(traitId)}
            >
              <img
                src={trait.icon}
                alt={trait.name}
                className="personality-badge-icon"
              />
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <span className="personality-badge-more">+{hiddenCount}</span>
        )}
      </div>

      {/* Expandable details section - vertical compact layout */}
      {expandedTrait && expandedColors && (
        <div
          className="personality-expanded-compact"
          style={{ borderColor: expandedColors.border }}
        >
          <div className="pec-header">
            <span className="pec-name" style={{ color: expandedColors.border }}>
              {expandedTrait.name}
            </span>
            <span className={`pec-category ${expandedTrait.category}`}>
              {expandedTrait.category}
            </span>
            {expandedTrait.isRare && <span className="pec-rare">RARE</span>}
          </div>
          <p className="pec-description">{expandedTrait.description}</p>
          <div className="pec-stats">
            <span className={expandedTrait.dramaModifier <= 1 ? 'good' : 'bad'}>
              Drama {formatModifier(expandedTrait.dramaModifier)}
            </span>
            <span className={expandedTrait.leaveModifier <= 1 ? 'good' : 'bad'}>
              Leave {formatModifier(expandedTrait.leaveModifier)}
            </span>
            <span className={expandedTrait.noShowModifier <= 0 ? 'good' : 'bad'}>
              No-Show {expandedTrait.noShowModifier > 0 ? '+' : ''}{Math.round(expandedTrait.noShowModifier * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Component to show traits with hover-to-expand details (for Guild management screen)
interface PersonalityBadgeListProps {
  traits: PersonalityTraitId[];
  size?: 'small' | 'medium' | 'large';
  maxVisible?: number;
  onReroll?: (traitId: PersonalityTraitId) => void;
  rerollCost?: number;
  canAffordReroll?: boolean;
}

export function PersonalityBadgeList({
  traits,
  size = 'small',
  maxVisible = 3,
  onReroll,
  rerollCost = 5,
  canAffordReroll = true,
}: PersonalityBadgeListProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isRerolling, setIsRerolling] = useState(false);
  const visibleTraits = traits.slice(0, maxVisible);
  const hiddenCount = traits.length - maxVisible;

  // Get the current trait from the hovered index (always up to date)
  const hoveredTraitId = hoveredIndex !== null ? visibleTraits[hoveredIndex] : null;
  const expandedTrait = hoveredTraitId ? PERSONALITY_TRAITS[hoveredTraitId] : null;
  const expandedColors = expandedTrait ? CATEGORY_COLORS[expandedTrait.category] : null;

  // Handle reroll button click - trigger animation then call parent
  const handleReroll = (traitId: PersonalityTraitId) => {
    if (onReroll && canAffordReroll) {
      setIsRerolling(true);
      // Call the actual reroll
      onReroll(traitId);
      // Clear animation after it completes
      setTimeout(() => setIsRerolling(false), 500);
    }
  };

  return (
    <div
      className="personality-badge-list-container"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <div className="personality-badge-list">
        {visibleTraits.map((traitId, index) => {
          const trait = PERSONALITY_TRAITS[traitId];
          if (!trait) return null;
          const colors = CATEGORY_COLORS[trait.category];
          const isExpanded = hoveredIndex === index;
          const shouldAnimate = isRerolling && hoveredIndex === index;

          return (
            <div
              key={`${traitId}-${index}`}
              className={`personality-badge personality-badge-${size} ${isExpanded ? 'active' : ''} ${shouldAnimate ? 'rerolled' : ''}`}
              style={{
                borderColor: colors.border,
                backgroundColor: colors.bg,
              }}
              onMouseEnter={() => {
                if (!isRerolling) {
                  setHoveredIndex(index);
                }
              }}
            >
              <img
                src={trait.icon}
                alt={trait.name}
                className="personality-badge-icon"
              />
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <span className="personality-badge-more">+{hiddenCount}</span>
        )}
      </div>

      {/* Expandable details section - horizontal layout */}
      {(expandedTrait || isRerolling) && expandedColors && expandedTrait && (
        <div
          className={`personality-expanded-details ${isRerolling ? 'rerolling' : ''}`}
          style={{ borderColor: expandedColors.border }}
        >
          <img src={expandedTrait.icon} alt="" className="personality-expanded-icon" />
          <div className="personality-expanded-info">
            <div className="personality-expanded-title-row">
              <span className="personality-expanded-name" style={{ color: expandedColors.border }}>
                {expandedTrait.name}
              </span>
              <span className={`personality-expanded-category ${expandedTrait.category}`}>
                {expandedTrait.category}
              </span>
              {expandedTrait.isRare && <span className="personality-expanded-rare">RARE</span>}
            </div>
            <p className="personality-expanded-description">{expandedTrait.description}</p>
          </div>
          <div className="personality-expanded-stats">
            <div className="personality-stat">
              <span className="stat-label">Drama</span>
              <span className={`stat-value ${expandedTrait.dramaModifier <= 1 ? 'good' : 'bad'}`}>
                {formatModifier(expandedTrait.dramaModifier)}
              </span>
            </div>
            <div className="personality-stat">
              <span className="stat-label">Leave</span>
              <span className={`stat-value ${expandedTrait.leaveModifier <= 1 ? 'good' : 'bad'}`}>
                {formatModifier(expandedTrait.leaveModifier)}
              </span>
            </div>
            <div className="personality-stat">
              <span className="stat-label">No-Show</span>
              <span className={`stat-value ${expandedTrait.noShowModifier <= 0 ? 'good' : 'bad'}`}>
                {expandedTrait.noShowModifier > 0 ? '+' : ''}{Math.round(expandedTrait.noShowModifier * 100)}%
              </span>
            </div>
          </div>
          {onReroll && hoveredTraitId && (
            <button
              className={`personality-reroll-btn ${!canAffordReroll || isRerolling ? 'disabled' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleReroll(hoveredTraitId);
              }}
              disabled={!canAffordReroll || isRerolling}
            >
              Reroll ({rerollCost})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
