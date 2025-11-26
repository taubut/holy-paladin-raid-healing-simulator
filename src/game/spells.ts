import type { Spell } from './types';

// Classic WoW Holy Paladin Spells - Vanilla Only
const ICON_BASE = 'https://wow.zamimg.com/images/wow/icons/large';

// Spell tooltip descriptions - Authentic Vanilla WoW from Wowhead
export interface SpellTooltip {
  description: string;
  additionalInfo?: string;
}

export const SPELL_TOOLTIPS: Record<string, SpellTooltip> = {
  holy_light: {
    description: 'Heals a friendly target for 1590 to 1770.',
    additionalInfo: 'Your strongest single-target heal. Use on tanks and priority targets.',
  },
  holy_light_downrank: {
    description: 'Heals a friendly target for 698 to 780.',
    additionalInfo: 'Mana-efficient option. Same cast time but lower mana cost.',
  },
  flash_of_light: {
    description: 'Heals a friendly target for 346 to 386.',
    additionalInfo: 'Fast, efficient heal. Your bread-and-butter spell for sustain healing.',
  },
  flash_of_light_downrank: {
    description: 'Heals a friendly target for 189 to 211.',
    additionalInfo: 'Ultra-efficient for topping off slightly injured targets.',
  },
  holy_shock: {
    description: 'Blasts the target with Holy energy, causing 204 to 220 Holy damage to an enemy, or 204 to 220 healing to an ally.',
    additionalInfo: 'Instant cast! Use for emergency heals or while moving.',
  },
  lay_on_hands: {
    description: "Heals a friendly target for an amount equal to the Paladin's maximum health. Drains all of the Paladin's remaining mana when used.",
    additionalInfo: 'Emergency only! Full heal but drains all your mana. 1 hour cooldown normally, reduced here.',
  },
  divine_favor: {
    description: "When activated, gives your next Flash of Light, Holy Light, or Holy Shock spell a 100% critical effect chance.",
    additionalInfo: 'Combine with Holy Light for massive emergency heals on tanks!',
  },
  cleanse: {
    description: 'Cleanses a friendly target, removing 1 magic effect, 1 poison effect, and 1 disease effect.',
    additionalInfo: 'Paladins can dispel magic, poison, AND disease - very versatile!',
  },
  blessing_of_light: {
    description: 'Places a Blessing on the friendly target, increasing the effects of Holy Light spells used on the target by up to 400 and the effects of Flash of Light spells used on the target by up to 115. Lasts 5 min.',
    additionalInfo: 'Always keep this on tanks! Significantly boosts your healing output.',
  },
  // ============================================
  // SHAMAN SPELLS
  // ============================================
  healing_wave: {
    description: 'Heals a friendly target for 1620 to 1850.',
    additionalInfo: 'Your strongest single-target heal. Long cast time but powerful for tank healing.',
  },
  healing_wave_downrank: {
    description: 'Heals a friendly target for 389 to 443.',
    additionalInfo: 'Mana-efficient option for sustained healing when damage is lighter.',
  },
  lesser_healing_wave: {
    description: 'Heals a friendly target for 458 to 514.',
    additionalInfo: 'Fast heal for quick spot healing. Higher mana per heal than Healing Wave.',
  },
  lesser_healing_wave_downrank: {
    description: 'Heals a friendly target for 248 to 280.',
    additionalInfo: 'Efficient fast heal for topping off raid members.',
  },
  chain_heal: {
    description: 'Heals the friendly target for 768 to 880, then bounces to the 2 most injured nearby allies for 50% less each bounce.',
    additionalInfo: 'Signature Shaman spell! Extremely efficient for healing stacked groups.',
  },
  chain_heal_downrank: {
    description: 'Heals the friendly target for 332 to 381, then bounces to the 2 most injured nearby allies for 50% less each bounce.',
    additionalInfo: 'Mana-efficient AoE healing. Great for sustained raid healing.',
  },
  natures_swiftness: {
    description: 'When activated, your next Nature spell with a casting time of less than 10 sec becomes an instant cast spell.',
    additionalInfo: 'Emergency cooldown! Combine with Healing Wave for instant massive heals.',
  },
  cure_poison: {
    description: 'Cures 1 poison effect on the target.',
    additionalInfo: 'Use to remove poison debuffs from raid members.',
  },
  cure_disease: {
    description: 'Cures 1 disease effect on the target.',
    additionalInfo: 'Use to remove disease debuffs from raid members.',
  },
};

// Holy Light - Rank 9 (max rank)
export const HOLY_LIGHT: Spell = {
  id: 'holy_light',
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
};

// Holy Light - Rank 6 (downrank for efficiency)
export const HOLY_LIGHT_DOWNRANK: Spell = {
  id: 'holy_light_downrank',
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
};

// Flash of Light - Rank 6 (max rank)
export const FLASH_OF_LIGHT: Spell = {
  id: 'flash_of_light',
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
};

// Flash of Light - Rank 4 (downrank)
export const FLASH_OF_LIGHT_DOWNRANK: Spell = {
  id: 'flash_of_light_downrank',
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
};

// Holy Shock - Talent (31-point Holy)
export const HOLY_SHOCK: Spell = {
  id: 'holy_shock',
  name: 'Holy Shock',
  rank: 1,
  icon: `${ICON_BASE}/spell_holy_searinglight.jpg`,
  manaCost: 225,
  castTime: 0,
  cooldown: 30,
  currentCooldown: 0,
  healAmount: { min: 204, max: 220 },
  range: 20,
  spellPowerCoefficient: 0.43,
  isOnGlobalCooldown: true,
};

// Lay on Hands - Emergency heal
export const LAY_ON_HANDS: Spell = {
  id: 'lay_on_hands',
  name: 'Lay on Hands',
  rank: 3,
  icon: `${ICON_BASE}/spell_holy_layonhands.jpg`,
  manaCost: 0,
  castTime: 0,
  cooldown: 60,
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 }, // Heals for target's max health
  range: 40,
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: true,
};

// Divine Favor - Next heal is guaranteed crit
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

// Cleanse - Removes magic, poison, disease
export const CLEANSE: Spell = {
  id: 'cleanse',
  name: 'Cleanse',
  rank: 1,
  icon: `${ICON_BASE}/spell_holy_renew.jpg`,
  manaCost: 60,
  castTime: 0,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  range: 40,
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: true,
};

// Blessing of Light - Increases healing (buff, not an action bar ability)
export const BLESSING_OF_LIGHT: Spell = {
  id: 'blessing_of_light',
  name: 'Blessing of Light',
  rank: 3,
  icon: `${ICON_BASE}/spell_holy_prayerofhealing02.jpg`,
  manaCost: 60,
  castTime: 0,
  cooldown: 0,
  currentCooldown: 0,
  healAmount: { min: 0, max: 0 },
  range: 30,
  spellPowerCoefficient: 0,
  isOnGlobalCooldown: true,
};

// Blessing of Light buff values
export const BLESSING_OF_LIGHT_VALUES = {
  holyLightBonus: 400,
  flashOfLightBonus: 115,
};

// Default action bar (Blessing of Light is a buff managed elsewhere, not an action bar ability)
export const DEFAULT_ACTION_BAR: Spell[] = [
  HOLY_LIGHT,
  HOLY_LIGHT_DOWNRANK,
  FLASH_OF_LIGHT,
  FLASH_OF_LIGHT_DOWNRANK,
  HOLY_SHOCK,
  LAY_ON_HANDS,
  DIVINE_FAVOR,
  CLEANSE,
];
