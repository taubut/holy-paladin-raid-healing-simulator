import React from 'react';
import { ENCOUNTERS, TRAINING_ENCOUNTER } from '../data/encounters';
import './EncounterSelect.css';

interface EncounterSelectProps {
  onSelectEncounter: (id: string) => void;
  onResetRaid: (size: 20 | 40) => void;
}

export const EncounterSelect: React.FC<EncounterSelectProps> = ({
  onSelectEncounter,
  onResetRaid,
}) => {
  return (
    <div className="encounter-select">
      <div className="encounter-header">
        <h2>Molten Core</h2>
        <div className="raid-size-buttons">
          <button onClick={() => onResetRaid(20)} className="size-button">
            20-Man
          </button>
          <button onClick={() => onResetRaid(40)} className="size-button">
            40-Man
          </button>
        </div>
      </div>

      <div className="encounter-list">
        {/* Training */}
        <button
          className="encounter-button training"
          onClick={() => onSelectEncounter(TRAINING_ENCOUNTER.id)}
        >
          <span className="encounter-name">{TRAINING_ENCOUNTER.name}</span>
          <span className="encounter-difficulty">Practice</span>
        </button>

        {/* Boss encounters */}
        {ENCOUNTERS.map((encounter, index) => (
          <button
            key={encounter.id}
            className="encounter-button"
            onClick={() => onSelectEncounter(encounter.id)}
          >
            <span className="encounter-number">{index + 1}</span>
            <span className="encounter-name">{encounter.name}</span>
            <span className="encounter-timer">{Math.floor(encounter.enrageTimer / 60)}m</span>
          </button>
        ))}
      </div>

      <div className="keybind-help">
        <h3>Keybinds</h3>
        <div className="keybind-grid">
          <span>1-9, 0</span><span>Cast spells</span>
          <span>Click</span><span>Select target</span>
          <span>ESC</span><span>Cancel cast</span>
        </div>
      </div>
    </div>
  );
};
