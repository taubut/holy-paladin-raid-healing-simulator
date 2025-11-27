// Molten Core Boss Loot Tables - Authentic Vanilla WoW
// Each boss drops specific T1 pieces plus shared loot pool items

import { ALL_ITEMS, LEGENDARY_MATERIALS } from './items';
import type { GearItem, LegendaryMaterialId, LegendaryMaterial, ItemCategory } from './items';
import type { Faction, PlayerHealerClass, WoWSpec } from './types';

// =============================================================================
// SPEC-AWARE ITEM AFFINITIES
// Maps each spec to the item categories they can benefit from
// Used for intelligent loot assignment (e.g., caster weapons go to caster specs)
// =============================================================================

export const SPEC_ITEM_AFFINITIES: Record<string, ItemCategory[]> = {
  // Warriors - ALL specs can use melee (including Fury/Prot tanks who dual wield!)
  'arms': ['melee', 'universal'],
  'fury': ['melee', 'universal'],
  'protection_warrior': ['melee', 'universal'],

  // Rogues - all melee
  'assassination': ['melee', 'universal'],
  'combat': ['melee', 'universal'],
  'subtlety': ['melee', 'universal'],

  // Hunters - physical ranged primary, some melee for stat sticks
  'beast_mastery': ['physical_ranged', 'melee', 'universal'],
  'marksmanship': ['physical_ranged', 'melee', 'universal'],
  'survival': ['physical_ranged', 'melee', 'universal'],

  // Mages - caster only
  'arcane': ['caster', 'universal'],
  'fire_mage': ['caster', 'universal'],
  'frost_mage': ['caster', 'universal'],

  // Warlocks - caster only
  'affliction': ['caster', 'universal'],
  'demonology': ['caster', 'universal'],
  'destruction': ['caster', 'universal'],

  // Priests - healer for Holy/Disc, caster for Shadow
  'discipline': ['healer', 'caster', 'universal'],
  'holy_priest': ['healer', 'caster', 'universal'],
  'shadow': ['caster', 'universal'],

  // Druids - depends heavily on spec
  'balance': ['caster', 'universal'],
  'feral_tank': ['melee', 'universal'],
  'feral_dps': ['melee', 'universal'],
  'restoration': ['healer', 'caster', 'universal'],

  // Paladins - Holy = healer, Ret/Prot = melee
  'holy_paladin': ['healer', 'caster', 'universal'],
  'protection_paladin': ['melee', 'universal'],
  'retribution': ['melee', 'universal'],

  // Shamans - Resto/Ele = caster/healer, Enhancement = melee
  'elemental': ['caster', 'universal'],
  'enhancement': ['melee', 'universal'],
  'restoration_shaman': ['healer', 'caster', 'universal'],
};

// Helper function to check if a spec can benefit from an item category
export function canSpecBenefitFrom(spec: WoWSpec, itemCategory: ItemCategory | undefined): boolean {
  // If item has no category, allow (backwards compatibility)
  if (!itemCategory) return true;

  const affinities = SPEC_ITEM_AFFINITIES[spec];
  // If spec not found (shouldn't happen), allow
  if (!affinities) return true;

  return affinities.includes(itemCategory);
}

export interface BossLootTable {
  items: string[];      // Item IDs that can drop
  dropCount: number;    // How many items drop per kill
  dkpReward: number;    // DKP earned for killing this boss
  legendaryMaterial?: LegendaryMaterialId; // Legendary material that can drop from this boss
}

// Tier 1 drops by boss (authentic vanilla):
// - Lucifron: T1 Boots (Paladin, Mage, Druid, Hunter, Warlock, Warrior)
// - Gehennas: T1 Gloves/Boots mix
// - Magmadar: T1 Legs
// - Garr: T1 Helm + Bindings of the Windseeker
// - Baron Geddon: T1 Shoulders + Bindings of the Windseeker
// - Shazzrah: T1 Gloves/Boots mix
// - Golemagg: T1 Chest + shared caster items
// - Sulfuron Harbinger: T1 Bracers/Belts
// - Majordomo: Cache items (rings, weapons)
// - Ragnaros: T2 Legs + legendary mats

export const BOSS_LOOT_TABLES: Record<string, BossLootTable> = {
  // =========================================================================
  // LUCIFRON - First boss
  // Drops: T1 Feet (Paladin, Druid, Mage, Shaman) + T1 Hands (Warlock)
  // + T1 Belts (normally trash drops, but we have no trash)
  // =========================================================================
  lucifron: {
    items: [
      // T1 Feet
      'lawbringer_boots',       // Paladin
      'arcanist_boots',         // Mage
      'cenarion_boots',         // Druid
      'earthfury_boots',        // Shaman
      // T1 Hands
      'felheart_gloves',        // Warlock
      // T1 Belts (normally trash drops)
      'lawbringer_belt',        // Paladin
      'arcanist_belt',          // Mage
      'cenarion_belt',          // Druid
      'earthfury_belt',         // Shaman
      'girdle_of_prophecy',     // Priest
      'felheart_belt',          // Warlock
      'giantstalker_belt',      // Hunter
      'belt_of_might',          // Warrior
      'nightslayer_belt',       // Rogue
      // Shared Flamewaker loot
      'sorcerous_dagger',       // Caster weapon
      'salamander_scale_pants', // Leather legs
    ],
    dropCount: 2,
    dkpReward: 10,
  },

  // =========================================================================
  // MAGMADAR - Second boss
  // Drops: All T1 Legs + Striker's Mark, Earthshaker
  // + T1 Bracers (normally trash drops, but we have no trash)
  // =========================================================================
  magmadar: {
    items: [
      // T1 Legs
      'arcanist_leggings',      // Mage
      'felheart_pants',         // Warlock
      'cenarion_leggings',      // Druid
      'nightslayer_pants',      // Rogue
      'earthfury_legguards',    // Shaman
      'giantstalker_leggings',  // Hunter
      // T1 Bracers (normally trash drops)
      'lawbringer_bracers',     // Paladin
      'arcanist_bindings',      // Mage
      'cenarion_bracers',       // Druid
      'earthfury_bracers',      // Shaman
      'vambraces_of_prophecy',  // Priest
      'felheart_bracers',       // Warlock
      'giantstalker_bracers',   // Hunter
      'bracers_of_might',       // Warrior
      'nightslayer_bracelets',  // Rogue
      // Non-set
      'strikers_mark',          // Hunter ranged
      'fire_runed_grimoire',    // Caster offhand
      'salamander_scale_pants', // Leather legs
    ],
    dropCount: 2,
    dkpReward: 10,
  },

  // =========================================================================
  // GEHENNAS - Third boss
  // Drops: T1 Hands (Priest, Hunter, Rogue, Shaman) + T1 Feet (Hunter)
  // =========================================================================
  gehennas: {
    items: [
      // T1 Hands
      'gloves_of_prophecy',     // Priest
      'earthfury_gauntlets',    // Shaman
      'nightslayer_gloves',     // Rogue
      // T1 Feet
      'giantstalker_boots',     // Hunter
      // Shared Flamewaker loot
      'sorcerous_dagger',       // Caster weapon
      'salamander_scale_pants', // Leather legs
    ],
    dropCount: 2,
    dkpReward: 10,
  },

  // =========================================================================
  // GARR - Fourth boss
  // Drops: All T1 Helms + Aurastone Hammer, Brutality Blade, Gutgore Ripper
  // Bindings of the Windseeker (Right half)
  // =========================================================================
  garr: {
    items: [
      // T1 Helms
      'arcanist_crown',         // Mage
      'circlet_of_prophecy',    // Priest
      'felheart_horns',         // Warlock
      'cenarion_helm',          // Druid
      'nightslayer_cover',      // Rogue
      'earthfury_helmet',       // Shaman
      'giantstalker_helm',      // Hunter
      // Non-set weapons
      'aurastone_hammer',       // Healer mace
      // Shared Non-Flamewaker loot
      'fire_runed_grimoire',    // Caster offhand
    ],
    dropCount: 3,
    dkpReward: 15,
    legendaryMaterial: 'bindings_of_the_windseeker_right',
  },

  // =========================================================================
  // BARON GEDDON - Fifth boss
  // Drops: T1 Shoulders (Mage, Warlock, Druid, Shaman, Hunter)
  // Bindings of the Windseeker (Left half)
  // =========================================================================
  baron_geddon: {
    items: [
      // T1 Shoulders
      'arcanist_mantle',        // Mage
      'felheart_shoulder_pads', // Warlock
      'cenarion_spaulders',     // Druid
      'earthfury_epaulets',     // Shaman
      'giantstalker_epaulets',  // Hunter
      // Shared Non-Flamewaker loot
      'fire_runed_grimoire',    // Caster offhand
    ],
    dropCount: 2,
    dkpReward: 15,
    legendaryMaterial: 'bindings_of_the_windseeker_left',
  },

  // =========================================================================
  // SHAZZRAH - Sixth boss
  // Drops: T1 Hands (Mage, Druid, Hunter) + T1 Feet (Priest, Warlock, Rogue)
  // =========================================================================
  shazzrah: {
    items: [
      // T1 Hands
      'arcanist_gloves',        // Mage
      'cenarion_gloves',        // Druid
      'giantstalker_gloves',    // Hunter
      // T1 Feet
      'boots_of_prophecy',      // Priest
      'felheart_slippers',      // Warlock
      'nightslayer_boots',      // Rogue
      // Shared Flamewaker loot
      'sorcerous_dagger',       // Caster weapon
      'salamander_scale_pants', // Leather legs
    ],
    dropCount: 2,
    dkpReward: 15,
  },

  // =========================================================================
  // SULFURON HARBINGER - Seventh boss
  // Drops: T1 Shoulders (Priest, Rogue, Hunter) - NOT bracers/belts!
  // Note: Bracers/Belts drop from MC trash, not bosses
  // =========================================================================
  sulfuron: {
    items: [
      // T1 Shoulders
      'mantle_of_prophecy',     // Priest
      'nightslayer_shoulder_pads', // Rogue
      'giantstalker_epaulets',  // Hunter (also drops here)
      // Shared Flamewaker loot
      'sorcerous_dagger',       // Caster weapon
      'salamander_scale_pants', // Leather legs
    ],
    dropCount: 2,
    dkpReward: 15,
  },

  // =========================================================================
  // GOLEMAGG - Eighth boss
  // Drops: All T1 Chests + Azuresong Mageblade, Staff of Dominance
  // =========================================================================
  golemagg: {
    items: [
      // T1 Chests
      'arcanist_robes',         // Mage
      'robes_of_prophecy',      // Priest
      'cenarion_vestments',     // Druid
      'nightslayer_chestpiece', // Rogue
      'earthfury_vestments',    // Shaman
      'giantstalker_breastplate', // Hunter
      'breastplate_of_might',   // Warrior
      'lawbringer_chestguard',  // Paladin
      // Non-set weapons
      'azuresong_mageblade',    // Caster sword
      'staff_of_dominance',     // Caster staff
      // Shared Non-Flamewaker loot
      'fire_runed_grimoire',    // Caster offhand
    ],
    dropCount: 3,
    dkpReward: 20,
  },

  // =========================================================================
  // MAJORDOMO EXECUTUS - Ninth boss (Cache)
  // Drops: Unique cache items - Core Hound Tooth, Sash of Whispered Secrets, etc.
  // Also: Ancient Petrified Leaf (Hunter quest), Eye of Divinity (Priest quest)
  // NOTE: Majordomo drops unique items we don't have defined yet (Core Hound Tooth,
  // Finkle's Lava Dredger, Cauterizing Band, Gloves of the Hypnotic Flame, etc.)
  // Using shared MC drops as placeholder until those items are added
  // =========================================================================
  majordomo: {
    items: [
      // Placeholder drops until Majordomo-specific items are added
      'fire_runed_grimoire',    // Caster offhand
      'sorcerous_dagger',       // Caster dagger
      'salamander_scale_pants', // Leather legs
    ],
    dropCount: 2,
    dkpReward: 20,
  },

  // =========================================================================
  // RAGNAROS - Final boss
  // Drops: T2 Legs + Perdition's Blade, Bonereaver's Edge, Spinal Reaper, etc.
  // Eye of Sulfuras (legendary component)
  // NOTE: Does NOT drop T1 gear. Drops T2 legs (not implemented) and unique weapons/accessories
  // =========================================================================
  ragnaros: {
    items: [
      // Ragnaros-only weapons (authentic drops)
      'perditions_blade',       // Rogue dagger
      'bonereaver_edge',        // Warrior 2H sword
      // Note: Spinal Reaper, Band of Accuria, Band of Sulfuras, Onslaught Girdle,
      // Crown of Destruction, Choker of the Fire Lord, Malistar's Defender, etc.
      // are authentic Rag drops but we don't have items defined for them yet
    ],
    dropCount: 4,
    dkpReward: 30,
    legendaryMaterial: 'eye_of_sulfuras',
  },

  // =========================================================================
  // TRAINING DUMMY - No real loot, just for practice
  // =========================================================================
  training: {
    items: [
      // Give some starter items
      'lawbringer_bracers',
      'lawbringer_belt',
      'earthfury_bracers',      // Shaman
      'earthfury_belt',         // Shaman
      'vambraces_of_prophecy',
      'girdle_of_prophecy',
      'cenarion_bracers',
      'cenarion_belt',
      'arcanist_bindings',
      'arcanist_belt',
      'bracers_of_might',
      'belt_of_might',
    ],
    dropCount: 2,
    dkpReward: 5,
  },

  // =========================================================================
  // BLACKWING LAIR
  // =========================================================================

  // =========================================================================
  // RAZORGORE THE UNTAMED - BWL Boss 1
  // Drops: T2 Bracers (normally trash drops, assigned here since no trash)
  // + The Untamed Blade, shared BWL loot
  // =========================================================================
  razorgore: {
    items: [
      // T2 Bracers
      'judgment_bindings',          // Paladin T2
      'bindings_of_transcendence',  // Priest T2
      'stormrage_bracers',          // Druid T2
      'bracelets_of_wrath',         // Warrior T2
      'dragonstalker_bracers',      // Hunter T2
      'netherwind_bindings',        // Mage T2
      'bloodfang_bracers',          // Rogue T2
      'nemesis_bracers',            // Warlock T2
      // Non-set weapons
      'the_untamed_blade',          // Warrior 2H sword
      'bracers_of_arcane_accuracy', // Caster bracers
    ],
    dropCount: 2,
    dkpReward: 15,
  },

  // =========================================================================
  // VAELASTRASZ THE CORRUPT - BWL Boss 2
  // Drops: T2 Belts (normally trash drops, assigned here since no trash)
  // + Dragonfang Blade
  // =========================================================================
  vaelastrasz: {
    items: [
      // T2 Belts
      'judgment_belt',              // Paladin T2
      'belt_of_transcendence',      // Priest T2
      'stormrage_belt',             // Druid T2
      'waistband_of_wrath',         // Warrior T2
      'dragonstalker_belt',         // Hunter T2
      'netherwind_belt',            // Mage T2
      'bloodfang_belt',             // Rogue T2
      'nemesis_belt',               // Warlock T2
      // Non-set
      'dragonfang_blade',           // Rogue dagger
      'angelista_grasp',            // Caster belt
    ],
    dropCount: 2,
    dkpReward: 20,
  },

  // =========================================================================
  // BROODLORD LASHLAYER - BWL Boss 3
  // Drops: T2 Boots + Maladath, Heartstriker
  // =========================================================================
  broodlord: {
    items: [
      // T2 Boots
      'judgment_sabatons',          // Paladin T2
      'boots_of_transcendence',     // Priest T2
      'stormrage_boots',            // Druid T2
      'sabatons_of_wrath',          // Warrior T2
      'dragonstalker_greaves',      // Hunter T2
      'netherwind_boots',           // Mage T2
      'bloodfang_boots',            // Rogue T2
      'nemesis_boots',              // Warlock T2
      // Non-set
      'maladath',                   // Sword +4 Sword Skill
      'heartstriker',               // Hunter bow
      'boots_of_the_shadow_flame',  // Leather boots
    ],
    dropCount: 2,
    dkpReward: 20,
  },

  // =========================================================================
  // FIREMAW - BWL Boss 4 (Drake)
  // Drops: T2 Gloves + Crul'shorukh
  // =========================================================================
  firemaw: {
    items: [
      // T2 Gloves
      'judgment_gauntlets',         // Paladin T2
      'handguards_of_transcendence', // Priest T2
      'stormrage_handguards',       // Druid T2
      'gauntlets_of_wrath',         // Warrior T2
      'dragonstalker_gauntlets',    // Hunter T2
      'netherwind_gloves',          // Mage T2
      'bloodfang_gloves',           // Rogue T2
      'nemesis_gloves',             // Warlock T2
      // Non-set
      'crul_shorukh',               // Warrior axe
      'ebony_flame_gloves',         // Leather gloves
      'black_brood_pauldrons',      // Plate shoulders
    ],
    dropCount: 2,
    dkpReward: 20,
  },

  // =========================================================================
  // EBONROC - BWL Boss 5 (Drake)
  // Drops: T2 Gloves + Shadow Wing Focus Staff
  // =========================================================================
  ebonroc: {
    items: [
      // T2 Gloves (same as other drakes)
      'judgment_gauntlets',         // Paladin T2
      'handguards_of_transcendence', // Priest T2
      'stormrage_handguards',       // Druid T2
      'gauntlets_of_wrath',         // Warrior T2
      'dragonstalker_gauntlets',    // Hunter T2
      'netherwind_gloves',          // Mage T2
      'bloodfang_gloves',           // Rogue T2
      'nemesis_gloves',             // Warlock T2
      // Non-set
      'shadow_wing_focus_staff',    // Caster staff
      'malfurions_blessed_bulwark', // Druid chest
      'shroud_of_pure_thought',     // Healer cloak
    ],
    dropCount: 2,
    dkpReward: 20,
  },

  // =========================================================================
  // FLAMEGOR - BWL Boss 6 (Drake)
  // Drops: T2 Gloves + Drake Talon Cleaver
  // =========================================================================
  flamegor: {
    items: [
      // T2 Gloves (same as other drakes)
      'judgment_gauntlets',         // Paladin T2
      'handguards_of_transcendence', // Priest T2
      'stormrage_handguards',       // Druid T2
      'gauntlets_of_wrath',         // Warrior T2
      'dragonstalker_gauntlets',    // Hunter T2
      'netherwind_gloves',          // Mage T2
      'bloodfang_gloves',           // Rogue T2
      'nemesis_gloves',             // Warlock T2
      // Non-set
      'drake_talon_cleaver',        // Warrior 2H axe
      'taut_dragonhide_belt',       // Leather belt
      'drake_talon_pauldrons',      // Plate shoulders
    ],
    dropCount: 2,
    dkpReward: 20,
  },

  // =========================================================================
  // CHROMAGGUS - BWL Boss 7
  // Drops: T2 Shoulders + Ashjre'thul, Chromatically Tempered Sword
  // =========================================================================
  chromaggus: {
    items: [
      // T2 Shoulders
      'judgment_spaulders',         // Paladin T2
      'pauldrons_of_transcendence', // Priest T2
      'stormrage_pauldrons',        // Druid T2
      'pauldrons_of_wrath',         // Warrior T2
      'dragonstalker_spaulders',    // Hunter T2
      'netherwind_mantle',          // Mage T2
      'bloodfang_spaulders',        // Rogue T2
      'nemesis_spaulders',          // Warlock T2
      // Non-set
      'ashjrethul',                 // Hunter crossbow
      'chromatically_tempered_sword', // Sword
      'elementium_threaded_cloak',  // Resist cloak
      'mantle_of_the_blackwing_cabal', // Caster shoulders
    ],
    dropCount: 3,
    dkpReward: 25,
  },

  // =========================================================================
  // NEFARIAN - BWL Final Boss
  // Drops: T2 Chest + Ashkandi, Staff of the Shadow Flame, Lok'amir,
  // Neltharion's Tear, Prestor's Talisman, Mish'undare
  // =========================================================================
  nefarian: {
    items: [
      // T2 Chest
      'judgment_breastplate',       // Paladin T2
      'robes_of_transcendence',     // Priest T2
      'stormrage_chestguard',       // Druid T2
      'breastplate_of_wrath',       // Warrior T2
      'dragonstalker_breastplate',  // Hunter T2
      'netherwind_robes',           // Mage T2
      'bloodfang_chestpiece',       // Rogue T2
      'nemesis_robes',              // Warlock T2
      // Non-set weapons
      'ashkandi',                   // Warrior 2H sword
      'staff_of_the_shadow_flame', // Caster staff
      'lok_amir',                   // Healer mace
      // Armor
      'mishundare',                 // Caster helm
      'scrolls_of_blinding_light',  // Healer offhand
      'helm_of_endless_rage',       // Warrior helm
      'red_dragonscale_protector',  // Tank shield
    ],
    dropCount: 4,
    dkpReward: 35,
  },

  // =========================================================================
  // SILITHUS - PRINCE THUNDERAAN
  // Secret boss unlocked by collecting both Bindings + killing Firemaw
  // Drops: Unique loot, no tier gear
  // =========================================================================
  thunderaan: {
    items: [
      // Since Thunderaan is the legendary boss for Thunderfury, he doesn't drop
      // traditional loot - killing him unlocks the ability to craft Thunderfury
      // We can add some thematic wind/elemental items here as bonus
      'elementium_threaded_cloak',  // Resist cloak
      'shroud_of_pure_thought',     // Healer cloak
      'mantle_of_the_blackwing_cabal', // Caster shoulders
    ],
    dropCount: 2,
    dkpReward: 40,
  },

  // =========================================================================
  // ONYXIA'S LAIR
  // =========================================================================
  onyxia: {
    items: [
      // T2 Helms (all classes)
      'judgment_crown',           // Paladin T2 helm
      'ten_storms_crown',         // Shaman T2 helm
      'halo_of_transcendence',    // Priest T2 helm
      'stormrage_cover',          // Druid T2 helm
      'netherwind_crown',         // Mage T2 helm
      'nemesis_skullcap',         // Warlock T2 helm
      'dragonstalker_helm',       // Hunter T2 helm
      'helm_of_wrath',            // Warrior T2 helm
      'bloodfang_hood',           // Rogue T2 helm

      // Weapons & Other
      'deathbringer',             // 2H sword
      'vis_kag',                  // 1H sword
      'ancient_cornerstone_grimoire', // Caster offhand
      'sapphiron_drape',          // Caster cloak
      'ring_of_binding',          // Ring
      'onyxia_tooth_pendant',     // Neck
    ],
    dropCount: 3,
    dkpReward: 25,
  },
};

// DKP costs based on item rarity and level
export function calculateDKPCost(item: GearItem): number {
  let baseCost = 0;

  switch (item.rarity) {
    case 'uncommon':
      baseCost = 10;
      break;
    case 'rare':
      baseCost = 20;
      break;
    case 'epic':
      baseCost = item.setId ? 35 : 45; // Set pieces slightly cheaper
      break;
    case 'legendary':
      baseCost = 100;
      break;
  }

  // Adjust by item level (66 is baseline)
  const levelModifier = (item.itemLevel - 60) / 10;
  baseCost = Math.floor(baseCost * (1 + levelModifier * 0.1));

  return baseCost;
}

// Check if an item is usable by paladin
export function isPaladinUsable(item: GearItem): boolean {
  return item.classes.includes('paladin') || item.classes.includes('all');
}

// Check if an item is Shaman-only (excludes 'all' class items)
export function isShamanOnly(item: GearItem): boolean {
  return item.classes.length === 1 && item.classes.includes('shaman');
}

// Check if an item is Paladin-only (excludes 'all' class items)
export function isPaladinOnly(item: GearItem): boolean {
  return item.classes.length === 1 && item.classes.includes('paladin');
}

// Check if an item is usable by the given player class (for bad luck protection)
export function isPlayerClassUsable(item: GearItem, playerClass: PlayerHealerClass): boolean {
  return item.classes.includes(playerClass) || item.classes.includes('all');
}

// Filter items based on faction - removes faction-exclusive items that shouldn't drop
// Alliance: Remove Shaman-only items (Shamans don't exist in Alliance)
// Horde: Remove Paladin-only items (Paladins don't exist in Horde)
export function filterItemsByFaction(itemIds: string[], faction: Faction): string[] {
  return itemIds.filter(itemId => {
    const item = ALL_ITEMS[itemId];
    if (!item) return true; // Keep unknown items

    if (faction === 'alliance') {
      // Alliance can't use Shaman-only items
      return !isShamanOnly(item);
    } else {
      // Horde can't use Paladin-only items
      return !isPaladinOnly(item);
    }
  });
}

// Roll loot from a boss's table with bad luck protection
// badLuckCounter: how many kills since last player class loot (0 = just got one)
// faction: determines which faction-exclusive items can drop
// playerClass: the player's healer class (paladin/shaman) for bad luck protection
// Returns: { items, hadPlayerClassLoot, legendaryMaterial } so caller can update state
export function rollBossLoot(
  bossId: string,
  badLuckCounter: number = 0,
  faction: Faction = 'alliance',
  playerClass: PlayerHealerClass = 'paladin'
): {
  items: GearItem[],
  hadPlayerClassLoot: boolean,
  legendaryMaterial: LegendaryMaterial | null
} {
  const table = BOSS_LOOT_TABLES[bossId];
  if (!table) return { items: [], hadPlayerClassLoot: false, legendaryMaterial: null };

  const droppedItems: GearItem[] = [];
  // Filter out faction-exclusive items that shouldn't drop
  const availableItems = filterItemsByFaction([...table.items], faction);

  // Check for legendary material drop first
  let legendaryMaterial: LegendaryMaterial | null = null;
  if (table.legendaryMaterial) {
    const material = LEGENDARY_MATERIALS[table.legendaryMaterial];
    if (material && Math.random() < material.dropChance) {
      legendaryMaterial = material;
    }
  }

  // Bad luck protection threshold - after 3 kills with no player class loot, guarantee one
  const BAD_LUCK_THRESHOLD = 3;
  const needsProtection = badLuckCounter >= BAD_LUCK_THRESHOLD;

  // If bad luck protection triggered, try to ensure a player class item drops first
  if (needsProtection) {
    // Find player class usable items in this (already faction-filtered) loot table
    const playerClassItems = availableItems.filter(itemId => {
      const item = ALL_ITEMS[itemId];
      return item && isPlayerClassUsable(item, playerClass);
    });

    if (playerClassItems.length > 0) {
      // Pick a random player class item as guaranteed drop
      const guaranteedItemId = playerClassItems[Math.floor(Math.random() * playerClassItems.length)];
      const guaranteedItem = ALL_ITEMS[guaranteedItemId];
      if (guaranteedItem) {
        droppedItems.push(guaranteedItem);
        // Remove from available pool
        const idx = availableItems.indexOf(guaranteedItemId);
        if (idx > -1) availableItems.splice(idx, 1);
      }
    }
  }

  // Roll remaining items normally
  const remainingDrops = table.dropCount - droppedItems.length;
  for (let i = 0; i < remainingDrops && availableItems.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableItems.length);
    const itemId = availableItems.splice(randomIndex, 1)[0];
    const item = ALL_ITEMS[itemId];
    if (item) {
      droppedItems.push(item);
    }
  }

  // Check if any dropped item is usable by the player's class
  const hadPlayerClassLoot = droppedItems.some(item => isPlayerClassUsable(item, playerClass));

  return { items: droppedItems, hadPlayerClassLoot, legendaryMaterial };
}

// Get DKP reward for killing a boss
export function getBossDKPReward(bossId: string): number {
  return BOSS_LOOT_TABLES[bossId]?.dkpReward || 10;
}
