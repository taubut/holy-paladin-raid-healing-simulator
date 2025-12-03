// Party Auras - Classic WoW Auras that affect party/raid members
// These are distinct from raid buffs - they're passive auras that affect groups

import type { PartyAura, RaidMember } from './types';

// Party Aura Definitions
export const PARTY_AURAS: Record<string, PartyAura> = {
  // === PALADIN AURAS (Manual Selection, Raid-Wide) ===
  // All paladin specs can use any aura
  devotion_aura: {
    id: 'devotion_aura',
    name: 'Devotion Aura',
    icon: '/icons/spell_holy_devotionaura.jpg',
    providerClass: 'paladin',
    effect: { armorBonus: 735 },
    isAutomatic: false,
    scope: 'raid',
  },
  concentration_aura: {
    id: 'concentration_aura',
    name: 'Concentration Aura',
    icon: '/icons/spell_holy_mindsooth.jpg',
    providerClass: 'paladin',
    effect: {}, // Interrupt resist - cosmetic for this sim
    isAutomatic: false,
    scope: 'raid',
  },
  fire_resistance_aura: {
    id: 'fire_resistance_aura',
    name: 'Fire Resistance Aura',
    icon: '/icons/spell_fire_sealoffire.jpg',
    providerClass: 'paladin',
    effect: { fireResistance: 60 },
    isAutomatic: false,
    scope: 'raid',
  },
  frost_resistance_aura: {
    id: 'frost_resistance_aura',
    name: 'Frost Resistance Aura',
    icon: '/icons/spell_frost_wizardmark.jpg',
    providerClass: 'paladin',
    effect: { frostResistance: 60 },
    isAutomatic: false,
    scope: 'raid',
  },
  shadow_resistance_aura: {
    id: 'shadow_resistance_aura',
    name: 'Shadow Resistance Aura',
    icon: '/icons/spell_shadow_sealofkings.jpg',
    providerClass: 'paladin',
    effect: { shadowResistance: 60 },
    isAutomatic: false,
    scope: 'raid',
  },
  retribution_aura: {
    id: 'retribution_aura',
    name: 'Retribution Aura',
    icon: '/icons/spell_holy_auraoflight.jpg',
    providerClass: 'paladin',
    effect: {}, // Holy damage on hit - cosmetic for healer sim
    isAutomatic: false,
    scope: 'raid',
  },
  sanctity_aura: {
    id: 'sanctity_aura',
    name: 'Sanctity Aura',
    icon: '/icons/spell_holy_mindvision.jpg',
    providerClass: 'paladin',
    effect: { healingPower: 50 }, // +10% holy damage approximated as healing power for healers
    isAutomatic: false,
    scope: 'raid',
  },

  // === DRUID AURAS (Automatic, Party-Only) ===
  moonkin_aura: {
    id: 'moonkin_aura',
    name: 'Moonkin Aura',
    icon: '/icons/spell_nature_moonglow.jpg',
    providerClass: 'druid',
    providerSpec: 'balance',  // Only Balance druids provide this
    effect: { spellCritBonus: 3 },
    isAutomatic: true,
    scope: 'party',
  },
  leader_of_the_pack: {
    id: 'leader_of_the_pack',
    name: 'Leader of the Pack',
    icon: '/icons/spell_nature_unyeildingstamina.jpg',
    providerClass: 'druid',
    providerSpec: ['feral_tank', 'feral_dps'],  // Both Feral specs provide this
    effect: { meleeCritBonus: 3 },
    isAutomatic: true,
    scope: 'party',
  },

  // === HUNTER AURA (Automatic, Party-Only) ===
  trueshot_aura: {
    id: 'trueshot_aura',
    name: 'Trueshot Aura',
    icon: '/icons/ability_trueshot.jpg',
    providerClass: 'hunter',
    providerSpec: 'marksmanship',  // Only Marksmanship hunters provide this
    effect: { attackPowerBonus: 100 },
    isAutomatic: true,
    scope: 'party',
  },

  // === WARLOCK AURA (Automatic, Party-Only) ===
  // Blood Pact comes from Imp pet - all warlock specs can have an Imp
  blood_pact: {
    id: 'blood_pact',
    name: 'Blood Pact',
    icon: '/icons/spell_shadow_bloodboil.jpg',
    providerClass: 'warlock',
    // No spec requirement - all warlocks can summon an Imp
    effect: { staminaBonus: 42 }, // Rank 5 value
    isAutomatic: true,
    scope: 'party',
  },
};

// Check if a member provides a specific aura based on their spec
export function memberProvidesAura(member: RaidMember, aura: PartyAura): boolean {
  // Class must match
  if (member.class !== aura.providerClass) return false;

  // If no spec requirement, class match is enough
  if (!aura.providerSpec) return true;

  // Check spec requirement
  if (Array.isArray(aura.providerSpec)) {
    return aura.providerSpec.includes(member.spec);
  }
  return member.spec === aura.providerSpec;
}

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
