import { useEffect, useState } from 'react';
import './ManaPotion.css';

interface ManaPotionProps {
  cooldown: number;
  onUse: () => void;
  keybind?: string;
}

export const ManaPotion: React.FC<ManaPotionProps> = ({ cooldown, onUse, keybind = 'm' }) => {
  const [isPressed, setIsPressed] = useState(false);
  const isOnCooldown = cooldown > 0;

  // Keybind for mana potion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key.toLowerCase() === keybind.toLowerCase()) {
        setIsPressed(true);
        onUse();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === keybind.toLowerCase()) {
        setIsPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onUse, keybind]);

  return (
    <div
      className={`mana-potion ${isOnCooldown ? 'on-cooldown' : ''} ${isPressed ? 'pressed' : ''}`}
      onClick={onUse}
      title={`Major Mana Potion (${keybind.toUpperCase()})\nRestores 1350-2250 mana\n2 minute cooldown`}
    >
      <img
        src="https://wow.zamimg.com/images/wow/icons/large/inv_potion_76.jpg"
        alt="Major Mana Potion"
        className="potion-icon"
      />
      {isOnCooldown && (
        <div className="cooldown-overlay">
          <span className="cooldown-text">{Math.ceil(cooldown)}</span>
        </div>
      )}
      <span className="keybind">{keybind.toUpperCase()}</span>
      <span className="potion-label">Mana</span>
    </div>
  );
};
