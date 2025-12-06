// Restoration Druid Spells for Classic WoW (Vanilla)
// Authentic spell values based on Classic DB and Wowhead Classic

import type { Spell } from './types';

const ICON_BASE = '/icons';

// Extended Spell interface for HoT spells
export interface HoTSpell extends Spell {
  isHoT?: boolean;
  hotDuration?: number;      // Total duration in seconds
  hotTickInterval?: number;  // Seconds between ticks
  hotTotalHealing?: number;  // Total healing over duration (for reference)
  // For Regrowth which has both direct heal + HoT
  hasDirectHeal?: boolean;
}

// Healing Touch - Rank 11 (Max rank, big slow heal)
export const HEALING_TOUCH: Spell = {
  id: 'healing_touch',
  name: 'Healing Touch',
  rank: 11,
  icon: `${ICON_BASE}/spell_nature_healingtouch.jpg`,
  manaCost: 800,
  castTime: 3.5,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 2267, max: 2678 },
  spellPowerCoefficient: 1.0, // Full coefficient for 3.5s cast
  isOnGlobalCooldown: true,
};

// Healing Touch - Rank 8 (Downrank for mana efficiency)
export const HEALING_TOUCH_DOWNRANK: Spell = {
  id: 'healing_touch_downrank',
  name: 'Healing Touch',
  rank: 8,
  icon: `${ICON_BASE}/spell_nature_healingtouch.jpg`,
  manaCost: 465,
  castTime: 3.5,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 1199, max: 1427 },
  spellPowerCoefficient: 1.0,
  isOnGlobalCooldown: true,
};

// Regrowth - Rank 9 (Max rank, direct heal + HoT)
// Direct: 1003-1119, HoT: 1064 over 21 seconds (7 ticks, ~152 per tick)
export const REGROWTH: HoTSpell = {
  id: 'regrowth',
  name: 'Regrowth',
  rank: 9,
  icon: `${ICON_BASE}/spell_nature_resistnature.jpg`,
  manaCost: 880,
  castTime: 2.0,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 1003, max: 1119 }, // Direct heal portion
  spellPowerCoefficient: 0.50, // Split between direct and HoT
  isOnGlobalCooldown: true,
  isHoT: true,
  hasDirectHeal: true,
  hotDuration: 21,
  hotTickInterval: 3, // Ticks every 3 seconds
  hotTotalHealing: 1064, // HoT portion total
};

// Rejuvenation - Rank 11 (Max rank, pure HoT)
// 888 total healing over 12 seconds (4 ticks, 222 per tick)
export const REJUVENATION: HoTSpell = {
  id: 'rejuvenation',
  name: 'Rejuvenation',
  rank: 11,
  icon: `${ICON_BASE}/spell_nature_rejuvenation.jpg`,
  manaCost: 360,
  castTime: 0, // Instant
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 222, max: 222 }, // Per tick healing
  spellPowerCoefficient: 0.20, // Per tick coefficient
  isOnGlobalCooldown: true,
  isHoT: true,
  hotDuration: 12,
  hotTickInterval: 3, // Ticks every 3 seconds
  hotTotalHealing: 888,
};

// Rejuvenation - Rank 7 (Downrank for efficiency)
// 504 total healing over 12 seconds (4 ticks, 126 per tick)
export const REJUVENATION_DOWNRANK: HoTSpell = {
  id: 'rejuvenation_downrank',
  name: 'Rejuvenation',
  rank: 7,
  icon: `${ICON_BASE}/spell_nature_rejuvenation.jpg`,
  manaCost: 215,
  castTime: 0, // Instant
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 126, max: 126 }, // Per tick healing
  spellPowerCoefficient: 0.20,
  isOnGlobalCooldown: true,
  isHoT: true,
  hotDuration: 12,
  hotTickInterval: 3,
  hotTotalHealing: 504,
};

// Nature's Swiftness - Talent ability (makes next spell instant)
export const NATURES_SWIFTNESS_DRUID: Spell = {
  id: 'natures_swiftness_druid',
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

// Remove Curse - Removes curse effects
export const REMOVE_CURSE: Spell = {
  id: 'remove_curse',
  name: 'Remove Curse',
  icon: `${ICON_BASE}/spell_holy_removecurse.jpg`,
  manaCost: 50,
  castTime: 0, // Instant
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: true,
};

// Abolish Poison - Removes poison effects
export const ABOLISH_POISON: Spell = {
  id: 'abolish_poison',
  name: 'Abolish Poison',
  icon: `${ICON_BASE}/spell_nature_nullifypoison_02.jpg`,
  manaCost: 60,
  castTime: 0, // Instant
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: true,
};

// Swiftmend - Talent (consumes HoT for instant heal) - Only available with talent
// Consumes Rejuvenation or Regrowth HoT for instant heal equal to 12 sec of the HoT
export const SWIFTMEND: Spell = {
  id: 'swiftmend',
  name: 'Swiftmend',
  icon: `${ICON_BASE}/inv_relics_idolofrejuvenation.jpg`,
  manaCost: 255,
  castTime: 0, // Instant
  cooldown: 15, // 15 second cooldown
  currentCooldown: 0,
  healAmount: { min: 888, max: 888 }, // Consumes Rejuvenation for ~888 instant heal
  spellPowerCoefficient: 0.80, // Based on consumed HoT
  isOnGlobalCooldown: true,
};

// Innervate - Increases target's mana regeneration by 400% for 20 seconds
// Also allows 100% of mana regeneration to continue while casting
export const INNERVATE: Spell = {
  id: 'innervate',
  name: 'Innervate',
  icon: `${ICON_BASE}/spell_nature_lightning.jpg`,
  manaCost: 0,
  castTime: 0, // Instant
  cooldown: 360, // 6 minute cooldown
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: true,
};

// All druid spells for AI healer selection
export const DRUID_SPELLS = {
  HEALING_TOUCH,
  HEALING_TOUCH_DOWNRANK,
  REGROWTH,
  REJUVENATION,
  REJUVENATION_DOWNRANK,
  NATURES_SWIFTNESS_DRUID,
  REMOVE_CURSE,
  ABOLISH_POISON,
  SWIFTMEND,
  INNERVATE,
};

// Default action bar for Druid (matching pattern of other healers)
export const DEFAULT_DRUID_ACTION_BAR: Spell[] = [
  HEALING_TOUCH,           // 1 - Big heal
  HEALING_TOUCH_DOWNRANK,  // 2 - Efficient big heal
  REGROWTH,                // 3 - Medium heal + HoT
  REJUVENATION,            // 4 - Pure HoT
  REJUVENATION_DOWNRANK,   // 5 - Efficient HoT
  SWIFTMEND,               // 6 - Emergency instant (consumes HoT)
  NATURES_SWIFTNESS_DRUID, // 7 - Makes next spell instant
  INNERVATE,               // 8 - Mana regen buff
  REMOVE_CURSE,            // 9 - Curse dispel
  ABOLISH_POISON,          // 0 - Poison dispel
];
