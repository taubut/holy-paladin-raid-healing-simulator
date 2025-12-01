// Molten Core Loot Items - Authentic Vanilla WoW Stats
// Sources: classicdb.ch, vanilla-wow-archive.fandom.com, wowhead.com/classic

export type EquipmentSlot =
  | 'head' | 'neck' | 'shoulders' | 'back' | 'chest'
  | 'wrist' | 'hands' | 'waist' | 'legs' | 'feet'
  | 'ring1' | 'ring2' | 'trinket1' | 'trinket2'
  | 'weapon' | 'offhand' | 'ranged';
export type ItemRarity = 'uncommon' | 'rare' | 'epic' | 'legendary';
export type WearableClass = 'paladin' | 'priest' | 'druid' | 'warrior' | 'mage' | 'warlock' | 'hunter' | 'rogue' | 'shaman' | 'all';

// Weapon type classification for dual-wield and two-hand handling
export type WeaponType = 'one_hand' | 'two_hand' | 'offhand_only' | 'ranged';

// Relic type for class-specific ranged slot items
export type RelicType = 'libram' | 'totem' | 'idol' | 'wand' | 'bow' | 'gun' | 'crossbow' | 'thrown';

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

// Enchanting material types (from disenchanting gear)
export type EnchantingMaterialId = 'nexus_crystal';

export interface EnchantingMaterial {
  id: EnchantingMaterialId;
  name: string;
  icon: string;
  description: string;
}

export const ENCHANTING_MATERIALS: Record<EnchantingMaterialId, EnchantingMaterial> = {
  nexus_crystal: {
    id: 'nexus_crystal',
    name: 'Nexus Crystal',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_enchant_shardnexuslarge.jpg',
    description: 'A powerful enchanting reagent obtained from disenchanting epic gear.',
  },
};

// Quest material types (turn-in items like Head of Onyxia, Head of Nefarian)
export type QuestMaterialId = 'head_of_onyxia' | 'head_of_nefarian';

export type OnyxiaQuestRewardId = 'dragonslayers_signet' | 'onyxia_blood_talisman' | 'onyxia_tooth_pendant';
export type NefarianQuestRewardId = 'master_dragonslayers_medallion' | 'master_dragonslayers_orb' | 'master_dragonslayers_ring';
export type QuestRewardId = OnyxiaQuestRewardId | NefarianQuestRewardId;

export interface QuestMaterial {
  id: QuestMaterialId;
  name: string;
  icon: string;
  description: string;
  dropChance: number;
  dropsFrom: string;
  rewards: QuestRewardId[]; // Items player can choose from
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
  relicType?: RelicType;  // For ranged slot items: libram, totem, idol, wand, bow, etc.
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
  setId: 'lawbringer', itemCategory: 'healer',
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
  setId: 'lawbringer', itemCategory: 'healer',
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
  setId: 'lawbringer', itemCategory: 'healer',
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
  setId: 'lawbringer', itemCategory: 'healer',
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
  setId: 'lawbringer', itemCategory: 'healer',
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
  setId: 'lawbringer', itemCategory: 'healer',
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
  setId: 'lawbringer', itemCategory: 'healer',
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
  setId: 'lawbringer', itemCategory: 'healer',
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
  setId: 'prophecy', itemCategory: 'healer',
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
  setId: 'prophecy', itemCategory: 'healer',
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
  setId: 'prophecy', itemCategory: 'healer',
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
  setId: 'prophecy', itemCategory: 'healer',
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
  setId: 'prophecy', itemCategory: 'healer',
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
  setId: 'prophecy', itemCategory: 'healer',
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
  setId: 'prophecy', itemCategory: 'healer',
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
  setId: 'prophecy', itemCategory: 'healer',
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
  setId: 'cenarion', itemCategory: 'healer',
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
  setId: 'cenarion', itemCategory: 'healer',
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
  setId: 'cenarion', itemCategory: 'healer',
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
  setId: 'cenarion', itemCategory: 'healer',
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
  setId: 'cenarion', itemCategory: 'healer',
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
  setId: 'cenarion', itemCategory: 'healer',
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
  setId: 'cenarion', itemCategory: 'healer',
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
  setId: 'cenarion', itemCategory: 'healer',
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
  itemCategory: 'healer',
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
// MOLTEN CORE - ACCESSORIES (Necklaces, Cloaks, Rings, Trinkets)
// =============================================================================

// MC Necklaces
export const CHOKER_OF_ENLIGHTENMENT: GearItem = { id: 'choker_of_enlightenment', name: 'Choker of Enlightenment', slot: 'neck', rarity: 'epic', itemLevel: 66, classes: ['all'], stats: { intellect: 10, spirit: 10, stamina: 9, spellPower: 18 }, icon: `${ICON_BASE}/inv_jewelry_necklace_10.jpg`, itemCategory: 'caster' };
export const MEDALLION_OF_STEADFAST_MIGHT: GearItem = { id: 'medallion_of_steadfast_might', name: 'Medallion of Steadfast Might', slot: 'neck', rarity: 'epic', itemLevel: 66, classes: ['warrior', 'paladin'], stats: { stamina: 13, strength: 9 }, icon: `${ICON_BASE}/inv_jewelry_necklace_07.jpg`, itemCategory: 'melee' };
export const CHOKER_OF_THE_FIRE_LORD: GearItem = { id: 'choker_of_the_fire_lord', name: 'Choker of the Fire Lord', slot: 'neck', rarity: 'epic', itemLevel: 71, classes: ['all'], stats: { intellect: 7, stamina: 7, spellPower: 34 }, icon: `${ICON_BASE}/inv_jewelry_necklace_14.jpg`, itemCategory: 'caster' };

// MC Cloaks
export const FIREPROOF_CLOAK: GearItem = { id: 'fireproof_cloak', name: 'Fireproof Cloak', slot: 'back', rarity: 'epic', itemLevel: 66, classes: ['all'], stats: { intellect: 9, spirit: 8, stamina: 12 }, icon: `${ICON_BASE}/inv_misc_cape_20.jpg`, itemCategory: 'caster' };
export const CLOAK_OF_THE_SHROUDED_MISTS: GearItem = { id: 'cloak_of_the_shrouded_mists', name: 'Cloak of the Shrouded Mists', slot: 'back', rarity: 'epic', itemLevel: 71, classes: ['all'], stats: { agility: 22, stamina: 12 }, icon: `${ICON_BASE}/inv_misc_cape_02.jpg`, itemCategory: 'melee' };
export const DRAGONS_BLOOD_CAPE: GearItem = { id: 'dragons_blood_cape', name: "Dragon's Blood Cape", slot: 'back', rarity: 'epic', itemLevel: 71, classes: ['warrior', 'paladin'], stats: { stamina: 22, strength: 9 }, icon: `${ICON_BASE}/inv_misc_cape_17.jpg`, itemCategory: 'melee' };

// MC Rings
export const RING_OF_SPELL_POWER: GearItem = { id: 'ring_of_spell_power', name: 'Ring of Spell Power', slot: 'ring1', rarity: 'epic', itemLevel: 66, classes: ['all'], stats: { spellPower: 33 }, icon: `${ICON_BASE}/inv_jewelry_ring_14.jpg`, itemCategory: 'caster' };
export const HEAVY_DARK_IRON_RING: GearItem = { id: 'heavy_dark_iron_ring', name: 'Heavy Dark Iron Ring', slot: 'ring1', rarity: 'epic', itemLevel: 66, classes: ['warrior', 'paladin'], stats: { stamina: 20 }, icon: `${ICON_BASE}/inv_jewelry_ring_01.jpg`, itemCategory: 'melee' };
export const SEAL_OF_THE_ARCHMAGUS: GearItem = { id: 'seal_of_the_archmagus', name: 'Seal of the Archmagus', slot: 'ring1', rarity: 'epic', itemLevel: 68, classes: ['all'], stats: { intellect: 11, spirit: 11, stamina: 11, mp5: 3 }, icon: `${ICON_BASE}/inv_jewelry_ring_16.jpg`, itemCategory: 'caster' };
export const CAUTERIZING_BAND: GearItem = { id: 'cauterizing_band', name: 'Cauterizing Band', slot: 'ring1', rarity: 'epic', itemLevel: 68, classes: ['paladin', 'priest', 'druid', 'shaman'], stats: { intellect: 12, stamina: 9, healingPower: 46 }, icon: `${ICON_BASE}/inv_jewelry_ring_38.jpg`, itemCategory: 'healer' };
export const BAND_OF_ACCURIA: GearItem = { id: 'band_of_accuria', name: 'Band of Accuria', slot: 'ring1', rarity: 'epic', itemLevel: 71, classes: ['all'], stats: { agility: 16, stamina: 10, hitChance: 2 }, icon: `${ICON_BASE}/inv_jewelry_ring_30.jpg`, itemCategory: 'melee' };
export const BAND_OF_SULFURAS: GearItem = { id: 'band_of_sulfuras', name: 'Band of Sulfuras', slot: 'ring1', rarity: 'epic', itemLevel: 71, classes: ['all'], stats: { intellect: 23, spirit: 10, stamina: 13 }, icon: `${ICON_BASE}/inv_jewelry_ring_33.jpg`, itemCategory: 'caster' };
export const QUICK_STRIKE_RING: GearItem = { id: 'quick_strike_ring', name: 'Quick Strike Ring', slot: 'ring1', rarity: 'epic', itemLevel: 66, classes: ['warrior', 'rogue', 'hunter', 'paladin'], stats: { strength: 5, stamina: 8, critChance: 1 }, icon: `${ICON_BASE}/inv_jewelry_ring_03.jpg`, itemCategory: 'melee' };

// MC Trinkets
export const TALISMAN_OF_EPHEMERAL_POWER: GearItem = { id: 'talisman_of_ephemeral_power', name: 'Talisman of Ephemeral Power', slot: 'trinket1', rarity: 'epic', itemLevel: 66, classes: ['all'], stats: { spellPower: 10 }, icon: `${ICON_BASE}/inv_misc_stonetablet_11.jpg`, itemCategory: 'caster' };
export const ESSENCE_OF_THE_PURE_FLAME: GearItem = { id: 'essence_of_the_pure_flame', name: 'Essence of the Pure Flame', slot: 'trinket1', rarity: 'epic', itemLevel: 71, classes: ['all'], stats: { stamina: 14 }, icon: `${ICON_BASE}/inv_elemental_primal_fire.jpg`, itemCategory: 'universal' };
export const SHARD_OF_THE_FLAME: GearItem = { id: 'shard_of_the_flame', name: 'Shard of the Flame', slot: 'trinket1', rarity: 'epic', itemLevel: 71, classes: ['all'], stats: { stamina: 7 }, icon: `${ICON_BASE}/inv_misc_gem_flamespessarite_02.jpg`, itemCategory: 'universal' };

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
  relicType: 'bow',
  itemCategory: 'physical_ranged',
};

// =============================================================================
// MOLTEN CORE - MISSING MELEE WEAPONS
// =============================================================================

export const BRUTALITY_BLADE: GearItem = {
  id: 'brutality_blade',
  name: 'Brutality Blade',
  slot: 'weapon',
  rarity: 'epic',
  itemLevel: 70,
  classes: ['warrior', 'rogue', 'hunter'],
  stats: { agility: 9, stamina: 9, strength: 9, critChance: 1, hitChance: 1 },
  icon: `${ICON_BASE}/inv_sword_15.jpg`,
  weaponType: 'one_hand',
  itemCategory: 'melee',
};

export const GUTGORE_RIPPER: GearItem = {
  id: 'gutgore_ripper',
  name: 'Gutgore Ripper',
  slot: 'weapon',
  rarity: 'epic',
  itemLevel: 70,
  classes: ['warrior', 'rogue'],
  stats: { agility: 16, stamina: 9, critChance: 1 },
  icon: `${ICON_BASE}/inv_weapon_shortblade_03.jpg`,
  weaponType: 'one_hand',
  itemCategory: 'melee',
};

export const CORE_HOUND_TOOTH: GearItem = {
  id: 'core_hound_tooth',
  name: 'Core Hound Tooth',
  slot: 'weapon',
  rarity: 'epic',
  itemLevel: 75,
  classes: ['warrior', 'rogue'],
  stats: { agility: 16, stamina: 7, hitChance: 1 },
  icon: `${ICON_BASE}/inv_weapon_shortblade_07.jpg`,
  weaponType: 'one_hand',
  itemCategory: 'melee',
};

export const SPINAL_REAPER: GearItem = {
  id: 'spinal_reaper',
  name: 'Spinal Reaper',
  slot: 'weapon',
  rarity: 'epic',
  itemLevel: 77,
  classes: ['warrior'],
  stats: { strength: 20, stamina: 15, critChance: 1 },
  icon: `${ICON_BASE}/inv_axe_09.jpg`,
  weaponType: 'two_hand',
  itemCategory: 'melee',
};

export const EARTHSHAKER: GearItem = {
  id: 'earthshaker',
  name: 'Earthshaker',
  slot: 'weapon',
  rarity: 'epic',
  itemLevel: 70,
  classes: ['warrior', 'paladin'],
  stats: { strength: 17, stamina: 12 },
  icon: `${ICON_BASE}/inv_hammer_09.jpg`,
  weaponType: 'two_hand',
  itemCategory: 'melee',
};

export const FINKLES_LAVA_DREDGER: GearItem = {
  id: 'finkles_lava_dredger',
  name: "Finkle's Lava Dredger",
  slot: 'weapon',
  rarity: 'epic',
  itemLevel: 70,
  classes: ['warrior', 'paladin', 'shaman'],
  stats: { strength: 12, stamina: 15, spirit: 10 },
  icon: `${ICON_BASE}/inv_pick_02.jpg`,
  weaponType: 'two_hand',
  itemCategory: 'melee',
};

export const OBSIDIAN_EDGED_BLADE: GearItem = {
  id: 'obsidian_edged_blade',
  name: 'Obsidian Edged Blade',
  slot: 'weapon',
  rarity: 'epic',
  itemLevel: 70,
  classes: ['warrior', 'paladin'],
  stats: { strength: 26, stamina: 13, critChance: 1 },
  icon: `${ICON_BASE}/inv_sword_42.jpg`,
  weaponType: 'two_hand',
  itemCategory: 'melee',
};

// =============================================================================
// MOLTEN CORE - MISSING RANGED WEAPONS
// =============================================================================

export const BLASTERSHOT_LAUNCHER: GearItem = {
  id: 'blastershot_launcher',
  name: 'Blastershot Launcher',
  slot: 'ranged',
  rarity: 'epic',
  itemLevel: 70,
  classes: ['hunter', 'warrior', 'rogue'],
  stats: { agility: 7, stamina: 8, hitChance: 1 },
  icon: `${ICON_BASE}/inv_weapon_rifle_01.jpg`,
  weaponType: 'ranged',
  relicType: 'gun',
  itemCategory: 'physical_ranged',
};

// Wand
export const CRIMSON_SHOCKER: GearItem = { id: 'crimson_shocker', name: 'Crimson Shocker', slot: 'ranged', rarity: 'epic', itemLevel: 66, classes: ['mage', 'warlock', 'priest'], stats: { intellect: 4, stamina: 4, spellPower: 11 }, icon: `${ICON_BASE}/inv_wand_05.jpg`, weaponType: 'ranged', relicType: 'wand', itemCategory: 'caster' };

// =============================================================================
// MOLTEN CORE - ADDITIONAL WEAPONS
// =============================================================================

// Shadowstrike - Sulfuron Harbinger
export const SHADOWSTRIKE: GearItem = { id: 'shadowstrike', name: 'Shadowstrike', slot: 'weapon', rarity: 'epic', itemLevel: 70, classes: ['warrior', 'paladin', 'hunter', 'druid'], stats: { strength: 22, stamina: 15, agility: 13 }, icon: `${ICON_BASE}/inv_weapon_halberd_02.jpg`, weaponType: 'two_hand', itemCategory: 'melee' };

// Eskhandar's Right Claw - Magmadar
export const ESKHANDARS_RIGHT_CLAW: GearItem = { id: 'eskhandars_right_claw', name: "Eskhandar's Right Claw", slot: 'weapon', rarity: 'epic', itemLevel: 70, classes: ['warrior', 'rogue', 'shaman'], stats: { strength: 8, agility: 8, stamina: 10 }, icon: `${ICON_BASE}/inv_weapon_hand_01.jpg`, weaponType: 'one_hand', itemCategory: 'melee' };

// =============================================================================
// MOLTEN CORE - SHARED NON-SET ARMOR (Drops from multiple bosses)
// =============================================================================

// Cloth
export const ROBE_OF_VOLATILE_POWER: GearItem = { id: 'robe_of_volatile_power', name: 'Robe of Volatile Power', slot: 'chest', rarity: 'epic', itemLevel: 66, classes: ['mage', 'warlock', 'priest'], stats: { intellect: 12, stamina: 16, spellPower: 23, critChance: 1 }, icon: `${ICON_BASE}/inv_chest_cloth_45.jpg`, itemCategory: 'caster' };

export const MANASTORM_LEGGINGS: GearItem = { id: 'manastorm_leggings', name: 'Manastorm Leggings', slot: 'legs', rarity: 'epic', itemLevel: 66, classes: ['mage', 'warlock', 'priest'], stats: { intellect: 21, stamina: 14, spellPower: 20 }, icon: `${ICON_BASE}/inv_pants_08.jpg`, itemCategory: 'caster' };

export const MANA_IGNITING_CORD: GearItem = { id: 'mana_igniting_cord', name: 'Mana Igniting Cord', slot: 'waist', rarity: 'epic', itemLevel: 66, classes: ['mage', 'warlock', 'priest'], stats: { intellect: 13, stamina: 8, spellPower: 24, hitChance: 1 }, icon: `${ICON_BASE}/inv_belt_13.jpg`, itemCategory: 'caster' };

// Leather
export const AGED_CORE_LEATHER_GLOVES: GearItem = { id: 'aged_core_leather_gloves', name: 'Aged Core Leather Gloves', slot: 'hands', rarity: 'epic', itemLevel: 66, classes: ['rogue', 'druid'], stats: { agility: 17, stamina: 17, hitChance: 1 }, icon: `${ICON_BASE}/inv_gauntlets_26.jpg`, itemCategory: 'melee' };

export const WRISTGUARDS_OF_STABILITY: GearItem = { id: 'wristguards_of_stability', name: 'Wristguards of Stability', slot: 'wrist', rarity: 'epic', itemLevel: 66, classes: ['rogue', 'druid'], stats: { agility: 16, stamina: 11, hitChance: 1 }, icon: `${ICON_BASE}/inv_bracer_15.jpg`, itemCategory: 'melee' };

export const FIREGUARD_SHOULDERS: GearItem = { id: 'fireguard_shoulders', name: 'Fireguard Shoulders', slot: 'shoulders', rarity: 'epic', itemLevel: 66, classes: ['rogue', 'druid'], stats: { agility: 18, stamina: 17, critChance: 1 }, icon: `${ICON_BASE}/inv_shoulder_01.jpg`, itemCategory: 'melee' };

export const WILD_GROWTH_SPAULDERS: GearItem = { id: 'wild_growth_spaulders', name: 'Wild Growth Spaulders', slot: 'shoulders', rarity: 'epic', itemLevel: 66, classes: ['druid', 'shaman'], stats: { intellect: 13, spirit: 14, stamina: 10, healingPower: 33 }, icon: `${ICON_BASE}/inv_shoulder_08.jpg`, itemCategory: 'healer' };

// Plate
export const MAGMA_TEMPERED_BOOTS: GearItem = { id: 'magma_tempered_boots', name: 'Magma Tempered Boots', slot: 'feet', rarity: 'epic', itemLevel: 66, classes: ['warrior', 'paladin'], stats: { strength: 20, stamina: 20, hitChance: 1 }, icon: `${ICON_BASE}/inv_boots_plate_06.jpg`, itemCategory: 'melee' };

export const FLAMEGUARD_GAUNTLETS: GearItem = { id: 'flameguard_gauntlets', name: 'Flameguard Gauntlets', slot: 'hands', rarity: 'epic', itemLevel: 66, classes: ['warrior', 'paladin'], stats: { strength: 16, stamina: 16, critChance: 1 }, icon: `${ICON_BASE}/inv_gauntlets_26.jpg`, itemCategory: 'melee' };

export const FLAMEWAKER_LEGPLATES: GearItem = { id: 'flamewaker_legplates', name: 'Flamewaker Legplates', slot: 'legs', rarity: 'epic', itemLevel: 66, classes: ['warrior', 'paladin'], stats: { strength: 26, stamina: 18, critChance: 1 }, icon: `${ICON_BASE}/inv_pants_plate_16.jpg`, itemCategory: 'melee' };

// =============================================================================
// MOLTEN CORE - T2 LEGS (Ragnaros drops)
// =============================================================================

// Priest T2 Legs
export const LEGGINGS_OF_TRANSCENDENCE: GearItem = { id: 'leggings_of_transcendence', name: 'Leggings of Transcendence', slot: 'legs', rarity: 'epic', itemLevel: 76, classes: ['priest'], stats: { intellect: 28, spirit: 18, stamina: 18, healingPower: 44 }, icon: `${ICON_BASE}/inv_pants_cloth_05.jpg`, setId: 'transcendence', itemCategory: 'healer' };

// Mage T2 Legs
export const NETHERWIND_PANTS: GearItem = { id: 'netherwind_pants', name: 'Netherwind Pants', slot: 'legs', rarity: 'epic', itemLevel: 76, classes: ['mage'], stats: { intellect: 26, stamina: 17, spellPower: 34, critChance: 1 }, icon: `${ICON_BASE}/inv_pants_cloth_14.jpg`, setId: 'netherwind', itemCategory: 'caster' };

// Warlock T2 Legs
export const NEMESIS_LEGGINGS: GearItem = { id: 'nemesis_leggings', name: 'Nemesis Leggings', slot: 'legs', rarity: 'epic', itemLevel: 76, classes: ['warlock'], stats: { intellect: 25, stamina: 20, spellPower: 32, hitChance: 1 }, icon: `${ICON_BASE}/inv_pants_cloth_09.jpg`, setId: 'nemesis', itemCategory: 'caster' };

// Druid T2 Legs
export const STORMRAGE_LEGGUARDS: GearItem = { id: 'stormrage_legguards', name: 'Stormrage Legguards', slot: 'legs', rarity: 'epic', itemLevel: 76, classes: ['druid'], stats: { intellect: 24, spirit: 18, stamina: 16, healingPower: 40 }, icon: `${ICON_BASE}/inv_pants_mail_08.jpg`, setId: 'stormrage', itemCategory: 'healer' };

// Rogue T2 Legs
export const BLOODFANG_PANTS: GearItem = { id: 'bloodfang_pants', name: 'Bloodfang Pants', slot: 'legs', rarity: 'epic', itemLevel: 76, classes: ['rogue'], stats: { agility: 32, stamina: 22, critChance: 1, hitChance: 1 }, icon: `${ICON_BASE}/inv_pants_leather_03.jpg`, setId: 'bloodfang', itemCategory: 'melee' };

// Hunter T2 Legs
export const DRAGONSTALKER_LEGGUARDS: GearItem = { id: 'dragonstalker_legguards', name: "Dragonstalker's Legguards", slot: 'legs', rarity: 'epic', itemLevel: 76, classes: ['hunter'], stats: { agility: 28, stamina: 20, intellect: 12, critChance: 1 }, icon: `${ICON_BASE}/inv_pants_mail_08.jpg`, setId: 'dragonstalker', itemCategory: 'physical_ranged' };

// Shaman T2 Legs
export const LEGPLATES_OF_TEN_STORMS: GearItem = { id: 'legplates_of_ten_storms', name: 'Legplates of Ten Storms', slot: 'legs', rarity: 'epic', itemLevel: 76, classes: ['shaman'], stats: { intellect: 22, stamina: 18, mp5: 8, healingPower: 37 }, icon: `${ICON_BASE}/inv_pants_mail_10.jpg`, setId: 'ten_storms', itemCategory: 'healer' };

// Warrior T2 Legs
export const LEGPLATES_OF_WRATH: GearItem = { id: 'legplates_of_wrath', name: 'Legplates of Wrath', slot: 'legs', rarity: 'epic', itemLevel: 76, classes: ['warrior'], stats: { strength: 30, stamina: 26, critChance: 1, hitChance: 1 }, icon: `${ICON_BASE}/inv_pants_plate_17.jpg`, setId: 'wrath', itemCategory: 'melee' };

// Paladin T2 Legs
export const JUDGEMENT_LEGPLATES: GearItem = { id: 'judgement_legplates', name: 'Judgement Legplates', slot: 'legs', rarity: 'epic', itemLevel: 76, classes: ['paladin'], stats: { intellect: 20, stamina: 22, strength: 10, healingPower: 35 }, icon: `${ICON_BASE}/inv_pants_plate_12.jpg`, setId: 'judgement', itemCategory: 'healer' };

// Crown of Destruction - Hunter head from Ragnaros
export const CROWN_OF_DESTRUCTION: GearItem = { id: 'crown_of_destruction', name: 'Crown of Destruction', slot: 'head', rarity: 'epic', itemLevel: 74, classes: ['hunter', 'shaman'], stats: { agility: 19, stamina: 18, intellect: 10, critChance: 1 }, icon: `${ICON_BASE}/inv_helmet_49.jpg`, itemCategory: 'physical_ranged' };

// =============================================================================
// MOLTEN CORE - MISSING ARMOR
// =============================================================================

export const ONSLAUGHT_GIRDLE: GearItem = {
  id: 'onslaught_girdle',
  name: 'Onslaught Girdle',
  slot: 'waist',
  rarity: 'epic',
  itemLevel: 78,
  classes: ['warrior', 'paladin'],
  stats: { strength: 31, stamina: 11, critChance: 1, hitChance: 1 },
  icon: `${ICON_BASE}/inv_belt_13.jpg`,
  itemCategory: 'melee',
};

export const SASH_OF_WHISPERED_SECRETS: GearItem = {
  id: 'sash_of_whispered_secrets',
  name: 'Sash of Whispered Secrets',
  slot: 'waist',
  rarity: 'epic',
  itemLevel: 70,
  classes: ['mage', 'warlock', 'priest'],
  stats: { intellect: 14, stamina: 12, spellPower: 26, hitChance: 1 },
  icon: `${ICON_BASE}/inv_belt_23.jpg`,
  itemCategory: 'caster',
};

export const GLOVES_OF_THE_HYPNOTIC_FLAME: GearItem = {
  id: 'gloves_of_the_hypnotic_flame',
  name: 'Gloves of the Hypnotic Flame',
  slot: 'hands',
  rarity: 'epic',
  itemLevel: 70,
  classes: ['mage', 'warlock', 'priest'],
  stats: { intellect: 18, stamina: 9, spellPower: 30 },
  icon: `${ICON_BASE}/inv_gauntlets_17.jpg`,
  itemCategory: 'caster',
};

// =============================================================================
// MOLTEN CORE - SHIELDS
// =============================================================================

// Healer Shield - Ragnaros
export const MALISTARS_DEFENDER: GearItem = {
  id: 'malistars_defender',
  name: "Malistar's Defender",
  slot: 'offhand',
  rarity: 'epic',
  itemLevel: 75,
  classes: ['paladin', 'shaman'],
  stats: { stamina: 9, intellect: 12, mp5: 9 },
  icon: `${ICON_BASE}/inv_shield_17.jpg`,
  weaponType: 'offhand_only',
  itemCategory: 'healer',
};

// Tank Shield - Garr
export const DRILLBORER_DISK: GearItem = {
  id: 'drillborer_disk',
  name: 'Drillborer Disk',
  slot: 'offhand',
  rarity: 'epic',
  itemLevel: 67,
  classes: ['warrior', 'paladin'],
  stats: { stamina: 10 },
  icon: `${ICON_BASE}/inv_shield_03.jpg`,
  weaponType: 'offhand_only',
  itemCategory: 'melee',
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
};

export const STAFF_OF_DOMINANCE: GearItem = {
  id: 'staff_of_dominance',
  name: 'Staff of Dominance',
  slot: 'weapon',
  rarity: 'epic',
  itemLevel: 68,
  classes: ['druid', 'mage', 'priest', 'shaman', 'warlock'], // Staves - NOT Paladin/Rogue
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
  classes: ['mage', 'warlock', 'priest'],
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
  classes: ['mage', 'warlock', 'priest', 'druid', 'shaman', 'rogue', 'warrior', 'hunter'],
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
  setId: 'might', itemCategory: 'melee',
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
  setId: 'might', itemCategory: 'melee',
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
  setId: 'might', itemCategory: 'melee',
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
  setId: 'might', itemCategory: 'melee',
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
  setId: 'might', itemCategory: 'melee',
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
  setId: 'might', itemCategory: 'melee',
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
  setId: 'might', itemCategory: 'melee',
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
  setId: 'might', itemCategory: 'melee',
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
  setId: 'giantstalker', itemCategory: 'physical_ranged',
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
  setId: 'giantstalker', itemCategory: 'physical_ranged',
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
  setId: 'giantstalker', itemCategory: 'physical_ranged',
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
  setId: 'giantstalker', itemCategory: 'physical_ranged',
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
  setId: 'giantstalker', itemCategory: 'physical_ranged',
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
  setId: 'giantstalker', itemCategory: 'physical_ranged',
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
  setId: 'giantstalker', itemCategory: 'physical_ranged',
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
  setId: 'giantstalker', itemCategory: 'physical_ranged',
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
  setId: 'arcanist', itemCategory: 'caster',
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
  setId: 'arcanist', itemCategory: 'caster',
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
  setId: 'arcanist', itemCategory: 'caster',
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
  setId: 'arcanist', itemCategory: 'caster',
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
  setId: 'arcanist', itemCategory: 'caster',
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
  setId: 'arcanist', itemCategory: 'caster',
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
  setId: 'arcanist', itemCategory: 'caster',
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
  setId: 'arcanist', itemCategory: 'caster',
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
  setId: 'nightslayer', itemCategory: 'melee',
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
  setId: 'nightslayer', itemCategory: 'melee',
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
  setId: 'nightslayer', itemCategory: 'melee',
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
  setId: 'nightslayer', itemCategory: 'melee',
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
  setId: 'nightslayer', itemCategory: 'melee',
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
  setId: 'nightslayer', itemCategory: 'melee',
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
  setId: 'nightslayer', itemCategory: 'melee',
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
  setId: 'nightslayer', itemCategory: 'melee',
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
  setId: 'felheart', itemCategory: 'caster',
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
  setId: 'felheart', itemCategory: 'caster',
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
  setId: 'felheart', itemCategory: 'caster',
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
  setId: 'felheart', itemCategory: 'caster',
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
  setId: 'felheart', itemCategory: 'caster',
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
  setId: 'felheart', itemCategory: 'caster',
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
  setId: 'felheart', itemCategory: 'caster',
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
  setId: 'felheart', itemCategory: 'caster',
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
  setId: 'earthfury', itemCategory: 'healer',
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
  setId: 'earthfury', itemCategory: 'healer',
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
  setId: 'earthfury', itemCategory: 'healer',
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
  setId: 'earthfury', itemCategory: 'healer',
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
  setId: 'earthfury', itemCategory: 'healer',
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
  setId: 'earthfury', itemCategory: 'healer',
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
  setId: 'earthfury', itemCategory: 'healer',
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
  setId: 'earthfury', itemCategory: 'healer',
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
};

export const ANCIENT_CORNERSTONE_GRIMOIRE: GearItem = {
  id: 'ancient_cornerstone_grimoire',
  name: 'Ancient Cornerstone Grimoire',
  slot: 'offhand',
  rarity: 'epic',
  itemLevel: 71,
  classes: ['mage', 'warlock', 'priest'],
  stats: { stamina: 10, intellect: 11, spellPower: 32, mp5: 4 },
  icon: `${ICON_BASE}/inv_misc_book_09.jpg`,
  weaponType: 'offhand_only',
};

export const SAPPHIRON_DRAPE: GearItem = {
  id: 'sapphiron_drape',
  name: 'Sapphiron Drape',
  slot: 'back',
  rarity: 'epic',
  itemLevel: 71,
  classes: ['all'],
  stats: { stamina: 10, intellect: 8, spellPower: 18, mp5: 3 },
  icon: `${ICON_BASE}/inv_misc_cape_21.jpg`,
};

export const RING_OF_BINDING: GearItem = {
  id: 'ring_of_binding',
  name: 'Ring of Binding',
  slot: 'ring1',
  rarity: 'epic',
  itemLevel: 71,
  classes: ['all'],
  stats: { stamina: 12, intellect: 10, spirit: 5, spellPower: 14 },
  icon: `${ICON_BASE}/inv_jewelry_ring_17.jpg`,
};

// Onyxia Tooth Pendant doesn't exist in Vanilla - replacing with Eskhandar's Collar
export const ESKHANDARS_COLLAR: GearItem = {
  id: 'eskhandars_collar',
  name: "Eskhandar's Collar",
  slot: 'neck',
  rarity: 'epic',
  itemLevel: 71,
  classes: ['warrior', 'rogue', 'paladin', 'hunter'],
  stats: { strength: 12, agility: 9, stamina: 8 },
  icon: `${ICON_BASE}/inv_jewelry_necklace_10.jpg`,
};

// Shard of the Scale - Onyxia Trinket
export const SHARD_OF_THE_SCALE: GearItem = {
  id: 'shard_of_the_scale',
  name: 'Shard of the Scale',
  slot: 'trinket1',
  rarity: 'epic',
  itemLevel: 71,
  classes: ['paladin', 'priest', 'druid', 'shaman'],
  stats: { mp5: 16 },
  icon: `${ICON_BASE}/inv_misc_gem_pearl_05.jpg`,
};

// =============================================================================
// ONYXIA QUEST REWARDS - From turning in Head of Onyxia
// =============================================================================

export const DRAGONSLAYERS_SIGNET: GearItem = {
  id: 'dragonslayers_signet',
  name: "Dragonslayer's Signet",
  slot: 'ring1',
  rarity: 'epic',
  itemLevel: 60,
  classes: ['all'],
  stats: { stamina: 12, critChance: 1, hitChance: 1 },
  icon: `${ICON_BASE}/inv_jewelry_ring_40.jpg`,
  itemCategory: 'melee',
};

export const ONYXIA_BLOOD_TALISMAN: GearItem = {
  id: 'onyxia_blood_talisman',
  name: 'Onyxia Blood Talisman',
  slot: 'trinket1',
  rarity: 'epic',
  itemLevel: 60,
  classes: ['all'],
  stats: { stamina: 15 },
  icon: `${ICON_BASE}/inv_jewelry_talisman_11.jpg`,
  itemCategory: 'melee', // Proc is fire damage on hit
};

export const ONYXIA_TOOTH_PENDANT: GearItem = {
  id: 'onyxia_tooth_pendant',
  name: 'Onyxia Tooth Pendant',
  slot: 'neck',
  rarity: 'epic',
  itemLevel: 60,
  classes: ['all'],
  stats: { stamina: 9, agility: 12, hitChance: 1 },
  icon: `${ICON_BASE}/inv_jewelry_necklace_11.jpg`,
  itemCategory: 'melee',
};

// =============================================================================
// NEFARIAN QUEST REWARDS - From turning in Head of Nefarian
// =============================================================================

export const MASTER_DRAGONSLAYERS_MEDALLION: GearItem = {
  id: 'master_dragonslayers_medallion',
  name: "Master Dragonslayer's Medallion",
  slot: 'neck',
  rarity: 'epic',
  itemLevel: 83,
  classes: ['all'],
  stats: { agility: 14, stamina: 24 }, // +7 defense as equip effect (not modeled)
  icon: `${ICON_BASE}/inv_jewelry_necklace_18.jpg`,
  itemCategory: 'melee', // BiS for Feral Druids, Hunters, Rogues, Prot Warriors
};

export const MASTER_DRAGONSLAYERS_ORB: GearItem = {
  id: 'master_dragonslayers_orb',
  name: "Master Dragonslayer's Orb",
  slot: 'trinket1',
  rarity: 'epic',
  itemLevel: 83,
  classes: ['all'],
  stats: { stamina: 14, spellPower: 28, healingPower: 28 },
  icon: `${ICON_BASE}/inv_misc_orb_03.jpg`,
  itemCategory: 'caster',
};

export const MASTER_DRAGONSLAYERS_RING: GearItem = {
  id: 'master_dragonslayers_ring',
  name: "Master Dragonslayer's Ring",
  slot: 'ring1',
  rarity: 'epic',
  itemLevel: 83,
  classes: ['all'],
  stats: { stamina: 14, hitChance: 1 }, // +48 AP as equip effect (not modeled as stat)
  icon: `${ICON_BASE}/inv_jewelry_ring_51naxxramas.jpg`,
  itemCategory: 'melee',
};

// =============================================================================
// BLACKWING LAIR - TIER 2 SETS
// =============================================================================

// PALADIN TIER 2 - JUDGMENT ARMOR
export const JUDGMENT_BINDINGS: GearItem = { id: 'judgment_bindings', name: 'Judgment Bindings', slot: 'wrist', rarity: 'epic', itemLevel: 76, classes: ['paladin'], stats: { intellect: 14, stamina: 13, healingPower: 20, mp5: 4 }, icon: `${ICON_BASE}/inv_bracer_17.jpg`, setId: 'judgment', itemCategory: 'healer' };
export const JUDGMENT_BELT: GearItem = { id: 'judgment_belt', name: 'Judgment Belt', slot: 'waist', rarity: 'epic', itemLevel: 76, classes: ['paladin'], stats: { intellect: 17, stamina: 15, healingPower: 24, mp5: 5 }, icon: `${ICON_BASE}/inv_belt_02.jpg`, setId: 'judgment', itemCategory: 'healer' };
export const JUDGMENT_SABATONS: GearItem = { id: 'judgment_sabatons', name: 'Judgment Sabatons', slot: 'feet', rarity: 'epic', itemLevel: 76, classes: ['paladin'], stats: { intellect: 19, stamina: 17, healingPower: 28, mp5: 5 }, icon: `${ICON_BASE}/inv_boots_chain_03.jpg`, setId: 'judgment', itemCategory: 'healer' };
export const JUDGMENT_GAUNTLETS: GearItem = { id: 'judgment_gauntlets', name: 'Judgment Gauntlets', slot: 'hands', rarity: 'epic', itemLevel: 76, classes: ['paladin'], stats: { intellect: 17, stamina: 15, healingPower: 26, mp5: 4 }, icon: `${ICON_BASE}/inv_gauntlets_30.jpg`, setId: 'judgment', itemCategory: 'healer' };
export const JUDGMENT_SPAULDERS: GearItem = { id: 'judgment_spaulders', name: 'Judgment Spaulders', slot: 'shoulders', rarity: 'epic', itemLevel: 76, classes: ['paladin'], stats: { intellect: 21, stamina: 19, healingPower: 31, mp5: 6 }, icon: `${ICON_BASE}/inv_shoulder_37.jpg`, setId: 'judgment', itemCategory: 'healer' };
export const JUDGMENT_BREASTPLATE: GearItem = { id: 'judgment_breastplate', name: 'Judgment Breastplate', slot: 'chest', rarity: 'epic', itemLevel: 76, classes: ['paladin'], stats: { intellect: 26, stamina: 24, healingPower: 40, mp5: 8 }, icon: `${ICON_BASE}/inv_chest_plate06.jpg`, setId: 'judgment', itemCategory: 'healer' };

// PRIEST TIER 2 - VESTMENTS OF TRANSCENDENCE
export const BINDINGS_OF_TRANSCENDENCE: GearItem = { id: 'bindings_of_transcendence', name: 'Bindings of Transcendence', slot: 'wrist', rarity: 'epic', itemLevel: 76, classes: ['priest'], stats: { intellect: 15, stamina: 14, healingPower: 22 }, icon: `${ICON_BASE}/inv_bracer_18.jpg`, setId: 'transcendence', itemCategory: 'healer' };
export const BELT_OF_TRANSCENDENCE: GearItem = { id: 'belt_of_transcendence', name: 'Belt of Transcendence', slot: 'waist', rarity: 'epic', itemLevel: 76, classes: ['priest'], stats: { intellect: 18, stamina: 16, healingPower: 28 }, icon: `${ICON_BASE}/inv_belt_22.jpg`, setId: 'transcendence', itemCategory: 'healer' };
export const BOOTS_OF_TRANSCENDENCE: GearItem = { id: 'boots_of_transcendence', name: 'Boots of Transcendence', slot: 'feet', rarity: 'epic', itemLevel: 76, classes: ['priest'], stats: { intellect: 20, stamina: 18, healingPower: 31 }, icon: `${ICON_BASE}/inv_boots_cloth_04.jpg`, setId: 'transcendence', itemCategory: 'healer' };
export const HANDGUARDS_OF_TRANSCENDENCE: GearItem = { id: 'handguards_of_transcendence', name: 'Handguards of Transcendence', slot: 'hands', rarity: 'epic', itemLevel: 76, classes: ['priest'], stats: { intellect: 18, stamina: 16, healingPower: 29 }, icon: `${ICON_BASE}/inv_gauntlets_14.jpg`, setId: 'transcendence', itemCategory: 'healer' };
export const PAULDRONS_OF_TRANSCENDENCE: GearItem = { id: 'pauldrons_of_transcendence', name: 'Pauldrons of Transcendence', slot: 'shoulders', rarity: 'epic', itemLevel: 76, classes: ['priest'], stats: { intellect: 22, stamina: 20, healingPower: 35 }, icon: `${ICON_BASE}/inv_shoulder_02.jpg`, setId: 'transcendence', itemCategory: 'healer' };
export const ROBES_OF_TRANSCENDENCE: GearItem = { id: 'robes_of_transcendence', name: 'Robes of Transcendence', slot: 'chest', rarity: 'epic', itemLevel: 76, classes: ['priest'], stats: { intellect: 28, stamina: 25, healingPower: 44, mp5: 6 }, icon: `${ICON_BASE}/inv_chest_cloth_46.jpg`, setId: 'transcendence', itemCategory: 'healer' };

// DRUID TIER 2 - STORMRAGE RAIMENT
export const STORMRAGE_BRACERS: GearItem = { id: 'stormrage_bracers', name: 'Stormrage Bracers', slot: 'wrist', rarity: 'epic', itemLevel: 76, classes: ['druid'], stats: { intellect: 14, stamina: 12, spirit: 5, healingPower: 20 }, icon: `${ICON_BASE}/inv_bracer_03.jpg`, setId: 'stormrage', itemCategory: 'healer' };
export const STORMRAGE_BELT: GearItem = { id: 'stormrage_belt', name: 'Stormrage Belt', slot: 'waist', rarity: 'epic', itemLevel: 76, classes: ['druid'], stats: { intellect: 17, stamina: 14, healingPower: 26, mp5: 4 }, icon: `${ICON_BASE}/inv_belt_06.jpg`, setId: 'stormrage', itemCategory: 'healer' };
export const STORMRAGE_BOOTS: GearItem = { id: 'stormrage_boots', name: 'Stormrage Boots', slot: 'feet', rarity: 'epic', itemLevel: 76, classes: ['druid'], stats: { intellect: 19, stamina: 16, spirit: 7, healingPower: 29 }, icon: `${ICON_BASE}/inv_boots_cloth_08.jpg`, setId: 'stormrage', itemCategory: 'healer' };
export const STORMRAGE_HANDGUARDS: GearItem = { id: 'stormrage_handguards', name: 'Stormrage Handguards', slot: 'hands', rarity: 'epic', itemLevel: 76, classes: ['druid'], stats: { intellect: 17, stamina: 14, spirit: 7, healingPower: 26 }, icon: `${ICON_BASE}/inv_gauntlets_25.jpg`, setId: 'stormrage', itemCategory: 'healer' };
export const STORMRAGE_PAULDRONS: GearItem = { id: 'stormrage_pauldrons', name: 'Stormrage Pauldrons', slot: 'shoulders', rarity: 'epic', itemLevel: 76, classes: ['druid'], stats: { intellect: 21, stamina: 18, spirit: 9, healingPower: 33 }, icon: `${ICON_BASE}/inv_shoulder_06.jpg`, setId: 'stormrage', itemCategory: 'healer' };
export const STORMRAGE_CHESTGUARD: GearItem = { id: 'stormrage_chestguard', name: 'Stormrage Chestguard', slot: 'chest', rarity: 'epic', itemLevel: 76, classes: ['druid'], stats: { intellect: 26, stamina: 22, spirit: 12, healingPower: 42 }, icon: `${ICON_BASE}/inv_chest_leather_03.jpg`, setId: 'stormrage', itemCategory: 'healer' };

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

// SHAMAN TIER 2 - TEN STORMS (BWL pieces - Helm from Onyxia, Legs from Ragnaros)
export const BRACERS_OF_TEN_STORMS: GearItem = { id: 'bracers_of_ten_storms', name: 'Bracers of Ten Storms', slot: 'wrist', rarity: 'epic', itemLevel: 76, classes: ['shaman'], stats: { intellect: 13, stamina: 12, spirit: 5, healingPower: 18, mp5: 3 }, icon: `${ICON_BASE}/inv_bracer_02.jpg`, setId: 'ten_storms', itemCategory: 'healer' };
export const BELT_OF_TEN_STORMS: GearItem = { id: 'belt_of_ten_storms', name: 'Belt of Ten Storms', slot: 'waist', rarity: 'epic', itemLevel: 76, classes: ['shaman'], stats: { intellect: 16, stamina: 14, healingPower: 24, mp5: 5 }, icon: `${ICON_BASE}/inv_belt_29.jpg`, setId: 'ten_storms', itemCategory: 'healer' };
export const GREAVES_OF_TEN_STORMS: GearItem = { id: 'greaves_of_ten_storms', name: 'Greaves of Ten Storms', slot: 'feet', rarity: 'epic', itemLevel: 76, classes: ['shaman'], stats: { intellect: 18, stamina: 16, spirit: 6, healingPower: 26, mp5: 4 }, icon: `${ICON_BASE}/inv_boots_chain_08.jpg`, setId: 'ten_storms', itemCategory: 'healer' };
export const GAUNTLETS_OF_TEN_STORMS: GearItem = { id: 'gauntlets_of_ten_storms', name: 'Gauntlets of Ten Storms', slot: 'hands', rarity: 'epic', itemLevel: 76, classes: ['shaman'], stats: { intellect: 16, stamina: 14, healingPower: 24, mp5: 4 }, icon: `${ICON_BASE}/inv_gauntlets_11.jpg`, setId: 'ten_storms', itemCategory: 'healer' };
export const EPAULETS_OF_TEN_STORMS: GearItem = { id: 'epaulets_of_ten_storms', name: 'Epaulets of Ten Storms', slot: 'shoulders', rarity: 'epic', itemLevel: 76, classes: ['shaman'], stats: { intellect: 20, stamina: 18, spirit: 8, healingPower: 29, mp5: 5 }, icon: `${ICON_BASE}/inv_shoulder_29.jpg`, setId: 'ten_storms', itemCategory: 'healer' };
export const BREASTPLATE_OF_TEN_STORMS: GearItem = { id: 'breastplate_of_ten_storms', name: 'Breastplate of Ten Storms', slot: 'chest', rarity: 'epic', itemLevel: 76, classes: ['shaman'], stats: { intellect: 25, stamina: 22, spirit: 10, healingPower: 37, mp5: 7 }, icon: `${ICON_BASE}/inv_chest_chain_15.jpg`, setId: 'ten_storms', itemCategory: 'healer' };

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
export const SHADOW_WING_FOCUS_STAFF: GearItem = { id: 'shadow_wing_focus_staff', name: 'Shadow Wing Focus Staff', slot: 'weapon', rarity: 'epic', itemLevel: 77, classes: ['druid', 'mage', 'priest', 'shaman', 'warlock'], stats: { intellect: 22, stamina: 18, spellPower: 68 }, icon: `${ICON_BASE}/inv_staff_37.jpg`, weaponType: 'two_hand', itemCategory: 'caster' };
export const STAFF_OF_THE_SHADOW_FLAME: GearItem = { id: 'staff_of_the_shadow_flame', name: 'Staff of the Shadow Flame', slot: 'weapon', rarity: 'epic', itemLevel: 83, classes: ['druid', 'mage', 'priest', 'shaman', 'warlock'], stats: { intellect: 28, stamina: 20, spellPower: 84 }, icon: `${ICON_BASE}/inv_staff_30.jpg`, weaponType: 'two_hand', itemCategory: 'caster' };
export const LOK_AMIR: GearItem = { id: 'lok_amir', name: "Lok'amir il Romathis", slot: 'weapon', rarity: 'epic', itemLevel: 81, classes: ['paladin', 'priest', 'druid'], stats: { intellect: 18, stamina: 12, healingPower: 84 }, icon: `${ICON_BASE}/inv_mace_15.jpg`, weaponType: 'one_hand', itemCategory: 'healer' };

// Weapons - Ranged
export const HEARTSTRIKER: GearItem = { id: 'heartstriker', name: 'Heartstriker', slot: 'ranged', rarity: 'epic', itemLevel: 77, classes: ['hunter'], stats: { agility: 14, stamina: 7, critChance: 1 }, icon: `${ICON_BASE}/inv_weapon_bow_08.jpg`, weaponType: 'ranged', relicType: 'bow', itemCategory: 'physical_ranged' };
export const ASHJRETHUL: GearItem = { id: 'ashjrethul', name: "Ashjre'thul, Crossbow of Smiting", slot: 'ranged', rarity: 'epic', itemLevel: 78, classes: ['hunter'], stats: { agility: 17, stamina: 8, critChance: 1 }, icon: `${ICON_BASE}/inv_weapon_crossbow_05.jpg`, weaponType: 'ranged', relicType: 'crossbow', itemCategory: 'physical_ranged' };
export const DRAGONBREATH_HAND_CANNON: GearItem = { id: 'dragonbreath_hand_cannon', name: 'Dragonbreath Hand Cannon', slot: 'ranged', rarity: 'epic', itemLevel: 77, classes: ['hunter', 'warrior', 'rogue'], stats: { agility: 7, stamina: 14, critChance: 1 }, icon: `${ICON_BASE}/inv_weapon_rifle_04.jpg`, weaponType: 'ranged', relicType: 'gun', itemCategory: 'physical_ranged' };

// BWL Missing Weapons - Melee
export const CLAW_OF_CHROMAGGUS: GearItem = { id: 'claw_of_chromaggus', name: 'Claw of Chromaggus', slot: 'weapon', rarity: 'epic', itemLevel: 78, classes: ['warrior', 'rogue'], stats: { agility: 14, stamina: 8, critChance: 1, hitChance: 1 }, icon: `${ICON_BASE}/inv_weapon_shortblade_22.jpg`, weaponType: 'one_hand', itemCategory: 'melee' };
export const CLAW_OF_THE_BLACK_DRAKE: GearItem = { id: 'claw_of_the_black_drake', name: 'Claw of the Black Drake', slot: 'weapon', rarity: 'epic', itemLevel: 77, classes: ['warrior', 'rogue', 'hunter', 'shaman'], stats: { agility: 13, stamina: 10, strength: 5 }, icon: `${ICON_BASE}/inv_weapon_hand_05.jpg`, weaponType: 'one_hand', itemCategory: 'melee' };
export const HERALD_OF_WOE: GearItem = { id: 'herald_of_woe', name: 'Herald of Woe', slot: 'weapon', rarity: 'epic', itemLevel: 77, classes: ['warrior', 'paladin', 'shaman'], stats: { strength: 25, stamina: 18, critChance: 1 }, icon: `${ICON_BASE}/inv_hammer_11.jpg`, weaponType: 'two_hand', itemCategory: 'melee' };
export const SPINESHATTER: GearItem = { id: 'spineshatter', name: 'Spineshatter', slot: 'weapon', rarity: 'epic', itemLevel: 72, classes: ['warrior', 'paladin', 'shaman'], stats: { strength: 12, stamina: 15, spirit: 8 }, icon: `${ICON_BASE}/inv_mace_04.jpg`, weaponType: 'one_hand', itemCategory: 'melee' };

// BWL Missing Weapons - Wand
export const DRAGONS_TOUCH: GearItem = { id: 'dragons_touch', name: "Dragon's Touch", slot: 'ranged', rarity: 'epic', itemLevel: 77, classes: ['mage', 'warlock', 'priest'], stats: { intellect: 7, stamina: 6, spellPower: 26 }, icon: `${ICON_BASE}/inv_wand_04.jpg`, weaponType: 'ranged', relicType: 'wand', itemCategory: 'caster' };

// BWL Missing Shields
export const ELEMENTIUM_REINFORCED_BULWARK: GearItem = { id: 'elementium_reinforced_bulwark', name: 'Elementium Reinforced Bulwark', slot: 'offhand', rarity: 'epic', itemLevel: 78, classes: ['warrior', 'paladin'], stats: { stamina: 23, strength: 7 }, icon: `${ICON_BASE}/inv_shield_22.jpg`, weaponType: 'offhand_only', itemCategory: 'melee' };

// =============================================================================
// BLACKWING LAIR - ACCESSORIES (Necklaces, Cloaks, Rings, Trinkets)
// =============================================================================

// BWL Necklaces
export const PENDANT_OF_THE_FALLEN_DRAGON: GearItem = { id: 'pendant_of_the_fallen_dragon', name: 'Pendant of the Fallen Dragon', slot: 'neck', rarity: 'epic', itemLevel: 77, classes: ['paladin', 'priest', 'druid', 'shaman'], stats: { intellect: 12, stamina: 9, mp5: 9 }, icon: `${ICON_BASE}/inv_jewelry_necklace_12.jpg`, itemCategory: 'healer' };
export const PRESTORS_TALISMAN_OF_CONNIVERY: GearItem = { id: 'prestors_talisman_of_connivery', name: "Prestor's Talisman of Connivery", slot: 'neck', rarity: 'epic', itemLevel: 77, classes: ['all'], stats: { agility: 30, hitChance: 1 }, icon: `${ICON_BASE}/inv_jewelry_necklace_13.jpg`, itemCategory: 'melee' };

// BWL Cloaks
export const ELEMENTIUM_THREADED_CLOAK: GearItem = { id: 'elementium_threaded_cloak', name: 'Elementium Threaded Cloak', slot: 'back', rarity: 'epic', itemLevel: 77, classes: ['all'], stats: { stamina: 15, agility: 8 }, icon: `${ICON_BASE}/inv_misc_cape_17.jpg`, itemCategory: 'melee' };
export const SHROUD_OF_PURE_THOUGHT: GearItem = { id: 'shroud_of_pure_thought', name: 'Shroud of Pure Thought', slot: 'back', rarity: 'epic', itemLevel: 77, classes: ['all'], stats: { intellect: 10, spirit: 8, healingPower: 33 }, icon: `${ICON_BASE}/inv_misc_cape_21.jpg`, itemCategory: 'healer' };
export const CLOAK_OF_FIREMAW: GearItem = { id: 'cloak_of_firemaw', name: 'Cloak of Firemaw', slot: 'back', rarity: 'epic', itemLevel: 77, classes: ['all'], stats: { intellect: 11, stamina: 7, spellPower: 27 }, icon: `${ICON_BASE}/inv_misc_cape_19.jpg`, itemCategory: 'caster' };
export const CLOAK_OF_THE_BROOD_LORD: GearItem = { id: 'cloak_of_the_brood_lord', name: 'Cloak of the Brood Lord', slot: 'back', rarity: 'epic', itemLevel: 81, classes: ['all'], stats: { intellect: 14, stamina: 10, spellPower: 28 }, icon: `${ICON_BASE}/inv_misc_cape_18.jpg`, itemCategory: 'caster' };

// BWL Rings
export const RING_OF_BLACKROCK: GearItem = { id: 'ring_of_blackrock', name: 'Ring of Blackrock', slot: 'ring1', rarity: 'epic', itemLevel: 77, classes: ['all'], stats: { intellect: 12, stamina: 8, spellPower: 20 }, icon: `${ICON_BASE}/inv_jewelry_ring_15.jpg`, itemCategory: 'caster' };
export const BAND_OF_FORCED_CONCENTRATION: GearItem = { id: 'band_of_forced_concentration', name: 'Band of Forced Concentration', slot: 'ring1', rarity: 'epic', itemLevel: 77, classes: ['all'], stats: { intellect: 12, stamina: 10, spellPower: 21, hitChance: 1 }, icon: `${ICON_BASE}/inv_jewelry_ring_24.jpg`, itemCategory: 'caster' };
export const CIRCLE_OF_APPLIED_FORCE: GearItem = { id: 'circle_of_applied_force', name: 'Circle of Applied Force', slot: 'ring1', rarity: 'epic', itemLevel: 77, classes: ['all'], stats: { strength: 12, agility: 22, stamina: 9 }, icon: `${ICON_BASE}/inv_jewelry_ring_22.jpg`, itemCategory: 'melee' };
export const PURE_ELEMENTIUM_BAND: GearItem = { id: 'pure_elementium_band', name: 'Pure Elementium Band', slot: 'ring1', rarity: 'epic', itemLevel: 81, classes: ['all'], stats: { intellect: 14, stamina: 10, spellPower: 27 }, icon: `${ICON_BASE}/inv_jewelry_ring_25.jpg`, itemCategory: 'caster' };
export const ARCHIMTIROS_RING_OF_RECKONING: GearItem = { id: 'archimtiros_ring_of_reckoning', name: "Archimtiros' Ring of Reckoning", slot: 'ring1', rarity: 'epic', itemLevel: 81, classes: ['warrior', 'paladin'], stats: { stamina: 16, strength: 14 }, icon: `${ICON_BASE}/inv_jewelry_ring_21.jpg`, itemCategory: 'melee' };

// BWL Trinkets - All Class
export const DRAKE_FANG_TALISMAN: GearItem = { id: 'drake_fang_talisman', name: 'Drake Fang Talisman', slot: 'trinket1', rarity: 'epic', itemLevel: 77, classes: ['warrior', 'rogue', 'hunter', 'paladin'], stats: { hitChance: 2 }, icon: `${ICON_BASE}/inv_jewelry_talisman_03.jpg`, itemCategory: 'melee' };
export const NELTHARIONS_TEAR: GearItem = { id: 'neltharions_tear', name: "Neltharion's Tear", slot: 'trinket1', rarity: 'epic', itemLevel: 83, classes: ['all'], stats: { spellPower: 44, hitChance: 2 }, icon: `${ICON_BASE}/inv_jewelry_talisman_06.jpg`, itemCategory: 'caster' };
export const REJUVENATING_GEM: GearItem = { id: 'rejuvenating_gem', name: 'Rejuvenating Gem', slot: 'trinket1', rarity: 'epic', itemLevel: 77, classes: ['paladin', 'priest', 'druid', 'shaman'], stats: { mp5: 9, healingPower: 66 }, icon: `${ICON_BASE}/inv_jewelry_talisman_02.jpg`, itemCategory: 'healer' };
export const STYLEENS_IMPEDING_SCARAB: GearItem = { id: 'styleens_impeding_scarab', name: "Styleen's Impeding Scarab", slot: 'trinket1', rarity: 'epic', itemLevel: 77, classes: ['warrior', 'paladin'], stats: { stamina: 12 }, icon: `${ICON_BASE}/inv_scarab_gold.jpg`, itemCategory: 'melee' };

// BWL Trinkets - Class Specific
export const AEGIS_OF_PRESERVATION: GearItem = { id: 'aegis_of_preservation', name: 'Aegis of Preservation', slot: 'trinket1', rarity: 'epic', itemLevel: 77, classes: ['priest'], stats: { stamina: 10 }, icon: `${ICON_BASE}/inv_misc_gem_pearl_02.jpg`, itemCategory: 'healer' };
export const ARCANE_INFUSED_GEM: GearItem = { id: 'arcane_infused_gem', name: 'Arcane Infused Gem', slot: 'trinket1', rarity: 'epic', itemLevel: 77, classes: ['hunter'], stats: { stamina: 10 }, icon: `${ICON_BASE}/inv_misc_gem_01.jpg`, itemCategory: 'physical_ranged' };
export const LIFEGIVING_GEM: GearItem = { id: 'lifegiving_gem', name: 'Lifegiving Gem', slot: 'trinket1', rarity: 'epic', itemLevel: 77, classes: ['warrior'], stats: { stamina: 15 }, icon: `${ICON_BASE}/inv_misc_gem_ruby_02.jpg`, itemCategory: 'melee' };
export const MIND_QUICKENING_GEM: GearItem = { id: 'mind_quickening_gem', name: 'Mind Quickening Gem', slot: 'trinket1', rarity: 'epic', itemLevel: 77, classes: ['mage'], stats: { stamina: 10, intellect: 6 }, icon: `${ICON_BASE}/inv_misc_gem_sapphire_02.jpg`, itemCategory: 'caster' };
export const NATURAL_ALIGNMENT_CRYSTAL: GearItem = { id: 'natural_alignment_crystal', name: 'Natural Alignment Crystal', slot: 'trinket1', rarity: 'epic', itemLevel: 77, classes: ['shaman'], stats: { stamina: 10 }, icon: `${ICON_BASE}/inv_misc_gem_emerald_01.jpg`, itemCategory: 'healer' };
export const RUNE_OF_METAMORPHOSIS: GearItem = { id: 'rune_of_metamorphosis', name: 'Rune of Metamorphosis', slot: 'trinket1', rarity: 'epic', itemLevel: 77, classes: ['druid'], stats: { stamina: 10, intellect: 6 }, icon: `${ICON_BASE}/spell_nature_crystalball.jpg`, itemCategory: 'healer' };
export const SCROLLS_OF_BLINDING_LIGHT_TRINKET: GearItem = { id: 'scrolls_of_blinding_light_trinket', name: 'Scrolls of Blinding Light', slot: 'trinket1', rarity: 'epic', itemLevel: 77, classes: ['paladin'], stats: { stamina: 10 }, icon: `${ICON_BASE}/inv_scroll_02.jpg`, itemCategory: 'healer' };
export const THE_BLACK_BOOK: GearItem = { id: 'the_black_book', name: 'The Black Book', slot: 'trinket1', rarity: 'epic', itemLevel: 77, classes: ['warlock'], stats: { stamina: 10 }, icon: `${ICON_BASE}/inv_misc_book_08.jpg`, itemCategory: 'caster' };
export const VENOMOUS_TOTEM: GearItem = { id: 'venomous_totem', name: 'Venomous Totem', slot: 'trinket1', rarity: 'epic', itemLevel: 77, classes: ['rogue'], stats: { agility: 8 }, icon: `${ICON_BASE}/inv_misc_idol_03.jpg`, itemCategory: 'melee' };

// BWL Shoulders (actual shoulder items)
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

// Additional BWL Non-Set Armor - Cloth
export const BLACK_ASH_ROBE: GearItem = { id: 'black_ash_robe', name: 'Black Ash Robe', slot: 'chest', rarity: 'epic', itemLevel: 77, classes: ['mage', 'warlock', 'priest'], stats: { intellect: 22, stamina: 15, spellPower: 46 }, icon: `${ICON_BASE}/inv_chest_cloth_45.jpg`, itemCategory: 'caster' };
export const BOOTS_OF_PURE_THOUGHT: GearItem = { id: 'boots_of_pure_thought', name: 'Boots of Pure Thought', slot: 'feet', rarity: 'epic', itemLevel: 77, classes: ['priest', 'paladin', 'druid', 'shaman'], stats: { intellect: 15, stamina: 10, spirit: 8, healingPower: 46 }, icon: `${ICON_BASE}/inv_boots_cloth_05.jpg`, itemCategory: 'healer' };
export const EMPOWERED_LEGGINGS: GearItem = { id: 'empowered_leggings', name: 'Empowered Leggings', slot: 'legs', rarity: 'epic', itemLevel: 77, classes: ['mage', 'warlock', 'priest'], stats: { intellect: 20, stamina: 18, spellPower: 39, hitChance: 1 }, icon: `${ICON_BASE}/inv_pants_cloth_14.jpg`, itemCategory: 'caster' };
export const FIREMAWS_CLUTCH: GearItem = { id: 'firemaws_clutch', name: "Firemaw's Clutch", slot: 'waist', rarity: 'epic', itemLevel: 77, classes: ['mage', 'warlock', 'priest'], stats: { intellect: 14, stamina: 12, spellPower: 30, critChance: 1 }, icon: `${ICON_BASE}/inv_belt_13.jpg`, itemCategory: 'caster' };

// Additional BWL Non-Set Armor - Leather
export const GLOVES_OF_RAPID_EVOLUTION: GearItem = { id: 'gloves_of_rapid_evolution', name: 'Gloves of Rapid Evolution', slot: 'hands', rarity: 'epic', itemLevel: 77, classes: ['druid'], stats: { intellect: 18, stamina: 14, spirit: 8, healingPower: 35 }, icon: `${ICON_BASE}/inv_gauntlets_25.jpg`, itemCategory: 'healer' };
export const SHIMMERING_GETA: GearItem = { id: 'shimmering_geta', name: 'Shimmering Geta', slot: 'feet', rarity: 'epic', itemLevel: 77, classes: ['druid', 'rogue'], stats: { agility: 22, stamina: 16, spirit: 10 }, icon: `${ICON_BASE}/inv_boots_02.jpg`, itemCategory: 'melee' };
export const TAUT_DRAGONHIDE_GLOVES: GearItem = { id: 'taut_dragonhide_gloves', name: 'Taut Dragonhide Gloves', slot: 'hands', rarity: 'epic', itemLevel: 77, classes: ['druid', 'rogue'], stats: { agility: 23, stamina: 15, critChance: 1 }, icon: `${ICON_BASE}/inv_gauntlets_15.jpg`, itemCategory: 'melee' };
export const TAUT_DRAGONHIDE_SHOULDERPADS: GearItem = { id: 'taut_dragonhide_shoulderpads', name: 'Taut Dragonhide Shoulderpads', slot: 'shoulders', rarity: 'epic', itemLevel: 77, classes: ['druid', 'rogue'], stats: { agility: 26, stamina: 18, critChance: 1 }, icon: `${ICON_BASE}/inv_shoulder_08.jpg`, itemCategory: 'melee' };
export const EMBERWEAVE_LEGGINGS: GearItem = { id: 'emberweave_leggings', name: 'Emberweave Leggings', slot: 'legs', rarity: 'epic', itemLevel: 77, classes: ['druid', 'rogue'], stats: { agility: 30, stamina: 22, critChance: 1 }, icon: `${ICON_BASE}/inv_pants_leather_03.jpg`, itemCategory: 'melee' };

// Additional BWL Non-Set Armor - Mail
export const CHROMATIC_BOOTS: GearItem = { id: 'chromatic_boots', name: 'Chromatic Boots', slot: 'feet', rarity: 'epic', itemLevel: 77, classes: ['hunter', 'shaman'], stats: { agility: 20, stamina: 15, intellect: 10, hitChance: 1 }, icon: `${ICON_BASE}/inv_boots_chain_06.jpg`, itemCategory: 'physical_ranged' };
export const PRIMALISTS_LINKED_LEGGUARDS: GearItem = { id: 'primalists_linked_legguards', name: "Primalist's Linked Legguards", slot: 'legs', rarity: 'epic', itemLevel: 77, classes: ['shaman'], stats: { intellect: 20, stamina: 18, spirit: 10, healingPower: 40 }, icon: `${ICON_BASE}/inv_pants_mail_10.jpg`, itemCategory: 'healer' };
export const PRIMALISTS_LINKED_WAISTGUARD: GearItem = { id: 'primalists_linked_waistguard', name: "Primalist's Linked Waistguard", slot: 'waist', rarity: 'epic', itemLevel: 77, classes: ['shaman'], stats: { intellect: 15, stamina: 12, healingPower: 33 }, icon: `${ICON_BASE}/inv_belt_29.jpg`, itemCategory: 'healer' };
export const THERAZANES_LINK: GearItem = { id: 'therazanes_link', name: "Therazane's Link", slot: 'waist', rarity: 'epic', itemLevel: 77, classes: ['hunter', 'shaman'], stats: { agility: 18, stamina: 14, intellect: 8, critChance: 1 }, icon: `${ICON_BASE}/inv_belt_28.jpg`, itemCategory: 'physical_ranged' };

// Additional BWL Non-Set Armor - Plate
export const GIRDLE_OF_THE_FALLEN_CRUSADER: GearItem = { id: 'girdle_of_the_fallen_crusader', name: 'Girdle of the Fallen Crusader', slot: 'waist', rarity: 'epic', itemLevel: 77, classes: ['warrior', 'paladin'], stats: { strength: 20, stamina: 18, critChance: 1 }, icon: `${ICON_BASE}/inv_belt_27.jpg`, itemCategory: 'melee' };
export const LEGGUARDS_OF_THE_FALLEN_CRUSADER: GearItem = { id: 'legguards_of_the_fallen_crusader', name: 'Legguards of the Fallen Crusader', slot: 'legs', rarity: 'epic', itemLevel: 77, classes: ['warrior', 'paladin'], stats: { strength: 26, stamina: 24, critChance: 1 }, icon: `${ICON_BASE}/inv_pants_plate_17.jpg`, itemCategory: 'melee' };

// Healer Shield
export const RED_DRAGONSCALE_PROTECTOR: GearItem = { id: 'red_dragonscale_protector', name: 'Red Dragonscale Protector', slot: 'offhand', rarity: 'epic', itemLevel: 77, classes: ['paladin', 'shaman'], stats: { stamina: 6, intellect: 17, spirit: 6, healingPower: 37 }, icon: `${ICON_BASE}/inv_shield_22.jpg`, weaponType: 'offhand_only', itemCategory: 'healer' };

// =============================================================================
// CLASS RELICS (Ranged Slot)
// Librams (Paladin), Totems (Shaman), Idols (Druid), Wands (Casters)
// =============================================================================

// Paladin Librams
export const LIBRAM_OF_GRACE: GearItem = { id: 'libram_of_grace', name: 'Libram of Grace', slot: 'ranged', rarity: 'rare', itemLevel: 60, classes: ['paladin'], stats: { healingPower: 53 }, icon: `${ICON_BASE}/inv_relics_libramofgrace.jpg`, relicType: 'libram', itemCategory: 'healer' };
export const LIBRAM_OF_DIVINITY: GearItem = { id: 'libram_of_divinity', name: 'Libram of Divinity', slot: 'ranged', rarity: 'epic', itemLevel: 68, classes: ['paladin'], stats: { healingPower: 53 }, icon: `${ICON_BASE}/inv_relics_libramofhope.jpg`, relicType: 'libram', itemCategory: 'healer' };
export const LIBRAM_OF_LIGHT: GearItem = { id: 'libram_of_light', name: 'Libram of Light', slot: 'ranged', rarity: 'rare', itemLevel: 55, classes: ['paladin'], stats: { healingPower: 30 }, icon: `${ICON_BASE}/inv_relics_libramofhope.jpg`, relicType: 'libram', itemCategory: 'healer' };

// Shaman Totems (Relic items, not spell totems)
export const TOTEM_OF_SUSTAINING: GearItem = { id: 'totem_of_sustaining', name: 'Totem of Sustaining', slot: 'ranged', rarity: 'rare', itemLevel: 60, classes: ['shaman'], stats: { healingPower: 53 }, icon: `${ICON_BASE}/inv_relics_totemoflife.jpg`, relicType: 'totem', itemCategory: 'healer' };
export const TOTEM_OF_LIFE: GearItem = { id: 'totem_of_life', name: 'Totem of Life', slot: 'ranged', rarity: 'epic', itemLevel: 68, classes: ['shaman'], stats: { healingPower: 53 }, icon: `${ICON_BASE}/inv_relics_totemoflife.jpg`, relicType: 'totem', itemCategory: 'healer' };
export const TOTEM_OF_REBIRTH: GearItem = { id: 'totem_of_rebirth', name: 'Totem of Rebirth', slot: 'ranged', rarity: 'rare', itemLevel: 55, classes: ['shaman'], stats: { healingPower: 30 }, icon: `${ICON_BASE}/inv_relics_totemoflife.jpg`, relicType: 'totem', itemCategory: 'healer' };

// Druid Idols
export const IDOL_OF_REJUVENATION: GearItem = { id: 'idol_of_rejuvenation', name: 'Idol of Rejuvenation', slot: 'ranged', rarity: 'rare', itemLevel: 60, classes: ['druid'], stats: { healingPower: 50 }, icon: `${ICON_BASE}/inv_relics_idolofrejuvenation.jpg`, relicType: 'idol', itemCategory: 'healer' };
export const IDOL_OF_HEALTH: GearItem = { id: 'idol_of_health', name: 'Idol of Health', slot: 'ranged', rarity: 'epic', itemLevel: 68, classes: ['druid'], stats: { healingPower: 50 }, icon: `${ICON_BASE}/inv_relics_idolofrejuvenation.jpg`, relicType: 'idol', itemCategory: 'healer' };
export const IDOL_OF_LONGEVITY: GearItem = { id: 'idol_of_longevity', name: 'Idol of Longevity', slot: 'ranged', rarity: 'rare', itemLevel: 55, classes: ['druid'], stats: { mp5: 4 }, icon: `${ICON_BASE}/inv_relics_idolofrejuvenation.jpg`, relicType: 'idol', itemCategory: 'healer' };

// Wands (Casters - Priest, Mage, Warlock)
// CRIMSON_SHOCKER defined in MC section above
export const DOOMFINGER: GearItem = { id: 'doomfinger', name: 'Doomfinger', slot: 'ranged', rarity: 'epic', itemLevel: 77, classes: ['priest', 'mage', 'warlock'], stats: { intellect: 8, stamina: 7, spellPower: 16 }, icon: `${ICON_BASE}/inv_wand_12.jpg`, relicType: 'wand', itemCategory: 'caster' };
export const SKULLFLAME_WAND: GearItem = { id: 'skullflame_wand', name: 'Nether Force Wand', slot: 'ranged', rarity: 'epic', itemLevel: 66, classes: ['priest', 'mage', 'warlock'], stats: { intellect: 7, stamina: 5, spellPower: 11 }, icon: `${ICON_BASE}/inv_wand_11.jpg`, relicType: 'wand', itemCategory: 'caster' };

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

  // MC Accessories - Necklaces
  choker_of_enlightenment: CHOKER_OF_ENLIGHTENMENT,
  medallion_of_steadfast_might: MEDALLION_OF_STEADFAST_MIGHT,
  choker_of_the_fire_lord: CHOKER_OF_THE_FIRE_LORD,

  // MC Accessories - Cloaks
  fireproof_cloak: FIREPROOF_CLOAK,
  cloak_of_the_shrouded_mists: CLOAK_OF_THE_SHROUDED_MISTS,
  dragons_blood_cape: DRAGONS_BLOOD_CAPE,

  // MC Accessories - Rings
  ring_of_spell_power: RING_OF_SPELL_POWER,
  heavy_dark_iron_ring: HEAVY_DARK_IRON_RING,
  seal_of_the_archmagus: SEAL_OF_THE_ARCHMAGUS,
  cauterizing_band: CAUTERIZING_BAND,
  band_of_accuria: BAND_OF_ACCURIA,
  band_of_sulfuras: BAND_OF_SULFURAS,
  quick_strike_ring: QUICK_STRIKE_RING,

  // MC Accessories - Trinkets
  talisman_of_ephemeral_power: TALISMAN_OF_EPHEMERAL_POWER,
  essence_of_the_pure_flame: ESSENCE_OF_THE_PURE_FLAME,
  shard_of_the_flame: SHARD_OF_THE_FLAME,

  // DPS Weapons
  bonereaver_edge: BONEREAVER_EDGE,
  perditions_blade: PERDITIONS_BLADE,
  strikers_mark: STRIKERS_MARK,

  // MC Missing Melee Weapons
  brutality_blade: BRUTALITY_BLADE,
  gutgore_ripper: GUTGORE_RIPPER,
  core_hound_tooth: CORE_HOUND_TOOTH,
  spinal_reaper: SPINAL_REAPER,
  earthshaker: EARTHSHAKER,
  finkles_lava_dredger: FINKLES_LAVA_DREDGER,
  obsidian_edged_blade: OBSIDIAN_EDGED_BLADE,

  // MC Missing Ranged Weapons
  blastershot_launcher: BLASTERSHOT_LAUNCHER,
  crimson_shocker: CRIMSON_SHOCKER,

  // MC Additional Weapons
  shadowstrike: SHADOWSTRIKE,
  eskhandars_right_claw: ESKHANDARS_RIGHT_CLAW,

  // MC Shared Non-Set Armor
  robe_of_volatile_power: ROBE_OF_VOLATILE_POWER,
  manastorm_leggings: MANASTORM_LEGGINGS,
  mana_igniting_cord: MANA_IGNITING_CORD,
  aged_core_leather_gloves: AGED_CORE_LEATHER_GLOVES,
  wristguards_of_stability: WRISTGUARDS_OF_STABILITY,
  fireguard_shoulders: FIREGUARD_SHOULDERS,
  wild_growth_spaulders: WILD_GROWTH_SPAULDERS,
  magma_tempered_boots: MAGMA_TEMPERED_BOOTS,
  flameguard_gauntlets: FLAMEGUARD_GAUNTLETS,
  flamewaker_legplates: FLAMEWAKER_LEGPLATES,

  // MC T2 Legs (Ragnaros)
  leggings_of_transcendence: LEGGINGS_OF_TRANSCENDENCE,
  netherwind_pants: NETHERWIND_PANTS,
  nemesis_leggings: NEMESIS_LEGGINGS,
  stormrage_legguards: STORMRAGE_LEGGUARDS,
  bloodfang_pants: BLOODFANG_PANTS,
  dragonstalker_legguards: DRAGONSTALKER_LEGGUARDS,
  legplates_of_ten_storms: LEGPLATES_OF_TEN_STORMS,
  legplates_of_wrath: LEGPLATES_OF_WRATH,
  judgement_legplates: JUDGEMENT_LEGPLATES,
  crown_of_destruction: CROWN_OF_DESTRUCTION,

  // MC Missing Armor
  onslaught_girdle: ONSLAUGHT_GIRDLE,
  sash_of_whispered_secrets: SASH_OF_WHISPERED_SECRETS,
  gloves_of_the_hypnotic_flame: GLOVES_OF_THE_HYPNOTIC_FLAME,

  // MC Shields
  malistars_defender: MALISTARS_DEFENDER,
  drillborer_disk: DRILLBORER_DISK,

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

  // Onyxia Weapons & Accessories
  deathbringer: DEATHBRINGER,
  vis_kag: VIS_KAG,
  ancient_cornerstone_grimoire: ANCIENT_CORNERSTONE_GRIMOIRE,
  sapphiron_drape: SAPPHIRON_DRAPE,
  ring_of_binding: RING_OF_BINDING,
  eskhandars_collar: ESKHANDARS_COLLAR,
  shard_of_the_scale: SHARD_OF_THE_SCALE,

  // Onyxia Quest Rewards
  dragonslayers_signet: DRAGONSLAYERS_SIGNET,
  onyxia_blood_talisman: ONYXIA_BLOOD_TALISMAN,
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

  // Shaman T2 - Ten Storms (BWL pieces)
  bracers_of_ten_storms: BRACERS_OF_TEN_STORMS,
  belt_of_ten_storms: BELT_OF_TEN_STORMS,
  greaves_of_ten_storms: GREAVES_OF_TEN_STORMS,
  gauntlets_of_ten_storms: GAUNTLETS_OF_TEN_STORMS,
  epaulets_of_ten_storms: EPAULETS_OF_TEN_STORMS,
  breastplate_of_ten_storms: BREASTPLATE_OF_TEN_STORMS,

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

  // BWL Non-Set Weapons - Ranged
  heartstriker: HEARTSTRIKER,
  ashjrethul: ASHJRETHUL,
  dragonbreath_hand_cannon: DRAGONBREATH_HAND_CANNON,

  // BWL Missing Weapons - Melee
  claw_of_chromaggus: CLAW_OF_CHROMAGGUS,
  claw_of_the_black_drake: CLAW_OF_THE_BLACK_DRAKE,
  herald_of_woe: HERALD_OF_WOE,
  spineshatter: SPINESHATTER,

  // BWL Missing Weapons - Wand
  dragons_touch: DRAGONS_TOUCH,

  // BWL Missing Shields
  elementium_reinforced_bulwark: ELEMENTIUM_REINFORCED_BULWARK,

  // BWL Accessories - Necklaces
  pendant_of_the_fallen_dragon: PENDANT_OF_THE_FALLEN_DRAGON,
  prestors_talisman_of_connivery: PRESTORS_TALISMAN_OF_CONNIVERY,

  // BWL Accessories - Cloaks
  elementium_threaded_cloak: ELEMENTIUM_THREADED_CLOAK,
  shroud_of_pure_thought: SHROUD_OF_PURE_THOUGHT,
  cloak_of_firemaw: CLOAK_OF_FIREMAW,
  cloak_of_the_brood_lord: CLOAK_OF_THE_BROOD_LORD,

  // BWL Accessories - Rings
  ring_of_blackrock: RING_OF_BLACKROCK,
  band_of_forced_concentration: BAND_OF_FORCED_CONCENTRATION,
  circle_of_applied_force: CIRCLE_OF_APPLIED_FORCE,
  pure_elementium_band: PURE_ELEMENTIUM_BAND,
  archimtiros_ring_of_reckoning: ARCHIMTIROS_RING_OF_RECKONING,

  // BWL Accessories - Trinkets (All Class)
  drake_fang_talisman: DRAKE_FANG_TALISMAN,
  neltharions_tear: NELTHARIONS_TEAR,
  rejuvenating_gem: REJUVENATING_GEM,
  styleens_impeding_scarab: STYLEENS_IMPEDING_SCARAB,

  // BWL Accessories - Trinkets (Class Specific)
  aegis_of_preservation: AEGIS_OF_PRESERVATION,
  arcane_infused_gem: ARCANE_INFUSED_GEM,
  lifegiving_gem: LIFEGIVING_GEM,
  mind_quickening_gem: MIND_QUICKENING_GEM,
  natural_alignment_crystal: NATURAL_ALIGNMENT_CRYSTAL,
  rune_of_metamorphosis: RUNE_OF_METAMORPHOSIS,
  scrolls_of_blinding_light_trinket: SCROLLS_OF_BLINDING_LIGHT_TRINKET,
  the_black_book: THE_BLACK_BOOK,
  venomous_totem: VENOMOUS_TOTEM,

  // BWL Armor - Shoulders
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

  // BWL Additional Non-Set Armor - Cloth
  black_ash_robe: BLACK_ASH_ROBE,
  boots_of_pure_thought: BOOTS_OF_PURE_THOUGHT,
  empowered_leggings: EMPOWERED_LEGGINGS,
  firemaws_clutch: FIREMAWS_CLUTCH,

  // BWL Additional Non-Set Armor - Leather
  gloves_of_rapid_evolution: GLOVES_OF_RAPID_EVOLUTION,
  shimmering_geta: SHIMMERING_GETA,
  taut_dragonhide_gloves: TAUT_DRAGONHIDE_GLOVES,
  taut_dragonhide_shoulderpads: TAUT_DRAGONHIDE_SHOULDERPADS,
  emberweave_leggings: EMBERWEAVE_LEGGINGS,

  // BWL Additional Non-Set Armor - Mail
  chromatic_boots: CHROMATIC_BOOTS,
  primalists_linked_legguards: PRIMALISTS_LINKED_LEGGUARDS,
  primalists_linked_waistguard: PRIMALISTS_LINKED_WAISTGUARD,
  therazanes_link: THERAZANES_LINK,

  // BWL Additional Non-Set Armor - Plate
  girdle_of_the_fallen_crusader: GIRDLE_OF_THE_FALLEN_CRUSADER,
  legguards_of_the_fallen_crusader: LEGGUARDS_OF_THE_FALLEN_CRUSADER,

  // BWL Armor - Shields
  red_dragonscale_protector: RED_DRAGONSCALE_PROTECTOR,

  // Class Relics (Ranged Slot)
  // Paladin Librams
  libram_of_grace: LIBRAM_OF_GRACE,
  libram_of_divinity: LIBRAM_OF_DIVINITY,
  libram_of_light: LIBRAM_OF_LIGHT,

  // Shaman Totems
  totem_of_sustaining: TOTEM_OF_SUSTAINING,
  totem_of_life: TOTEM_OF_LIFE,
  totem_of_rebirth: TOTEM_OF_REBIRTH,

  // Druid Idols
  idol_of_rejuvenation: IDOL_OF_REJUVENATION,
  idol_of_health: IDOL_OF_HEALTH,
  idol_of_longevity: IDOL_OF_LONGEVITY,

  // Wands (crimson_shocker already in MC section)
  doomfinger: DOOMFINGER,
  skullflame_wand: SKULLFLAME_WAND,
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

// Quest Materials - Turn-in items that give choice of rewards
export const QUEST_MATERIALS: Record<QuestMaterialId, QuestMaterial> = {
  head_of_onyxia: {
    id: 'head_of_onyxia',
    name: 'Head of Onyxia',
    icon: `${ICON_BASE}/inv_misc_head_dragon_01.jpg`,
    description: 'The severed head of Onyxia. Can be turned in for a reward - but you may only claim one reward per character!',
    dropChance: 1.0, // Always drops
    dropsFrom: 'onyxia',
    rewards: ['dragonslayers_signet', 'onyxia_blood_talisman', 'onyxia_tooth_pendant'],
  },
  head_of_nefarian: {
    id: 'head_of_nefarian',
    name: 'Head of Nefarian',
    icon: `${ICON_BASE}/inv_misc_head_dragon_black.jpg`,
    description: 'The severed head of Nefarian. Can be turned in for a reward - but you may only claim one reward per character!',
    dropChance: 1.0, // Always drops
    dropsFrom: 'nefarian',
    rewards: ['master_dragonslayers_medallion', 'master_dragonslayers_orb', 'master_dragonslayers_ring'],
  },
};

// Onyxia Quest Reward Items lookup
export const ONYXIA_QUEST_REWARDS: Record<OnyxiaQuestRewardId, GearItem> = {
  dragonslayers_signet: DRAGONSLAYERS_SIGNET,
  onyxia_blood_talisman: ONYXIA_BLOOD_TALISMAN,
  onyxia_tooth_pendant: ONYXIA_TOOTH_PENDANT,
};

// Nefarian Quest Reward Items lookup
export const NEFARIAN_QUEST_REWARDS: Record<NefarianQuestRewardId, GearItem> = {
  master_dragonslayers_medallion: MASTER_DRAGONSLAYERS_MEDALLION,
  master_dragonslayers_orb: MASTER_DRAGONSLAYERS_ORB,
  master_dragonslayers_ring: MASTER_DRAGONSLAYERS_RING,
};

// Combined Quest Rewards lookup for all quest items
export const ALL_QUEST_REWARDS: Record<QuestRewardId, GearItem> = {
  ...ONYXIA_QUEST_REWARDS,
  ...NEFARIAN_QUEST_REWARDS,
};

// Rarity colors for UI
export const RARITY_COLORS: Record<ItemRarity, string> = {
  uncommon: '#1eff00',
  rare: '#0070dd',
  epic: '#a335ee',
  legendary: '#ff8000',
};
