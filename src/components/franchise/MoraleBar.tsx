import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { MoraleState } from '../../game/franchiseTypes';
import './MoraleBar.css';

interface MoraleBarProps {
  morale: MoraleState;
  showValue?: boolean;
  showTooltip?: boolean;
  size?: 'compact' | 'normal' | 'large';
  leaveWarnings?: number;  // 0-3 warning count
}

// Get color based on morale value
function getMoraleColor(value: number): string {
  if (value >= 70) return '#4ade80';      // Green - Happy
  if (value >= 50) return '#a3e635';      // Light green - Content
  if (value >= 30) return '#facc15';      // Yellow - Neutral
  if (value >= 15) return '#fb923c';      // Orange - Unhappy
  return '#f87171';                        // Red - Very unhappy
}

// Get mood label based on morale
function getMoodLabel(value: number): string {
  if (value >= 85) return 'Ecstatic';
  if (value >= 70) return 'Happy';
  if (value >= 50) return 'Content';
  if (value >= 30) return 'Unhappy';
  if (value >= 15) return 'Upset';
  return 'Miserable';
}

// Get trend arrow
function getTrendIcon(trend: MoraleState['trend']): string {
  if (trend === 'rising') return '\u2191';   // Up arrow
  if (trend === 'falling') return '\u2193';  // Down arrow
  return '\u2194';                            // Horizontal arrow
}

export function MoraleBar({
  morale,
  showValue = false,
  showTooltip = true,
  size = 'normal',
  leaveWarnings = 0,
}: MoraleBarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const barRef = useRef<HTMLDivElement>(null);
  const color = getMoraleColor(morale.current);
  const mood = getMoodLabel(morale.current);
  const trendIcon = getTrendIcon(morale.trend);

  useEffect(() => {
    if (isHovered && barRef.current) {
      const rect = barRef.current.getBoundingClientRect();
      const tooltipWidth = 200;
      const tooltipHeight = 180;

      // Position tooltip above the bar, centered
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      let top = rect.top - tooltipHeight - 8;

      // If tooltip would go off top, position below instead
      if (top < 20) {
        top = rect.bottom + 8;
      }

      // Keep tooltip from going off bottom
      if (top + tooltipHeight > window.innerHeight - 20) {
        top = window.innerHeight - tooltipHeight - 20;
      }

      // Keep tooltip from going off left
      if (left < 20) {
        left = 20;
      }

      // Keep tooltip from going off right
      if (left + tooltipWidth > window.innerWidth - 20) {
        left = window.innerWidth - tooltipWidth - 20;
      }

      setTooltipPos({ top, left });
    }
  }, [isHovered]);

  const sizeClasses = {
    compact: 'morale-bar-compact',
    normal: 'morale-bar-normal',
    large: 'morale-bar-large',
  };

  const tooltipContent = showTooltip && isHovered && createPortal(
    <div className="morale-tooltip morale-tooltip-fixed" style={{ top: tooltipPos.top, left: tooltipPos.left }}>
      <div className="morale-tooltip-header">
        <span className="morale-mood" style={{ color }}>
          {mood}
        </span>
        <span className={`morale-trend ${morale.trend}`}>
          {trendIcon}
        </span>
      </div>

      <div className="morale-tooltip-stats">
        <div className="morale-stat-row">
          <span className="morale-stat-label">Current:</span>
          <span className="morale-stat-value" style={{ color }}>
            {morale.current}/100
          </span>
        </div>
        <div className="morale-stat-row">
          <span className="morale-stat-label">Baseline:</span>
          <span className="morale-stat-value">
            {morale.baseline}
          </span>
        </div>
      </div>

      {morale.lastChangeReason && (
        <div className="morale-last-change">
          <span className="morale-change-label">Last change:</span>
          <span className="morale-change-reason">
            {morale.lastChangeReason}
            {morale.lastChangeAmount !== 0 && (
              <span
                className={`morale-change-amount ${morale.lastChangeAmount > 0 ? 'positive' : 'negative'}`}
              >
                {morale.lastChangeAmount > 0 ? '+' : ''}{morale.lastChangeAmount}
              </span>
            )}
          </span>
        </div>
      )}

      <div className="morale-effects">
        <span className="morale-effects-label">Effects:</span>
        {morale.current >= 70 && (
          <span className="morale-effect good">+5% performance</span>
        )}
        {morale.current < 30 && (
          <span className="morale-effect bad">-10% performance</span>
        )}
        {morale.current < 30 && (
          <span className="morale-effect warning">High leave risk</span>
        )}
        {morale.current >= 50 && morale.current < 70 && (
          <span className="morale-effect neutral">Normal performance</span>
        )}
        {morale.current >= 30 && morale.current < 50 && (
          <span className="morale-effect caution">-5% performance</span>
        )}
      </div>
    </div>,
    document.body
  );

  // Determine warning level based on morale (always show if low morale)
  const getWarningLevel = () => {
    if (leaveWarnings > 0) return leaveWarnings;
    if (morale.current < 15) return 3;  // Critical
    if (morale.current < 25) return 2;  // Severe
    if (morale.current < 30) return 1;  // Warning
    return 0;
  };

  const warningLevel = getWarningLevel();

  // Warning badge text
  const getWarningBadge = (level: number) => {
    if (level === 0) return null;
    if (level === 1) return '⚠️';
    if (level === 2) return '⚠️⚠️';
    return '🚪'; // 3 = critical/about to leave
  };

  return (
    <div
      ref={barRef}
      className={`morale-bar-container ${sizeClasses[size]} ${warningLevel > 0 ? `at-risk risk-level-${warningLevel}` : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Leave warning indicator - show based on morale or explicit warnings */}
      {warningLevel > 0 && (
        <span
          className={`morale-leave-warning level-${warningLevel}`}
          title={leaveWarnings > 0 ? `Leave warning ${leaveWarnings}/3` : `Low morale warning`}
        >
          {getWarningBadge(warningLevel)}
        </span>
      )}

      <div className="morale-bar-track">
        <div
          className="morale-bar-fill"
          style={{
            width: `${morale.current}%`,
            backgroundColor: color,
          }}
        />
        {/* Baseline marker */}
        <div
          className="morale-bar-baseline"
          style={{ left: `${morale.baseline}%` }}
          title={`Baseline: ${morale.baseline}`}
        />
      </div>

      {showValue && (
        <span className="morale-bar-value" style={{ color }}>
          {morale.current}
        </span>
      )}

      {tooltipContent}
    </div>
  );
}

// Compact inline morale indicator (just icon + number)
interface MoraleIndicatorProps {
  morale: MoraleState;
  leaveWarnings?: number;  // 0-3 warning count
}

export function MoraleIndicator({ morale, leaveWarnings = 0 }: MoraleIndicatorProps) {
  const color = getMoraleColor(morale.current);
  const trendIcon = getTrendIcon(morale.trend);

  // Determine warning level based on morale (always show if low morale)
  const getWarningLevel = () => {
    if (leaveWarnings > 0) return leaveWarnings;
    if (morale.current < 15) return 3;  // Critical
    if (morale.current < 25) return 2;  // Severe
    if (morale.current < 30) return 1;  // Warning
    return 0;
  };

  const warningLevel = getWarningLevel();

  // Warning badge for compact indicator
  const getWarningBadge = (level: number) => {
    if (level === 0) return null;
    if (level === 1) return '⚠';
    if (level === 2) return '⚠⚠';
    return '🚪';
  };

  return (
    <span
      className={`morale-indicator ${warningLevel > 0 ? `at-risk risk-level-${warningLevel}` : ''}`}
      title={warningLevel > 0 ? `${getMoodLabel(morale.current)} - At risk` : getMoodLabel(morale.current)}
    >
      {warningLevel > 0 && (
        <span className={`morale-indicator-warning level-${warningLevel}`}>
          {getWarningBadge(warningLevel)}
        </span>
      )}
      <span className="morale-indicator-icon" style={{ backgroundColor: color }} />
      <span className="morale-indicator-value" style={{ color }}>
        {morale.current}
      </span>
      <span className={`morale-indicator-trend ${morale.trend}`}>
        {trendIcon}
      </span>
    </span>
  );
}
