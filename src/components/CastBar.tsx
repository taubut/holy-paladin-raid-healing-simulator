import type { PlayerState } from '../types/game';
import './CastBar.css';

interface CastBarProps {
  player: PlayerState;
}

export const CastBar: React.FC<CastBarProps> = ({ player }) => {
  if (!player.isCasting || !player.currentCastSpell) {
    return null;
  }

  const spell = player.currentCastSpell;
  const progress = player.castProgress * 100;
  const remainingTime = spell.castTime * (1 - player.castProgress);

  return (
    <div className="cast-bar-container">
      <div className="cast-bar">
        <div className="cast-bar-fill" style={{ width: `${progress}%` }} />
        <div className="cast-bar-spark" style={{ left: `${progress}%` }} />
        <span className="cast-bar-text">{spell.name}</span>
        <span className="cast-bar-time">{remainingTime.toFixed(1)}s</span>
      </div>
      <img src={spell.icon} alt={spell.name} className="cast-bar-icon" />
    </div>
  );
};
