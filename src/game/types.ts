// Classic WoW Holy Paladin Raid Healing Simulator Types

import type { GearItem, LegendaryMaterialId } from './items';

export type WoWClass =
  | 'warrior'
  | 'paladin'
  | 'hunter'
  | 'rogue'
  | 'priest'
  | 'mage'
  | 'warlock'
  | 'druid';

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
}

export interface DamageEvent {
  type: 'tank_damage' | 'raid_damage' | 'random_target' | 'debuff';
  damage: number;
  interval: number;
  targetCount?: number;
  debuffId?: string;
  // Phase-based damage: only active during specified phases (1, 2, 3)
  // If not specified, event is active in all phases
  activeInPhases?: number[];
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
}

// Class colors matching Classic WoW
export const CLASS_COLORS: Record<WoWClass, string> = {
  warrior: '#C79C6E',
  paladin: '#F58CBA',
  hunter: '#ABD473',
  rogue: '#FFF569',
  priest: '#FFFFFF',
  mage: '#69CCF0',
  warlock: '#9482C9',
  druid: '#FF7D0A',
};
