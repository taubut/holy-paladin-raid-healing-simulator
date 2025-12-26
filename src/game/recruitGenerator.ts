// LFG Recruit Pool Generator
// Generates random recruits for the Franchise Mode LFG system

import type { WoWClass, WoWSpec, Equipment, Faction } from './types';
import { createEmptyEquipment } from './types';
import type { LFGRecruit, PersonalityTraitId, MoraleState } from './franchiseTypes';
import { getRandomTraits } from './franchiseTypes';
import { getPreRaidBisForSpec } from './preRaidBisSets';
import { ALL_ITEMS, type ArmorType, type EquipmentSlot, type GearItem } from './items';
import { canSpecBenefitFrom } from './lootTables';

// Faction-restricted classes (Classic WoW)
// Alliance cannot have Shaman, Horde cannot have Paladin
const ALLIANCE_CLASSES: WoWClass[] = ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'mage', 'warlock', 'druid'];
const HORDE_CLASSES: WoWClass[] = ['warrior', 'shaman', 'hunter', 'rogue', 'priest', 'mage', 'warlock', 'druid'];

// Armor type restrictions by class
const CLASS_ARMOR_TYPES: Record<WoWClass, ArmorType[]> = {
  warrior: ['plate', 'mail', 'leather', 'cloth'],
  paladin: ['plate', 'mail', 'leather', 'cloth'],
  hunter: ['mail', 'leather', 'cloth'],
  shaman: ['mail', 'leather', 'cloth'],
  rogue: ['leather', 'cloth'],
  druid: ['leather', 'cloth'],
  priest: ['cloth'],
  mage: ['cloth'],
  warlock: ['cloth'],
};

// Check if a class can equip an item
function canClassEquip(wowClass: WoWClass, item: GearItem): boolean {
  // Check class restriction
  if (item.classes && !item.classes.includes('all') && !item.classes.includes(wowClass)) {
    return false;
  }
  // Check armor type if applicable
  if (item.armorType && !CLASS_ARMOR_TYPES[wowClass].includes(item.armorType)) {
    return false;
  }
  return true;
}

// Specs that can use 2H weapons (Arms, Fury can dual-wield or 2H, Enhancement, Feral, Retribution)
const TWO_HAND_SPECS: WoWSpec[] = [
  'arms', 'fury', 'enhancement', 'feral_dps', 'feral_tank', 'retribution'
];

// Check if a spec can use a weapon based on weapon type
function canSpecUseWeapon(spec: WoWSpec, item: GearItem): boolean {
  // Only check weapons
  if (item.slot !== 'weapon') return true;

  const weaponType = item.weaponType;
  if (!weaponType) return true; // No weapon type specified, allow

  // 2H weapons can only be used by 2H specs
  if (weaponType === 'two_hand') {
    return TWO_HAND_SPECS.includes(spec);
  }

  return true;
}

// Get equipment based on gear tier, with realistic mix of pre-raid and raid gear
function getEquipmentForTier(spec: WoWSpec, wowClass: WoWClass, tierName: string): Equipment {
  // Pre-raid tiers just use the defined BiS sets
  if (tierName === 'Fresh 60' || tierName === 'Dungeon Geared' || tierName === 'Pre-Raid BiS') {
    return getPreRaidBisForSpec(spec);
  }

  // Get the pre-raid BiS as a baseline (fills all slots)
  const baseEquipment = getPreRaidBisForSpec(spec);

  // Determine item level range and upgrade chance based on tier
  // upgradeChance = how likely each slot is to have a raid upgrade vs pre-raid item
  let minItemLevel: number;
  let maxItemLevel: number;
  let upgradeChance: number;

  switch (tierName) {
    case 'MC Starter':
      // Just started MC - only ~20-35% of slots upgraded
      minItemLevel = 66; maxItemLevel = 72;
      upgradeChance = 0.2 + Math.random() * 0.15;
      break;
    case 'MC Geared':
      // Regular MC raider - ~40-60% of slots upgraded
      minItemLevel = 66; maxItemLevel = 76;
      upgradeChance = 0.4 + Math.random() * 0.2;
      break;
    case 'MC BiS':
      // Full MC BiS - ~70-90% upgraded (some pre-raid items are still BiS)
      minItemLevel = 66; maxItemLevel = 78;
      upgradeChance = 0.7 + Math.random() * 0.2;
      break;
    case 'BWL Ready':
      // Starting BWL - MC BiS with ~20-40% BWL upgrades
      minItemLevel = 72; maxItemLevel = 81;
      upgradeChance = 0.2 + Math.random() * 0.2;
      break;
    case 'BWL Geared':
      // Regular BWL raider - ~50-70% BWL gear
      minItemLevel = 76; maxItemLevel = 83;
      upgradeChance = 0.5 + Math.random() * 0.2;
      break;
    case 'BWL BiS':
      // Full BWL BiS - ~80-95% upgraded
      minItemLevel = 77; maxItemLevel = 100;
      upgradeChance = 0.8 + Math.random() * 0.15;
      break;
    default:
      return baseEquipment;
  }

  // Only BWL BiS tier has a SMALL chance of legendaries (5%)
  const allowLegendaries = tierName === 'BWL BiS' && Math.random() < 0.05;

  // Get available raid tier items for this spec
  const allItems = Object.values(ALL_ITEMS) as GearItem[];
  const raidItems = allItems.filter(item =>
    item.itemLevel >= minItemLevel &&
    item.itemLevel <= maxItemLevel &&
    (allowLegendaries || item.rarity !== 'legendary') && // Legendaries only for top tier, rarely
    canClassEquip(wowClass, item) &&
    canSpecBenefitFrom(spec, item.itemCategory) &&
    canSpecUseWeapon(spec, item) // Check weapon type compatibility (2H vs 1H)
  );

  // Equipment slots to process
  const slots: EquipmentSlot[] = [
    'head', 'neck', 'shoulders', 'back', 'chest', 'wrist',
    'hands', 'waist', 'legs', 'feet', 'ring1', 'ring2',
    'trinket1', 'trinket2', 'weapon', 'offhand', 'ranged'
  ];

  const finalEquipment = createEmptyEquipment();
  const usedItemIds = new Set<string>();

  for (const slot of slots) {
    const baseItem = (baseEquipment as unknown as Record<string, GearItem | null>)[slot];

    // Decide if this slot gets a raid upgrade or keeps pre-raid
    if (Math.random() < upgradeChance) {
      // Try to find a raid item for this slot
      const targetSlot = slot === 'ring2' ? 'ring1' : slot === 'trinket2' ? 'trinket1' : slot;
      let itemsForSlot = raidItems.filter(item =>
        item.slot === targetSlot && !usedItemIds.has(item.id)
      );

      if (itemsForSlot.length > 0) {
        // Pick a random item from available options (weighted toward higher ilvl)
        // Sort by ilvl descending, then pick from top half with some randomness
        itemsForSlot.sort((a, b) => b.itemLevel - a.itemLevel);
        const topHalf = itemsForSlot.slice(0, Math.max(1, Math.ceil(itemsForSlot.length / 2)));
        const selectedItem = topHalf[Math.floor(Math.random() * topHalf.length)];

        (finalEquipment as unknown as Record<string, GearItem | null>)[slot] = selectedItem;
        usedItemIds.add(selectedItem.id);
        continue;
      }
    }

    // No upgrade for this slot - use pre-raid BiS
    if (baseItem) {
      (finalEquipment as unknown as Record<string, GearItem | null>)[slot] = baseItem;
      usedItemIds.add(baseItem.id);
    }
  }

  return finalEquipment;
}

function getClassesForFaction(faction: Faction): WoWClass[] {
  return faction === 'alliance' ? ALLIANCE_CLASSES : HORDE_CLASSES;
}

// Class names for LFG recruits (separate from regular name pool to avoid conflicts)
const LFG_NAMES: Record<WoWClass, string[]> = {
  warrior: [
    'Bloodrage', 'Warborn', 'Steelguard', 'Ironclad', 'Battlecry', 'Warbringer',
    'Shieldbreaker', 'Ragefist', 'Stormfury', 'Axemaster', 'Charger', 'Defender',
    'Gladius', 'Warforge', 'Battlelord', 'Skullcrusher', 'Berserker', 'Champion'
  ],
  paladin: [
    'Lightbringer', 'Holywrath', 'Divineward', 'Justiceborn', 'Sacredlight',
    'Truthseeker', 'Holyshield', 'Crusade', 'Redeemer', 'Faithguard', 'Zealot',
    'Templar', 'Protectron', 'Avenger', 'Illumina', 'Purity', 'Devotion', 'Grace'
  ],
  hunter: [
    'Hawkeye', 'Wildshot', 'Beastmaster', 'Tracker', 'Swiftarrow', 'Stalker',
    'Windrunner', 'Deadeye', 'Marksman', 'Naturecall', 'Huntress', 'Predator',
    'Sharpshoot', 'Rangefind', 'Quickdraw', 'Sureshot', 'Prowler', 'Trapper'
  ],
  rogue: [
    'Shadowstep', 'Nightblade', 'Venomfang', 'Quickknife', 'Darkstrike',
    'Silentdeath', 'Backstab', 'Assassina', 'Poisonmist', 'Stealthmaster',
    'Shadowdance', 'Cutthroat', 'Daggerfin', 'Sneakthief', 'Ambush', 'Slick'
  ],
  priest: [
    'Mindweave', 'Spiritcall', 'Lighttouch', 'Shadowmend', 'Holyfire',
    'Soulkeeper', 'Divineecho', 'Faithhealer', 'Prayerful', 'Spiritbind',
    'Absolution', 'Transcend', 'Innerpeace', 'Sanctuary', 'Blessing', 'Serenity'
  ],
  shaman: [
    'Stormcall', 'Earthshaker', 'Totemweave', 'Thunderclap', 'Spiritwalker',
    'Lavaburst', 'Chainlightning', 'Elemental', 'Ancestral', 'Windshear',
    'Tidecaller', 'Naturewrath', 'Frostshock', 'Firenova', 'Groundstomp', 'Echo'
  ],
  mage: [
    'Frostweave', 'Fireblast', 'Arcanist', 'Spellweaver', 'Icestorm',
    'Flamecaster', 'Blizzardmind', 'Polymorphia', 'Teleporter', 'Brilliance',
    'Pyroblast', 'Frostbolt', 'Intellect', 'Sorcerous', 'Conjure', 'Evocate'
  ],
  warlock: [
    'Felfire', 'Soulstealer', 'Demonbind', 'Shadowflame', 'Corruptor',
    'Doomcaller', 'Hellfire', 'Nethermancer', 'Curseweaver', 'Summoner',
    'Voidsoul', 'Darkpact', 'Demonology', 'Affliction', 'Destruction', 'Siphon'
  ],
  druid: [
    'Wildshape', 'Moonfire', 'Naturecall', 'Bearform', 'Catprowl',
    'Starshine', 'Treehug', 'Rejuvenat', 'Thornclaw', 'Feralheart',
    'Restoration', 'Balance', 'Swiftmend', 'Regrowth', 'Lifebloom', 'Nurture'
  ],
};

// Available specs per class (for random selection)
const CLASS_SPECS: Record<WoWClass, { id: WoWSpec; role: 'tank' | 'healer' | 'dps' }[]> = {
  warrior: [
    { id: 'protection_warrior', role: 'tank' },
    { id: 'fury_prot', role: 'tank' },  // Fury/Prot hybrid tank
    { id: 'fury', role: 'dps' },
    { id: 'arms', role: 'dps' },
  ],
  paladin: [
    { id: 'holy_paladin', role: 'healer' },
    { id: 'protection_paladin', role: 'tank' },
    { id: 'retribution', role: 'dps' },
  ],
  hunter: [
    { id: 'beast_mastery', role: 'dps' },
    { id: 'marksmanship', role: 'dps' },
    { id: 'survival', role: 'dps' },
  ],
  rogue: [
    { id: 'combat', role: 'dps' },
    { id: 'assassination', role: 'dps' },
    { id: 'subtlety', role: 'dps' },
  ],
  priest: [
    { id: 'holy_priest', role: 'healer' },
    { id: 'discipline', role: 'healer' },
    { id: 'shadow', role: 'dps' },
  ],
  shaman: [
    { id: 'restoration_shaman', role: 'healer' },
    { id: 'elemental', role: 'dps' },
    { id: 'enhancement', role: 'dps' },
  ],
  mage: [
    { id: 'frost_mage', role: 'dps' },
    { id: 'fire_mage', role: 'dps' },
    { id: 'arcane', role: 'dps' },
  ],
  warlock: [
    { id: 'affliction', role: 'dps' },
    { id: 'demonology', role: 'dps' },
    { id: 'destruction', role: 'dps' },
  ],
  druid: [
    { id: 'restoration', role: 'healer' },
    { id: 'balance', role: 'dps' },
    { id: 'feral_dps', role: 'dps' },
    { id: 'feral_tank', role: 'tank' },
  ],
};

// Recruit reasons for flavor text
const RECRUIT_REASONS = [
  'Guild disbanded',
  'Looking for raid times that fit',
  'Wants more progression',
  'Drama in previous guild',
  'Friends transferred servers',
  'Returning player',
  'Casual guild not raiding enough',
  'Just hit 60, ready to raid',
  'Rerolled from another server',
  'Old guild leadership quit',
  'Wants to try a new class',
  'Real life schedule changed',
  'Looking for more serious raiding',
  'Previous guild stopped raiding',
];

// Previous guild names for flavor
const PREVIOUS_GUILDS = [
  'Casualties of War',
  'The Forgotten',
  'Night Shift',
  'Weekend Warriors',
  'Eternal Legacy',
  'Dawn of Justice',
  'Nerfed Again',
  'Epic Fail',
  'AFK Alert',
  'Undergeared',
  'Second Best',
  'Almost Famous',
  'Mediocre at Best',
  'Try Hards',
  'Blame the Healer',
  'Stand in Fire',
  'Keyboard Turners',
  'Clickers United',
  'The Pugs',
  null, // Some recruits don't list previous guild
  null,
  null,
];

// Gear tier definitions - determines what level of recruit you get
// Each tier has a gear score range and renown cost range
interface GearTier {
  name: string;
  minGearScore: number;
  maxGearScore: number;
  minRenownCost: number;
  maxRenownCost: number;
  minReputationRequired: number;  // Minimum guild reputation to see recruits of this tier
}

// Gear score = sum of item levels across 17 equipment slots
// Pre-raid: ~60 ilvl avg = ~1020 GS
// MC gear: ~72 ilvl avg = ~1224 GS
// BWL gear: ~81 ilvl avg = ~1377 GS
const GEAR_TIERS: GearTier[] = [
  { name: 'Fresh 60', minGearScore: 800, maxGearScore: 920, minRenownCost: 5, maxRenownCost: 10, minReputationRequired: 0 },
  { name: 'Dungeon Geared', minGearScore: 920, maxGearScore: 1000, minRenownCost: 10, maxRenownCost: 18, minReputationRequired: 0 },
  { name: 'Pre-Raid BiS', minGearScore: 1000, maxGearScore: 1050, minRenownCost: 18, maxRenownCost: 30, minReputationRequired: 20 },
  { name: 'MC Starter', minGearScore: 1050, maxGearScore: 1120, minRenownCost: 30, maxRenownCost: 45, minReputationRequired: 30 },
  { name: 'MC Geared', minGearScore: 1120, maxGearScore: 1200, minRenownCost: 45, maxRenownCost: 65, minReputationRequired: 45 },
  { name: 'MC BiS', minGearScore: 1200, maxGearScore: 1280, minRenownCost: 65, maxRenownCost: 90, minReputationRequired: 60 },
  { name: 'BWL Ready', minGearScore: 1280, maxGearScore: 1330, minRenownCost: 90, maxRenownCost: 120, minReputationRequired: 75 },
  { name: 'BWL Geared', minGearScore: 1330, maxGearScore: 1380, minRenownCost: 120, maxRenownCost: 160, minReputationRequired: 90 },
  { name: 'BWL BiS', minGearScore: 1380, maxGearScore: 1450, minRenownCost: 160, maxRenownCost: 220, minReputationRequired: 100 },
];

// Get available gear tiers based on guild reputation
function getAvailableTiers(reputation: number): GearTier[] {
  return GEAR_TIERS.filter(tier => reputation >= tier.minReputationRequired);
}

// Get tier distribution for pool generation
// Higher reputation unlocks better tiers, but pool still has a mix
function getTierDistribution(reputation: number): { tier: GearTier; weight: number }[] {
  const available = getAvailableTiers(reputation);
  const distribution: { tier: GearTier; weight: number }[] = [];

  // At higher reputations, shift weights toward better tiers
  // Legendary guilds attract elite players!
  const repBonus = Math.floor(reputation / 20); // 0-5 based on rep

  for (let i = 0; i < available.length; i++) {
    const tier = available[i];
    let weight: number;

    // How far from the best tier (0 = best available)
    const distanceFromBest = available.length - 1 - i;

    if (distanceFromBest === 0) {
      // Best available tier - heavily weighted at high rep
      weight = 15 + (repBonus * 5); // 15-40 weight
    } else if (distanceFromBest === 1) {
      // Second best tier
      weight = 12 + (repBonus * 3); // 12-27 weight
    } else if (distanceFromBest === 2) {
      // Third best
      weight = 10 + repBonus; // 10-15 weight
    } else {
      // Lower tiers get less weight as reputation increases
      weight = Math.max(3, 15 - (repBonus * 2) - (distanceFromBest * 2));
    }

    distribution.push({ tier, weight: Math.max(3, weight) });
  }

  return distribution;
}

// Select a random tier based on weighted distribution
function selectRandomTier(distribution: { tier: GearTier; weight: number }[]): GearTier {
  const totalWeight = distribution.reduce((sum, d) => sum + d.weight, 0);
  let random = Math.random() * totalWeight;

  for (const { tier, weight } of distribution) {
    random -= weight;
    if (random <= 0) return tier;
  }

  return distribution[0].tier; // Fallback
}

// Calculate renown cost based on gear tier and exact gear score
function calculateRenownCost(gearScore: number, tier: GearTier): number {
  // Linear interpolation within the tier's cost range
  const scoreRange = tier.maxGearScore - tier.minGearScore;
  const costRange = tier.maxRenownCost - tier.minRenownCost;
  const scorePercent = Math.min(1, Math.max(0, (gearScore - tier.minGearScore) / scoreRange));

  return Math.round(tier.minRenownCost + (scorePercent * costRange));
}

// Get minimum reputation required for a recruit (exported for potential future use)
export function getMinReputationRequired(gearScore: number): number {
  // Find the tier this gear score falls into
  for (let i = GEAR_TIERS.length - 1; i >= 0; i--) {
    const tier = GEAR_TIERS[i];
    if (gearScore >= tier.minGearScore) {
      return tier.minReputationRequired;
    }
  }
  return 0;
}

// Generate a single LFG recruit
export function generateLFGRecruit(
  reputation: number,
  usedNames: Set<string>,
  faction: Faction,
  preferredRole?: 'tank' | 'healer' | 'dps',
  forceTier?: GearTier  // Optional: force a specific tier for controlled distribution
): LFGRecruit {
  // Pick random class from faction-appropriate classes
  const factionClasses = getClassesForFaction(faction);
  let wowClass: WoWClass;
  let spec: { id: WoWSpec; role: 'tank' | 'healer' | 'dps' };

  if (preferredRole) {
    // Filter classes that have the preferred role AND are available to this faction
    const classesWithRole = factionClasses.filter(c =>
      CLASS_SPECS[c].some(s => s.role === preferredRole)
    );
    wowClass = classesWithRole[Math.floor(Math.random() * classesWithRole.length)];
    const specsWithRole = CLASS_SPECS[wowClass].filter(s => s.role === preferredRole);
    spec = specsWithRole[Math.floor(Math.random() * specsWithRole.length)];
  } else {
    wowClass = factionClasses[Math.floor(Math.random() * factionClasses.length)];
    const specs = CLASS_SPECS[wowClass];
    spec = specs[Math.floor(Math.random() * specs.length)];
  }

  // Get name (avoid duplicates)
  const names = LFG_NAMES[wowClass];
  const available = names.filter(n => !usedNames.has(n));
  let name: string;
  if (available.length > 0) {
    name = available[Math.floor(Math.random() * available.length)];
  } else {
    // Fallback with number suffix
    const baseName = names[Math.floor(Math.random() * names.length)];
    name = `${baseName}${Math.floor(Math.random() * 100)}`;
  }
  usedNames.add(name);

  // Select gear tier based on reputation (or forced tier)
  const tier = forceTier ?? selectRandomTier(getTierDistribution(reputation));

  // Get appropriate equipment for this tier
  const equipment: Equipment = getEquipmentForTier(spec.id, wowClass, tier.name);

  // Calculate REAL gear score from actual equipment (sum of item levels)
  let gearScore = 0;
  Object.values(equipment).forEach(item => {
    if (item) {
      gearScore += item.itemLevel;
    }
  });

  // Calculate renown cost based on actual gear score and tier
  const renownCost = calculateRenownCost(gearScore, tier);

  // Generate personality traits (2-3 traits)
  const traitCount = Math.random() < 0.3 ? 3 : 2;
  const allTraits = getRandomTraits(traitCount as 2 | 3);

  // Only first trait is visible before recruiting
  const visibleTraits: PersonalityTraitId[] = [allTraits[0]];
  const hiddenTraits: PersonalityTraitId[] = allTraits.slice(1);

  // Initialize morale
  const morale: MoraleState = {
    current: 50 + Math.floor(Math.random() * 20), // 50-70 starting morale
    baseline: 50,
    trend: 'stable',
    lastChangeReason: 'Looking for guild',
    lastChangeAmount: 0,
    lastChangeTimestamp: Date.now(),
  };

  // Availability (1-5 weeks before they join another guild)
  // Higher tier recruits get poached faster
  const baseDuration = tier.minReputationRequired >= 60 ? 2 : tier.minReputationRequired >= 40 ? 3 : 4;
  const weeksUntilGone = baseDuration + Math.floor(Math.random() * 2);
  const availableUntil = Date.now() + (weeksUntilGone * 7 * 24 * 60 * 60 * 1000);

  // Minimum reputation required (based on tier)
  const minReputationRequired = tier.minReputationRequired;

  // Flavor text
  const recruitReason = RECRUIT_REASONS[Math.floor(Math.random() * RECRUIT_REASONS.length)];
  const previousGuild = PREVIOUS_GUILDS[Math.floor(Math.random() * PREVIOUS_GUILDS.length)] ?? undefined;

  return {
    id: `lfg_${wowClass}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name,
    class: wowClass,
    spec: spec.id,
    role: spec.role,
    equipment,
    gearScore,
    personality: allTraits,
    visibleTraits,
    hiddenTraits,
    morale,
    availableUntil,
    weeksUntilGone,
    minReputationRequired,
    renownCost,
    recruitReason,
    previousGuild,
    gearTier: tier.name,  // Store tier name for display
  };
}

// Generate a full LFG pool
export function generateLFGPool(
  count: number,
  reputation: number,
  faction: Faction,
  existingNames?: Set<string>
): LFGRecruit[] {
  const usedNames = existingNames || new Set<string>();
  const recruits: LFGRecruit[] = [];

  // Ensure some role diversity in the pool
  // About 15% tanks, 25% healers, 60% DPS (similar to raid needs)
  const tankCount = Math.floor(count * 0.15);
  const healerCount = Math.floor(count * 0.25);
  const dpsCount = count - tankCount - healerCount;

  // Generate tanks
  for (let i = 0; i < tankCount; i++) {
    recruits.push(generateLFGRecruit(reputation, usedNames, faction, 'tank'));
  }

  // Generate healers
  for (let i = 0; i < healerCount; i++) {
    recruits.push(generateLFGRecruit(reputation, usedNames, faction, 'healer'));
  }

  // Generate DPS
  for (let i = 0; i < dpsCount; i++) {
    recruits.push(generateLFGRecruit(reputation, usedNames, faction, 'dps'));
  }

  // Shuffle the array so roles are mixed
  for (let i = recruits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [recruits[i], recruits[j]] = [recruits[j], recruits[i]];
  }

  // Count by tier for logging
  const tierCounts: Record<string, number> = {};
  for (const r of recruits) {
    const tier = r.gearTier || 'Unknown';
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
  }

  console.log(`[Franchise] Generated ${recruits.length} LFG recruits (Rep: ${reputation}):`, {
    roles: { tanks: tankCount, healers: healerCount, dps: dpsCount },
    tiers: tierCounts,
    avgGearScore: Math.round(recruits.reduce((sum, r) => sum + r.gearScore, 0) / recruits.length),
    avgRenownCost: Math.round(recruits.reduce((sum, r) => sum + r.renownCost, 0) / recruits.length),
    gsRange: {
      min: Math.min(...recruits.map(r => r.gearScore)),
      max: Math.max(...recruits.map(r => r.gearScore)),
    },
  });

  return recruits;
}

// Simple gear score calculation (matches GameEngine.calculateGearScore)
// Gear score = sum of all item levels (exported for potential future use)
export function calculateSimpleGearScore(equipment: Equipment): number {
  let score = 0;

  const slots = Object.keys(equipment) as (keyof Equipment)[];
  for (const slot of slots) {
    const item = equipment[slot];
    if (item) {
      score += item.itemLevel;
    }
  }

  return score;
}

// Generate emergency fill recruits (lower quality, temporary)
export function generateEmergencyRecruit(
  role: 'tank' | 'healer' | 'dps',
  faction: Faction,
  usedNames: Set<string>
): LFGRecruit {
  const recruit = generateLFGRecruit(0, usedNames, faction, role);

  // Mark as emergency fill
  recruit.isEmergencyFill = true;
  recruit.weeksUntilGone = 0; // One raid only
  recruit.availableUntil = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  recruit.recruitReason = 'Emergency fill - one raid only';

  // Emergency fills have slightly lower morale (desperate)
  recruit.morale.current = 40 + Math.floor(Math.random() * 15);

  return recruit;
}
