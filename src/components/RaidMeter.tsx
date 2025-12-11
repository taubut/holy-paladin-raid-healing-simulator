import { useState } from 'react';
import type { AIHealerStats, WoWClass, WoWSpec, PlayerClass } from '../game/types';
import { getPlayerRole } from '../game/types';

// Type for raid DPS stats passed from GameEngine
interface RaidDpsStats {
  name: string;
  class: WoWClass;
  damageDone: number;
  spec: WoWSpec;
}

// Class colors matching WoW
const CLASS_COLORS: Record<string, string> = {
  paladin: '#F58CBA',
  shaman: '#0070DE',
  priest: '#FFFFFF',
  druid: '#FF7D0A',
  mage: '#69CCF0',
  warrior: '#C79C6E',
  rogue: '#FFF569',
  hunter: '#ABD473',
  warlock: '#9482C9',
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
  // Mage spells (Frost)
  frostbolt: 'Frostbolt',
  frostbolt_downrank: 'Frostbolt (R8)',
  frost_nova: 'Frost Nova',
  cone_of_cold: 'Cone of Cold',
  ice_barrier: 'Ice Barrier',
  blizzard: 'Blizzard',
};

interface MeterEntry {
  id: string;
  name: string;
  healingDone: number;
  dispelsDone: number;
  damageDone: number;
  class: WoWClass | PlayerClass;
  isPlayer: boolean;
  spellBreakdown?: Record<string, number>;
  damageBreakdown?: Record<string, number>;
}

interface RaidMeterProps {
  playerHealing: number;
  playerDispels: number;
  playerDamage: number;
  playerSpellBreakdown: Record<string, number>;
  playerDamageBreakdown?: Record<string, number>;
  playerName: string;
  playerClass: PlayerClass;
  aiHealerStats: Record<string, AIHealerStats>;
  showAiHealers: boolean;
  isMultiplayer?: boolean;
  multiplayerPlayers?: MeterEntry[];
  hidePlayer?: boolean; // For Raid Leader mode where player doesn't heal
  raidDpsStats?: Record<string, RaidDpsStats>; // Simulated DPS damage from raid members
}

export function RaidMeter({
  playerHealing,
  playerDispels,
  playerDamage,
  playerSpellBreakdown,
  playerDamageBreakdown = {},
  playerName,
  playerClass,
  aiHealerStats,
  showAiHealers,
  isMultiplayer = false,
  multiplayerPlayers = [],
  hidePlayer = false,
  raidDpsStats = {},
}: RaidMeterProps) {
  const playerRole = getPlayerRole(playerClass);
  const [activeTab, setActiveTab] = useState<'healing' | 'dispels' | 'damage'>(
    playerRole === 'dps' ? 'damage' : 'healing'
  );
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  // Build the players list (healers and DPS)
  const players: MeterEntry[] = [];

  // Add player (unless hidden, e.g. in Raid Leader mode)
  if (!hidePlayer) {
    players.push({
      id: 'player',
      name: playerName,
      healingDone: playerHealing,
      dispelsDone: playerDispels,
      damageDone: playerDamage,
      class: playerClass,
      isPlayer: true,
      spellBreakdown: playerSpellBreakdown,
      damageBreakdown: playerDamageBreakdown,
    });
  }

  // In multiplayer, add other players
  if (isMultiplayer && multiplayerPlayers.length > 0) {
    players.push(...multiplayerPlayers.filter(p => p.id !== 'player'));
  }

  // In solo mode, add AI healers for Healing/Dispels tabs
  if (!isMultiplayer && showAiHealers) {
    Object.entries(aiHealerStats).forEach(([id, stats]) => {
      players.push({
        id,
        name: stats.name,
        healingDone: stats.healingDone,
        dispelsDone: stats.dispelsDone || 0,
        damageDone: 0,
        class: stats.class,
        isPlayer: false,
      });
    });
  }

  // Add raid DPS players for Damage tab (simulated damage)
  if (!isMultiplayer && Object.keys(raidDpsStats).length > 0) {
    Object.entries(raidDpsStats).forEach(([id, stats]) => {
      players.push({
        id,
        name: stats.name,
        healingDone: 0,
        dispelsDone: 0,
        damageDone: stats.damageDone,
        class: stats.class,
        isPlayer: false,
      });
    });
  }

  // Filter players based on active tab:
  // - Healing/Dispels: show healers (those with healingDone > 0 OR player role is healer)
  // - Damage: show DPS (those with damageDone > 0 OR player role is DPS)
  const filteredPlayers = players.filter(p => {
    if (activeTab === 'damage') {
      // On Damage tab, show players with damage > 0 OR if it's the player and they're a DPS
      return p.damageDone > 0 || (p.isPlayer && playerRole === 'dps');
    } else {
      // On Healing/Dispels tab, show players with healing > 0 OR if it's the player and they're a healer
      return p.healingDone > 0 || (p.isPlayer && playerRole === 'healer');
    }
  });

  // Sort by the active metric
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (activeTab === 'healing') {
      return b.healingDone - a.healingDone;
    } else if (activeTab === 'damage') {
      return b.damageDone - a.damageDone;
    }
    return b.dispelsDone - a.dispelsDone;
  });

  // Calculate max and total for bar scaling
  const getValue = (p: MeterEntry) => {
    if (activeTab === 'healing') return p.healingDone;
    if (activeTab === 'damage') return p.damageDone;
    return p.dispelsDone;
  };

  const maxValue = sortedPlayers.length > 0 ? getValue(sortedPlayers[0]) : 1;
  const totalValue = filteredPlayers.reduce((sum, p) => sum + getValue(p), 0);

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
  const getSpellBreakdown = (player: MeterEntry): Array<{ name: string; value: number }> => {
    const breakdown = activeTab === 'damage' ? player.damageBreakdown : player.spellBreakdown;
    if (!breakdown) return [];

    return Object.entries(breakdown)
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
          className={`raid-meter-tab ${activeTab === 'damage' ? 'active' : ''}`}
          onClick={() => setActiveTab('damage')}
        >
          Damage
        </button>
        <button
          className={`raid-meter-tab ${activeTab === 'dispels' ? 'active' : ''}`}
          onClick={() => setActiveTab('dispels')}
        >
          Dispels
        </button>
      </div>

      {/* Player list */}
      <div className="raid-meter-list">
        {sortedPlayers.map((player, index) => {
          const value = getValue(player);
          const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const sharePercentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
          const classColor = CLASS_COLORS[player.class] || '#FFFFFF';
          const isExpanded = expandedPlayer === player.id;
          const hasBreakdown = player.isPlayer && (
            (activeTab === 'healing' && player.spellBreakdown) ||
            (activeTab === 'damage' && player.damageBreakdown)
          );

          return (
            <div key={player.id}>
              <div
                className={`raid-meter-row ${player.isPlayer ? 'is-player' : ''} ${hasBreakdown ? 'clickable' : ''}`}
                onClick={() => hasBreakdown && handleRowClick(player.id)}
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
                    {player.name}
                    {player.isPlayer && <span className="raid-meter-you">(You)</span>}
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
                  {getSpellBreakdown(player).map((spell) => {
                    const spellMax = getSpellBreakdown(player)[0]?.value || 1;
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

        {sortedPlayers.length === 0 && (
          <div className="raid-meter-empty">
            {activeTab === 'damage' ? 'No damage data yet' : 'No healing data yet'}
          </div>
        )}
      </div>

      {/* Footer with total */}
      <div className="raid-meter-footer">
        <span>Total: {formatNumber(totalValue)}</span>
      </div>
    </div>
  );
}
