// Classic WoW Holy Paladin Raid Healing Simulator Types

import type { GearItem, LegendaryMaterialId, QuestMaterialId, EnchantingMaterialId, EquipmentSlot } from './items';

export type WoWClass =
  | 'warrior'
  | 'paladin'
  | 'hunter'
  | 'rogue'
  | 'priest'
  | 'shaman'
  | 'mage'
  | 'warlock'
  | 'druid';

// Faction types
export type Faction = 'alliance' | 'horde';

// Player healer class (expandable for future classes)
export type PlayerHealerClass = 'paladin' | 'shaman' | 'priest' | 'druid';

// Position zone for Chain Heal bouncing (melee/ranged/tank)
export type PositionZone = 'melee' | 'ranged' | 'tank';

// Totem element types
export type TotemElement = 'earth' | 'fire' | 'water' | 'air';

// Vanilla WoW specs for each class
export type WoWSpec =
  // Warrior specs
  | 'arms' | 'fury' | 'fury_prot' | 'protection_warrior'
  // Paladin specs
  | 'holy_paladin' | 'protection_paladin' | 'retribution'
  // Hunter specs
  | 'beast_mastery' | 'marksmanship' | 'survival'
  // Rogue specs
  | 'assassination' | 'combat' | 'subtlety'
  // Priest specs
  | 'discipline' | 'holy_priest' | 'shadow'
  // Shaman specs
  | 'elemental' | 'enhancement' | 'restoration_shaman'
  // Mage specs
  | 'arcane' | 'fire_mage' | 'frost_mage'
  // Warlock specs
  | 'affliction' | 'demonology' | 'destruction'
  // Druid specs
  | 'balance' | 'feral_tank' | 'feral_dps' | 'restoration';

// Spec definitions with display info and role
export interface SpecDefinition {
  id: WoWSpec;
  name: string;
  role: 'tank' | 'healer' | 'dps';
  icon: string;
}

// All specs organized by class
export const CLASS_SPECS: Record<WoWClass, SpecDefinition[]> = {
  warrior: [
    { id: 'arms', name: 'Arms', role: 'dps', icon: '/icons/ability_warrior_savageblow.jpg' },
    { id: 'fury', name: 'Fury', role: 'dps', icon: '/icons/ability_warrior_innerrage.jpg' },
    { id: 'fury_prot', name: 'Fury/Prot', role: 'tank', icon: '/icons/ability_warrior_innerrage.jpg' },
    { id: 'protection_warrior', name: 'Protection', role: 'tank', icon: '/icons/ability_warrior_defensivestance.jpg' },
  ],
  paladin: [
    { id: 'holy_paladin', name: 'Holy', role: 'healer', icon: '/icons/spell_holy_holybolt.jpg' },
    { id: 'protection_paladin', name: 'Protection', role: 'tank', icon: '/icons/spell_holy_devotionaura.jpg' },
    { id: 'retribution', name: 'Retribution', role: 'dps', icon: '/icons/spell_holy_auraoflight.jpg' },
  ],
  hunter: [
    { id: 'beast_mastery', name: 'Beast Mastery', role: 'dps', icon: '/icons/ability_hunter_beasttaming.jpg' },
    { id: 'marksmanship', name: 'Marksmanship', role: 'dps', icon: '/icons/ability_marksmanship.jpg' },
    { id: 'survival', name: 'Survival', role: 'dps', icon: '/icons/ability_hunter_swiftstrike.jpg' },
  ],
  rogue: [
    { id: 'assassination', name: 'Assassination', role: 'dps', icon: '/icons/ability_rogue_eviscerate.jpg' },
    { id: 'combat', name: 'Combat', role: 'dps', icon: '/icons/ability_backstab.jpg' },
    { id: 'subtlety', name: 'Subtlety', role: 'dps', icon: '/icons/ability_stealth.jpg' },
  ],
  priest: [
    { id: 'discipline', name: 'Discipline', role: 'healer', icon: '/icons/spell_holy_powerwordshield.jpg' },
    { id: 'holy_priest', name: 'Holy', role: 'healer', icon: '/icons/spell_holy_guardianspirit.jpg' },
    { id: 'shadow', name: 'Shadow', role: 'dps', icon: '/icons/spell_shadow_shadowwordpain.jpg' },
  ],
  shaman: [
    { id: 'elemental', name: 'Elemental', role: 'dps', icon: '/icons/spell_nature_lightning.jpg' },
    { id: 'enhancement', name: 'Enhancement', role: 'dps', icon: '/icons/spell_nature_lightningshield.jpg' },
    { id: 'restoration_shaman', name: 'Restoration', role: 'healer', icon: '/icons/spell_nature_magicimmunity.jpg' },
  ],
  mage: [
    { id: 'arcane', name: 'Arcane', role: 'dps', icon: '/icons/spell_holy_magicalsentry.jpg' },
    { id: 'fire_mage', name: 'Fire', role: 'dps', icon: '/icons/spell_fire_firebolt02.jpg' },
    { id: 'frost_mage', name: 'Frost', role: 'dps', icon: '/icons/spell_frost_frostbolt02.jpg' },
  ],
  warlock: [
    { id: 'affliction', name: 'Affliction', role: 'dps', icon: '/icons/spell_shadow_deathcoil.jpg' },
    { id: 'demonology', name: 'Demonology', role: 'dps', icon: '/icons/spell_shadow_metamorphosis.jpg' },
    { id: 'destruction', name: 'Destruction', role: 'dps', icon: '/icons/spell_shadow_rainoffire.jpg' },
  ],
  druid: [
    { id: 'balance', name: 'Balance', role: 'dps', icon: '/icons/spell_nature_starfall.jpg' },
    { id: 'feral_tank', name: 'Feral (Bear)', role: 'tank', icon: '/icons/ability_racial_bearform.jpg' },
    { id: 'feral_dps', name: 'Feral (Cat)', role: 'dps', icon: '/icons/ability_druid_catform.jpg' },
    { id: 'restoration', name: 'Restoration', role: 'healer', icon: '/icons/spell_nature_healingtouch.jpg' },
  ],
};

// Gear compatibility groups - specs in the same group can be swapped without losing gear effectiveness
// Specs NOT in the same group require using the bench system for a full character swap
export const GEAR_COMPATIBLE_SPECS: Record<WoWClass, WoWSpec[][]> = {
  // Warriors: All plate DPS/tank stats are interchangeable enough
  warrior: [['arms', 'fury', 'fury_prot', 'protection_warrior']],
  // Paladins: Holy (healing), Prot (tank), Ret (DPS) all need different gear
  paladin: [['holy_paladin'], ['protection_paladin'], ['retribution']],
  // Hunters: All use agility/AP mail
  hunter: [['beast_mastery', 'marksmanship', 'survival']],
  // Rogues: All use agility leather
  rogue: [['assassination', 'combat', 'subtlety']],
  // Priests: All cloth caster specs can swap freely
  priest: [['discipline', 'holy_priest', 'shadow']],
  // Shamans: Ele/Resto share caster mail, Enhancement is melee
  shaman: [['elemental', 'restoration_shaman'], ['enhancement']],
  // Mages: All caster DPS cloth
  mage: [['arcane', 'fire_mage', 'frost_mage']],
  // Warlocks: All caster DPS cloth
  warlock: [['affliction', 'demonology', 'destruction']],
  // Druids: Balance/Resto share caster leather, Ferals share feral gear
  druid: [['balance', 'restoration'], ['feral_tank', 'feral_dps']],
};

// Check if two specs are gear-compatible (can swap without bench)
export function areSpecsGearCompatible(spec1: WoWSpec, spec2: WoWSpec): boolean {
  for (const classGroups of Object.values(GEAR_COMPATIBLE_SPECS)) {
    for (const group of classGroups) {
      if (group.includes(spec1) && group.includes(spec2)) {
        return true;
      }
    }
  }
  return false;
}

// Get all gear-compatible specs for a given spec (same class only)
export function getGearCompatibleSpecs(wowClass: WoWClass, currentSpec: WoWSpec): WoWSpec[] {
  const groups = GEAR_COMPATIBLE_SPECS[wowClass];
  for (const group of groups) {
    if (group.includes(currentSpec)) {
      return group;
    }
  }
  return [currentSpec]; // Fallback: only compatible with itself
}

// Get default spec for a class/role combination
export function getDefaultSpec(wowClass: WoWClass, role: 'tank' | 'healer' | 'dps'): WoWSpec {
  const specs = CLASS_SPECS[wowClass];
  const matchingSpec = specs.find(s => s.role === role);
  return matchingSpec?.id || specs[0].id;
}

// Get spec definition by ID
export function getSpecById(specId: WoWSpec): SpecDefinition | undefined {
  for (const specs of Object.values(CLASS_SPECS)) {
    const found = specs.find(s => s.id === specId);
    if (found) return found;
  }
  return undefined;
}

// Resource types for different classes
export type ResourceType = 'mana' | 'rage' | 'energy';

// Determine resource type based on class and role
export function getResourceType(wowClass: WoWClass, role: 'tank' | 'healer' | 'dps'): ResourceType {
  switch (wowClass) {
    case 'warrior':
      return 'rage';  // Always rage
    case 'rogue':
      return 'energy';  // Always energy
    case 'druid':
      if (role === 'healer') return 'mana';  // Resto druid
      if (role === 'dps') return 'energy';   // Cat druid (feral DPS)
      if (role === 'tank') return 'rage';    // Bear druid (feral tank)
      return 'mana';  // Moonkin/Balance (though marked as dps, moonkin uses mana)
    default:
      return 'mana';  // All other classes use mana
  }
}

export interface Buff {
  id: string;
  name: string;
  icon: string;
  duration: number;
  maxDuration: number;
  effect?: BuffEffect;
}

// HoT (Heal over Time) effect tracking
export interface ActiveHoT {
  id: string;           // Unique ID for this HoT instance
  spellId: string;      // Which spell (rejuvenation, renew, regrowth_hot)
  spellName: string;    // Display name
  icon: string;         // Icon path
  casterId: string;     // Who cast it (for tracking)
  casterName: string;   // Caster name for combat log
  remainingDuration: number;  // Seconds remaining
  maxDuration: number;        // Total duration for UI
  tickInterval: number;       // Seconds between ticks
  timeSinceLastTick: number;  // Accumulator for tick timing
  healPerTick: number;        // How much each tick heals
}

export interface BuffEffect {
  healingReceivedBonus?: number;
  holyLightBonus?: number;
  flashOfLightBonus?: number;
  staminaBonus?: number;
  intellectBonus?: number;
  spiritBonus?: number;
  armorBonus?: number;
  allStatsBonus?: number;
  manaRegenBonus?: number;
  spellCritBonus?: number;
  attackPowerBonus?: number;
  attackSpeedBonus?: number; // Percentage attack speed increase (e.g., 15 = 15% faster)
  mana?: number; // Flat mana bonus (e.g., Flask of Distilled Wisdom)
  healingPower?: number; // Flat healing power bonus
  // Resistance stats for party auras
  fireResistance?: number;
  frostResistance?: number;
  shadowResistance?: number;
  natureResistance?: number;
  arcaneResistance?: number;
  // Melee crit bonus for Leader of the Pack
  meleeCritBonus?: number;
  // Shaman totem bonuses
  strengthBonus?: number;
  agilityBonus?: number;
  threatReduction?: number;
  fearImmunity?: boolean;
  // Cleansing totem effects
  cleansesPoison?: boolean;
  cleansesDisease?: boolean;
  // Power Infusion bonus
  spellDamageBonus?: number; // Percentage spell damage increase (e.g., 0.20 = 20%)
}

// Consumable buff definition
export interface ConsumableBuff {
  id: string;
  name: string;
  icon: string;
  duration: number;
  effect: BuffEffect;
  role: 'healer' | 'dps' | 'tank' | 'all'; // Who gets this when applied
}

// World buff definition with progression gating
export interface WorldBuff {
  id: string;
  name: string;
  icon: string;
  duration: number;
  effect: BuffEffect;
  unlockBoss?: string; // Boss ID that must be defeated to unlock (null = always available)
  unlockRaid?: string; // Raid name for "Coming Soon" display
  comingSoon?: boolean; // True = show locked with "Coming Soon" message
}

// Party aura definition (paladin auras, moonkin aura, trueshot, etc.)
export interface PartyAura {
  id: string;
  name: string;
  icon: string;
  providerClass: WoWClass;
  providerSpec?: WoWSpec | WoWSpec[];  // Optional spec requirement (can be array for multiple specs)
  effect: BuffEffect;
  isAutomatic: boolean;  // true = auto-apply when class present, false = manual selection (paladin)
  scope: 'party' | 'raid';  // party = group only, raid = all members
}

// Track paladin aura assignments (each paladin chooses their own aura)
export interface PaladinAuraAssignment {
  paladinId: string;  // Member ID of the paladin
  auraId: string | null;  // Selected aura ID or null for no aura
}

// Track shaman totem assignments (each shaman can have one totem per element)
export interface ShamanTotemAssignment {
  shamanId: string;  // Member ID of the shaman
  earthTotemId: string | null;
  fireTotemId: string | null;
  waterTotemId: string | null;
  airTotemId: string | null;
}

// Shaman totem definition
export interface Totem {
  id: string;
  name: string;
  icon: string;
  element: TotemElement;
  manaCost: number;
  duration: number; // Duration in seconds (default 120 = 2 min)
  cooldown: number; // Cooldown in seconds (0 for most totems)
  effect: BuffEffect;
  scope: 'party' | 'raid';
  tickRate?: number; // Seconds between pulses (default 2 for most totems)
}

// Active totem tracking (runtime state) - extends Totem with runtime info
export interface ActiveTotem extends Totem {
  remainingDuration: number;
  lastTickTime: number; // For periodic effects like Healing Stream
  group: number; // Which raid group this totem is buffing
}

// Totem cooldown tracking
export interface TotemCooldown {
  totemId: string;
  remainingCooldown: number;
}

export interface Debuff {
  id: string;
  name: string;
  icon?: string;
  duration: number;
  maxDuration?: number;
  type: 'magic' | 'poison' | 'disease' | 'curse' | 'enrage' | 'physical';
  damagePerTick?: number;
  tickInterval?: number;
  damageType?: DamageType; // For fire/shadow/etc damage reduction
  // Living Bomb mechanic
  explodesOnExpiry?: boolean;
  explosionDamage?: number;
  // Some debuffs cannot be dispelled even if they have a dispellable type
  dispellable?: boolean;
  // Lucifron's Curse - doubles mana costs
  increasesManaCost?: boolean;
  // Dominate Mind - mind control, player attacks raid
  isMindControl?: boolean;
  mcTargetId?: string; // Who the MC'd player is attacking
  // Targeting restrictions
  targetZones?: readonly PositionZone[]; // Only targets these position zones (melee, ranged, tank)
  // Stacking debuffs (like Magma Spit)
  maxStacks?: number;
  stacks?: number; // Current stack count
  // Boss debuffs (like Frenzy)
  isBossDebuff?: boolean;
  // Healing reduction (Gehennas' Curse) - 0.75 = 75% reduction
  healingReduction?: number;
  // Shazzrah's Curse - increases magic damage taken (2.0 = doubles)
  increasesMagicDamageTaken?: number;
  // Deaden Magic - reduces magic damage taken by boss (0.5 = 50% reduction)
  reducesMagicDamage?: number;
  // Wrath of Ragnaros - forces tank swap (can't be dispelled)
  forcesTankSwap?: boolean;
}

// Equipment slots for gear (17 slots total - authentic WoW Classic)
export interface Equipment {
  head: GearItem | null;
  neck: GearItem | null;
  shoulders: GearItem | null;
  back: GearItem | null;
  chest: GearItem | null;
  wrist: GearItem | null;
  hands: GearItem | null;
  waist: GearItem | null;
  legs: GearItem | null;
  feet: GearItem | null;
  ring1: GearItem | null;
  ring2: GearItem | null;
  trinket1: GearItem | null;
  trinket2: GearItem | null;
  weapon: GearItem | null;
  offhand: GearItem | null;
  ranged: GearItem | null;  // Includes librams, totems, idols, wands for casters
}

// Create empty equipment set
export function createEmptyEquipment(): Equipment {
  return {
    head: null,
    neck: null,
    shoulders: null,
    back: null,
    chest: null,
    wrist: null,
    hands: null,
    waist: null,
    legs: null,
    feet: null,
    ring1: null,
    ring2: null,
    trinket1: null,
    trinket2: null,
    weapon: null,
    offhand: null,
    ranged: null,
  };
}

// DKP (Dragon Kill Points) state for loot distribution
export interface DKPState {
  points: number;
  earnedThisRaid: number;
}

// Computed player stats from base + gear
export interface PlayerStats {
  baseSpellPower: number;
  baseMaxMana: number;
  baseCritChance: number;
  totalSpellPower: number;
  totalMaxMana: number;
  totalCritChance: number;
  totalMp5: number;
}

export interface RaidMember {
  id: string;
  name: string;
  class: WoWClass;
  spec: WoWSpec;
  role: 'tank' | 'healer' | 'dps';
  currentHealth: number;
  maxHealth: number;
  buffs: Buff[];
  debuffs: Debuff[];
  activeHoTs: ActiveHoT[]; // Active HoT effects on this member
  isAlive: boolean;
  dps: number;
  group: number;
  equipment: Equipment;
  gearScore: number;
  lastCritHealTime?: number; // Timestamp of last crit heal received (for animation)
  positionZone: PositionZone; // For Chain Heal bouncing (melee/ranged/tank)
  wasInEncounter?: boolean; // Track if they participated in current boss fight (for loot eligibility)
  absorbShield?: number; // Current absorb shield amount (e.g., Power Word: Shield)
  absorbShieldMax?: number; // Max absorb shield amount (for display purposes)
  weakenedSoulDuration?: number; // Weakened Soul debuff duration (prevents PW:S reapplication)
}

// Bench player - sits out of active raid but persists with their own gear
export interface BenchPlayer {
  id: string;              // Unique ID like 'bench_warrior_1234'
  name: string;            // Auto-generated name
  class: WoWClass;
  spec: WoWSpec;
  role: 'tank' | 'healer' | 'dps';
  equipment: Equipment;    // Their own gear, persisted
  gearScore: number;
}

export interface Spell {
  id: string;
  name: string;
  rank?: number;
  icon: string;
  manaCost: number;
  castTime: number;
  cooldown: number;
  currentCooldown: number;
  healAmount: { min: number; max: number };
  range?: number;
  spellPowerCoefficient: number;
  isOnGlobalCooldown: boolean;
  // Chain Heal specific properties
  maxBounces?: number;      // Number of additional targets (3 for Chain Heal)
  bounceReduction?: number; // Healing reduction per bounce (0.5 = 50% in Vanilla)
}

// Damage type for damage reduction calculations
export type DamageType = 'physical' | 'fire' | 'frost' | 'shadow' | 'nature' | 'arcane';

export interface DamageEvent {
  type: 'tank_damage' | 'raid_damage' | 'random_target' | 'debuff' | 'inferno' | 'frenzy' | 'lava_bomb' | 'rain_of_fire' | 'antimagic_pulse' | 'shazzrah_curse' | 'shazzrah_blink' | 'deaden_magic' | 'hand_of_ragnaros' | 'inspire' | 'dark_mending' | 'sulfuron_immolate' | 'golemagg_magma_splash' | 'golemagg_pyroblast' | 'golemagg_earthquake' | 'core_rager_mangle' | 'core_rager_melee' | 'majordomo_teleport' | 'majordomo_elite_melee' | 'majordomo_fire_blast' | 'majordomo_shadow_shock' | 'majordomo_shadow_bolt' | 'majordomo_fireball' | 'majordomo_dark_mending' | 'majordomo_magic_reflection' | 'ragnaros_melee' | 'ragnaros_elemental_fire' | 'ragnaros_wrath' | 'ragnaros_lava_burst' | 'ragnaros_magma_blast' | 'sons_of_flame_melee';
  damage: number;
  interval: number;
  targetCount?: number;
  debuffId?: string;
  // Phase-based damage: only active during specified phases (1, 2, 3)
  // If not specified, event is active in all phases
  activeInPhases?: number[];
  // Damage school for resistance calculations (default: physical)
  damageType?: DamageType;
}

// Phase transition threshold definition
export interface PhaseTransition {
  phase: number;           // Phase number (1, 2, 3, etc.)
  healthPercent: number;   // Transition when health drops below this %
  message: string;         // Combat log message for transition
}

// Boss add (minions like Flamewaker Priests for Sulfuron)
export interface BossAdd {
  id: string;
  name: string;
  maxHealth: number;
  currentHealth: number;
  isAlive: boolean;
}

export interface Boss {
  id: string;
  name: string;
  maxHealth: number;
  currentHealth: number;
  enrageTimer: number;
  damageEvents: DamageEvent[];
  // Optional phase transitions (for multi-phase bosses like Onyxia)
  phaseTransitions?: PhaseTransition[];
  currentPhase?: number;  // Runtime tracking of current phase
  // Boss debuffs (like Frenzy) - runtime state
  isFrenzied?: boolean;
  frenzyEndTime?: number; // When frenzy will be removed by Tranq Shot
  // Shazzrah's Deaden Magic - reduces magic damage taken by 50%
  hasDeadenMagic?: boolean;
  deadenMagicEndTime?: number; // When Deaden Magic will expire or be dispelled
  // Sulfuron Harbinger - adds (Flamewaker Priests)
  adds?: BossAdd[];
  // Sulfuron's Inspire buff
  isInspired?: boolean;
  inspireEndTime?: number;
  // Golemagg tank assignment and swap tracking
  golemaggTanks?: {
    tank1Id: string;
    tank2Id: string;
    coreRagerTankId: string;
    currentMainTank: 1 | 2; // Which tank is currently on Golemagg
    tank1Stacks: number;
    tank2Stacks: number;
    lastSwapTime: number;
    nextSwapThreshold: number; // Starts at 5, increases by 5 each swap (5, 10, 15, etc.)
    ragersLoose: boolean; // True when dog tank is dead and ragers are attacking random DPS
    ragerTarget1: string | null; // Current target for first Core Rager
    ragerTarget2: string | null; // Current target for second Core Rager
  };
  // Flag for bosses that require tank assignment modal
  requiresTankAssignment?: boolean;
  // Majordomo Executus tank assignments and magic reflection tracking
  majordomoTanks?: {
    majordomoTankId: string; // Tank for Majordomo himself (gets Teleport fire damage)
    addTank1Id: string; // Tanks adds 1 & 2
    addTank2Id: string; // Tanks adds 3 & 4
    addTank3Id: string; // Tanks adds 5 & 6
    addTank4Id: string; // Tanks adds 7 & 8
    magicReflectionActive: boolean; // When true, adds have magic reflection shield
    magicReflectionEndTime: number; // When the shield expires
    dpsStoppedTime: number; // When DPS stopped (for forgetful DPS mechanic)
    // Loose adds tracking (when a tank dies, their adds attack random raid members)
    looseAdds1: boolean; // Adds 1 & 2 are loose (tank1 dead)
    looseAdds2: boolean; // Adds 3 & 4 are loose (tank2 dead)
    looseAdds3: boolean; // Adds 5 & 6 are loose (tank3 dead)
    looseAdds4: boolean; // Adds 7 & 8 are loose (tank4 dead)
    looseTarget1a: string | null; // Target for add 1 when loose
    looseTarget1b: string | null; // Target for add 2 when loose
    looseTarget2a: string | null; // Target for add 3 when loose
    looseTarget2b: string | null; // Target for add 4 when loose
    looseTarget3a: string | null; // Target for add 5 when loose
    looseTarget3b: string | null; // Target for add 6 when loose
    looseTarget4a: string | null; // Target for add 7 when loose
    looseTarget4b: string | null; // Target for add 8 when loose
  };
  // Ragnaros tank assignments and phase tracking
  ragnarosTanks?: {
    tank1Id: string; // Main tank
    tank2Id: string; // Off-tank for Wrath swaps
    currentMainTank: 1 | 2; // Which tank is currently tanking
    wrathKnockbackUntil: number; // Time until current tank recovers from Wrath
    submergeTime: number; // Time when Ragnaros will submerge (180s after combat start)
    sonsTimer: number; // Time remaining to kill Sons (90s countdown, -1 if not active)
    sonsKilled: number; // How many Sons have been killed
    hasSubmerged: boolean; // True if Ragnaros has already submerged this fight
    healthBeforeSubmerge: number; // Store Ragnaros health when he submerges
  };
}

export interface CombatLogEntry {
  timestamp: number;
  message: string;
  type: 'heal' | 'damage' | 'buff' | 'debuff' | 'system';
  amount?: number;
  isCrit?: boolean;
}

// AI healer stats for the healing meter
export interface AIHealerStats {
  healingDone: number;
  dispelsDone: number;  // Track dispels for the meter
  name: string;
  class: WoWClass;
  // Mana system for realistic AI healer behavior
  currentMana: number;
  maxMana: number;
  mp5: number;  // Mana per 5 seconds
  manaPotionCooldown: number;  // Cooldown remaining for mana potion
  // Druid-specific cooldowns
  naturesSwiftnessCooldown?: number;  // Nature's Swiftness (3 min cooldown)
  swiftmendCooldown?: number;         // Swiftmend (15 sec cooldown)
  innervateCooldown?: number;         // Innervate (6 min cooldown)
  // Priest-specific cooldowns
  innerFocusCooldown?: number;        // Inner Focus (3 min cooldown)
  innerFocusActive?: boolean;         // Next spell is free + 25% crit
  // Innervate buff from player druid
  innervateActive?: boolean;          // Has Innervate buff (400% mana regen)
  innervateRemainingDuration?: number; // Duration remaining on buff
}

// Multiplayer loot bidding
export interface LootBid {
  playerId: string;
  playerName: string;
  playerClass: WoWClass;
  dkp: number;
  roll: number;        // Random roll for tie-breaking
  timestamp: number;   // When bid was placed
}

export interface LootResult {
  itemId: string;
  itemName: string;
  winnerId: string;
  winnerName: string;
  winnerClass: WoWClass;
  dkpSpent: number;
  roll?: number;       // Show roll if there was a tie
}

export interface GameState {
  raid: RaidMember[];
  boss: Boss | null;
  selectedTargetId: string | null;
  isRunning: boolean;
  elapsedTime: number;
  bossEnraged: boolean;
  playerMana: number;
  maxMana: number;
  spellPower: number;
  critChance: number;
  isCasting: boolean;
  castingSpell: Spell | null;
  castProgress: number;
  globalCooldown: number;
  healingDone: number;
  overhealing: number;
  // Healing meter stats
  dispelsDone: number;                         // Total successful dispels by player
  spellHealing: Record<string, number>;        // Per-spell healing breakdown (spellId -> healing)
  aiHealerStats: Record<string, AIHealerStats>; // Per AI healer stats (healerId -> stats)
  lastEncounterResult: 'victory' | 'wipe' | null; // Result of the last encounter (for showing summary)
  combatLog: CombatLogEntry[];
  manaPotionCooldown: number;
  divineFavorActive: boolean;
  // Priest cooldown states
  innerFocusActive: boolean;           // Next spell is free + 25% crit
  powerInfusionTargetId: string | null; // Who has Power Infusion buff
  powerInfusionDuration: number;        // Remaining duration of PI buff (seconds)
  // Innervate buff state (400% mana regen for 20 seconds)
  innervateActive: boolean;
  innervateRemainingDuration: number;
  innervateTargetId: string | null;    // Who has Innervate buff (raid member ID)
  otherHealersEnabled: boolean;
  otherHealersHealing: number;
  // Loot and gear system
  playerEquipment: Equipment;
  playerDKP: DKPState;
  pendingLoot: GearItem[];
  lootAssignments: Record<string, string>; // itemId -> memberName (for showing who got loot in multiplayer)
  showLootModal: boolean;
  showAuctionHouse: boolean;  // Auction House modal for buying enchants
  inspectedMember: RaidMember | null;
  // Multiplayer loot bidding
  lootBids: Record<string, LootBid[]>;  // itemId -> array of bids
  lootBidTimer: number;                  // Seconds remaining in bid window
  lootResults: LootResult[];             // Results to display
  // Player identity
  playerName: string;
  playerId: string;
  playerBuffs: Buff[];
  // Paladin blessing assignments (which blessings are active, limited by paladin count)
  activePaladinBlessings: string[];
  maxPaladinBlessings: number; // Based on paladin count in raid
  // Raid progression - tracks defeated bosses in current lockout
  defeatedBosses: string[];  // Legacy - kept for backward compatibility
  defeatedBossesByRaid: Record<string, string[]>;  // Per-raid defeated bosses
  raidInProgress: boolean;
  selectedRaidId: string;  // Currently selected raid
  firstKills: string[];  // Boss IDs killed for the first time ever (persisted for world buff unlocks)
  // Consumables and World Buffs
  activeConsumables: string[]; // IDs of active consumables
  activeWorldBuffs: string[]; // IDs of active world buffs
  unlockedWorldBuffs: string[]; // IDs of world buffs player has unlocked (persisted)
  // Bad luck protection
  bossKillsWithoutPaladinLoot: number; // Tracks kills since last paladin-usable drop
  // Legendary materials inventory
  legendaryMaterials: LegendaryMaterialId[]; // Materials the player has collected
  // Quest materials inventory (turn-in items like Head of Onyxia, Head of Nefarian)
  questMaterials: QuestMaterialId[]; // Quest items the player has collected
  // Track which quest rewards have been claimed by the player (can only claim once per character)
  claimedQuestRewards: QuestMaterialId[]; // Which head turn-ins has this character already claimed?
  // Track which quest rewards have been assigned to raid members (each member can only receive once)
  raidMemberQuestRewards: Record<string, QuestMaterialId[]>; // memberId -> claimed quest types
  // Track the most recently obtained quest material (for loot screen notification)
  lastObtainedQuestMaterial: QuestMaterialId | null;
  // Track the most recently obtained legendary material (for loot screen notification)
  lastObtainedLegendaryMaterial: LegendaryMaterialId | null;
  // Player bag for storing extra gear
  playerBag: GearItem[]; // Items in the player's inventory bag
  // Materials bag for enchanting materials (nexus crystals from disenchanting)
  materialsBag: Record<EnchantingMaterialId, number>; // Material ID -> count
  // Five-Second Rule tracking
  lastSpellCastTime: number; // Elapsed time when last spell was cast (for FSR)
  // Raid management and party auras
  raidManagementMode: boolean;  // Toggle for drag-drop raid arrangement mode
  paladinAuraAssignments: PaladinAuraAssignment[];  // Each paladin's chosen aura
  shamanTotemAssignments: ShamanTotemAssignment[];  // Each shaman's chosen totems
  // Mouseover healing - cast spells on whoever the mouse is hovering over
  mouseoverTargetId: string | null;  // ID of raid member currently under the mouse cursor
  mouseoverHealingEnabled: boolean;  // When true, use mouseoverTargetId instead of selectedTargetId
  // Faction and class system
  faction: Faction;
  playerClass: PlayerHealerClass;
  // Shaman-specific state
  activeTotems: ActiveTotem[];         // Max 4 (one per element)
  totemCooldowns: TotemCooldown[];     // Tracking cooldowns for totems like Mana Tide
  naturesSwiftnessActive: boolean;     // Next spell is instant
  naturesSwiftnessCooldown: number;    // 3-minute cooldown tracking
  // Faction-specific progress (each faction maintains separate gear/bag/DKP)
  allianceEquipment: Equipment;
  allianceBag: GearItem[];
  allianceDKP: DKPState;
  hordeEquipment: Equipment;
  hordeBag: GearItem[];
  hordeDKP: DKPState;
  // Hidden boss unlocks
  silithusUnlocked: boolean;      // True when Silithus raid is visible (both bindings + Firemaw kill)
  thunderaanDefeated: boolean;    // True when Thunderaan has been killed (allows Thunderfury crafting)
  // Living Bomb Safe Zone mechanic
  membersInSafeZone: Set<string>; // Member IDs currently in the safe zone
  // Cloud save trigger - set to true when important events happen that should trigger a cloud save
  pendingCloudSave: boolean;
  // Golemagg tank swap warning - displayed as raid warning
  tankSwapWarning: { message: string; type: 'swap' | 'late_swap' | 'stacks_high' } | null;
  // Bench players - roster of players not in active raid
  benchPlayers: BenchPlayer[]; // 5 for 20-man, 10 for 40-man
  // Raid Leader Mode - player manages raid instead of healing
  isRaidLeaderMode: boolean;
  // Weapon slot choice modal - for dual-wield classes when assigning weapons
  pendingWeaponAssignment: {
    item: GearItem;
    memberId: string;
    memberName: string;
    mainHandItem: GearItem | null;
    offHandItem: GearItem | null;
  } | null;
  // Downgrade/sidegrade confirmation modal - warn before replacing better/equal gear
  pendingDowngradeConfirmation: {
    item: GearItem;
    memberId: string;
    memberName: string;
    currentItem: GearItem;
    slot: EquipmentSlot;
  } | null;
}

// Class colors matching Classic WoW
export const CLASS_COLORS: Record<WoWClass, string> = {
  warrior: '#C79C6E',
  paladin: '#F58CBA',
  hunter: '#ABD473',
  rogue: '#FFF569',
  priest: '#FFFFFF',
  shaman: '#0070DE',
  mage: '#69CCF0',
  warlock: '#9482C9',
  druid: '#FF7D0A',
};
