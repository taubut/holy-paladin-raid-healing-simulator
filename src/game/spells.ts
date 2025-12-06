import type { Spell } from './types';

// Classic WoW Holy Paladin Spells - Vanilla Only
const ICON_BASE = '/icons';

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
  // ============================================
  // PRIEST SPELLS
  // ============================================
  greater_heal: {
    description: 'A slow casting spell that heals a single target for 1966 to 2195.',
    additionalInfo: 'Your biggest heal. Use on tanks or badly injured targets.',
  },
  greater_heal_downrank: {
    description: 'A slow casting spell that heals a single target for 1437 to 1610.',
    additionalInfo: 'Rank 3 - More mana efficient for moderate damage.',
  },
  greater_heal_rank1: {
    description: 'A slow casting spell that heals a single target for 899 to 1014.',
    additionalInfo: 'Rank 1 - Emergency spam rank when mana is critical.',
  },
  flash_heal: {
    description: 'Heals a friendly target for 812 to 959.',
    additionalInfo: 'Fast 1.5s cast. Your go-to spell for quick healing.',
  },
  flash_heal_downrank: {
    description: 'Heals a friendly target for 400 to 479.',
    additionalInfo: 'Rank 4 - Mana efficient for light damage.',
  },
  heal: {
    description: 'Heal your target for 566 to 643.',
    additionalInfo: 'Most mana-efficient heal. Use during light damage phases.',
  },
  renew: {
    description: 'Heals the target for 970 over 15 sec.',
    additionalInfo: 'Instant HoT! Keep rolling on tanks. 5 ticks of 194 healing.',
  },
  prayer_of_healing: {
    description: 'A powerful prayer heals party members within 30 yards for 1041 to 1100.',
    additionalInfo: 'Heals your entire group! Expensive but powerful for AoE damage.',
  },
  power_word_shield: {
    description: 'Draws on the soul of the party member to shield them, absorbing 942 damage. Lasts 30 sec. While the shield holds, spellcasting will not be interrupted by damage. Once shielded, the target cannot be shielded again for 15 sec.',
    additionalInfo: 'Instant absorb shield. Weakened Soul prevents re-shielding for 15 sec.',
  },
  inner_focus: {
    description: 'When activated, reduces the mana cost of your next spell by 100% and increases its critical effect chance by 25%.',
    additionalInfo: 'Combine with Greater Heal for a free, likely-to-crit big heal!',
  },
  power_infusion: {
    description: "Infuses the target with power, increasing their spell damage and healing by 20% for 15 sec.",
    additionalInfo: 'Cast on a caster DPS to boost raid damage! Watch them glow gold.',
  },
  dispel_magic: {
    description: 'Dispels magic on the target, removing 1 harmful spell from a friend.',
    additionalInfo: 'Use to remove magic debuffs from raid members.',
  },
  abolish_disease: {
    description: 'Attempts to cure 1 disease on the target, and 1 more disease every 5 sec for 20 sec.',
    additionalInfo: 'Removes diseases over time. Great for fights with disease mechanics.',
  },
  // ============================================
  // DRUID SPELLS
  // ============================================
  healing_touch: {
    description: 'Heals a friendly target for 2267 to 2678.',
    additionalInfo: 'Your biggest heal with a 3.5s cast time. Use on tanks or priority targets.',
  },
  healing_touch_downrank: {
    description: 'Heals a friendly target for 1199 to 1427.',
    additionalInfo: 'Rank 8 - More mana efficient for moderate damage.',
  },
  regrowth: {
    description: 'Heals a friendly target for 1003 to 1119 and another 1064 over 21 sec.',
    additionalInfo: 'Direct heal plus HoT! Great for pre-hotting and sustained healing.',
  },
  rejuvenation: {
    description: 'Heals the target for 888 over 12 sec.',
    additionalInfo: 'Instant HoT! Keep rolling on tanks. 4 ticks of 222 healing.',
  },
  rejuvenation_downrank: {
    description: 'Heals the target for 504 over 12 sec.',
    additionalInfo: 'Rank 7 - Mana efficient HoT for light incoming damage.',
  },
  swiftmend: {
    description: 'Consumes a Rejuvenation or Regrowth effect on a friendly target to instantly heal them for an amount equal to 12 sec of Rejuvenation or 18 sec of Regrowth.',
    additionalInfo: 'Emergency instant heal! Requires a HoT on the target. 15 sec cooldown.',
  },
  natures_swiftness_druid: {
    description: 'When activated, your next Nature spell with a casting time less than 10 sec becomes an instant cast spell.',
    additionalInfo: 'Emergency cooldown! Combine with Healing Touch for instant massive heals. 3 min CD.',
  },
  remove_curse: {
    description: 'Dispels 1 Curse from a friendly target.',
    additionalInfo: 'Use to remove curse debuffs from raid members.',
  },
  abolish_poison: {
    description: 'Attempts to cure 1 poison effect on the target, and 1 more poison effect every 2 sec for 8 sec.',
    additionalInfo: 'Removes poisons over time. Great for fights with poison mechanics.',
  },
  innervate: {
    description: 'Increases the target\'s Mana regeneration by 400% and allows 100% of mana regeneration while casting. Lasts 20 sec.',
    additionalInfo: 'Cast on yourself or another healer who is low on mana. 6 min cooldown.',
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
  isOnGlobalCooldown: true,
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
  isOnGlobalCooldown: true,
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
  isOnGlobalCooldown: true,
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
  isOnGlobalCooldown: true,
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
