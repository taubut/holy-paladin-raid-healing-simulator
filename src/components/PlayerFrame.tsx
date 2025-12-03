import type { PlayerState } from '../types/game';
import './PlayerFrame.css';

interface PlayerFrameProps {
  player: PlayerState;
  divineFavorActive: boolean;
}

export const PlayerFrame: React.FC<PlayerFrameProps> = ({ player, divineFavorActive }) => {
  const manaPercent = (player.currentMana / player.maxMana) * 100;

  return (
    <div className="player-frame">
      <div className="player-portrait">
        {/* Paladin class icon */}
        <img
          src="/icons/classicon_paladin.jpg"
          alt="Paladin"
          className="portrait-image"
        />
        {divineFavorActive && <div className="divine-favor-glow" />}
      </div>

      <div className="player-bars">
        <div className="player-name">Holy Paladin</div>

        {/* Mana bar */}
        <div className="mana-bar-container">
          <div className="mana-bar" style={{ width: `${manaPercent}%` }} />
          <span className="mana-text">
            {Math.floor(player.currentMana)} / {player.maxMana}
          </span>
        </div>

        {/* Stats */}
        <div className="player-stats">
          <span className="stat">
            +{player.spellPower} SP
          </span>
          <span className="stat">
            {player.critChance}% Crit
          </span>
          <span className="stat">
            {player.manaRegen} MP5
          </span>
        </div>
      </div>

      {/* Divine Favor indicator */}
      {divineFavorActive && (
        <div className="divine-favor-indicator">
          <img
            src="/icons/spell_holy_divineillumination.jpg"
            alt="Divine Favor"
          />
          <span>Divine Favor Active!</span>
        </div>
      )}
    </div>
  );
};
