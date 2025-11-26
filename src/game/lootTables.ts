// Molten Core Boss Loot Tables - Authentic Vanilla WoW
// Each boss drops specific T1 pieces plus shared loot pool items

import { ALL_ITEMS, LEGENDARY_MATERIALS } from './items';
import type { GearItem, LegendaryMaterialId, LegendaryMaterial } from './items';

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
  // LUCIFRON - First boss, drops T1 boots
  // =========================================================================
  lucifron: {
    items: [
      'lawbringer_boots',       // Paladin
      'boots_of_prophecy',      // Priest
      'cenarion_boots',         // Druid
      'arcanist_boots',         // Mage
      'felheart_slippers',      // Warlock
      'giantstalker_boots',     // Hunter
      'sabatons_of_might',      // Warrior
      'nightslayer_boots',      // Rogue
      'sorcerous_dagger',       // Non-set caster
    ],
    dropCount: 2,
    dkpReward: 10,
  },

  // =========================================================================
  // MAGMADAR - Second boss, drops T1 legs
  // =========================================================================
  magmadar: {
    items: [
      'lawbringer_legplates',   // Paladin
      'pants_of_prophecy',      // Priest
      'cenarion_leggings',      // Druid
      'arcanist_leggings',      // Mage
      'felheart_pants',         // Warlock
      'giantstalker_leggings',  // Hunter
      'legplates_of_might',     // Warrior
      'nightslayer_pants',      // Rogue
      'salamander_scale_pants', // Non-set healer
    ],
    dropCount: 2,
    dkpReward: 10,
  },

  // =========================================================================
  // GEHENNAS - Third boss, drops T1 gloves/boots
  // =========================================================================
  gehennas: {
    items: [
      'lawbringer_gauntlets',   // Paladin
      'gloves_of_prophecy',     // Priest
      'cenarion_gloves',        // Druid
      'arcanist_gloves',        // Mage
      'felheart_gloves',        // Warlock
      'giantstalker_gloves',    // Hunter
      'gauntlets_of_might',     // Warrior
      'nightslayer_gloves',     // Rogue
      'sorcerous_dagger',       // Non-set caster
    ],
    dropCount: 2,
    dkpReward: 10,
  },

  // =========================================================================
  // GARR - Fourth boss, drops T1 helm + Left Binding
  // =========================================================================
  garr: {
    items: [
      'lawbringer_helm',        // Paladin
      'circlet_of_prophecy',    // Priest
      'cenarion_helm',          // Druid
      'arcanist_crown',         // Mage
      'felheart_horns',         // Warlock
      'giantstalker_helm',      // Hunter
      'helm_of_might',          // Warrior
      'nightslayer_cover',      // Rogue
      'gutgutter',              // Non-set melee
      'perditions_blade',       // Rogue/Warrior dagger
    ],
    dropCount: 3,
    dkpReward: 15,
    legendaryMaterial: 'bindings_of_the_windseeker_left',
  },

  // =========================================================================
  // BARON GEDDON - Fifth boss, drops T1 shoulders + Right Binding
  // =========================================================================
  baron_geddon: {
    items: [
      'lawbringer_spaulders',   // Paladin
      'mantle_of_prophecy',     // Priest
      'cenarion_spaulders',     // Druid
      'arcanist_mantle',        // Mage
      'felheart_shoulder_pads', // Warlock
      'giantstalker_epaulets',  // Hunter
      'pauldrons_of_might',     // Warrior
      'nightslayer_shoulder_pads', // Rogue
      'staff_of_dominance',     // Non-set caster
    ],
    dropCount: 2,
    dkpReward: 15,
    legendaryMaterial: 'bindings_of_the_windseeker_right',
  },

  // =========================================================================
  // SHAZZRAH - Sixth boss, drops T1 gloves/boots mix
  // =========================================================================
  shazzrah: {
    items: [
      'lawbringer_gauntlets',   // Paladin (alt drop)
      'lawbringer_boots',       // Paladin (alt drop)
      'gloves_of_prophecy',     // Priest
      'cenarion_gloves',        // Druid
      'arcanist_gloves',        // Mage
      'felheart_gloves',        // Warlock
      'fire_runed_grimoire',    // Non-set caster
    ],
    dropCount: 2,
    dkpReward: 15,
  },

  // =========================================================================
  // SULFURON HARBINGER - Seventh boss, drops T1 Bracers/Belts
  // =========================================================================
  sulfuron: {
    items: [
      'lawbringer_bracers',     // Paladin
      'lawbringer_belt',        // Paladin
      'vambraces_of_prophecy',  // Priest
      'girdle_of_prophecy',     // Priest
      'cenarion_bracers',       // Druid
      'cenarion_belt',          // Druid
      'arcanist_bindings',      // Mage
      'arcanist_belt',          // Mage
      'felheart_bracers',       // Warlock
      'felheart_belt',          // Warlock
      'giantstalker_bracers',   // Hunter
      'giantstalker_belt',      // Hunter
      'bracers_of_might',       // Warrior
      'belt_of_might',          // Warrior
      'nightslayer_bracelets',  // Rogue
      'nightslayer_belt',       // Rogue
      'gutgutter',              // Non-set melee weapon
    ],
    dropCount: 2,
    dkpReward: 15,
  },

  // =========================================================================
  // GOLEMAGG - Eighth boss, drops T1 chest
  // =========================================================================
  golemagg: {
    items: [
      'lawbringer_chestguard',  // Paladin
      'robes_of_prophecy',      // Priest
      'cenarion_vestments',     // Druid
      'arcanist_robes',         // Mage
      'felheart_robes',         // Warlock
      'giantstalker_breastplate', // Hunter
      'breastplate_of_might',   // Warrior
      'nightslayer_chestpiece', // Rogue
      'azuresong_mageblade',    // Non-set caster weapon
      'strikers_mark',          // Hunter ranged
    ],
    dropCount: 3,
    dkpReward: 20,
  },

  // =========================================================================
  // MAJORDOMO EXECUTUS - Eighth boss, cache drops
  // =========================================================================
  majordomo: {
    items: [
      'aurastone_hammer',       // Healer weapon
      'azuresong_mageblade',    // Caster weapon
      'staff_of_dominance',     // Caster weapon
      'sorcerous_dagger',       // Caster weapon
      'fire_runed_grimoire',    // Caster offhand
      'gutgutter',              // Melee weapon
    ],
    dropCount: 2,
    dkpReward: 20,
  },

  // =========================================================================
  // RAGNAROS - Final boss, best loot + Eye of Sulfuras
  // =========================================================================
  ragnaros: {
    items: [
      // Best weapons
      'azuresong_mageblade',
      'aurastone_hammer',
      'staff_of_dominance',
      'bonereaver_edge',        // Warrior DPS sword
      'perditions_blade',       // Rogue/Warrior dagger
      // Some T1 pieces as bonus
      'lawbringer_chestguard',
      'robes_of_prophecy',
      'breastplate_of_might',
      'nightslayer_chestpiece',
      // Best non-set
      'salamander_scale_pants',
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
  // ONYXIA'S LAIR
  // =========================================================================
  onyxia: {
    items: [
      // T2 Helms (all classes)
      'judgment_crown',           // Paladin T2 helm
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

// Roll loot from a boss's table with bad luck protection
// badLuckCounter: how many kills since last paladin loot (0 = just got one)
// Returns: { items, hadPaladinLoot, legendaryMaterial } so caller can update state
export function rollBossLoot(bossId: string, badLuckCounter: number = 0): {
  items: GearItem[],
  hadPaladinLoot: boolean,
  legendaryMaterial: LegendaryMaterial | null
} {
  const table = BOSS_LOOT_TABLES[bossId];
  if (!table) return { items: [], hadPaladinLoot: false, legendaryMaterial: null };

  const droppedItems: GearItem[] = [];
  const availableItems = [...table.items];

  // Check for legendary material drop first
  let legendaryMaterial: LegendaryMaterial | null = null;
  if (table.legendaryMaterial) {
    const material = LEGENDARY_MATERIALS[table.legendaryMaterial];
    if (material && Math.random() < material.dropChance) {
      legendaryMaterial = material;
    }
  }

  // Bad luck protection threshold - after 3 kills with no paladin loot, guarantee one
  const BAD_LUCK_THRESHOLD = 3;
  const needsProtection = badLuckCounter >= BAD_LUCK_THRESHOLD;

  // If bad luck protection triggered, try to ensure a paladin item drops first
  if (needsProtection) {
    // Find paladin-usable items in this loot table
    const paladinItems = availableItems.filter(itemId => {
      const item = ALL_ITEMS[itemId];
      return item && isPaladinUsable(item);
    });

    if (paladinItems.length > 0) {
      // Pick a random paladin item as guaranteed drop
      const guaranteedItemId = paladinItems[Math.floor(Math.random() * paladinItems.length)];
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

  // Check if any dropped item is paladin-usable
  const hadPaladinLoot = droppedItems.some(item => isPaladinUsable(item));

  return { items: droppedItems, hadPaladinLoot, legendaryMaterial };
}

// Get DKP reward for killing a boss
export function getBossDKPReward(bossId: string): number {
  return BOSS_LOOT_TABLES[bossId]?.dkpReward || 10;
}
