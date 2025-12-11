// Frost Mage Spells for Classic WoW (Vanilla)
// Authentic spell values based on Classic DB and Wowhead Classic

import type { Spell } from './types';

const ICON_BASE = '/icons';

// Frostbolt - Rank 11 (Max rank, main nuke)
// Source: classicdb.ch - 290 mana, 515-556 damage, 3.0s cast (reduced to 2.5s with 5/5 Improved Frostbolt)
export const FROSTBOLT: Spell = {
  id: 'frostbolt',
  name: 'Frostbolt',
  rank: 11,
  icon: `${ICON_BASE}/spell_frost_frostbolt02.jpg`,
  manaCost: 290,
  castTime: 2.5, // Assuming 5/5 Improved Frostbolt
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  damageAmount: { min: 515, max: 556 },
  spellSchool: 'frost',
  spellPowerCoefficient: 0.814, // 2.5/3.0 * 0.97 (frost penalty)
  isOnGlobalCooldown: true,
  isDamageSpell: true,
};

// Frostbolt - Rank 8 (Downrank for mana efficiency during long fights)
// Source: classicdb.ch - 195 mana, 330-356 damage
export const FROSTBOLT_DOWNRANK: Spell = {
  id: 'frostbolt_downrank',
  name: 'Frostbolt',
  rank: 8,
  icon: `${ICON_BASE}/spell_frost_frostbolt02.jpg`,
  manaCost: 195,
  castTime: 2.5,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  damageAmount: { min: 330, max: 356 },
  spellSchool: 'frost',
  spellPowerCoefficient: 0.814,
  isOnGlobalCooldown: true,
  isDamageSpell: true,
};

// Frost Nova - Rank 4 (Instant AoE freeze)
// Source: classicdb.ch - 55 mana, 71-81 damage, roots for 8 seconds
export const FROST_NOVA: Spell = {
  id: 'frost_nova',
  name: 'Frost Nova',
  rank: 4,
  icon: `${ICON_BASE}/spell_frost_frostnova.jpg`,
  manaCost: 55,
  castTime: 0, // Instant
  cooldown: 25,
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  damageAmount: { min: 71, max: 81 },
  spellSchool: 'frost',
  spellPowerCoefficient: 0.129, // Instant spell penalty
  isOnGlobalCooldown: true,
  isDamageSpell: true,
  isAoE: true,
};

// Ice Barrier - Rank 4 (Absorb shield, Frost talent)
// Source: classicdb.ch - 300 mana, absorbs 818 damage
export const ICE_BARRIER: Spell = {
  id: 'ice_barrier',
  name: 'Ice Barrier',
  rank: 4,
  icon: `${ICON_BASE}/spell_ice_lament.jpg`,
  manaCost: 300,
  castTime: 0, // Instant
  cooldown: 30,
  currentCooldown: 0,
  healAmount: { min: 818, max: 818 }, // Using healAmount for shield/absorb
  damageAmount: { min: 0, max: 0 },
  spellSchool: 'frost',
  spellPowerCoefficient: 0.10, // Absorb coefficient
  isOnGlobalCooldown: true,
  isDamageSpell: false, // Shield spell, not damage
};

// Cone of Cold - Rank 5 (Instant frontal cone AoE)
// Source: classicdb.ch - 210 mana, 98-107 damage
export const CONE_OF_COLD: Spell = {
  id: 'cone_of_cold',
  name: 'Cone of Cold',
  rank: 5,
  icon: `${ICON_BASE}/spell_frost_glacier.jpg`,
  manaCost: 210,
  castTime: 0, // Instant
  cooldown: 10,
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  damageAmount: { min: 98, max: 107 },
  spellSchool: 'frost',
  spellPowerCoefficient: 0.129, // Instant AoE penalty
  isOnGlobalCooldown: true,
  isDamageSpell: true,
  isAoE: true,
};

// Blizzard - Rank 6 (Channeled AoE)
// Source: classicdb.ch - 1160 mana, 936 total damage over 8 seconds (8 ticks)
export const BLIZZARD: Spell = {
  id: 'blizzard',
  name: 'Blizzard',
  rank: 6,
  icon: `${ICON_BASE}/spell_frost_icestorm.jpg`,
  manaCost: 1160,
  castTime: 0, // Channeled
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  damageAmount: { min: 117, max: 117 }, // Per tick damage (936 / 8)
  spellSchool: 'frost',
  spellPowerCoefficient: 0.083, // Per tick (total ~0.66)
  isOnGlobalCooldown: true,
  isDamageSpell: true,
  isChanneled: true,
  channelDuration: 8,
  channelTicks: 8,
  isAoE: true,
};

// Evocation (Channel to restore mana)
// Source: classicdb.ch - 60% mana over 8 seconds (15% per tick)
export const EVOCATION: Spell = {
  id: 'evocation',
  name: 'Evocation',
  icon: `${ICON_BASE}/spell_nature_purge.jpg`,
  manaCost: 0,
  castTime: 0, // Channeled
  cooldown: 480, // 8 minute cooldown
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  damageAmount: { min: 0, max: 0 },
  spellSchool: 'arcane',
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: false,
  isDamageSpell: false,
  isChanneled: true,
  channelDuration: 8,
  channelTicks: 4, // 4 ticks of 15% mana
};

// Cold Snap (Reset frost cooldowns)
// Source: classicdb.ch - Resets cooldowns of all Frost spells, 10 min CD
export const COLD_SNAP: Spell = {
  id: 'cold_snap',
  name: 'Cold Snap',
  icon: `${ICON_BASE}/spell_frost_wizardmark.jpg`,
  manaCost: 0,
  castTime: 0, // Instant
  cooldown: 600, // 10 minute cooldown
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  damageAmount: { min: 0, max: 0 },
  spellSchool: 'frost',
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: false,
  isDamageSpell: false,
};

// Ice Block (Immunity, breaks all movement impairing effects)
// Source: classicdb.ch - 10 second immunity, 5 min CD
export const ICE_BLOCK: Spell = {
  id: 'ice_block',
  name: 'Ice Block',
  icon: `${ICON_BASE}/spell_frost_frost.jpg`,
  manaCost: 0,
  castTime: 0, // Instant
  cooldown: 300, // 5 minute cooldown
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  damageAmount: { min: 0, max: 0 },
  spellSchool: 'frost',
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: false,
  isDamageSpell: false,
};

// Remove Curse - Removes curse effects (Mages can decurse!)
// Source: classicdb.ch - 76 mana, instant cast
export const REMOVE_CURSE: Spell = {
  id: 'remove_curse',
  name: 'Remove Curse',
  icon: `${ICON_BASE}/spell_holy_removecurse.jpg`,
  manaCost: 76,
  castTime: 0, // Instant
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  damageAmount: { min: 0, max: 0 },
  spellSchool: 'arcane',
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: true,
  isDamageSpell: false,
};

// All mage spells for reference
export const MAGE_SPELLS = {
  FROSTBOLT,
  FROSTBOLT_DOWNRANK,
  FROST_NOVA,
  ICE_BARRIER,
  CONE_OF_COLD,
  BLIZZARD,
  EVOCATION,
  COLD_SNAP,
  ICE_BLOCK,
  REMOVE_CURSE,
};

// Default action bar for Frost Mage player (10 spells)
export const DEFAULT_MAGE_ACTION_BAR: Spell[] = [
  FROSTBOLT,          // 1 - Main nuke (290 mana, 2.5s, 515-556)
  FROSTBOLT_DOWNRANK, // 2 - Efficient nuke (195 mana, 2.5s, 330-356)
  FROST_NOVA,         // 3 - Instant AoE root (55 mana, 25s CD)
  CONE_OF_COLD,       // 4 - Instant frontal AoE (210 mana, 10s CD)
  ICE_BARRIER,        // 5 - Self shield (300 mana, 30s CD, 818 absorb)
  BLIZZARD,           // 6 - Channeled AoE (1160 mana, 8s channel)
  REMOVE_CURSE,       // 7 - Decurse raid members (76 mana) - CRITICAL for Shazzrah!
  EVOCATION,          // 8 - Mana regen channel (8 min CD)
  COLD_SNAP,          // 9 - Reset frost CDs (10 min CD)
  ICE_BLOCK,          // 0 - Immunity (5 min CD)
];
