// Holy Priest Spells for Classic WoW (Vanilla)
// Authentic spell values based on Classic DB and Wowhead Classic

import type { Spell } from './types';

const ICON_BASE = '/icons';

// Extended Spell interface for HoT spells
export interface HoTSpell extends Spell {
  isHoT?: boolean;
  hotDuration?: number;      // Total duration in seconds
  hotTickInterval?: number;  // Seconds between ticks
  hotTotalHealing?: number;  // Total healing over duration (for reference)
  hasDirectHeal?: boolean;   // For spells like Regrowth that have both direct + HoT
}

// Greater Heal - Rank 5 (Max rank, big slow heal)
// Source: classicdb.ch - 710 mana, 1966-2195 healing
export const GREATER_HEAL: Spell = {
  id: 'greater_heal',
  name: 'Greater Heal',
  rank: 5,
  icon: `${ICON_BASE}/spell_holy_greaterheal.jpg`,
  manaCost: 710,
  castTime: 3.0,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 1966, max: 2195 },
  spellPowerCoefficient: 0.857, // 3.0/3.5 base cast time ratio
  isOnGlobalCooldown: true,
};

// Greater Heal - Rank 3 (Downrank for moderate healing)
// Source: classicdb.ch - 545 mana, 1437-1610 healing
export const GREATER_HEAL_DOWNRANK: Spell = {
  id: 'greater_heal_downrank',
  name: 'Greater Heal',
  rank: 3,
  icon: `${ICON_BASE}/spell_holy_greaterheal.jpg`,
  manaCost: 545,
  castTime: 3.0,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 1437, max: 1610 },
  spellPowerCoefficient: 0.857,
  isOnGlobalCooldown: true,
};

// Greater Heal - Rank 1 (Spam rank for emergencies when mana is critical)
// Source: classicdb.ch - 370 mana, 899-1014 healing
export const GREATER_HEAL_RANK1: Spell = {
  id: 'greater_heal_rank1',
  name: 'Greater Heal',
  rank: 1,
  icon: `${ICON_BASE}/spell_holy_greaterheal.jpg`,
  manaCost: 370,
  castTime: 3.0,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 899, max: 1014 },
  spellPowerCoefficient: 0.857,
  isOnGlobalCooldown: true,
};

// Flash Heal - Rank 7 (Max rank, fast heal)
// Source: classicdb.ch - 380 mana, 812-959 healing
export const FLASH_HEAL: Spell = {
  id: 'flash_heal',
  name: 'Flash Heal',
  rank: 7,
  icon: `${ICON_BASE}/spell_holy_flashheal.jpg`,
  manaCost: 380,
  castTime: 1.5,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 812, max: 959 },
  spellPowerCoefficient: 0.429, // 1.5/3.5 base cast time ratio
  isOnGlobalCooldown: true,
};

// Flash Heal - Rank 4 (Downrank for efficiency - recommended by guides)
// Source: classicdb.ch - 215 mana, 400-479 healing
export const FLASH_HEAL_DOWNRANK: Spell = {
  id: 'flash_heal_downrank',
  name: 'Flash Heal',
  rank: 4,
  icon: `${ICON_BASE}/spell_holy_flashheal.jpg`,
  manaCost: 215,
  castTime: 1.5,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 400, max: 479 },
  spellPowerCoefficient: 0.429,
  isOnGlobalCooldown: true,
};

// Heal - Rank 3 (Most mana efficient heal for low damage periods)
// Source: classicdb.ch - 255 mana, 566-643 healing, 3.0s cast
// Guides recommend this for conserving mana during light damage
export const HEAL: Spell = {
  id: 'heal',
  name: 'Heal',
  rank: 3,
  icon: `${ICON_BASE}/spell_holy_lesserheal02.jpg`, // Uses Lesser Heal icon
  manaCost: 255,
  castTime: 3.0,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 566, max: 643 },
  spellPowerCoefficient: 0.857, // Same as Greater Heal (3.0s cast)
  isOnGlobalCooldown: true,
};

// Renew - Rank 10 (Max rank, HoT spell)
// 970 total healing over 15 seconds (5 ticks, 194 per tick)
export const RENEW: HoTSpell = {
  id: 'renew',
  name: 'Renew',
  rank: 10,
  icon: `${ICON_BASE}/spell_holy_renew.jpg`,
  manaCost: 410,
  castTime: 0, // Instant
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 194, max: 194 }, // Per tick healing
  spellPowerCoefficient: 0.20, // Per tick coefficient (total ~1.0 over duration)
  isOnGlobalCooldown: true,
  isHoT: true,
  hotDuration: 15,
  hotTickInterval: 3, // Ticks every 3 seconds
  hotTotalHealing: 970,
};

// Prayer of Healing - Rank 5 (Max rank, group heal)
// Heals all party members in the caster's group
export const PRAYER_OF_HEALING: Spell = {
  id: 'prayer_of_healing',
  name: 'Prayer of Healing',
  rank: 5,
  icon: `${ICON_BASE}/spell_holy_prayerofhealing02.jpg`,
  manaCost: 1070,
  castTime: 3.0,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 1041, max: 1100 },
  spellPowerCoefficient: 0.286, // Reduced coefficient for AoE
  isOnGlobalCooldown: true,
};

// Dispel Magic - Rank 2 (Removes magic effects)
export const DISPEL_MAGIC: Spell = {
  id: 'dispel_magic',
  name: 'Dispel Magic',
  rank: 2,
  icon: `${ICON_BASE}/spell_holy_dispelmagic.jpg`,
  manaCost: 75,
  castTime: 0, // Instant
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: true,
};

// Abolish Disease - Removes disease effects
export const ABOLISH_DISEASE: Spell = {
  id: 'abolish_disease',
  name: 'Abolish Disease',
  icon: `${ICON_BASE}/spell_nature_nullifydisease.jpg`,
  manaCost: 100,
  castTime: 0, // Instant
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: true,
};

// Power Word: Shield - Rank 10 (Absorb shield)
// Source: classicdb.ch - 500 mana, 942 absorb, 15s Weakened Soul
export const POWER_WORD_SHIELD: Spell = {
  id: 'power_word_shield',
  name: 'Power Word: Shield',
  rank: 10,
  icon: `${ICON_BASE}/spell_holy_powerwordshield.jpg`,
  manaCost: 500,
  castTime: 0, // Instant
  cooldown: 0, // Has Weakened Soul debuff instead
  currentCooldown: 0,
  healAmount: { min: 942, max: 942 }, // Shield absorb amount
  spellPowerCoefficient: 0.10, // Low coefficient for shields
  isOnGlobalCooldown: true,
};

// Inner Focus - Holy/Disc talent (makes next spell free + 25% crit)
// Source: classicdb.ch - 3 min cooldown, instant, next spell costs 0 mana
export const INNER_FOCUS: Spell = {
  id: 'inner_focus',
  name: 'Inner Focus',
  icon: `${ICON_BASE}/spell_frost_windwalkon.jpg`,
  manaCost: 0,
  castTime: 0, // Instant
  cooldown: 180, // 3 minute cooldown
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: false, // Does not trigger GCD
};

// All priest spells for AI healer selection
export const PRIEST_SPELLS = {
  GREATER_HEAL,
  GREATER_HEAL_DOWNRANK,
  GREATER_HEAL_RANK1,
  FLASH_HEAL,
  FLASH_HEAL_DOWNRANK,
  HEAL,
  RENEW,
  PRAYER_OF_HEALING,
  DISPEL_MAGIC,
  ABOLISH_DISEASE,
  POWER_WORD_SHIELD,
  INNER_FOCUS,
};

// Default action bar for Priest (matching pattern of other healers)
export const DEFAULT_PRIEST_ACTION_BAR: Spell[] = [
  GREATER_HEAL,           // 1 - Big heal (710 mana, 1966-2195)
  FLASH_HEAL,             // 2 - Fast heal (380 mana, 812-959)
  HEAL,                   // 3 - Efficient heal (255 mana, 566-643) - use for low damage
  RENEW,                  // 4 - HoT (410 mana, 970 over 15s)
  PRAYER_OF_HEALING,      // 5 - Group heal (1070 mana, 1041-1099)
  POWER_WORD_SHIELD,      // 6 - Damage absorb (500 mana, 942 absorb)
  DISPEL_MAGIC,           // 7 - Magic dispel
  ABOLISH_DISEASE,        // 8 - Disease dispel
];
