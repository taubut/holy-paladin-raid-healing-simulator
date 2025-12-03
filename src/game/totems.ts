// Restoration Shaman Totems for Classic WoW (Vanilla)
// One totem per element can be active at a time (Earth, Fire, Water, Air)
// Most totems last 2 minutes (120 seconds) and affect party members only

import type { Totem, TotemElement } from './types';

const ICON_BASE = '/icons';

// ============================================
// WATER TOTEMS - Mana and healing focused
// ============================================

export const MANA_SPRING_TOTEM: Totem = {
  id: 'mana_spring_totem',
  name: 'Mana Spring Totem',
  icon: `${ICON_BASE}/spell_nature_manaregentotem.jpg`,
  element: 'water',
  manaCost: 100,
  duration: 60, // 1 minute
  cooldown: 0,
  effect: { manaRegenBonus: 10 }, // +10 mana every 2 seconds to party
  scope: 'party',
  tickRate: 2,
};

export const MANA_TIDE_TOTEM: Totem = {
  id: 'mana_tide_totem',
  name: 'Mana Tide Totem',
  icon: `${ICON_BASE}/spell_frost_summonwaterelemental.jpg`,
  element: 'water',
  manaCost: 20,
  duration: 12, // Short duration but powerful
  cooldown: 300, // 5 minute cooldown
  effect: { manaRegenBonus: 170 }, // +170 mana every 3 seconds to party
  scope: 'party',
  tickRate: 3,
};

export const HEALING_STREAM_TOTEM: Totem = {
  id: 'healing_stream_totem',
  name: 'Healing Stream Totem',
  icon: `${ICON_BASE}/inv_spear_04.jpg`,
  element: 'water',
  manaCost: 80,
  duration: 60,
  cooldown: 0,
  effect: { healingReceivedBonus: 14 }, // Heals party for 14 hp every 2 sec
  scope: 'party',
  tickRate: 2,
};

export const POISON_CLEANSING_TOTEM: Totem = {
  id: 'poison_cleansing_totem',
  name: 'Poison Cleansing Totem',
  icon: `${ICON_BASE}/spell_nature_poisoncleansingtotem.jpg`,
  element: 'water',
  manaCost: 80, // ~10% base mana
  duration: 120,
  cooldown: 0,
  effect: { cleansesPoison: true },
  scope: 'party',
  tickRate: 5, // Pulses every 5 seconds
};

export const DISEASE_CLEANSING_TOTEM: Totem = {
  id: 'disease_cleansing_totem',
  name: 'Disease Cleansing Totem',
  icon: `${ICON_BASE}/spell_nature_diseasecleansingtotem.jpg`,
  element: 'water',
  manaCost: 80,
  duration: 120,
  cooldown: 0,
  effect: { cleansesDisease: true },
  scope: 'party',
  tickRate: 5,
};

// ============================================
// EARTH TOTEMS - Melee support and utility
// ============================================

export const STRENGTH_OF_EARTH_TOTEM: Totem = {
  id: 'strength_of_earth_totem',
  name: 'Strength of Earth Totem',
  icon: `${ICON_BASE}/spell_nature_earthbindtotem.jpg`,
  element: 'earth',
  manaCost: 65,
  duration: 120,
  cooldown: 0,
  effect: { strengthBonus: 77 },
  scope: 'party',
};

export const STONESKIN_TOTEM: Totem = {
  id: 'stoneskin_totem',
  name: 'Stoneskin Totem',
  icon: `${ICON_BASE}/spell_nature_stoneskintotem.jpg`,
  element: 'earth',
  manaCost: 60,
  duration: 120,
  cooldown: 0,
  effect: { armorBonus: 225 }, // Flat armor to party
  scope: 'party',
};

export const TREMOR_TOTEM: Totem = {
  id: 'tremor_totem',
  name: 'Tremor Totem',
  icon: `${ICON_BASE}/spell_nature_tremortotem.jpg`,
  element: 'earth',
  manaCost: 60,
  duration: 120,
  cooldown: 0,
  effect: { fearImmunity: true }, // Removes fear/charm/sleep every 4 sec (good for Onyxia!)
  scope: 'party',
  tickRate: 4,
};

// ============================================
// AIR TOTEMS - Agility, attack power, and threat
// ============================================

export const GRACE_OF_AIR_TOTEM: Totem = {
  id: 'grace_of_air_totem',
  name: 'Grace of Air Totem',
  icon: `${ICON_BASE}/spell_nature_invisibilitytotem.jpg`,
  element: 'air',
  manaCost: 90,
  duration: 120,
  cooldown: 0,
  effect: { agilityBonus: 77 },
  scope: 'party',
};

export const WINDFURY_TOTEM: Totem = {
  id: 'windfury_totem',
  name: 'Windfury Totem',
  icon: `${ICON_BASE}/spell_nature_windfury.jpg`,
  element: 'air',
  manaCost: 75,
  duration: 120,
  cooldown: 0,
  effect: { attackPowerBonus: 195 }, // Melee attack proc
  scope: 'party',
};

export const TRANQUIL_AIR_TOTEM: Totem = {
  id: 'tranquil_air_totem',
  name: 'Tranquil Air Totem',
  icon: `${ICON_BASE}/spell_nature_brilliance.jpg`,
  element: 'air',
  manaCost: 75,
  duration: 120,
  cooldown: 0,
  effect: { threatReduction: 20 }, // -20% threat for casters/healers
  scope: 'party',
};

// ============================================
// FIRE TOTEMS - Resistance totems (Fire element in Vanilla)
// ============================================

export const FIRE_RESISTANCE_TOTEM: Totem = {
  id: 'fire_resistance_totem',
  name: 'Fire Resistance Totem',
  icon: `${ICON_BASE}/spell_fireresistancetotem_01.jpg`,
  element: 'fire',
  manaCost: 95,
  duration: 120,
  cooldown: 0,
  effect: { fireResistance: 60 },
  scope: 'party',
};

export const FROST_RESISTANCE_TOTEM: Totem = {
  id: 'frost_resistance_totem',
  name: 'Frost Resistance Totem',
  icon: `${ICON_BASE}/spell_frostresistancetotem_01.jpg`,
  element: 'fire', // Yes, this is fire element in Vanilla
  manaCost: 95,
  duration: 120,
  cooldown: 0,
  effect: { frostResistance: 60 },
  scope: 'party',
};

export const NATURE_RESISTANCE_TOTEM: Totem = {
  id: 'nature_resistance_totem',
  name: 'Nature Resistance Totem',
  icon: `${ICON_BASE}/spell_nature_natureresistancetotem.jpg`,
  element: 'fire', // Also fire element in Vanilla
  manaCost: 95,
  duration: 120,
  cooldown: 0,
  effect: { natureResistance: 60 },
  scope: 'party',
};

// ============================================
// TOTEM COLLECTIONS BY ELEMENT
// ============================================

export const WATER_TOTEMS: Totem[] = [
  MANA_SPRING_TOTEM,
  MANA_TIDE_TOTEM,
  HEALING_STREAM_TOTEM,
  POISON_CLEANSING_TOTEM,
  DISEASE_CLEANSING_TOTEM,
];

export const EARTH_TOTEMS: Totem[] = [
  STRENGTH_OF_EARTH_TOTEM,
  STONESKIN_TOTEM,
  TREMOR_TOTEM,
];

export const AIR_TOTEMS: Totem[] = [
  GRACE_OF_AIR_TOTEM,
  WINDFURY_TOTEM,
  TRANQUIL_AIR_TOTEM,
];

export const FIRE_TOTEMS: Totem[] = [
  FIRE_RESISTANCE_TOTEM,
  FROST_RESISTANCE_TOTEM,
  NATURE_RESISTANCE_TOTEM,
];

// All totems indexed by element for easy lookup
export const TOTEMS_BY_ELEMENT: Record<TotemElement, Totem[]> = {
  water: WATER_TOTEMS,
  earth: EARTH_TOTEMS,
  air: AIR_TOTEMS,
  fire: FIRE_TOTEMS,
};

// All totems as a flat map for ID lookup
export const SHAMAN_TOTEMS: Record<string, Totem> = {
  // Water
  mana_spring_totem: MANA_SPRING_TOTEM,
  mana_tide_totem: MANA_TIDE_TOTEM,
  healing_stream_totem: HEALING_STREAM_TOTEM,
  poison_cleansing_totem: POISON_CLEANSING_TOTEM,
  disease_cleansing_totem: DISEASE_CLEANSING_TOTEM,
  // Earth
  strength_of_earth_totem: STRENGTH_OF_EARTH_TOTEM,
  stoneskin_totem: STONESKIN_TOTEM,
  tremor_totem: TREMOR_TOTEM,
  // Air
  grace_of_air_totem: GRACE_OF_AIR_TOTEM,
  windfury_totem: WINDFURY_TOTEM,
  tranquil_air_totem: TRANQUIL_AIR_TOTEM,
  // Fire
  fire_resistance_totem: FIRE_RESISTANCE_TOTEM,
  frost_resistance_totem: FROST_RESISTANCE_TOTEM,
  nature_resistance_totem: NATURE_RESISTANCE_TOTEM,
};

// Default totem loadout for resto shaman (what you'd typically drop)
export const DEFAULT_TOTEM_LOADOUT: Record<TotemElement, string> = {
  water: 'mana_spring_totem',   // MP5 for healers
  earth: 'stoneskin_totem',     // Armor for tanks
  air: 'tranquil_air_totem',    // Threat reduction for caster group
  fire: 'fire_resistance_totem', // FR for Molten Core
};

// Get totem by ID
export function getTotemById(totemId: string): Totem | undefined {
  return SHAMAN_TOTEMS[totemId];
}

// Get all totems for an element
export function getTotemsForElement(element: TotemElement): Totem[] {
  return TOTEMS_BY_ELEMENT[element];
}
