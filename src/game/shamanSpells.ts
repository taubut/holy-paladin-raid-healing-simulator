// Restoration Shaman Spells for Classic WoW (Vanilla)
// Authentic spell values based on Classic DB and Icy Veins guides

import type { Spell } from './types';

const ICON_BASE = '/icons';

// Healing Wave - Rank 10 (Max rank, big slow heal like Holy Light)
export const HEALING_WAVE: Spell = {
  id: 'healing_wave',
  name: 'Healing Wave',
  rank: 10,
  icon: `${ICON_BASE}/spell_nature_magicimmunity.jpg`,
  manaCost: 620,
  castTime: 3.0,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 1620, max: 1850 },
  spellPowerCoefficient: 0.857, // 3.0/3.5 base cast time ratio
  isOnGlobalCooldown: true,
};

// Healing Wave - Rank 5 (Downrank for mana efficiency)
export const HEALING_WAVE_DOWNRANK: Spell = {
  id: 'healing_wave_downrank',
  name: 'Healing Wave',
  rank: 5,
  icon: `${ICON_BASE}/spell_nature_magicimmunity.jpg`,
  manaCost: 200,
  castTime: 3.0,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 389, max: 443 },
  spellPowerCoefficient: 0.857,
  isOnGlobalCooldown: true,
};

// Lesser Healing Wave - Rank 6 (Fast heal like Flash of Light)
export const LESSER_HEALING_WAVE: Spell = {
  id: 'lesser_healing_wave',
  name: 'Lesser Healing Wave',
  rank: 6,
  icon: `${ICON_BASE}/spell_nature_healingwavelesser.jpg`,
  manaCost: 265,
  castTime: 1.5,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 458, max: 514 },
  spellPowerCoefficient: 0.429, // 1.5/3.5 base cast time ratio
  isOnGlobalCooldown: true,
};

// Lesser Healing Wave - Rank 4 (Downrank for efficiency)
export const LESSER_HEALING_WAVE_DOWNRANK: Spell = {
  id: 'lesser_healing_wave_downrank',
  name: 'Lesser Healing Wave',
  rank: 4,
  icon: `${ICON_BASE}/spell_nature_healingwavelesser.jpg`,
  manaCost: 155,
  castTime: 1.5,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 248, max: 280 },
  spellPowerCoefficient: 0.429,
  isOnGlobalCooldown: true,
};

// Chain Heal - Rank 3 (Signature Shaman spell)
// Bounces to 2 additional targets (3 total), 50% reduction per bounce
export const CHAIN_HEAL: Spell = {
  id: 'chain_heal',
  name: 'Chain Heal',
  rank: 3,
  icon: `${ICON_BASE}/spell_nature_healingwavegreater.jpg`,
  manaCost: 405,
  castTime: 2.5,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 768, max: 880 },
  spellPowerCoefficient: 0.714, // 2.5/3.5 base cast time ratio
  isOnGlobalCooldown: true,
  maxBounces: 2, // Bounces to 2 additional targets (total 3 healed)
  bounceReduction: 0.5, // 50% reduction per bounce in Vanilla
};

// Chain Heal - Rank 1 (Downrank for mana efficiency)
export const CHAIN_HEAL_DOWNRANK: Spell = {
  id: 'chain_heal_downrank',
  name: 'Chain Heal',
  rank: 1,
  icon: `${ICON_BASE}/spell_nature_healingwavegreater.jpg`,
  manaCost: 260,
  castTime: 2.5,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 332, max: 381 },
  spellPowerCoefficient: 0.714,
  isOnGlobalCooldown: true,
  maxBounces: 2,
  bounceReduction: 0.5,
};

// Nature's Swiftness - Talent ability (like Divine Favor but makes next spell instant)
export const NATURES_SWIFTNESS: Spell = {
  id: 'natures_swiftness',
  name: "Nature's Swiftness",
  icon: `${ICON_BASE}/spell_nature_ravenform.jpg`,
  manaCost: 0,
  castTime: 0,
  cooldown: 180, // 3 minute cooldown
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: false, // Does not trigger GCD
};

// Cure Poison - Removes one poison effect
export const CURE_POISON: Spell = {
  id: 'cure_poison',
  name: 'Cure Poison',
  icon: `${ICON_BASE}/spell_nature_nullifypoison.jpg`,
  manaCost: 75,
  castTime: 0, // Instant
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: true,
};

// Cure Disease - Removes one disease effect
export const CURE_DISEASE: Spell = {
  id: 'cure_disease',
  name: 'Cure Disease',
  icon: `${ICON_BASE}/spell_nature_removedisease.jpg`,
  manaCost: 75,
  castTime: 0, // Instant
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: true,
};

// Default Shaman action bar (8 spells to match Paladin)
export const DEFAULT_SHAMAN_ACTION_BAR: Spell[] = [
  HEALING_WAVE,           // 1 - Big heal (like Holy Light R9)
  HEALING_WAVE_DOWNRANK,  // 2 - Efficient big heal (like Holy Light R6)
  LESSER_HEALING_WAVE,    // 3 - Fast heal (like Flash of Light R6)
  LESSER_HEALING_WAVE_DOWNRANK, // 4 - Efficient fast heal (like Flash of Light R4)
  CHAIN_HEAL,             // 5 - Signature AoE heal
  CHAIN_HEAL_DOWNRANK,    // 6 - Efficient AoE heal
  NATURES_SWIFTNESS,      // 7 - Emergency instant (like Divine Favor)
  CURE_POISON,            // 8 - Poison dispel
  // Note: Cure Disease could be on bar but limited to 8 slots
  // Players can use it situationally via totem bar or keybind
];

// All shaman spells for reference
export const ALL_SHAMAN_SPELLS = {
  HEALING_WAVE,
  HEALING_WAVE_DOWNRANK,
  LESSER_HEALING_WAVE,
  LESSER_HEALING_WAVE_DOWNRANK,
  CHAIN_HEAL,
  CHAIN_HEAL_DOWNRANK,
  NATURES_SWIFTNESS,
  CURE_POISON,
  CURE_DISEASE,
};
