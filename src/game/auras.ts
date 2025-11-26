// Party Auras - Classic WoW Auras that affect party/raid members
// These are distinct from raid buffs - they're passive auras that affect groups

import type { PartyAura } from './types';

// Party Aura Definitions
export const PARTY_AURAS: Record<string, PartyAura> = {
  // === PALADIN AURAS (Manual Selection, Raid-Wide) ===
  devotion_aura: {
    id: 'devotion_aura',
    name: 'Devotion Aura',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_devotionaura.jpg',
    providerClass: 'paladin',
    effect: { armorBonus: 735 },
    isAutomatic: false,
    scope: 'raid',
  },
  concentration_aura: {
    id: 'concentration_aura',
    name: 'Concentration Aura',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_mindsooth.jpg',
    providerClass: 'paladin',
    effect: {}, // Interrupt resist - cosmetic for this sim
    isAutomatic: false,
    scope: 'raid',
  },
  fire_resistance_aura: {
    id: 'fire_resistance_aura',
    name: 'Fire Resistance Aura',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_sealoffire.jpg',
    providerClass: 'paladin',
    effect: { fireResistance: 60 },
    isAutomatic: false,
    scope: 'raid',
  },
  frost_resistance_aura: {
    id: 'frost_resistance_aura',
    name: 'Frost Resistance Aura',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_frost_wizardmark.jpg',
    providerClass: 'paladin',
    effect: { frostResistance: 60 },
    isAutomatic: false,
    scope: 'raid',
  },
  shadow_resistance_aura: {
    id: 'shadow_resistance_aura',
    name: 'Shadow Resistance Aura',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_sealofkings.jpg',
    providerClass: 'paladin',
    effect: { shadowResistance: 60 },
    isAutomatic: false,
    scope: 'raid',
  },
  retribution_aura: {
    id: 'retribution_aura',
    name: 'Retribution Aura',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_auraoflight.jpg',
    providerClass: 'paladin',
    effect: {}, // Holy damage on hit - cosmetic for healer sim
    isAutomatic: false,
    scope: 'raid',
  },
  sanctity_aura: {
    id: 'sanctity_aura',
    name: 'Sanctity Aura',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_mindvision.jpg',
    providerClass: 'paladin',
    effect: { healingPower: 50 }, // +10% holy damage approximated as healing power for healers
    isAutomatic: false,
    scope: 'raid',
  },

  // === DRUID AURAS (Automatic, Party-Only) ===
  moonkin_aura: {
    id: 'moonkin_aura',
    name: 'Moonkin Aura',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_moonglow.jpg',
    providerClass: 'druid',
    providerSpec: 'moonkin',
    effect: { spellCritBonus: 3 },
    isAutomatic: true,
    scope: 'party',
  },
  leader_of_the_pack: {
    id: 'leader_of_the_pack',
    name: 'Leader of the Pack',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_unyeildingstamina.jpg',
    providerClass: 'druid',
    providerSpec: 'feral',
    effect: { meleeCritBonus: 3 },
    isAutomatic: true,
    scope: 'party',
  },

  // === HUNTER AURA (Automatic, Party-Only) ===
  trueshot_aura: {
    id: 'trueshot_aura',
    name: 'Trueshot Aura',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_trueshot.jpg',
    providerClass: 'hunter',
    providerSpec: 'marksman',
    effect: { attackPowerBonus: 100 },
    isAutomatic: true,
    scope: 'party',
  },

  // === WARLOCK AURA (Automatic, Party-Only) ===
  blood_pact: {
    id: 'blood_pact',
    name: 'Blood Pact',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_bloodboil.jpg',
    providerClass: 'warlock',
    effect: { staminaBonus: 42 }, // Rank 5 value
    isAutomatic: true,
    scope: 'party',
  },
};

// Get all paladin auras for selection UI
export function getPaladinAuras(): PartyAura[] {
  return Object.values(PARTY_AURAS).filter(aura => aura.providerClass === 'paladin');
}

// Get all automatic auras (non-paladin)
export function getAutomaticAuras(): PartyAura[] {
  return Object.values(PARTY_AURAS).filter(aura => aura.isAutomatic);
}

// Get aura by ID
export function getAuraById(auraId: string): PartyAura | undefined {
  return PARTY_AURAS[auraId];
}
