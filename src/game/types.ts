// Classic WoW Holy Paladin Raid Healing Simulator Types

import type { GearItem, LegendaryMaterialId } from './items';

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
export type PlayerHealerClass = 'paladin' | 'shaman';

// Position zone for Chain Heal bouncing (melee/ranged/tank)
export type PositionZone = 'melee' | 'ranged' | 'tank';

// Totem element types
export type TotemElement = 'earth' | 'fire' | 'water' | 'air';

// Vanilla WoW specs for each class
export type WoWSpec =
  // Warrior specs
  | 'arms' | 'fury' | 'protection_warrior'
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
    { id: 'arms', name: 'Arms', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_warrior_savageblow.jpg' },
    { id: 'fury', name: 'Fury', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_warrior_innerrage.jpg' },
    { id: 'protection_warrior', name: 'Protection', role: 'tank', icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_warrior_defensivestance.jpg' },
  ],
  paladin: [
    { id: 'holy_paladin', name: 'Holy', role: 'healer', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_holybolt.jpg' },
    { id: 'protection_paladin', name: 'Protection', role: 'tank', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_devotionaura.jpg' },
    { id: 'retribution', name: 'Retribution', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_auraoflight.jpg' },
  ],
  hunter: [
    { id: 'beast_mastery', name: 'Beast Mastery', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_hunter_beasttaming.jpg' },
    { id: 'marksmanship', name: 'Marksmanship', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_marksmanship.jpg' },
    { id: 'survival', name: 'Survival', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_hunter_swiftstrike.jpg' },
  ],
  rogue: [
    { id: 'assassination', name: 'Assassination', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_rogue_eviscerate.jpg' },
    { id: 'combat', name: 'Combat', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_backstab.jpg' },
    { id: 'subtlety', name: 'Subtlety', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_stealth.jpg' },
  ],
  priest: [
    { id: 'discipline', name: 'Discipline', role: 'healer', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_powerwordshield.jpg' },
    { id: 'holy_priest', name: 'Holy', role: 'healer', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_guardianspirit.jpg' },
    { id: 'shadow', name: 'Shadow', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_shadowwordpain.jpg' },
  ],
  shaman: [
    { id: 'elemental', name: 'Elemental', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_lightning.jpg' },
    { id: 'enhancement', name: 'Enhancement', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_lightningshield.jpg' },
    { id: 'restoration_shaman', name: 'Restoration', role: 'healer', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_magicimmunity.jpg' },
  ],
  mage: [
    { id: 'arcane', name: 'Arcane', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_magicalsentry.jpg' },
    { id: 'fire_mage', name: 'Fire', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_firebolt02.jpg' },
    { id: 'frost_mage', name: 'Frost', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_frost_frostbolt02.jpg' },
  ],
  warlock: [
    { id: 'affliction', name: 'Affliction', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_deathcoil.jpg' },
    { id: 'demonology', name: 'Demonology', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_metamorphosis.jpg' },
    { id: 'destruction', name: 'Destruction', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_rainoffire.jpg' },
  ],
  druid: [
    { id: 'balance', name: 'Balance', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_starfall.jpg' },
    { id: 'feral_tank', name: 'Feral (Bear)', role: 'tank', icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_racial_bearform.jpg' },
    { id: 'feral_dps', name: 'Feral (Cat)', role: 'dps', icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_druid_catform.jpg' },
    { id: 'restoration', name: 'Restoration', role: 'healer', icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_healingtouch.jpg' },
  ],
};

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
  type: 'magic' | 'poison' | 'disease' | 'curse';
  damagePerTick?: number;
  tickInterval?: number;
}

// Equipment slots for gear
export interface Equipment {
  head: GearItem | null;
  shoulders: GearItem | null;
  chest: GearItem | null;
  waist: GearItem | null;
  legs: GearItem | null;
  hands: GearItem | null;
  wrist: GearItem | null;
  feet: GearItem | null;
  weapon: GearItem | null;
}

// Create empty equipment set
export function createEmptyEquipment(): Equipment {
  return {
    head: null,
    shoulders: null,
    chest: null,
    waist: null,
    legs: null,
    hands: null,
    wrist: null,
    feet: null,
    weapon: null,
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
  isAlive: boolean;
  dps: number;
  group: number;
  equipment: Equipment;
  gearScore: number;
  lastCritHealTime?: number; // Timestamp of last crit heal received (for animation)
  positionZone: PositionZone; // For Chain Heal bouncing (melee/ranged/tank)
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
  type: 'tank_damage' | 'raid_damage' | 'random_target' | 'debuff';
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
}

export interface CombatLogEntry {
  timestamp: number;
  message: string;
  type: 'heal' | 'damage' | 'buff' | 'debuff' | 'system';
  amount?: number;
  isCrit?: boolean;
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
  combatLog: CombatLogEntry[];
  manaPotionCooldown: number;
  divineFavorActive: boolean;
  otherHealersEnabled: boolean;
  otherHealersHealing: number;
  // Loot and gear system
  playerEquipment: Equipment;
  playerDKP: DKPState;
  pendingLoot: GearItem[];
  showLootModal: boolean;
  inspectedMember: RaidMember | null;
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
  // Player bag for storing extra gear
  playerBag: GearItem[]; // Items in the player's inventory bag
  // Five-Second Rule tracking
  lastSpellCastTime: number; // Elapsed time when last spell was cast (for FSR)
  // Raid management and party auras
  raidManagementMode: boolean;  // Toggle for drag-drop raid arrangement mode
  paladinAuraAssignments: PaladinAuraAssignment[];  // Each paladin's chosen aura
  shamanTotemAssignments: ShamanTotemAssignment[];  // Each shaman's chosen totems
  // Mouseover healing - cast spells on whoever the mouse is hovering over
  mouseoverTargetId: string | null;  // ID of raid member currently under the mouse cursor
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
