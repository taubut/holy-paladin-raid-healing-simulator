import type { Spell } from '../types/game';

// Classic WoW Holy Paladin Spells - Vanilla Only
// Icon URLs from Wowhead's CDN

const ICON_BASE = 'https://wow.zamimg.com/images/wow/icons/large';

// Holy Light - All Ranks (2.5 sec cast, 71% spell power coefficient)
export const HOLY_LIGHT_RANKS: Spell[] = [
  {
    id: 'holy_light_1',
    name: 'Holy Light',
    rank: 1,
    icon: `${ICON_BASE}/spell_holy_holybolt.jpg`,
    manaCost: 35,
    castTime: 2.5,
    cooldown: 0,
    currentCooldown: 0,
    healAmount: { min: 39, max: 47 },
    range: 40,
    spellPowerCoefficient: 0.71,
    isOnGlobalCooldown: false,
  },
  {
    id: 'holy_light_2',
    name: 'Holy Light',
    rank: 2,
    icon: `${ICON_BASE}/spell_holy_holybolt.jpg`,
    manaCost: 60,
    castTime: 2.5,
    cooldown: 0,
    currentCooldown: 0,
    healAmount: { min: 76, max: 90 },
    range: 40,
    spellPowerCoefficient: 0.71,
    isOnGlobalCooldown: false,
  },
  {
    id: 'holy_light_3',
    name: 'Holy Light',
    rank: 3,
    icon: `${ICON_BASE}/spell_holy_holybolt.jpg`,
    manaCost: 110,
    castTime: 2.5,
    cooldown: 0,
    currentCooldown: 0,
    healAmount: { min: 159, max: 187 },
    range: 40,
    spellPowerCoefficient: 0.71,
    isOnGlobalCooldown: false,
  },
  {
    id: 'holy_light_4',
    name: 'Holy Light',
    rank: 4,
    icon: `${ICON_BASE}/spell_holy_holybolt.jpg`,
    manaCost: 190,
    castTime: 2.5,
    cooldown: 0,
    currentCooldown: 0,
    healAmount: { min: 310, max: 356 },
    range: 40,
    spellPowerCoefficient: 0.71,
    isOnGlobalCooldown: false,
  },
  {
    id: 'holy_light_5',
    name: 'Holy Light',
    rank: 5,
    icon: `${ICON_BASE}/spell_holy_holybolt.jpg`,
    manaCost: 275,
    castTime: 2.5,
    cooldown: 0,
    currentCooldown: 0,
    healAmount: { min: 491, max: 553 },
    range: 40,
    spellPowerCoefficient: 0.71,
    isOnGlobalCooldown: false,
  },
  {
    id: 'holy_light_6',
    name: 'Holy Light',
    rank: 6,
    icon: `${ICON_BASE}/spell_holy_holybolt.jpg`,
    manaCost: 365,
    castTime: 2.5,
    cooldown: 0,
    currentCooldown: 0,
    healAmount: { min: 698, max: 780 },
    range: 40,
    spellPowerCoefficient: 0.71,
    isOnGlobalCooldown: false,
  },
  {
    id: 'holy_light_7',
    name: 'Holy Light',
    rank: 7,
    icon: `${ICON_BASE}/spell_holy_holybolt.jpg`,
    manaCost: 465,
    castTime: 2.5,
    cooldown: 0,
    currentCooldown: 0,
    healAmount: { min: 945, max: 1053 },
    range: 40,
    spellPowerCoefficient: 0.71,
    isOnGlobalCooldown: false,
  },
  {
    id: 'holy_light_8',
    name: 'Holy Light',
    rank: 8,
    icon: `${ICON_BASE}/spell_holy_holybolt.jpg`,
    manaCost: 580,
    castTime: 2.5,
    cooldown: 0,
    currentCooldown: 0,
    healAmount: { min: 1246, max: 1388 },
    range: 40,
    spellPowerCoefficient: 0.71,
    isOnGlobalCooldown: false,
  },
  {
    id: 'holy_light_9',
    name: 'Holy Light',
    rank: 9,
    icon: `${ICON_BASE}/spell_holy_holybolt.jpg`,
    manaCost: 660,
    castTime: 2.5,
    cooldown: 0,
    currentCooldown: 0,
    healAmount: { min: 1590, max: 1770 },
    range: 40,
    spellPowerCoefficient: 0.71,
    isOnGlobalCooldown: false,
  },
];

// Flash of Light - All Ranks (1.5 sec cast, 43% spell power coefficient)
export const FLASH_OF_LIGHT_RANKS: Spell[] = [
  {
    id: 'flash_of_light_1',
    name: 'Flash of Light',
    rank: 1,
    icon: `${ICON_BASE}/spell_holy_flashheal.jpg`,
    manaCost: 35,
    castTime: 1.5,
    cooldown: 0,
    currentCooldown: 0,
    healAmount: { min: 62, max: 72 },
    range: 40,
    spellPowerCoefficient: 0.43,
    isOnGlobalCooldown: false,
  },
  {
    id: 'flash_of_light_2',
    name: 'Flash of Light',
    rank: 2,
    icon: `${ICON_BASE}/spell_holy_flashheal.jpg`,
    manaCost: 50,
    castTime: 1.5,
    cooldown: 0,
    currentCooldown: 0,
    healAmount: { min: 96, max: 110 },
    range: 40,
    spellPowerCoefficient: 0.43,
    isOnGlobalCooldown: false,
  },
  {
    id: 'flash_of_light_3',
    name: 'Flash of Light',
    rank: 3,
    icon: `${ICON_BASE}/spell_holy_flashheal.jpg`,
    manaCost: 70,
    castTime: 1.5,
    cooldown: 0,
    currentCooldown: 0,
    healAmount: { min: 143, max: 163 },
    range: 40,
    spellPowerCoefficient: 0.43,
    isOnGlobalCooldown: false,
  },
  {
    id: 'flash_of_light_4',
    name: 'Flash of Light',
    rank: 4,
    icon: `${ICON_BASE}/spell_holy_flashheal.jpg`,
    manaCost: 90,
    castTime: 1.5,
    cooldown: 0,
    currentCooldown: 0,
    healAmount: { min: 189, max: 211 },
    range: 40,
    spellPowerCoefficient: 0.43,
    isOnGlobalCooldown: false,
  },
  {
    id: 'flash_of_light_5',
    name: 'Flash of Light',
    rank: 5,
    icon: `${ICON_BASE}/spell_holy_flashheal.jpg`,
    manaCost: 115,
    castTime: 1.5,
    cooldown: 0,
    currentCooldown: 0,
    healAmount: { min: 256, max: 288 },
    range: 40,
    spellPowerCoefficient: 0.43,
    isOnGlobalCooldown: false,
  },
  {
    id: 'flash_of_light_6',
    name: 'Flash of Light',
    rank: 6,
    icon: `${ICON_BASE}/spell_holy_flashheal.jpg`,
    manaCost: 140,
    castTime: 1.5,
    cooldown: 0,
    currentCooldown: 0,
    healAmount: { min: 346, max: 386 },
    range: 40,
    spellPowerCoefficient: 0.43,
    isOnGlobalCooldown: false,
  },
];

// Holy Shock - Talent (31-point Holy) - Instant cast, 30 sec cooldown
export const HOLY_SHOCK: Spell = {
  id: 'holy_shock',
  name: 'Holy Shock',
  rank: 1,
  icon: `${ICON_BASE}/spell_holy_searinglight.jpg`,
  manaCost: 225,
  castTime: 0, // Instant
  cooldown: 30,
  currentCooldown: 0,
  healAmount: { min: 204, max: 220 },
  range: 20,
  spellPowerCoefficient: 0.43,
  isOnGlobalCooldown: true,
};

// Lay on Hands - Emergency heal, 1 hour cooldown (we'll use 60 seconds for gameplay)
export const LAY_ON_HANDS: Spell = {
  id: 'lay_on_hands',
  name: 'Lay on Hands',
  rank: 3,
  icon: `${ICON_BASE}/spell_holy_layonhands.jpg`,
  manaCost: 0, // Drains all mana but costs 0 to cast
  castTime: 0, // Instant
  cooldown: 60, // Reduced from 1 hour for gameplay
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 }, // Heals for player's max health - special case
  range: 40,
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: true,
};

// Divine Favor - Next heal is guaranteed crit, 2 min cooldown
export const DIVINE_FAVOR: Spell = {
  id: 'divine_favor',
  name: 'Divine Favor',
  rank: 1,
  icon: `${ICON_BASE}/spell_holy_divineillumination.jpg`,
  manaCost: 0,
  castTime: 0,
  cooldown: 120,
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  range: 0,
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: false,
};

// Cleanse - Removes 1 magic, 1 poison, 1 disease
export const CLEANSE: Spell = {
  id: 'cleanse',
  name: 'Cleanse',
  rank: 1,
  icon: `${ICON_BASE}/spell_holy_renew.jpg`,
  manaCost: 60,
  castTime: 0, // Instant in Classic with talents
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  range: 40,
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: true,
};

// Blessing of Light - Increases healing from Holy Light and Flash of Light
export const BLESSING_OF_LIGHT: Spell = {
  id: 'blessing_of_light',
  name: 'Blessing of Light',
  rank: 3,
  icon: `${ICON_BASE}/spell_holy_prayerofhealing.jpg`,
  manaCost: 60,
  castTime: 0,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  range: 30,
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: true,
};

// Default action bar setup - using max ranks
export const DEFAULT_ACTION_BAR: Spell[] = [
  HOLY_LIGHT_RANKS[8], // Holy Light Rank 9
  HOLY_LIGHT_RANKS[5], // Holy Light Rank 6 (downrank for efficiency)
  FLASH_OF_LIGHT_RANKS[5], // Flash of Light Rank 6
  FLASH_OF_LIGHT_RANKS[3], // Flash of Light Rank 4 (downrank)
  HOLY_SHOCK,
  LAY_ON_HANDS,
  DIVINE_FAVOR,
  CLEANSE,
  BLESSING_OF_LIGHT,
];

// Blessing of Light buff values by rank
export const BLESSING_OF_LIGHT_VALUES = {
  1: { holyLightBonus: 210, flashOfLightBonus: 60 },
  2: { holyLightBonus: 300, flashOfLightBonus: 85 },
  3: { holyLightBonus: 400, flashOfLightBonus: 115 },
};
