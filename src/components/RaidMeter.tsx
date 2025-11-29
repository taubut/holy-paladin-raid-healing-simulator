import { useState } from 'react';
import type { AIHealerStats, WoWClass, PlayerHealerClass } from '../game/types';

// Class colors matching WoW
const CLASS_COLORS: Record<string, string> = {
  paladin: '#F58CBA',
  shaman: '#0070DE',
  priest: '#FFFFFF',
  druid: '#FF7D0A',
};

// Spell name mappings for breakdown display
const SPELL_NAMES: Record<string, string> = {
  // Paladin spells
  holy_light: 'Holy Light',
  holy_light_downrank: 'Holy Light (R6)',
  flash_of_light: 'Flash of Light',
  flash_of_light_downrank: 'Flash of Light (R4)',
  holy_shock: 'Holy Shock',
  lay_on_hands: 'Lay on Hands',
  // Shaman spells
  healing_wave: 'Healing Wave',
  healing_wave_downrank: 'Healing Wave (R4)',
  lesser_healing_wave: 'Lesser Healing Wave',
  lesser_healing_wave_downrank: 'Lesser Healing Wave (R3)',
  chain_heal: 'Chain Heal',
  chain_heal_downrank: 'Chain Heal (R2)',
  // Totems
  healing_stream_totem: 'Healing Stream',
};

interface HealerEntry {
  id: string;
  name: string;
  healingDone: number;
  dispelsDone: number;
  class: WoWClass | PlayerHealerClass;
  isPlayer: boolean;
  spellBreakdown?: Record<string, number>;
}

interface RaidMeterProps {
  playerHealing: number;
  playerDispels: number;
  playerSpellBreakdown: Record<string, number>;
  playerName: string;
  playerClass: PlayerHealerClass;
  aiHealerStats: Record<string, AIHealerStats>;
  showAiHealers: boolean;
  isMultiplayer?: boolean;
  multiplayerHealers?: HealerEntry[];
}

export function RaidMeter({
  playerHealing,
  playerDispels,
  playerSpellBreakdown,
  playerName,
  playerClass,
  aiHealerStats,
  showAiHealers,
  isMultiplayer = false,
  multiplayerHealers = [],
}: RaidMeterProps) {
  const [activeTab, setActiveTab] = useState<'healing' | 'dispels'>('healing');
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  // Build the healers list
  const healers: HealerEntry[] = [];

  // Add player
  healers.push({
    id: 'player',
    name: playerName,
    healingDone: playerHealing,
    dispelsDone: playerDispels,
    class: playerClass,
    isPlayer: true,
    spellBreakdown: playerSpellBreakdown,
  });

  // In multiplayer, add other players
  if (isMultiplayer && multiplayerHealers.length > 0) {
    healers.push(...multiplayerHealers.filter(h => h.id !== 'player'));
  }

  // In solo mode, add AI healers
  if (!isMultiplayer && showAiHealers) {
    Object.entries(aiHealerStats).forEach(([id, stats]) => {
      healers.push({
        id,
        name: stats.name,
        healingDone: stats.healingDone,
        dispelsDone: 0, // AI healers don't dispel
        class: stats.class,
        isPlayer: false,
      });
    });
  }

  // Sort by the active metric
  const sortedHealers = [...healers].sort((a, b) => {
    if (activeTab === 'healing') {
      return b.healingDone - a.healingDone;
    }
    return b.dispelsDone - a.dispelsDone;
  });

  // Calculate max and total for bar scaling
  const maxValue = sortedHealers.length > 0
    ? (activeTab === 'healing' ? sortedHealers[0].healingDone : sortedHealers[0].dispelsDone)
    : 1;
  const totalValue = healers.reduce(
    (sum, h) => sum + (activeTab === 'healing' ? h.healingDone : h.dispelsDone),
    0
  );

  // Format numbers for display
  const formatNumber = (num: number): string => {
    const rounded = Math.round(num);
    if (rounded >= 1000000) {
      return (rounded / 1000000).toFixed(2) + 'M';
    } else if (rounded >= 1000) {
      return (rounded / 1000).toFixed(1) + 'K';
    }
    return rounded.toString();
  };

  const handleRowClick = (healerId: string) => {
    if (expandedPlayer === healerId) {
      setExpandedPlayer(null);
    } else {
      setExpandedPlayer(healerId);
    }
  };

  // Get spell breakdown for expanded player
  const getSpellBreakdown = (healer: HealerEntry): Array<{ name: string; value: number }> => {
    if (!healer.spellBreakdown) return [];

    return Object.entries(healer.spellBreakdown)
      .map(([spellId, value]) => ({
        name: SPELL_NAMES[spellId] || spellId,
        value,
      }))
      .filter(s => s.value > 0)
      .sort((a, b) => b.value - a.value);
  };

  return (
    <div className="raid-meter">
      {/* Tab buttons */}
      <div className="raid-meter-tabs">
        <button
          className={`raid-meter-tab ${activeTab === 'healing' ? 'active' : ''}`}
          onClick={() => setActiveTab('healing')}
        >
          Healing
        </button>
        <button
          className={`raid-meter-tab ${activeTab === 'dispels' ? 'active' : ''}`}
          onClick={() => setActiveTab('dispels')}
        >
          Dispels
        </button>
      </div>

      {/* Healer list */}
      <div className="raid-meter-list">
        {sortedHealers.map((healer, index) => {
          const value = activeTab === 'healing' ? healer.healingDone : healer.dispelsDone;
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const sharePercentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
          const classColor = CLASS_COLORS[healer.class] || '#FFFFFF';
          const isExpanded = expandedPlayer === healer.id;
          const hasBreakdown = healer.isPlayer && activeTab === 'healing' && healer.spellBreakdown;

          return (
            <div key={healer.id}>
              <div
                className={`raid-meter-row ${healer.isPlayer ? 'is-player' : ''} ${hasBreakdown ? 'clickable' : ''}`}
                onClick={() => hasBreakdown && handleRowClick(healer.id)}
              >
                {/* Background bar */}
                <div
                  className="raid-meter-bar"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: classColor,
                  }}
                />

                {/* Content */}
                <div className="raid-meter-content">
                  <span className="raid-meter-rank">{index + 1}.</span>
                  <span className="raid-meter-name" style={{ color: classColor }}>
                    {healer.name}
                    {healer.isPlayer && <span className="raid-meter-you">(You)</span>}
                  </span>
                  <span className="raid-meter-value">{formatNumber(value)}</span>
                  <span className="raid-meter-percent">({sharePercentage.toFixed(0)}%)</span>
                  {hasBreakdown && (
                    <span className="raid-meter-expand">{isExpanded ? '▲' : '▼'}</span>
                  )}
                </div>
              </div>

              {/* Spell breakdown (expanded view) */}
              {isExpanded && hasBreakdown && (
                <div className="raid-meter-breakdown">
                  {getSpellBreakdown(healer).map((spell) => {
                    const spellMax = getSpellBreakdown(healer)[0]?.value || 1;
                    const spellPercent = (spell.value / spellMax) * 100;

                    return (
                      <div key={spell.name} className="raid-meter-breakdown-row">
                        <div
                          className="raid-meter-breakdown-bar"
                          style={{ width: `${spellPercent}%` }}
                        />
                        <div className="raid-meter-breakdown-content">
                          <span className="raid-meter-breakdown-name">{spell.name}</span>
                          <span className="raid-meter-breakdown-value">{formatNumber(spell.value)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {sortedHealers.length === 0 && (
          <div className="raid-meter-empty">No healing data yet</div>
        )}
      </div>

      {/* Footer with total */}
      <div className="raid-meter-footer">
        <span>Total: {formatNumber(totalValue)}</span>
      </div>
    </div>
  );
}
