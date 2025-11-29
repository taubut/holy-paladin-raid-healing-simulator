import { useEffect, useState } from 'react';
import type { Spell, PlayerState } from '../types/game';
import './ActionBar.css';

interface ActionBarProps {
  spells: Spell[];
  player: PlayerState;
  onCastSpell: (spell: Spell) => void;
  divineFavorActive: boolean;
  keybinds?: string[];
}

// Default keybinds for action bar slots
const DEFAULT_KEYBINDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export const ActionBar: React.FC<ActionBarProps> = ({
  spells,
  player,
  onCastSpell,
  divineFavorActive,
  keybinds = DEFAULT_KEYBINDS,
}) => {
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const key = e.key.toLowerCase();
      const keyIndex = keybinds.findIndex(k => k.toLowerCase() === key);
      if (keyIndex !== -1 && keyIndex < spells.length) {
        setPressedKey(key);
        onCastSpell(spells[keyIndex]);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keybinds.map(k => k.toLowerCase()).includes(key)) {
        setPressedKey(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spells, onCastSpell, keybinds]);

  const isSpellUsable = (spell: Spell): boolean => {
    if (player.isCasting) return false;
    if (player.globalCooldown > 0 && spell.isOnGlobalCooldown) return false;
    if (player.currentMana < spell.manaCost) return false;
    if (spell.currentCooldown > 0) return false;
    return true;
  };

  return (
    <div className="action-bar">
      {spells.map((spell, index) => {
        const keybind = keybinds[index] || '';
        const usable = isSpellUsable(spell);
        const onCooldown = spell.currentCooldown > 0;
        const isPressed = pressedKey === keybind.toLowerCase();

        return (
          <div
            key={spell.id}
            className={`action-button ${!usable ? 'unusable' : ''} ${isPressed ? 'pressed' : ''} ${spell.id === 'divine_favor' && divineFavorActive ? 'active-buff' : ''}`}
            onClick={() => usable && onCastSpell(spell)}
            title={`${spell.name} (Rank ${spell.rank})\nMana: ${spell.manaCost}\nCast: ${spell.castTime > 0 ? `${spell.castTime}s` : 'Instant'}${spell.cooldown > 0 ? `\nCooldown: ${spell.cooldown}s` : ''}`}
          >
            <img src={spell.icon} alt={spell.name} className="spell-icon" />

            {/* Cooldown overlay */}
            {onCooldown && (
              <div className="cooldown-overlay">
                <span className="cooldown-text">{Math.ceil(spell.currentCooldown)}</span>
              </div>
            )}

            {/* GCD sweep */}
            {player.globalCooldown > 0 && spell.isOnGlobalCooldown && !onCooldown && (
              <div
                className="gcd-overlay"
                style={{
                  height: `${(player.globalCooldown / 1.5) * 100}%`,
                }}
              />
            )}

            {/* Mana indicator */}
            {player.currentMana < spell.manaCost && (
              <div className="oom-overlay" />
            )}

            {/* Keybind */}
            <span className="keybind">{keybind.toUpperCase()}</span>

            {/* Spell rank */}
            {spell.rank > 0 && spell.healAmount.max > 0 && (
              <span className="spell-rank">R{spell.rank}</span>
            )}
          </div>
        );
      })}
    </div>
  );
};
