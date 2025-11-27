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
