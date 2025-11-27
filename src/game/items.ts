// Molten Core Loot Items - Authentic Vanilla WoW Stats
// Sources: classicdb.ch, vanilla-wow-archive.fandom.com, wowhead.com/classic

export type EquipmentSlot = 'head' | 'shoulders' | 'chest' | 'waist' | 'legs' | 'hands' | 'wrist' | 'feet' | 'weapon' | 'offhand' | 'ranged';
export type ItemRarity = 'uncommon' | 'rare' | 'epic' | 'legendary';
export type WearableClass = 'paladin' | 'priest' | 'druid' | 'warrior' | 'mage' | 'warlock' | 'hunter' | 'rogue' | 'shaman' | 'all';

// Weapon type classification for dual-wield and two-hand handling
export type WeaponType = 'one_hand' | 'two_hand' | 'offhand_only' | 'ranged';

// Item category for spec-aware loot filtering
export type ItemCategory = 'melee' | 'caster' | 'healer' | 'physical_ranged' | 'universal';

// Legendary material types
export type LegendaryMaterialId =
  | 'bindings_of_the_windseeker_left'
  | 'bindings_of_the_windseeker_right'
  | 'eye_of_sulfuras';

export interface LegendaryMaterial {
  id: LegendaryMaterialId;
  name: string;
  icon: string;
  description: string;
  dropChance: number; // As a decimal (e.g., 0.03 = 3%)
  dropsFrom: string; // Boss ID
  craftsInto?: string; // Item ID of what this crafts (if standalone)
  requiresOther?: LegendaryMaterialId; // If this needs another material to craft
  requiresBossKill?: string; // Boss that must be killed to unlock crafting (e.g., firemaw)
}

export interface ItemStats {
  intellect?: number;
  spirit?: number;
  stamina?: number;
  strength?: number;
  agility?: number;
  spellPower?: number;
  healingPower?: number;
  mp5?: number;
  critChance?: number;
  hitChance?: number;
  armor?: number;
}

export interface GearItem {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  itemLevel: number;
  classes: WearableClass[];
  stats: ItemStats;
  icon: string;
  setId?: string;
  weaponType?: WeaponType;  // For weapons: one_hand, two_hand, offhand_only, ranged
  itemCategory?: ItemCategory;  // For spec-aware loot filtering
}

const ICON_BASE = 'https://wow.zamimg.com/images/wow/icons/large';

// =============================================================================
// PALADIN TIER 1 - LAWBRINGER ARMOR
// =============================================================================

export const LAWBRINGER_BOOTS: GearItem = {
  id: 'lawbringer_boots',
  name: 'Lawbringer Boots',
  slot: 'feet',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['paladin'],
  stats: { stamina: 20, intellect: 13, spirit: 10, spellPower: 9, mp5: 2 },
  icon: `${ICON_BASE}/inv_boots_plate_06.jpg`,
  setId: 'lawbringer',
};

export const LAWBRINGER_GAUNTLETS: GearItem = {
  id: 'lawbringer_gauntlets',
  name: 'Lawbringer Gauntlets',
  slot: 'hands',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['paladin'],
  stats: { stamina: 15, intellect: 15, spirit: 14, spellPower: 9 },
  icon: `${ICON_BASE}/inv_gauntlets_29.jpg`,
  setId: 'lawbringer',
};

export const LAWBRINGER_HELM: GearItem = {
  id: 'lawbringer_helm',
  name: 'Lawbringer Helm',
  slot: 'head',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['paladin'],
  stats: { stamina: 20, intellect: 24, spirit: 10, spellPower: 12, mp5: 4 },
  icon: `${ICON_BASE}/inv_helmet_22.jpg`,
  setId: 'lawbringer',
};

export const LAWBRINGER_LEGPLATES: GearItem = {
  id: 'lawbringer_legplates',
  name: 'Lawbringer Legplates',
  slot: 'legs',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['paladin'],
  stats: { stamina: 24, intellect: 18, spirit: 18, spellPower: 12, mp5: 3 },
  icon: `${ICON_BASE}/inv_pants_04.jpg`,
  setId: 'lawbringer',
};

export const LAWBRINGER_SPAULDERS: GearItem = {
  id: 'lawbringer_spaulders',
  name: 'Lawbringer Spaulders',
  slot: 'shoulders',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['paladin'],
  stats: { stamina: 22, intellect: 15, spirit: 8, spellPower: 9 },
  icon: `${ICON_BASE}/inv_shoulder_02.jpg`,
  setId: 'lawbringer',
};

export const LAWBRINGER_CHESTGUARD: GearItem = {
  id: 'lawbringer_chestguard',
  name: 'Lawbringer Chestguard',
  slot: 'chest',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['paladin'],
  stats: { stamina: 26, intellect: 21, spirit: 13, spellPower: 12 },
  icon: `${ICON_BASE}/inv_chest_plate11.jpg`,
  setId: 'lawbringer',
};

export const LAWBRINGER_BELT: GearItem = {
  id: 'lawbringer_belt',
  name: 'Lawbringer Belt',
  slot: 'waist',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['paladin'],
  stats: { stamina: 15, intellect: 20, spirit: 8, spellPower: 9 },
  icon: `${ICON_BASE}/inv_belt_09.jpg`,
  setId: 'lawbringer',
};

export const LAWBRINGER_BRACERS: GearItem = {
  id: 'lawbringer_bracers',
  name: 'Lawbringer Bracers',
  slot: 'wrist',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['paladin'],
  stats: { stamina: 11, intellect: 8, spirit: 11, mp5: 4 },
  icon: `${ICON_BASE}/inv_bracer_19.jpg`,
  setId: 'lawbringer',
};

// =============================================================================
// PRIEST TIER 1 - VESTMENTS OF PROPHECY
// =============================================================================

export const BOOTS_OF_PROPHECY: GearItem = {
  id: 'boots_of_prophecy',
  name: 'Boots of Prophecy',
  slot: 'feet',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['priest'],
  stats: { stamina: 16, intellect: 17, spirit: 20, spellPower: 12 },
  icon: `${ICON_BASE}/inv_boots_cloth_05.jpg`,
  setId: 'prophecy',
};

export const GLOVES_OF_PROPHECY: GearItem = {
  id: 'gloves_of_prophecy',
  name: 'Gloves of Prophecy',
  slot: 'hands',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['priest'],
  stats: { stamina: 13, intellect: 17, spirit: 13, spellPower: 12 },
  icon: `${ICON_BASE}/inv_gauntlets_17.jpg`,
  setId: 'prophecy',
};

export const CIRCLET_OF_PROPHECY: GearItem = {
  id: 'circlet_of_prophecy',
  name: 'Circlet of Prophecy',
  slot: 'head',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['priest'],
  stats: { stamina: 18, intellect: 32, spirit: 10, spellPower: 18, mp5: 4 },
  icon: `${ICON_BASE}/inv_helmet_51.jpg`,
  setId: 'prophecy',
};

export const PANTS_OF_PROPHECY: GearItem = {
  id: 'pants_of_prophecy',
  name: 'Pants of Prophecy',
  slot: 'legs',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['priest'],
  stats: { stamina: 22, intellect: 24, spirit: 18, spellPower: 14, mp5: 4 },
  icon: `${ICON_BASE}/inv_pants_cloth_14.jpg`,
  setId: 'prophecy',
};

export const MANTLE_OF_PROPHECY: GearItem = {
  id: 'mantle_of_prophecy',
  name: 'Mantle of Prophecy',
  slot: 'shoulders',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['priest'],
  stats: { stamina: 16, intellect: 15, spirit: 20, spellPower: 9 },
  icon: `${ICON_BASE}/inv_shoulder_02.jpg`,
  setId: 'prophecy',
};

export const ROBES_OF_PROPHECY: GearItem = {
  id: 'robes_of_prophecy',
  name: 'Robes of Prophecy',
  slot: 'chest',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['priest'],
  stats: { stamina: 20, intellect: 17, spirit: 30, spellPower: 18 },
  icon: `${ICON_BASE}/inv_chest_cloth_46.jpg`,
  setId: 'prophecy',
};

export const GIRDLE_OF_PROPHECY: GearItem = {
  id: 'girdle_of_prophecy',
  name: 'Girdle of Prophecy',
  slot: 'waist',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['priest'],
  stats: { stamina: 16, intellect: 17, spirit: 8, spellPower: 9 },
  icon: `${ICON_BASE}/inv_belt_18.jpg`,
  setId: 'prophecy',
};

export const VAMBRACES_OF_PROPHECY: GearItem = {
  id: 'vambraces_of_prophecy',
  name: 'Vambraces of Prophecy',
  slot: 'wrist',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['priest'],
  stats: { stamina: 8, intellect: 11, spirit: 12, mp5: 4 },
  icon: `${ICON_BASE}/inv_bracer_09.jpg`,
  setId: 'prophecy',
};

// =============================================================================
// DRUID TIER 1 - CENARION RAIMENT
// =============================================================================

export const CENARION_BOOTS: GearItem = {
  id: 'cenarion_boots',
  name: 'Cenarion Boots',
  slot: 'feet',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['druid'],
  stats: { stamina: 18, intellect: 15, spirit: 14, spellPower: 9, mp5: 3 },
  icon: `${ICON_BASE}/inv_boots_cloth_09.jpg`,
  setId: 'cenarion',
};

export const CENARION_GLOVES: GearItem = {
  id: 'cenarion_gloves',
  name: 'Cenarion Gloves',
  slot: 'hands',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['druid'],
  stats: { stamina: 10, intellect: 17, spirit: 18, spellPower: 18 },
  icon: `${ICON_BASE}/inv_gauntlets_11.jpg`,
  setId: 'cenarion',
};

export const CENARION_HELM: GearItem = {
  id: 'cenarion_helm',
  name: 'Cenarion Helm',
  slot: 'head',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['druid'],
  stats: { stamina: 18, intellect: 24, spirit: 20, spellPower: 12, mp5: 4 },
  icon: `${ICON_BASE}/inv_helmet_09.jpg`,
  setId: 'cenarion',
};

export const CENARION_LEGGINGS: GearItem = {
  id: 'cenarion_leggings',
  name: 'Cenarion Leggings',
  slot: 'legs',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['druid'],
  stats: { stamina: 21, intellect: 22, spirit: 17, spellPower: 14, mp5: 4 },
  icon: `${ICON_BASE}/inv_pants_09.jpg`,
  setId: 'cenarion',
};

export const CENARION_SPAULDERS: GearItem = {
  id: 'cenarion_spaulders',
  name: 'Cenarion Spaulders',
  slot: 'shoulders',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['druid'],
  stats: { stamina: 18, intellect: 12, spirit: 20, spellPower: 12 },
  icon: `${ICON_BASE}/inv_shoulder_08.jpg`,
  setId: 'cenarion',
};

export const CENARION_VESTMENTS: GearItem = {
  id: 'cenarion_vestments',
  name: 'Cenarion Vestments',
  slot: 'chest',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['druid'],
  stats: { stamina: 23, intellect: 18, spirit: 24, spellPower: 18 },
  icon: `${ICON_BASE}/inv_chest_leather_03.jpg`,
  setId: 'cenarion',
};

export const CENARION_BELT: GearItem = {
  id: 'cenarion_belt',
  name: 'Cenarion Belt',
  slot: 'waist',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['druid'],
  stats: { stamina: 14, intellect: 15, spirit: 12, spellPower: 9 },
  icon: `${ICON_BASE}/inv_belt_06.jpg`,
  setId: 'cenarion',
};

export const CENARION_BRACERS: GearItem = {
  id: 'cenarion_bracers',
  name: 'Cenarion Bracers',
  slot: 'wrist',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['druid'],
  stats: { stamina: 10, intellect: 12, spirit: 10, mp5: 4 },
  icon: `${ICON_BASE}/inv_bracer_08.jpg`,
  setId: 'cenarion',
};

// =============================================================================
// NON-SET HEALER ITEMS
// =============================================================================

export const SALAMANDER_SCALE_PANTS: GearItem = {
  id: 'salamander_scale_pants',
  name: 'Salamander Scale Pants',
  slot: 'legs',
  rarity: 'epic',
  itemLevel: 64,
  classes: ['druid', 'priest', 'paladin'],
  stats: { stamina: 14, intellect: 14, healingPower: 51, mp5: 9 },
  icon: `${ICON_BASE}/inv_pants_06.jpg`,
};

export const AZURESONG_MAGEBLADE: GearItem = {
  id: 'azuresong_mageblade',
  name: 'Azuresong Mageblade',
  slot: 'weapon',
  rarity: 'epic',
  itemLevel: 71,
  classes: ['all'],
  stats: { stamina: 7, intellect: 12, spellPower: 40, critChance: 1 },
  icon: `${ICON_BASE}/inv_sword_39.jpg`,
  weaponType: 'one_hand',
  itemCategory: 'caster',
};

// =============================================================================
// MELEE DPS WEAPONS
// =============================================================================

export const BONEREAVER_EDGE: GearItem = {
  id: 'bonereaver_edge',
  name: "Bonereaver's Edge",
  slot: 'weapon',
  rarity: 'epic',
  itemLevel: 77,
  classes: ['warrior'],
  stats: { strength: 25, stamina: 15, agility: 8, critChance: 1 },
  icon: `${ICON_BASE}/inv_sword_12.jpg`,
  weaponType: 'two_hand',
  itemCategory: 'melee',
};

export const PERDITIONS_BLADE: GearItem = {
  id: 'perditions_blade',
  name: "Perdition's Blade",
  slot: 'weapon',
  rarity: 'epic',
  itemLevel: 75,
  classes: ['rogue', 'warrior'],
  stats: { agility: 14, stamina: 9, critChance: 1, hitChance: 1 },
  icon: `${ICON_BASE}/inv_sword_48.jpg`,
  weaponType: 'one_hand',
  itemCategory: 'melee',
};

export const STRIKERS_MARK: GearItem = {
  id: 'strikers_mark',
  name: "Striker's Mark",
  slot: 'ranged',
  rarity: 'epic',
  itemLevel: 75,
  classes: ['hunter'],
  stats: { agility: 22, stamina: 8, hitChance: 1 },
  icon: `${ICON_BASE}/inv_weapon_bow_08.jpg`,
  weaponType: 'ranged',
  itemCategory: 'physical_ranged',
};

// =============================================================================
// LEGENDARY WEAPONS (Crafted from materials)
// =============================================================================

export const THUNDERFURY: GearItem = {
  id: 'thunderfury',
  name: 'Thunderfury, Blessed Blade of the Windseeker',
  slot: 'weapon',
  rarity: 'legendary',
  itemLevel: 80,
  classes: ['warrior', 'rogue', 'paladin', 'hunter'],
  stats: { agility: 15, stamina: 12, strength: 8, hitChance: 2, critChance: 1 },
  icon: `${ICON_BASE}/inv_sword_39.jpg`,
  weaponType: 'one_hand',
  itemCategory: 'melee',
};

export const SULFURAS: GearItem = {
  id: 'sulfuras',
  name: 'Sulfuras, Hand of Ragnaros',
  slot: 'weapon',
  rarity: 'legendary',
  itemLevel: 80,
  classes: ['warrior', 'paladin'],
  stats: { strength: 30, stamina: 20, critChance: 2 },
  icon: `${ICON_BASE}/inv_hammer_unique_sulfuras.jpg`,
  weaponType: 'two_hand',
  itemCategory: 'melee',
};

export const AURASTONE_HAMMER: GearItem = {
  id: 'aurastone_hammer',
  name: 'Aurastone Hammer',
  slot: 'weapon',
  rarity: 'epic',
  itemLevel: 70,
  classes: ['paladin', 'priest', 'druid'],
  stats: { stamina: 8, intellect: 9, spirit: 8, healingPower: 55 },
  icon: `${ICON_BASE}/inv_mace_02.jpg`,
  weaponType: 'one_hand',
  itemCategory: 'healer',
};

export const GUTGUTTER: GearItem = {
  id: 'gutgutter',
  name: 'Gutgutter',
  slot: 'weapon',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['warrior', 'paladin'],
  stats: { strength: 15, stamina: 15, agility: 9 },
  icon: `${ICON_BASE}/inv_axe_12.jpg`,
  weaponType: 'one_hand',
  itemCategory: 'melee',
};

export const STAFF_OF_DOMINANCE: GearItem = {
  id: 'staff_of_dominance',
  name: 'Staff of Dominance',
  slot: 'weapon',
  rarity: 'epic',
  itemLevel: 68,
  classes: ['all'],
  stats: { stamina: 11, intellect: 24, spirit: 10, spellPower: 33 },
  icon: `${ICON_BASE}/inv_staff_13.jpg`,
  weaponType: 'two_hand',
  itemCategory: 'caster',
};

export const FIRE_RUNED_GRIMOIRE: GearItem = {
  id: 'fire_runed_grimoire',
  name: 'Fire Runed Grimoire',
  slot: 'offhand',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['all'],
  stats: { stamina: 12, intellect: 8, spellPower: 21, hitChance: 1 },
  icon: `${ICON_BASE}/inv_misc_book_06.jpg`,
  weaponType: 'offhand_only',
  itemCategory: 'caster',
};

export const SORCEROUS_DAGGER: GearItem = {
  id: 'sorcerous_dagger',
  name: 'Sorcerous Dagger',
  slot: 'weapon',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['all'],
  stats: { stamina: 7, intellect: 6, spellPower: 20 },
  icon: `${ICON_BASE}/inv_weapon_shortblade_16.jpg`,
  weaponType: 'one_hand',
  itemCategory: 'caster',
};

// =============================================================================
// WARRIOR TIER 1 - MIGHT ARMOR (for tanks)
// =============================================================================

export const HELM_OF_MIGHT: GearItem = {
  id: 'helm_of_might',
  name: 'Helm of Might',
  slot: 'head',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['warrior'],
  stats: { strength: 20, stamina: 32, agility: 8 },
  icon: `${ICON_BASE}/inv_helmet_09.jpg`,
  setId: 'might',
};

export const PAULDRONS_OF_MIGHT: GearItem = {
  id: 'pauldrons_of_might',
  name: 'Pauldrons of Might',
  slot: 'shoulders',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['warrior'],
  stats: { strength: 18, stamina: 27, agility: 9 },
  icon: `${ICON_BASE}/inv_shoulder_11.jpg`,
  setId: 'might',
};

export const BREASTPLATE_OF_MIGHT: GearItem = {
  id: 'breastplate_of_might',
  name: 'Breastplate of Might',
  slot: 'chest',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['warrior'],
  stats: { strength: 21, stamina: 33, agility: 10 },
  icon: `${ICON_BASE}/inv_chest_plate16.jpg`,
  setId: 'might',
};

export const GAUNTLETS_OF_MIGHT: GearItem = {
  id: 'gauntlets_of_might',
  name: 'Gauntlets of Might',
  slot: 'hands',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['warrior'],
  stats: { strength: 22, stamina: 17, agility: 5 },
  icon: `${ICON_BASE}/inv_gauntlets_25.jpg`,
  setId: 'might',
};

export const LEGPLATES_OF_MIGHT: GearItem = {
  id: 'legplates_of_might',
  name: 'Legplates of Might',
  slot: 'legs',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['warrior'],
  stats: { strength: 28, stamina: 32, agility: 4 },
  icon: `${ICON_BASE}/inv_pants_04.jpg`,
  setId: 'might',
};

export const SABATONS_OF_MIGHT: GearItem = {
  id: 'sabatons_of_might',
  name: 'Sabatons of Might',
  slot: 'feet',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['warrior'],
  stats: { strength: 13, stamina: 22, agility: 13 },
  icon: `${ICON_BASE}/inv_boots_plate_06.jpg`,
  setId: 'might',
};

export const BELT_OF_MIGHT: GearItem = {
  id: 'belt_of_might',
  name: 'Belt of Might',
  slot: 'waist',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['warrior'],
  stats: { strength: 21, stamina: 18 },
  icon: `${ICON_BASE}/inv_belt_01.jpg`,
  setId: 'might',
};

export const BRACERS_OF_MIGHT: GearItem = {
  id: 'bracers_of_might',
  name: 'Bracers of Might',
  slot: 'wrist',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['warrior'],
  stats: { strength: 12, stamina: 17 },
  icon: `${ICON_BASE}/inv_bracer_19.jpg`,
  setId: 'might',
};

// =============================================================================
// HUNTER TIER 1 - GIANTSTALKER (for DPS hunters)
// =============================================================================

export const GIANTSTALKER_HELM: GearItem = {
  id: 'giantstalker_helm',
  name: 'Giantstalker\'s Helmet',
  slot: 'head',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['hunter'],
  stats: { stamina: 24, agility: 27, intellect: 15 },
  icon: `${ICON_BASE}/inv_helmet_11.jpg`,
  setId: 'giantstalker',
};

export const GIANTSTALKER_EPAULETS: GearItem = {
  id: 'giantstalker_epaulets',
  name: 'Giantstalker\'s Epaulets',
  slot: 'shoulders',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['hunter'],
  stats: { stamina: 18, agility: 20, intellect: 9 },
  icon: `${ICON_BASE}/inv_shoulder_25.jpg`,
  setId: 'giantstalker',
};

export const GIANTSTALKER_BREASTPLATE: GearItem = {
  id: 'giantstalker_breastplate',
  name: 'Giantstalker\'s Breastplate',
  slot: 'chest',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['hunter'],
  stats: { stamina: 27, agility: 25, intellect: 20 },
  icon: `${ICON_BASE}/inv_chest_chain_06.jpg`,
  setId: 'giantstalker',
};

export const GIANTSTALKER_GLOVES: GearItem = {
  id: 'giantstalker_gloves',
  name: 'Giantstalker\'s Gloves',
  slot: 'hands',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['hunter'],
  stats: { stamina: 10, agility: 22, hitChance: 1 },
  icon: `${ICON_BASE}/inv_gauntlets_10.jpg`,
  setId: 'giantstalker',
};

export const GIANTSTALKER_LEGGINGS: GearItem = {
  id: 'giantstalker_leggings',
  name: 'Giantstalker\'s Leggings',
  slot: 'legs',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['hunter'],
  stats: { stamina: 23, agility: 25, intellect: 15 },
  icon: `${ICON_BASE}/inv_pants_03.jpg`,
  setId: 'giantstalker',
};

export const GIANTSTALKER_BOOTS: GearItem = {
  id: 'giantstalker_boots',
  name: 'Giantstalker\'s Boots',
  slot: 'feet',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['hunter'],
  stats: { stamina: 18, agility: 23, intellect: 6 },
  icon: `${ICON_BASE}/inv_boots_chain_08.jpg`,
  setId: 'giantstalker',
};

export const GIANTSTALKER_BELT: GearItem = {
  id: 'giantstalker_belt',
  name: 'Giantstalker\'s Belt',
  slot: 'waist',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['hunter'],
  stats: { stamina: 18, agility: 16, intellect: 8 },
  icon: `${ICON_BASE}/inv_belt_15.jpg`,
  setId: 'giantstalker',
};

export const GIANTSTALKER_BRACERS: GearItem = {
  id: 'giantstalker_bracers',
  name: 'Giantstalker\'s Bracers',
  slot: 'wrist',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['hunter'],
  stats: { stamina: 8, agility: 14, intellect: 9 },
  icon: `${ICON_BASE}/inv_bracer_14.jpg`,
  setId: 'giantstalker',
};

// =============================================================================
// MAGE TIER 1 - ARCANIST REGALIA
// =============================================================================

export const ARCANIST_BOOTS: GearItem = {
  id: 'arcanist_boots',
  name: 'Arcanist Boots',
  slot: 'feet',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['mage'],
  stats: { stamina: 17, intellect: 17, spirit: 14, spellPower: 12 },
  icon: `${ICON_BASE}/inv_boots_cloth_04.jpg`,
  setId: 'arcanist',
};

export const ARCANIST_GLOVES: GearItem = {
  id: 'arcanist_gloves',
  name: 'Arcanist Gloves',
  slot: 'hands',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['mage'],
  stats: { stamina: 14, intellect: 15, spirit: 15, spellPower: 14 },
  icon: `${ICON_BASE}/inv_gauntlets_14.jpg`,
  setId: 'arcanist',
};

export const ARCANIST_CROWN: GearItem = {
  id: 'arcanist_crown',
  name: 'Arcanist Crown',
  slot: 'head',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['mage'],
  stats: { stamina: 18, intellect: 28, spirit: 14, spellPower: 18 },
  icon: `${ICON_BASE}/inv_crown_01.jpg`,
  setId: 'arcanist',
};

export const ARCANIST_LEGGINGS: GearItem = {
  id: 'arcanist_leggings',
  name: 'Arcanist Leggings',
  slot: 'legs',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['mage'],
  stats: { stamina: 20, intellect: 23, spirit: 18, spellPower: 21 },
  icon: `${ICON_BASE}/inv_pants_cloth_14.jpg`,
  setId: 'arcanist',
};

export const ARCANIST_MANTLE: GearItem = {
  id: 'arcanist_mantle',
  name: 'Arcanist Mantle',
  slot: 'shoulders',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['mage'],
  stats: { stamina: 15, intellect: 18, spirit: 11, spellPower: 14 },
  icon: `${ICON_BASE}/inv_shoulder_02.jpg`,
  setId: 'arcanist',
};

export const ARCANIST_ROBES: GearItem = {
  id: 'arcanist_robes',
  name: 'Arcanist Robes',
  slot: 'chest',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['mage'],
  stats: { stamina: 19, intellect: 18, spirit: 24, spellPower: 21 },
  icon: `${ICON_BASE}/inv_chest_cloth_01.jpg`,
  setId: 'arcanist',
};

export const ARCANIST_BELT: GearItem = {
  id: 'arcanist_belt',
  name: 'Arcanist Belt',
  slot: 'waist',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['mage'],
  stats: { stamina: 12, intellect: 21, spellPower: 12 },
  icon: `${ICON_BASE}/inv_belt_29.jpg`,
  setId: 'arcanist',
};

export const ARCANIST_BINDINGS: GearItem = {
  id: 'arcanist_bindings',
  name: 'Arcanist Bindings',
  slot: 'wrist',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['mage'],
  stats: { stamina: 9, intellect: 14, spirit: 7, spellPower: 7 },
  icon: `${ICON_BASE}/inv_bracer_09.jpg`,
  setId: 'arcanist',
};

// =============================================================================
// ROGUE TIER 1 - NIGHTSLAYER
// =============================================================================

export const NIGHTSLAYER_COVER: GearItem = {
  id: 'nightslayer_cover',
  name: 'Nightslayer Cover',
  slot: 'head',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['rogue'],
  stats: { stamina: 24, agility: 31 },
  icon: `${ICON_BASE}/inv_helmet_21.jpg`,
  setId: 'nightslayer',
};

export const NIGHTSLAYER_SHOULDER_PADS: GearItem = {
  id: 'nightslayer_shoulder_pads',
  name: 'Nightslayer Shoulder Pads',
  slot: 'shoulders',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['rogue'],
  stats: { stamina: 20, agility: 23 },
  icon: `${ICON_BASE}/inv_shoulder_13.jpg`,
  setId: 'nightslayer',
};

export const NIGHTSLAYER_CHESTPIECE: GearItem = {
  id: 'nightslayer_chestpiece',
  name: 'Nightslayer Chestpiece',
  slot: 'chest',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['rogue'],
  stats: { stamina: 29, agility: 33, strength: 11 },
  icon: `${ICON_BASE}/inv_chest_leather_08.jpg`,
  setId: 'nightslayer',
};

export const NIGHTSLAYER_GLOVES: GearItem = {
  id: 'nightslayer_gloves',
  name: 'Nightslayer Gloves',
  slot: 'hands',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['rogue'],
  stats: { stamina: 14, agility: 26, hitChance: 1 },
  icon: `${ICON_BASE}/inv_gauntlets_18.jpg`,
  setId: 'nightslayer',
};

export const NIGHTSLAYER_PANTS: GearItem = {
  id: 'nightslayer_pants',
  name: 'Nightslayer Pants',
  slot: 'legs',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['rogue'],
  stats: { stamina: 26, agility: 32, strength: 7 },
  icon: `${ICON_BASE}/inv_pants_07.jpg`,
  setId: 'nightslayer',
};

export const NIGHTSLAYER_BOOTS: GearItem = {
  id: 'nightslayer_boots',
  name: 'Nightslayer Boots',
  slot: 'feet',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['rogue'],
  stats: { stamina: 19, agility: 26 },
  icon: `${ICON_BASE}/inv_boots_08.jpg`,
  setId: 'nightslayer',
};

export const NIGHTSLAYER_BELT: GearItem = {
  id: 'nightslayer_belt',
  name: 'Nightslayer Belt',
  slot: 'waist',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['rogue'],
  stats: { stamina: 14, agility: 24 },
  icon: `${ICON_BASE}/inv_belt_25.jpg`,
  setId: 'nightslayer',
};

export const NIGHTSLAYER_BRACELETS: GearItem = {
  id: 'nightslayer_bracelets',
  name: 'Nightslayer Bracelets',
  slot: 'wrist',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['rogue'],
  stats: { stamina: 12, agility: 18 },
  icon: `${ICON_BASE}/inv_bracer_05.jpg`,
  setId: 'nightslayer',
};

// =============================================================================
// WARLOCK TIER 1 - FELHEART
// =============================================================================

export const FELHEART_HORNS: GearItem = {
  id: 'felheart_horns',
  name: 'Felheart Horns',
  slot: 'head',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['warlock'],
  stats: { stamina: 26, intellect: 17, spirit: 18, spellPower: 20 },
  icon: `${ICON_BASE}/inv_helmet_08.jpg`,
  setId: 'felheart',
};

export const FELHEART_SHOULDER_PADS: GearItem = {
  id: 'felheart_shoulder_pads',
  name: 'Felheart Shoulder Pads',
  slot: 'shoulders',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['warlock'],
  stats: { stamina: 22, intellect: 13, spirit: 13, spellPower: 14 },
  icon: `${ICON_BASE}/inv_shoulder_23.jpg`,
  setId: 'felheart',
};

export const FELHEART_ROBES: GearItem = {
  id: 'felheart_robes',
  name: 'Felheart Robes',
  slot: 'chest',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['warlock'],
  stats: { stamina: 30, intellect: 18, spirit: 11, spellPower: 22 },
  icon: `${ICON_BASE}/inv_chest_cloth_26.jpg`,
  setId: 'felheart',
};

export const FELHEART_GLOVES: GearItem = {
  id: 'felheart_gloves',
  name: 'Felheart Gloves',
  slot: 'hands',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['warlock'],
  stats: { stamina: 19, intellect: 14, spirit: 14, spellPower: 14 },
  icon: `${ICON_BASE}/inv_gauntlets_19.jpg`,
  setId: 'felheart',
};

export const FELHEART_PANTS: GearItem = {
  id: 'felheart_pants',
  name: 'Felheart Pants',
  slot: 'legs',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['warlock'],
  stats: { stamina: 27, intellect: 20, spirit: 17, spellPower: 18 },
  icon: `${ICON_BASE}/inv_pants_cloth_02.jpg`,
  setId: 'felheart',
};

export const FELHEART_SLIPPERS: GearItem = {
  id: 'felheart_slippers',
  name: 'Felheart Slippers',
  slot: 'feet',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['warlock'],
  stats: { stamina: 19, intellect: 14, spirit: 16, spellPower: 14 },
  icon: `${ICON_BASE}/inv_boots_cloth_05.jpg`,
  setId: 'felheart',
};

export const FELHEART_BELT: GearItem = {
  id: 'felheart_belt',
  name: 'Felheart Belt',
  slot: 'waist',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['warlock'],
  stats: { stamina: 20, intellect: 12, spirit: 8, spellPower: 11 },
  icon: `${ICON_BASE}/inv_belt_13.jpg`,
  setId: 'felheart',
};

export const FELHEART_BRACERS: GearItem = {
  id: 'felheart_bracers',
  name: 'Felheart Bracers',
  slot: 'wrist',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['warlock'],
  stats: { stamina: 14, intellect: 9, spirit: 10, spellPower: 9 },
  icon: `${ICON_BASE}/inv_bracer_07.jpg`,
  setId: 'felheart',
};

// =============================================================================
// SHAMAN TIER 1 - EARTHFURY RAIMENT
// =============================================================================

export const EARTHFURY_BOOTS: GearItem = {
  id: 'earthfury_boots',
  name: 'Earthfury Boots',
  slot: 'feet',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['shaman'],
  stats: { stamina: 16, intellect: 17, spirit: 10, healingPower: 22, mp5: 3 },
  icon: `${ICON_BASE}/inv_boots_chain_01.jpg`,
  setId: 'earthfury',
};

export const EARTHFURY_GAUNTLETS: GearItem = {
  id: 'earthfury_gauntlets',
  name: 'Earthfury Gauntlets',
  slot: 'hands',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['shaman'],
  stats: { stamina: 15, intellect: 20, spirit: 6, healingPower: 24 },
  icon: `${ICON_BASE}/inv_gauntlets_25.jpg`,
  setId: 'earthfury',
};

export const EARTHFURY_HELMET: GearItem = {
  id: 'earthfury_helmet',
  name: 'Earthfury Helmet',
  slot: 'head',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['shaman'],
  stats: { stamina: 23, intellect: 27, spirit: 11, healingPower: 35, mp5: 4 },
  icon: `${ICON_BASE}/inv_helmet_09.jpg`,
  setId: 'earthfury',
};

export const EARTHFURY_LEGGUARDS: GearItem = {
  id: 'earthfury_legguards',
  name: 'Earthfury Legguards',
  slot: 'legs',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['shaman'],
  stats: { stamina: 24, intellect: 23, spirit: 15, healingPower: 31, mp5: 4 },
  icon: `${ICON_BASE}/inv_pants_mail_08.jpg`,
  setId: 'earthfury',
};

export const EARTHFURY_EPAULETS: GearItem = {
  id: 'earthfury_epaulets',
  name: 'Earthfury Epaulets',
  slot: 'shoulders',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['shaman'],
  stats: { stamina: 18, intellect: 19, spirit: 9, healingPower: 26 },
  icon: `${ICON_BASE}/inv_shoulder_02.jpg`,
  setId: 'earthfury',
};

export const EARTHFURY_VESTMENTS: GearItem = {
  id: 'earthfury_vestments',
  name: 'Earthfury Vestments',
  slot: 'chest',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['shaman'],
  stats: { stamina: 25, intellect: 25, spirit: 12, healingPower: 33, mp5: 4 },
  icon: `${ICON_BASE}/inv_chest_chain_11.jpg`,
  setId: 'earthfury',
};

export const EARTHFURY_BELT: GearItem = {
  id: 'earthfury_belt',
  name: 'Earthfury Belt',
  slot: 'waist',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['shaman'],
  stats: { stamina: 14, intellect: 21, spirit: 6, healingPower: 20, mp5: 3 },
  icon: `${ICON_BASE}/inv_belt_29.jpg`,
  setId: 'earthfury',
};

export const EARTHFURY_BRACERS: GearItem = {
  id: 'earthfury_bracers',
  name: 'Earthfury Bracers',
  slot: 'wrist',
  rarity: 'epic',
  itemLevel: 66,
  classes: ['shaman'],
  stats: { stamina: 11, intellect: 13, spirit: 8, healingPower: 15, mp5: 3 },
  icon: `${ICON_BASE}/inv_bracer_02.jpg`,
  setId: 'earthfury',
};

// =============================================================================
// SHAMAN TIER 2 HELM - Drops from Onyxia
// =============================================================================

export const TEN_STORMS_CROWN: GearItem = {
  id: 'ten_storms_crown',
  name: 'Helmet of Ten Storms',
  slot: 'head',
  rarity: 'epic',
  itemLevel: 76,
  classes: ['shaman'],
  stats: { stamina: 26, intellect: 30, spirit: 14, healingPower: 44, mp5: 6 },
  icon: `${ICON_BASE}/inv_helmet_47.jpg`,
  setId: 'ten_storms',
};

// =============================================================================
// TIER 2 HELMS - Drop from Onyxia
// =============================================================================

export const JUDGMENT_CROWN: GearItem = {
  id: 'judgment_crown',
  name: 'Judgment Crown',
  slot: 'head',
  rarity: 'epic',
  itemLevel: 76,
  classes: ['paladin'],
  stats: { stamina: 24, intellect: 27, spellPower: 29, mp5: 6 },
  icon: `${ICON_BASE}/inv_helmet_61.jpg`,
  setId: 'judgment',
};

export const HALO_OF_TRANSCENDENCE: GearItem = {
  id: 'halo_of_transcendence',
  name: 'Halo of Transcendence',
  slot: 'head',
  rarity: 'epic',
  itemLevel: 76,
  classes: ['priest'],
  stats: { stamina: 22, intellect: 34, spirit: 15, spellPower: 32, mp5: 5 },
  icon: `${ICON_BASE}/inv_helmet_36.jpg`,
  setId: 'transcendence',
};

export const STORMRAGE_COVER: GearItem = {
  id: 'stormrage_cover',
  name: 'Stormrage Cover',
  slot: 'head',
  rarity: 'epic',
  itemLevel: 76,
  classes: ['druid'],
  stats: { stamina: 21, intellect: 28, spirit: 22, spellPower: 27, mp5: 5 },
  icon: `${ICON_BASE}/inv_helmet_45.jpg`,
  setId: 'stormrage',
};

export const NETHERWIND_CROWN: GearItem = {
  id: 'netherwind_crown',
  name: 'Netherwind Crown',
  slot: 'head',
  rarity: 'epic',
  itemLevel: 76,
  classes: ['mage'],
  stats: { stamina: 20, intellect: 32, spirit: 16, spellPower: 34, critChance: 1 },
  icon: `${ICON_BASE}/inv_helmet_69.jpg`,
  setId: 'netherwind',
};

export const NEMESIS_SKULLCAP: GearItem = {
  id: 'nemesis_skullcap',
  name: 'Nemesis Skullcap',
  slot: 'head',
  rarity: 'epic',
  itemLevel: 76,
  classes: ['warlock'],
  stats: { stamina: 28, intellect: 22, spirit: 20, spellPower: 34, critChance: 1 },
  icon: `${ICON_BASE}/inv_helmet_52.jpg`,
  setId: 'nemesis',
};

export const DRAGONSTALKER_HELM: GearItem = {
  id: 'dragonstalker_helm',
  name: "Dragonstalker's Helm",
  slot: 'head',
  rarity: 'epic',
  itemLevel: 76,
  classes: ['hunter'],
  stats: { stamina: 28, agility: 33, intellect: 18, hitChance: 1 },
  icon: `${ICON_BASE}/inv_helmet_53.jpg`,
  setId: 'dragonstalker',
};

export const HELM_OF_WRATH: GearItem = {
  id: 'helm_of_wrath',
  name: 'Helm of Wrath',
  slot: 'head',
  rarity: 'epic',
  itemLevel: 76,
  classes: ['warrior'],
  stats: { strength: 24, stamina: 38, agility: 10, hitChance: 1 },
  icon: `${ICON_BASE}/inv_helmet_59.jpg`,
  setId: 'wrath',
};

export const BLOODFANG_HOOD: GearItem = {
  id: 'bloodfang_hood',
  name: 'Bloodfang Hood',
  slot: 'head',
  rarity: 'epic',
  itemLevel: 76,
  classes: ['rogue'],
  stats: { stamina: 28, agility: 38, strength: 12, critChance: 1 },
  icon: `${ICON_BASE}/inv_helmet_20.jpg`,
  setId: 'bloodfang',
};

// =============================================================================
// ONYXIA WEAPONS & OTHER LOOT
// =============================================================================

export const DEATHBRINGER: GearItem = {
  id: 'deathbringer',
  name: 'Deathbringer',
  slot: 'weapon',
  rarity: 'epic',
  itemLevel: 71,
  classes: ['warrior'],
  stats: { strength: 22, stamina: 12, agility: 16, critChance: 1 },
  icon: `${ICON_BASE}/inv_sword_26.jpg`,
  weaponType: 'two_hand',
  itemCategory: 'melee',
};

export const VIS_KAG: GearItem = {
  id: 'vis_kag',
  name: "Vis'kag the Bloodletter",
  slot: 'weapon',
  rarity: 'epic',
  itemLevel: 71,
  classes: ['rogue', 'warrior'],
  stats: { agility: 16, stamina: 8, critChance: 1, hitChance: 1 },
  icon: `${ICON_BASE}/inv_sword_29.jpg`,
  weaponType: 'one_hand',
  itemCategory: 'melee',
};

export const ANCIENT_CORNERSTONE_GRIMOIRE: GearItem = {
  id: 'ancient_cornerstone_grimoire',
  name: 'Ancient Cornerstone Grimoire',
  slot: 'offhand',
  rarity: 'epic',
  itemLevel: 71,
  classes: ['all'],
  stats: { stamina: 10, intellect: 11, spellPower: 32, mp5: 4 },
  icon: `${ICON_BASE}/inv_misc_book_09.jpg`,
  weaponType: 'offhand_only',
  itemCategory: 'caster',
};

export const SAPPHIRON_DRAPE: GearItem = {
  id: 'sapphiron_drape',
  name: 'Sapphiron Drape',
  slot: 'shoulders',  // Using shoulders slot since we don't have back slot
  rarity: 'epic',
  itemLevel: 71,
  classes: ['all'],
  stats: { stamina: 10, intellect: 8, spellPower: 18, mp5: 3 },
  icon: `${ICON_BASE}/inv_misc_cape_21.jpg`,
};

export const RING_OF_BINDING: GearItem = {
  id: 'ring_of_binding',
  name: 'Ring of Binding',
  slot: 'hands',  // Using hands slot since we don't have ring slot
  rarity: 'epic',
  itemLevel: 71,
  classes: ['all'],
  stats: { stamina: 12, intellect: 10, spirit: 5, spellPower: 14 },
  icon: `${ICON_BASE}/inv_jewelry_ring_17.jpg`,
};

export const ONYXIA_TOOTH_PENDANT: GearItem = {
  id: 'onyxia_tooth_pendant',
  name: 'Onyxia Tooth Pendant',
  slot: 'wrist',  // Using wrist slot since we don't have neck slot
  rarity: 'epic',
  itemLevel: 71,
  classes: ['all'],
  stats: { agility: 12, stamina: 8, hitChance: 1, critChance: 1 },
  icon: `${ICON_BASE}/inv_jewelry_necklace_10.jpg`,
};

// =============================================================================
// BLACKWING LAIR - TIER 2 SETS
// =============================================================================

// PALADIN TIER 2 - JUDGMENT ARMOR
export const JUDGMENT_BINDINGS: GearItem = { id: 'judgment_bindings', name: 'Judgment Bindings', slot: 'wrist', rarity: 'epic', itemLevel: 76, classes: ['paladin'], stats: { intellect: 14, stamina: 13, healingPower: 20, mp5: 4 }, icon: `${ICON_BASE}/inv_bracer_17.jpg`, setId: 'judgment' };
export const JUDGMENT_BELT: GearItem = { id: 'judgment_belt', name: 'Judgment Belt', slot: 'waist', rarity: 'epic', itemLevel: 76, classes: ['paladin'], stats: { intellect: 17, stamina: 15, healingPower: 24, mp5: 5 }, icon: `${ICON_BASE}/inv_belt_02.jpg`, setId: 'judgment' };
export const JUDGMENT_SABATONS: GearItem = { id: 'judgment_sabatons', name: 'Judgment Sabatons', slot: 'feet', rarity: 'epic', itemLevel: 76, classes: ['paladin'], stats: { intellect: 19, stamina: 17, healingPower: 28, mp5: 5 }, icon: `${ICON_BASE}/inv_boots_chain_03.jpg`, setId: 'judgment' };
export const JUDGMENT_GAUNTLETS: GearItem = { id: 'judgment_gauntlets', name: 'Judgment Gauntlets', slot: 'hands', rarity: 'epic', itemLevel: 76, classes: ['paladin'], stats: { intellect: 17, stamina: 15, healingPower: 26, mp5: 4 }, icon: `${ICON_BASE}/inv_gauntlets_30.jpg`, setId: 'judgment' };
export const JUDGMENT_SPAULDERS: GearItem = { id: 'judgment_spaulders', name: 'Judgment Spaulders', slot: 'shoulders', rarity: 'epic', itemLevel: 76, classes: ['paladin'], stats: { intellect: 21, stamina: 19, healingPower: 31, mp5: 6 }, icon: `${ICON_BASE}/inv_shoulder_37.jpg`, setId: 'judgment' };
export const JUDGMENT_BREASTPLATE: GearItem = { id: 'judgment_breastplate', name: 'Judgment Breastplate', slot: 'chest', rarity: 'epic', itemLevel: 76, classes: ['paladin'], stats: { intellect: 26, stamina: 24, healingPower: 40, mp5: 8 }, icon: `${ICON_BASE}/inv_chest_plate06.jpg`, setId: 'judgment' };

// PRIEST TIER 2 - VESTMENTS OF TRANSCENDENCE
export const BINDINGS_OF_TRANSCENDENCE: GearItem = { id: 'bindings_of_transcendence', name: 'Bindings of Transcendence', slot: 'wrist', rarity: 'epic', itemLevel: 76, classes: ['priest'], stats: { intellect: 15, stamina: 14, healingPower: 22 }, icon: `${ICON_BASE}/inv_bracer_18.jpg`, setId: 'transcendence' };
export const BELT_OF_TRANSCENDENCE: GearItem = { id: 'belt_of_transcendence', name: 'Belt of Transcendence', slot: 'waist', rarity: 'epic', itemLevel: 76, classes: ['priest'], stats: { intellect: 18, stamina: 16, healingPower: 28 }, icon: `${ICON_BASE}/inv_belt_22.jpg`, setId: 'transcendence' };
export const BOOTS_OF_TRANSCENDENCE: GearItem = { id: 'boots_of_transcendence', name: 'Boots of Transcendence', slot: 'feet', rarity: 'epic', itemLevel: 76, classes: ['priest'], stats: { intellect: 20, stamina: 18, healingPower: 31 }, icon: `${ICON_BASE}/inv_boots_cloth_04.jpg`, setId: 'transcendence' };
export const HANDGUARDS_OF_TRANSCENDENCE: GearItem = { id: 'handguards_of_transcendence', name: 'Handguards of Transcendence', slot: 'hands', rarity: 'epic', itemLevel: 76, classes: ['priest'], stats: { intellect: 18, stamina: 16, healingPower: 29 }, icon: `${ICON_BASE}/inv_gauntlets_14.jpg`, setId: 'transcendence' };
export const PAULDRONS_OF_TRANSCENDENCE: GearItem = { id: 'pauldrons_of_transcendence', name: 'Pauldrons of Transcendence', slot: 'shoulders', rarity: 'epic', itemLevel: 76, classes: ['priest'], stats: { intellect: 22, stamina: 20, healingPower: 35 }, icon: `${ICON_BASE}/inv_shoulder_02.jpg`, setId: 'transcendence' };
export const ROBES_OF_TRANSCENDENCE: GearItem = { id: 'robes_of_transcendence', name: 'Robes of Transcendence', slot: 'chest', rarity: 'epic', itemLevel: 76, classes: ['priest'], stats: { intellect: 28, stamina: 25, healingPower: 44, mp5: 6 }, icon: `${ICON_BASE}/inv_chest_cloth_46.jpg`, setId: 'transcendence' };

// DRUID TIER 2 - STORMRAGE RAIMENT
export const STORMRAGE_BRACERS: GearItem = { id: 'stormrage_bracers', name: 'Stormrage Bracers', slot: 'wrist', rarity: 'epic', itemLevel: 76, classes: ['druid'], stats: { intellect: 14, stamina: 12, spirit: 5, healingPower: 20 }, icon: `${ICON_BASE}/inv_bracer_03.jpg`, setId: 'stormrage' };
export const STORMRAGE_BELT: GearItem = { id: 'stormrage_belt', name: 'Stormrage Belt', slot: 'waist', rarity: 'epic', itemLevel: 76, classes: ['druid'], stats: { intellect: 17, stamina: 14, healingPower: 26, mp5: 4 }, icon: `${ICON_BASE}/inv_belt_06.jpg`, setId: 'stormrage' };
export const STORMRAGE_BOOTS: GearItem = { id: 'stormrage_boots', name: 'Stormrage Boots', slot: 'feet', rarity: 'epic', itemLevel: 76, classes: ['druid'], stats: { intellect: 19, stamina: 16, spirit: 7, healingPower: 29 }, icon: `${ICON_BASE}/inv_boots_cloth_08.jpg`, setId: 'stormrage' };
export const STORMRAGE_HANDGUARDS: GearItem = { id: 'stormrage_handguards', name: 'Stormrage Handguards', slot: 'hands', rarity: 'epic', itemLevel: 76, classes: ['druid'], stats: { intellect: 17, stamina: 14, spirit: 7, healingPower: 26 }, icon: `${ICON_BASE}/inv_gauntlets_25.jpg`, setId: 'stormrage' };
export const STORMRAGE_PAULDRONS: GearItem = { id: 'stormrage_pauldrons', name: 'Stormrage Pauldrons', slot: 'shoulders', rarity: 'epic', itemLevel: 76, classes: ['druid'], stats: { intellect: 21, stamina: 18, spirit: 9, healingPower: 33 }, icon: `${ICON_BASE}/inv_shoulder_06.jpg`, setId: 'stormrage' };
export const STORMRAGE_CHESTGUARD: GearItem = { id: 'stormrage_chestguard', name: 'Stormrage Chestguard', slot: 'chest', rarity: 'epic', itemLevel: 76, classes: ['druid'], stats: { intellect: 26, stamina: 22, spirit: 12, healingPower: 42 }, icon: `${ICON_BASE}/inv_chest_leather_03.jpg`, setId: 'stormrage' };

// WARRIOR TIER 2 - BATTLEGEAR OF WRATH
export const BRACELETS_OF_WRATH: GearItem = { id: 'bracelets_of_wrath', name: 'Bracelets of Wrath', slot: 'wrist', rarity: 'epic', itemLevel: 76, classes: ['warrior'], stats: { strength: 17, stamina: 22, hitChance: 1 }, icon: `${ICON_BASE}/inv_bracer_14.jpg`, setId: 'wrath', itemCategory: 'melee' };
export const WAISTBAND_OF_WRATH: GearItem = { id: 'waistband_of_wrath', name: 'Waistband of Wrath', slot: 'waist', rarity: 'epic', itemLevel: 76, classes: ['warrior'], stats: { strength: 20, stamina: 24, critChance: 1 }, icon: `${ICON_BASE}/inv_belt_27.jpg`, setId: 'wrath', itemCategory: 'melee' };
export const SABATONS_OF_WRATH: GearItem = { id: 'sabatons_of_wrath', name: 'Sabatons of Wrath', slot: 'feet', rarity: 'epic', itemLevel: 76, classes: ['warrior'], stats: { strength: 18, stamina: 28, hitChance: 1 }, icon: `${ICON_BASE}/inv_boots_plate_06.jpg`, setId: 'wrath', itemCategory: 'melee' };
export const GAUNTLETS_OF_WRATH: GearItem = { id: 'gauntlets_of_wrath', name: 'Gauntlets of Wrath', slot: 'hands', rarity: 'epic', itemLevel: 76, classes: ['warrior'], stats: { strength: 19, stamina: 23, hitChance: 1 }, icon: `${ICON_BASE}/inv_gauntlets_10.jpg`, setId: 'wrath', itemCategory: 'melee' };
export const PAULDRONS_OF_WRATH: GearItem = { id: 'pauldrons_of_wrath', name: 'Pauldrons of Wrath', slot: 'shoulders', rarity: 'epic', itemLevel: 76, classes: ['warrior'], stats: { strength: 22, stamina: 28, hitChance: 1 }, icon: `${ICON_BASE}/inv_shoulder_29.jpg`, setId: 'wrath', itemCategory: 'melee' };
export const BREASTPLATE_OF_WRATH: GearItem = { id: 'breastplate_of_wrath', name: 'Breastplate of Wrath', slot: 'chest', rarity: 'epic', itemLevel: 76, classes: ['warrior'], stats: { strength: 27, stamina: 38, hitChance: 1, critChance: 1 }, icon: `${ICON_BASE}/inv_chest_plate03.jpg`, setId: 'wrath', itemCategory: 'melee' };

// HUNTER TIER 2 - DRAGONSTALKER ARMOR
export const DRAGONSTALKER_BRACERS: GearItem = { id: 'dragonstalker_bracers', name: "Dragonstalker's Bracers", slot: 'wrist', rarity: 'epic', itemLevel: 76, classes: ['hunter'], stats: { agility: 18, stamina: 14, intellect: 12 }, icon: `${ICON_BASE}/inv_bracer_13.jpg`, setId: 'dragonstalker', itemCategory: 'physical_ranged' };
export const DRAGONSTALKER_BELT: GearItem = { id: 'dragonstalker_belt', name: "Dragonstalker's Belt", slot: 'waist', rarity: 'epic', itemLevel: 76, classes: ['hunter'], stats: { agility: 22, stamina: 17, intellect: 8 }, icon: `${ICON_BASE}/inv_belt_28.jpg`, setId: 'dragonstalker', itemCategory: 'physical_ranged' };
export const DRAGONSTALKER_GREAVES: GearItem = { id: 'dragonstalker_greaves', name: "Dragonstalker's Greaves", slot: 'feet', rarity: 'epic', itemLevel: 76, classes: ['hunter'], stats: { agility: 25, stamina: 20, intellect: 10 }, icon: `${ICON_BASE}/inv_boots_chain_09.jpg`, setId: 'dragonstalker', itemCategory: 'physical_ranged' };
export const DRAGONSTALKER_GAUNTLETS: GearItem = { id: 'dragonstalker_gauntlets', name: "Dragonstalker's Gauntlets", slot: 'hands', rarity: 'epic', itemLevel: 76, classes: ['hunter'], stats: { agility: 24, stamina: 18, intellect: 9 }, icon: `${ICON_BASE}/inv_gauntlets_11.jpg`, setId: 'dragonstalker', itemCategory: 'physical_ranged' };
export const DRAGONSTALKER_SPAULDERS: GearItem = { id: 'dragonstalker_spaulders', name: "Dragonstalker's Spaulders", slot: 'shoulders', rarity: 'epic', itemLevel: 76, classes: ['hunter'], stats: { agility: 27, stamina: 22, intellect: 11 }, icon: `${ICON_BASE}/inv_shoulder_30.jpg`, setId: 'dragonstalker', itemCategory: 'physical_ranged' };
export const DRAGONSTALKER_BREASTPLATE: GearItem = { id: 'dragonstalker_breastplate', name: "Dragonstalker's Breastplate", slot: 'chest', rarity: 'epic', itemLevel: 76, classes: ['hunter'], stats: { agility: 32, stamina: 28, intellect: 14 }, icon: `${ICON_BASE}/inv_chest_chain_16.jpg`, setId: 'dragonstalker', itemCategory: 'physical_ranged' };

// MAGE TIER 2 - NETHERWIND REGALIA
export const NETHERWIND_BINDINGS: GearItem = { id: 'netherwind_bindings', name: 'Netherwind Bindings', slot: 'wrist', rarity: 'epic', itemLevel: 76, classes: ['mage'], stats: { intellect: 14, stamina: 12, spellPower: 18 }, icon: `${ICON_BASE}/inv_bracer_07.jpg`, setId: 'netherwind', itemCategory: 'caster' };
export const NETHERWIND_BELT: GearItem = { id: 'netherwind_belt', name: 'Netherwind Belt', slot: 'waist', rarity: 'epic', itemLevel: 76, classes: ['mage'], stats: { intellect: 18, stamina: 14, spellPower: 23 }, icon: `${ICON_BASE}/inv_belt_02.jpg`, setId: 'netherwind', itemCategory: 'caster' };
export const NETHERWIND_BOOTS: GearItem = { id: 'netherwind_boots', name: 'Netherwind Boots', slot: 'feet', rarity: 'epic', itemLevel: 76, classes: ['mage'], stats: { intellect: 20, stamina: 16, spellPower: 25 }, icon: `${ICON_BASE}/inv_boots_cloth_05.jpg`, setId: 'netherwind', itemCategory: 'caster' };
export const NETHERWIND_GLOVES: GearItem = { id: 'netherwind_gloves', name: 'Netherwind Gloves', slot: 'hands', rarity: 'epic', itemLevel: 76, classes: ['mage'], stats: { intellect: 18, stamina: 14, spellPower: 23, critChance: 1 }, icon: `${ICON_BASE}/inv_gauntlets_19.jpg`, setId: 'netherwind', itemCategory: 'caster' };
export const NETHERWIND_MANTLE: GearItem = { id: 'netherwind_mantle', name: 'Netherwind Mantle', slot: 'shoulders', rarity: 'epic', itemLevel: 76, classes: ['mage'], stats: { intellect: 22, stamina: 18, spellPower: 28 }, icon: `${ICON_BASE}/inv_shoulder_02.jpg`, setId: 'netherwind', itemCategory: 'caster' };
export const NETHERWIND_ROBES: GearItem = { id: 'netherwind_robes', name: 'Netherwind Robes', slot: 'chest', rarity: 'epic', itemLevel: 76, classes: ['mage'], stats: { intellect: 28, stamina: 22, spellPower: 36, critChance: 1 }, icon: `${ICON_BASE}/inv_chest_cloth_31.jpg`, setId: 'netherwind', itemCategory: 'caster' };

// ROGUE TIER 2 - BLOODFANG ARMOR
export const BLOODFANG_BRACERS: GearItem = { id: 'bloodfang_bracers', name: 'Bloodfang Bracers', slot: 'wrist', rarity: 'epic', itemLevel: 76, classes: ['rogue'], stats: { agility: 21, stamina: 16, hitChance: 1 }, icon: `${ICON_BASE}/inv_bracer_16.jpg`, setId: 'bloodfang', itemCategory: 'melee' };
export const BLOODFANG_BELT: GearItem = { id: 'bloodfang_belt', name: 'Bloodfang Belt', slot: 'waist', rarity: 'epic', itemLevel: 76, classes: ['rogue'], stats: { agility: 25, stamina: 19, critChance: 1 }, icon: `${ICON_BASE}/inv_belt_28.jpg`, setId: 'bloodfang', itemCategory: 'melee' };
export const BLOODFANG_BOOTS: GearItem = { id: 'bloodfang_boots', name: 'Bloodfang Boots', slot: 'feet', rarity: 'epic', itemLevel: 76, classes: ['rogue'], stats: { agility: 28, stamina: 18, hitChance: 1 }, icon: `${ICON_BASE}/inv_boots_08.jpg`, setId: 'bloodfang', itemCategory: 'melee' };
export const BLOODFANG_GLOVES: GearItem = { id: 'bloodfang_gloves', name: 'Bloodfang Gloves', slot: 'hands', rarity: 'epic', itemLevel: 76, classes: ['rogue'], stats: { agility: 26, stamina: 17, critChance: 1 }, icon: `${ICON_BASE}/inv_gauntlets_05.jpg`, setId: 'bloodfang', itemCategory: 'melee' };
export const BLOODFANG_SPAULDERS: GearItem = { id: 'bloodfang_spaulders', name: 'Bloodfang Spaulders', slot: 'shoulders', rarity: 'epic', itemLevel: 76, classes: ['rogue'], stats: { agility: 29, stamina: 20, critChance: 1 }, icon: `${ICON_BASE}/inv_shoulder_07.jpg`, setId: 'bloodfang', itemCategory: 'melee' };
export const BLOODFANG_CHESTPIECE: GearItem = { id: 'bloodfang_chestpiece', name: 'Bloodfang Chestpiece', slot: 'chest', rarity: 'epic', itemLevel: 76, classes: ['rogue'], stats: { agility: 35, stamina: 26, critChance: 2 }, icon: `${ICON_BASE}/inv_chest_leather_08.jpg`, setId: 'bloodfang', itemCategory: 'melee' };

// WARLOCK TIER 2 - NEMESIS RAIMENT
export const NEMESIS_BRACERS: GearItem = { id: 'nemesis_bracers', name: 'Nemesis Bracers', slot: 'wrist', rarity: 'epic', itemLevel: 76, classes: ['warlock'], stats: { stamina: 16, intellect: 12, spellPower: 18 }, icon: `${ICON_BASE}/inv_bracer_07.jpg`, setId: 'nemesis', itemCategory: 'caster' };
export const NEMESIS_BELT: GearItem = { id: 'nemesis_belt', name: 'Nemesis Belt', slot: 'waist', rarity: 'epic', itemLevel: 76, classes: ['warlock'], stats: { stamina: 20, intellect: 15, spellPower: 23 }, icon: `${ICON_BASE}/inv_belt_13.jpg`, setId: 'nemesis', itemCategory: 'caster' };
export const NEMESIS_BOOTS: GearItem = { id: 'nemesis_boots', name: 'Nemesis Boots', slot: 'feet', rarity: 'epic', itemLevel: 76, classes: ['warlock'], stats: { stamina: 22, intellect: 17, spellPower: 25 }, icon: `${ICON_BASE}/inv_boots_cloth_05.jpg`, setId: 'nemesis', itemCategory: 'caster' };
export const NEMESIS_GLOVES: GearItem = { id: 'nemesis_gloves', name: 'Nemesis Gloves', slot: 'hands', rarity: 'epic', itemLevel: 76, classes: ['warlock'], stats: { stamina: 19, intellect: 15, spellPower: 23 }, icon: `${ICON_BASE}/inv_gauntlets_17.jpg`, setId: 'nemesis', itemCategory: 'caster' };
export const NEMESIS_SPAULDERS: GearItem = { id: 'nemesis_spaulders', name: 'Nemesis Spaulders', slot: 'shoulders', rarity: 'epic', itemLevel: 76, classes: ['warlock'], stats: { stamina: 24, intellect: 19, spellPower: 28 }, icon: `${ICON_BASE}/inv_shoulder_12.jpg`, setId: 'nemesis', itemCategory: 'caster' };
export const NEMESIS_ROBES: GearItem = { id: 'nemesis_robes', name: 'Nemesis Robes', slot: 'chest', rarity: 'epic', itemLevel: 76, classes: ['warlock'], stats: { stamina: 30, intellect: 24, spellPower: 36 }, icon: `${ICON_BASE}/inv_chest_cloth_07.jpg`, setId: 'nemesis', itemCategory: 'caster' };

// =============================================================================
// BWL NON-SET ITEMS - WEAPONS & ACCESSORIES
// =============================================================================

// Weapons - Melee
export const THE_UNTAMED_BLADE: GearItem = { id: 'the_untamed_blade', name: 'The Untamed Blade', slot: 'weapon', rarity: 'epic', itemLevel: 77, classes: ['warrior', 'paladin'], stats: { strength: 38 }, icon: `${ICON_BASE}/inv_sword_41.jpg`, weaponType: 'two_hand', itemCategory: 'melee' };
export const DRAGONFANG_BLADE: GearItem = { id: 'dragonfang_blade', name: 'Dragonfang Blade', slot: 'weapon', rarity: 'epic', itemLevel: 77, classes: ['warrior', 'rogue'], stats: { agility: 16, stamina: 9, hitChance: 1 }, icon: `${ICON_BASE}/inv_weapon_shortblade_25.jpg`, weaponType: 'one_hand', itemCategory: 'melee' };
export const MALADATH: GearItem = { id: 'maladath', name: 'Maladath, Runed Blade of the Black Flight', slot: 'weapon', rarity: 'epic', itemLevel: 77, classes: ['warrior', 'rogue', 'paladin'], stats: { agility: 13, stamina: 10 }, icon: `${ICON_BASE}/inv_sword_50.jpg`, weaponType: 'one_hand', itemCategory: 'melee' };
export const CRUL_SHORUKH: GearItem = { id: 'crul_shorukh', name: "Crul'shorukh, Edge of Chaos", slot: 'weapon', rarity: 'epic', itemLevel: 78, classes: ['warrior'], stats: { strength: 16, stamina: 9, critChance: 1 }, icon: `${ICON_BASE}/inv_axe_12.jpg`, weaponType: 'one_hand', itemCategory: 'melee' };
export const CHROMATICALLY_TEMPERED_SWORD: GearItem = { id: 'chromatically_tempered_sword', name: 'Chromatically Tempered Sword', slot: 'weapon', rarity: 'epic', itemLevel: 78, classes: ['warrior', 'rogue', 'paladin'], stats: { strength: 14, agility: 10, critChance: 1 }, icon: `${ICON_BASE}/inv_sword_55.jpg`, weaponType: 'one_hand', itemCategory: 'melee' };
export const ASHKANDI: GearItem = { id: 'ashkandi', name: 'Ashkandi, Greatsword of the Brotherhood', slot: 'weapon', rarity: 'epic', itemLevel: 78, classes: ['warrior', 'paladin'], stats: { stamina: 14, strength: 43 }, icon: `${ICON_BASE}/inv_sword_36.jpg`, weaponType: 'two_hand', itemCategory: 'melee' };
export const DRAKE_TALON_CLEAVER: GearItem = { id: 'drake_talon_cleaver', name: 'Drake Talon Cleaver', slot: 'weapon', rarity: 'epic', itemLevel: 77, classes: ['warrior'], stats: { strength: 25, stamina: 22, critChance: 1 }, icon: `${ICON_BASE}/inv_axe_09.jpg`, weaponType: 'two_hand', itemCategory: 'melee' };

// Weapons - Caster/Healer
export const SHADOW_WING_FOCUS_STAFF: GearItem = { id: 'shadow_wing_focus_staff', name: 'Shadow Wing Focus Staff', slot: 'weapon', rarity: 'epic', itemLevel: 77, classes: ['all'], stats: { intellect: 22, stamina: 18, spellPower: 68 }, icon: `${ICON_BASE}/inv_staff_37.jpg`, weaponType: 'two_hand', itemCategory: 'caster' };
export const STAFF_OF_THE_SHADOW_FLAME: GearItem = { id: 'staff_of_the_shadow_flame', name: 'Staff of the Shadow Flame', slot: 'weapon', rarity: 'epic', itemLevel: 83, classes: ['all'], stats: { intellect: 28, stamina: 20, spellPower: 84 }, icon: `${ICON_BASE}/inv_staff_30.jpg`, weaponType: 'two_hand', itemCategory: 'caster' };
export const LOK_AMIR: GearItem = { id: 'lok_amir', name: "Lok'amir il Romathis", slot: 'weapon', rarity: 'epic', itemLevel: 81, classes: ['paladin', 'priest', 'druid'], stats: { intellect: 18, stamina: 12, healingPower: 84 }, icon: `${ICON_BASE}/inv_mace_15.jpg`, weaponType: 'one_hand', itemCategory: 'healer' };
export const SCROLLS_OF_BLINDING_LIGHT: GearItem = { id: 'scrolls_of_blinding_light', name: 'Scrolls of Blinding Light', slot: 'offhand', rarity: 'epic', itemLevel: 77, classes: ['priest', 'paladin'], stats: { intellect: 10, spirit: 7, healingPower: 53 }, icon: `${ICON_BASE}/inv_misc_book_05.jpg`, weaponType: 'offhand_only', itemCategory: 'healer' };

// Weapons - Ranged
export const HEARTSTRIKER: GearItem = { id: 'heartstriker', name: 'Heartstriker', slot: 'ranged', rarity: 'epic', itemLevel: 77, classes: ['hunter'], stats: { agility: 14, stamina: 7, critChance: 1 }, icon: `${ICON_BASE}/inv_weapon_bow_08.jpg`, weaponType: 'ranged', itemCategory: 'physical_ranged' };
export const ASHJRETHUL: GearItem = { id: 'ashjrethul', name: "Ashjre'thul, Crossbow of Smiting", slot: 'ranged', rarity: 'epic', itemLevel: 78, classes: ['hunter'], stats: { agility: 17, stamina: 8, critChance: 1 }, icon: `${ICON_BASE}/inv_weapon_crossbow_05.jpg`, weaponType: 'ranged', itemCategory: 'physical_ranged' };

// Cloak - using shoulders slot
export const ELEMENTIUM_THREADED_CLOAK: GearItem = { id: 'elementium_threaded_cloak', name: 'Elementium Threaded Cloak', slot: 'shoulders', rarity: 'epic', itemLevel: 77, classes: ['all'], stats: { stamina: 15 }, icon: `${ICON_BASE}/inv_misc_cape_17.jpg` };

// Armor - Shoulders/Cloaks (using shoulders slot for cloaks)
export const SHROUD_OF_PURE_THOUGHT: GearItem = { id: 'shroud_of_pure_thought', name: 'Shroud of Pure Thought', slot: 'shoulders', rarity: 'epic', itemLevel: 77, classes: ['all'], stats: { intellect: 10, spirit: 8, healingPower: 33 }, icon: `${ICON_BASE}/inv_misc_cape_21.jpg`, itemCategory: 'healer' };
export const MANTLE_OF_THE_BLACKWING_CABAL: GearItem = { id: 'mantle_of_the_blackwing_cabal', name: 'Mantle of the Blackwing Cabal', slot: 'shoulders', rarity: 'epic', itemLevel: 77, classes: ['mage', 'warlock', 'priest'], stats: { intellect: 21, stamina: 14, spellPower: 36 }, icon: `${ICON_BASE}/inv_shoulder_19.jpg`, itemCategory: 'caster' };
export const BLACK_BROOD_PAULDRONS: GearItem = { id: 'black_brood_pauldrons', name: 'Black Brood Pauldrons', slot: 'shoulders', rarity: 'epic', itemLevel: 77, classes: ['warrior', 'paladin'], stats: { strength: 22, stamina: 18, critChance: 1 }, icon: `${ICON_BASE}/inv_shoulder_03.jpg`, itemCategory: 'melee' };
export const DRAKE_TALON_PAULDRONS: GearItem = { id: 'drake_talon_pauldrons', name: 'Drake Talon Pauldrons', slot: 'shoulders', rarity: 'epic', itemLevel: 77, classes: ['warrior', 'paladin'], stats: { strength: 24, stamina: 20, critChance: 1 }, icon: `${ICON_BASE}/inv_shoulder_11.jpg`, itemCategory: 'melee' };

// Helm
export const HELM_OF_ENDLESS_RAGE: GearItem = { id: 'helm_of_endless_rage', name: 'Helm of Endless Rage', slot: 'head', rarity: 'epic', itemLevel: 77, classes: ['warrior'], stats: { strength: 32, stamina: 24, critChance: 1 }, icon: `${ICON_BASE}/inv_helmet_08.jpg`, itemCategory: 'melee' };
export const MISHUNDARE: GearItem = { id: 'mishundare', name: 'Mish\'undare, Circlet of the Mind Flayer', slot: 'head', rarity: 'epic', itemLevel: 83, classes: ['mage', 'warlock', 'priest'], stats: { intellect: 24, stamina: 18, spellPower: 35, critChance: 2 }, icon: `${ICON_BASE}/inv_helmet_37.jpg`, itemCategory: 'caster' };

// Chest - Non-set
export const MALFURIONS_BLESSED_BULWARK: GearItem = { id: 'malfurions_blessed_bulwark', name: "Malfurion's Blessed Bulwark", slot: 'chest', rarity: 'epic', itemLevel: 77, classes: ['druid'], stats: { stamina: 25, intellect: 20, spirit: 12, healingPower: 37 }, icon: `${ICON_BASE}/inv_chest_leather_04.jpg`, itemCategory: 'healer' };

// Gloves - Non-set
export const EBONY_FLAME_GLOVES: GearItem = { id: 'ebony_flame_gloves', name: 'Ebony Flame Gloves', slot: 'hands', rarity: 'epic', itemLevel: 77, classes: ['rogue', 'druid'], stats: { agility: 23, stamina: 14 }, icon: `${ICON_BASE}/inv_gauntlets_26.jpg`, itemCategory: 'melee' };

// Belt - Non-set
export const ANGELISTA_GRASP: GearItem = { id: 'angelista_grasp', name: "Angelista's Grasp", slot: 'waist', rarity: 'epic', itemLevel: 77, classes: ['mage', 'warlock', 'priest'], stats: { intellect: 15, stamina: 12, spellPower: 32 }, icon: `${ICON_BASE}/inv_belt_18.jpg`, itemCategory: 'caster' };
export const TAUT_DRAGONHIDE_BELT: GearItem = { id: 'taut_dragonhide_belt', name: 'Taut Dragonhide Belt', slot: 'waist', rarity: 'epic', itemLevel: 77, classes: ['druid', 'rogue'], stats: { agility: 24, stamina: 18, critChance: 1 }, icon: `${ICON_BASE}/inv_belt_14.jpg`, itemCategory: 'melee' };

// Boots - Non-set
export const BOOTS_OF_THE_SHADOW_FLAME: GearItem = { id: 'boots_of_the_shadow_flame', name: 'Boots of the Shadow Flame', slot: 'feet', rarity: 'epic', itemLevel: 77, classes: ['rogue', 'druid'], stats: { agility: 26, stamina: 15 }, icon: `${ICON_BASE}/inv_boots_cloth_05.jpg`, itemCategory: 'melee' };

// Wrists - Non-set
export const BRACERS_OF_ARCANE_ACCURACY: GearItem = { id: 'bracers_of_arcane_accuracy', name: 'Bracers of Arcane Accuracy', slot: 'wrist', rarity: 'epic', itemLevel: 77, classes: ['all'], stats: { intellect: 10, stamina: 10, spellPower: 21, hitChance: 1 }, icon: `${ICON_BASE}/inv_bracer_07.jpg`, itemCategory: 'caster' };

// Shield
export const RED_DRAGONSCALE_PROTECTOR: GearItem = { id: 'red_dragonscale_protector', name: 'Red Dragonscale Protector', slot: 'offhand', rarity: 'epic', itemLevel: 77, classes: ['paladin', 'warrior'], stats: { stamina: 12 }, icon: `${ICON_BASE}/inv_shield_22.jpg`, weaponType: 'offhand_only', itemCategory: 'melee' };

// =============================================================================
// ALL ITEMS INDEX
// =============================================================================

export const ALL_ITEMS: Record<string, GearItem> = {
  // Paladin T1
  lawbringer_boots: LAWBRINGER_BOOTS,
  lawbringer_gauntlets: LAWBRINGER_GAUNTLETS,
  lawbringer_helm: LAWBRINGER_HELM,
  lawbringer_legplates: LAWBRINGER_LEGPLATES,
  lawbringer_spaulders: LAWBRINGER_SPAULDERS,
  lawbringer_chestguard: LAWBRINGER_CHESTGUARD,
  lawbringer_belt: LAWBRINGER_BELT,
  lawbringer_bracers: LAWBRINGER_BRACERS,

  // Priest T1
  boots_of_prophecy: BOOTS_OF_PROPHECY,
  gloves_of_prophecy: GLOVES_OF_PROPHECY,
  circlet_of_prophecy: CIRCLET_OF_PROPHECY,
  pants_of_prophecy: PANTS_OF_PROPHECY,
  mantle_of_prophecy: MANTLE_OF_PROPHECY,
  robes_of_prophecy: ROBES_OF_PROPHECY,
  girdle_of_prophecy: GIRDLE_OF_PROPHECY,
  vambraces_of_prophecy: VAMBRACES_OF_PROPHECY,

  // Druid T1
  cenarion_boots: CENARION_BOOTS,
  cenarion_gloves: CENARION_GLOVES,
  cenarion_helm: CENARION_HELM,
  cenarion_leggings: CENARION_LEGGINGS,
  cenarion_spaulders: CENARION_SPAULDERS,
  cenarion_vestments: CENARION_VESTMENTS,
  cenarion_belt: CENARION_BELT,
  cenarion_bracers: CENARION_BRACERS,

  // Warrior T1
  helm_of_might: HELM_OF_MIGHT,
  pauldrons_of_might: PAULDRONS_OF_MIGHT,
  breastplate_of_might: BREASTPLATE_OF_MIGHT,
  gauntlets_of_might: GAUNTLETS_OF_MIGHT,
  legplates_of_might: LEGPLATES_OF_MIGHT,
  sabatons_of_might: SABATONS_OF_MIGHT,
  belt_of_might: BELT_OF_MIGHT,
  bracers_of_might: BRACERS_OF_MIGHT,

  // Hunter T1
  giantstalker_helm: GIANTSTALKER_HELM,
  giantstalker_epaulets: GIANTSTALKER_EPAULETS,
  giantstalker_breastplate: GIANTSTALKER_BREASTPLATE,
  giantstalker_gloves: GIANTSTALKER_GLOVES,
  giantstalker_leggings: GIANTSTALKER_LEGGINGS,
  giantstalker_boots: GIANTSTALKER_BOOTS,
  giantstalker_belt: GIANTSTALKER_BELT,
  giantstalker_bracers: GIANTSTALKER_BRACERS,

  // Mage T1
  arcanist_boots: ARCANIST_BOOTS,
  arcanist_gloves: ARCANIST_GLOVES,
  arcanist_crown: ARCANIST_CROWN,
  arcanist_leggings: ARCANIST_LEGGINGS,
  arcanist_mantle: ARCANIST_MANTLE,
  arcanist_robes: ARCANIST_ROBES,
  arcanist_belt: ARCANIST_BELT,
  arcanist_bindings: ARCANIST_BINDINGS,

  // Rogue T1
  nightslayer_cover: NIGHTSLAYER_COVER,
  nightslayer_shoulder_pads: NIGHTSLAYER_SHOULDER_PADS,
  nightslayer_chestpiece: NIGHTSLAYER_CHESTPIECE,
  nightslayer_gloves: NIGHTSLAYER_GLOVES,
  nightslayer_pants: NIGHTSLAYER_PANTS,
  nightslayer_boots: NIGHTSLAYER_BOOTS,
  nightslayer_belt: NIGHTSLAYER_BELT,
  nightslayer_bracelets: NIGHTSLAYER_BRACELETS,

  // Warlock T1
  felheart_horns: FELHEART_HORNS,
  felheart_shoulder_pads: FELHEART_SHOULDER_PADS,
  felheart_robes: FELHEART_ROBES,
  felheart_gloves: FELHEART_GLOVES,
  felheart_pants: FELHEART_PANTS,
  felheart_slippers: FELHEART_SLIPPERS,
  felheart_belt: FELHEART_BELT,
  felheart_bracers: FELHEART_BRACERS,

  // Shaman T1
  earthfury_boots: EARTHFURY_BOOTS,
  earthfury_gauntlets: EARTHFURY_GAUNTLETS,
  earthfury_helmet: EARTHFURY_HELMET,
  earthfury_legguards: EARTHFURY_LEGGUARDS,
  earthfury_epaulets: EARTHFURY_EPAULETS,
  earthfury_vestments: EARTHFURY_VESTMENTS,
  earthfury_belt: EARTHFURY_BELT,
  earthfury_bracers: EARTHFURY_BRACERS,

  // Non-set items
  salamander_scale_pants: SALAMANDER_SCALE_PANTS,
  azuresong_mageblade: AZURESONG_MAGEBLADE,
  aurastone_hammer: AURASTONE_HAMMER,
  gutgutter: GUTGUTTER,
  staff_of_dominance: STAFF_OF_DOMINANCE,
  fire_runed_grimoire: FIRE_RUNED_GRIMOIRE,
  sorcerous_dagger: SORCEROUS_DAGGER,

  // DPS Weapons
  bonereaver_edge: BONEREAVER_EDGE,
  perditions_blade: PERDITIONS_BLADE,
  strikers_mark: STRIKERS_MARK,

  // Legendary Weapons
  thunderfury: THUNDERFURY,
  sulfuras: SULFURAS,

  // T2 Helms (Onyxia drops)
  judgment_crown: JUDGMENT_CROWN,
  halo_of_transcendence: HALO_OF_TRANSCENDENCE,
  stormrage_cover: STORMRAGE_COVER,
  netherwind_crown: NETHERWIND_CROWN,
  nemesis_skullcap: NEMESIS_SKULLCAP,
  dragonstalker_helm: DRAGONSTALKER_HELM,
  helm_of_wrath: HELM_OF_WRATH,
  bloodfang_hood: BLOODFANG_HOOD,
  ten_storms_crown: TEN_STORMS_CROWN,

  // Onyxia Weapons & Other
  deathbringer: DEATHBRINGER,
  vis_kag: VIS_KAG,
  ancient_cornerstone_grimoire: ANCIENT_CORNERSTONE_GRIMOIRE,
  sapphiron_drape: SAPPHIRON_DRAPE,
  ring_of_binding: RING_OF_BINDING,
  onyxia_tooth_pendant: ONYXIA_TOOTH_PENDANT,

  // Paladin T2 - Judgment Armor
  judgment_bindings: JUDGMENT_BINDINGS,
  judgment_belt: JUDGMENT_BELT,
  judgment_sabatons: JUDGMENT_SABATONS,
  judgment_gauntlets: JUDGMENT_GAUNTLETS,
  judgment_spaulders: JUDGMENT_SPAULDERS,
  judgment_breastplate: JUDGMENT_BREASTPLATE,

  // Priest T2 - Vestments of Transcendence
  bindings_of_transcendence: BINDINGS_OF_TRANSCENDENCE,
  belt_of_transcendence: BELT_OF_TRANSCENDENCE,
  boots_of_transcendence: BOOTS_OF_TRANSCENDENCE,
  handguards_of_transcendence: HANDGUARDS_OF_TRANSCENDENCE,
  pauldrons_of_transcendence: PAULDRONS_OF_TRANSCENDENCE,
  robes_of_transcendence: ROBES_OF_TRANSCENDENCE,

  // Druid T2 - Stormrage Raiment
  stormrage_bracers: STORMRAGE_BRACERS,
  stormrage_belt: STORMRAGE_BELT,
  stormrage_boots: STORMRAGE_BOOTS,
  stormrage_handguards: STORMRAGE_HANDGUARDS,
  stormrage_pauldrons: STORMRAGE_PAULDRONS,
  stormrage_chestguard: STORMRAGE_CHESTGUARD,

  // Warrior T2 - Battlegear of Wrath
  bracelets_of_wrath: BRACELETS_OF_WRATH,
  waistband_of_wrath: WAISTBAND_OF_WRATH,
  sabatons_of_wrath: SABATONS_OF_WRATH,
  gauntlets_of_wrath: GAUNTLETS_OF_WRATH,
  pauldrons_of_wrath: PAULDRONS_OF_WRATH,
  breastplate_of_wrath: BREASTPLATE_OF_WRATH,

  // Hunter T2 - Dragonstalker Armor
  dragonstalker_bracers: DRAGONSTALKER_BRACERS,
  dragonstalker_belt: DRAGONSTALKER_BELT,
  dragonstalker_greaves: DRAGONSTALKER_GREAVES,
  dragonstalker_gauntlets: DRAGONSTALKER_GAUNTLETS,
  dragonstalker_spaulders: DRAGONSTALKER_SPAULDERS,
  dragonstalker_breastplate: DRAGONSTALKER_BREASTPLATE,

  // Mage T2 - Netherwind Regalia
  netherwind_bindings: NETHERWIND_BINDINGS,
  netherwind_belt: NETHERWIND_BELT,
  netherwind_boots: NETHERWIND_BOOTS,
  netherwind_gloves: NETHERWIND_GLOVES,
  netherwind_mantle: NETHERWIND_MANTLE,
  netherwind_robes: NETHERWIND_ROBES,

  // Rogue T2 - Bloodfang Armor
  bloodfang_bracers: BLOODFANG_BRACERS,
  bloodfang_belt: BLOODFANG_BELT,
  bloodfang_boots: BLOODFANG_BOOTS,
  bloodfang_gloves: BLOODFANG_GLOVES,
  bloodfang_spaulders: BLOODFANG_SPAULDERS,
  bloodfang_chestpiece: BLOODFANG_CHESTPIECE,

  // Warlock T2 - Nemesis Raiment
  nemesis_bracers: NEMESIS_BRACERS,
  nemesis_belt: NEMESIS_BELT,
  nemesis_boots: NEMESIS_BOOTS,
  nemesis_gloves: NEMESIS_GLOVES,
  nemesis_spaulders: NEMESIS_SPAULDERS,
  nemesis_robes: NEMESIS_ROBES,

  // BWL Non-Set Weapons - Melee
  the_untamed_blade: THE_UNTAMED_BLADE,
  dragonfang_blade: DRAGONFANG_BLADE,
  maladath: MALADATH,
  crul_shorukh: CRUL_SHORUKH,
  chromatically_tempered_sword: CHROMATICALLY_TEMPERED_SWORD,
  ashkandi: ASHKANDI,
  drake_talon_cleaver: DRAKE_TALON_CLEAVER,

  // BWL Non-Set Weapons - Caster/Healer
  shadow_wing_focus_staff: SHADOW_WING_FOCUS_STAFF,
  staff_of_the_shadow_flame: STAFF_OF_THE_SHADOW_FLAME,
  lok_amir: LOK_AMIR,
  scrolls_of_blinding_light: SCROLLS_OF_BLINDING_LIGHT,

  // BWL Non-Set Weapons - Ranged
  heartstriker: HEARTSTRIKER,
  ashjrethul: ASHJRETHUL,

  // BWL Cloaks
  elementium_threaded_cloak: ELEMENTIUM_THREADED_CLOAK,

  // BWL Armor - Shoulders/Cloaks
  shroud_of_pure_thought: SHROUD_OF_PURE_THOUGHT,
  mantle_of_the_blackwing_cabal: MANTLE_OF_THE_BLACKWING_CABAL,
  black_brood_pauldrons: BLACK_BROOD_PAULDRONS,
  drake_talon_pauldrons: DRAKE_TALON_PAULDRONS,

  // BWL Armor - Helms
  helm_of_endless_rage: HELM_OF_ENDLESS_RAGE,
  mishundare: MISHUNDARE,

  // BWL Armor - Chest
  malfurions_blessed_bulwark: MALFURIONS_BLESSED_BULWARK,

  // BWL Armor - Gloves
  ebony_flame_gloves: EBONY_FLAME_GLOVES,

  // BWL Armor - Belts
  angelista_grasp: ANGELISTA_GRASP,
  taut_dragonhide_belt: TAUT_DRAGONHIDE_BELT,

  // BWL Armor - Boots
  boots_of_the_shadow_flame: BOOTS_OF_THE_SHADOW_FLAME,

  // BWL Armor - Wrists
  bracers_of_arcane_accuracy: BRACERS_OF_ARCANE_ACCURACY,

  // BWL Armor - Shields
  red_dragonscale_protector: RED_DRAGONSCALE_PROTECTOR,
};

// =============================================================================
// LEGENDARY MATERIALS
// =============================================================================

export const LEGENDARY_MATERIALS: Record<LegendaryMaterialId, LegendaryMaterial> = {
  bindings_of_the_windseeker_left: {
    id: 'bindings_of_the_windseeker_left',
    name: 'Left Binding of the Windseeker',
    icon: `${ICON_BASE}/spell_ice_lament.jpg`,
    description: 'One half of the legendary bindings needed to forge Thunderfury.',
    dropChance: 0.03, // 3% drop chance
    dropsFrom: 'baron_geddon', // Left Binding drops from Baron Geddon
    requiresOther: 'bindings_of_the_windseeker_right',
    requiresBossKill: 'firemaw', // Must kill Firemaw in BWL
  },
  bindings_of_the_windseeker_right: {
    id: 'bindings_of_the_windseeker_right',
    name: 'Right Binding of the Windseeker',
    icon: `${ICON_BASE}/spell_ice_lament.jpg`,
    description: 'One half of the legendary bindings needed to forge Thunderfury.',
    dropChance: 0.03, // 3% drop chance
    dropsFrom: 'garr', // Right Binding drops from Garr
    requiresOther: 'bindings_of_the_windseeker_left',
    requiresBossKill: 'firemaw', // Must kill Firemaw in BWL
  },
  eye_of_sulfuras: {
    id: 'eye_of_sulfuras',
    name: 'Eye of Sulfuras',
    icon: `${ICON_BASE}/inv_misc_gem_pearl_05.jpg`,
    description: 'The burning eye of Ragnaros. Can be forged into Sulfuras, Hand of Ragnaros.',
    dropChance: 0.02, // 2% drop chance
    dropsFrom: 'ragnaros',
    craftsInto: 'sulfuras',
  },
};

// Rarity colors for UI
export const RARITY_COLORS: Record<ItemRarity, string> = {
  uncommon: '#1eff00',
  rare: '#0070dd',
  epic: '#a335ee',
  legendary: '#ff8000',
};
