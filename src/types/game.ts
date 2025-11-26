// Classic WoW Holy Paladin Raid Healing Simulator Types

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
  group: number; // 1-8 for 40-man raid
}

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
  duration: number; // remaining seconds
  maxDuration: number;
  effect?: BuffEffect;
}

export interface BuffEffect {
  healingReceivedBonus?: number; // percentage increase
  holyLightBonus?: number; // flat bonus healing from Blessing of Light
  flashOfLightBonus?: number; // flat bonus healing from Blessing of Light
}

export interface Debuff {
  id: string;
  name: string;
  icon: string;
  duration: number;
  maxDuration: number;
  type: 'magic' | 'poison' | 'disease' | 'curse';
  damagePerTick?: number;
  tickInterval?: number;
}

export interface Spell {
  id: string;
  name: string;
  rank: number;
  icon: string;
  manaCost: number;
  castTime: number; // seconds, 0 for instant
  cooldown: number; // seconds
  currentCooldown: number;
  healAmount: { min: number; max: number };
  range: number;
  spellPowerCoefficient: number;
  isOnGlobalCooldown: boolean;
}

export interface PlayerState {
  currentMana: number;
  maxMana: number;
  manaRegen: number; // per 5 seconds
  spellPower: number;
  critChance: number; // percentage
  globalCooldown: number; // remaining GCD
  isCasting: boolean;
  currentCastSpell: Spell | null;
  castProgress: number; // 0-1
  targetId: string | null;
}

export interface BossEncounter {
  id: string;
  name: string;
  phase: number;
  isActive: boolean;
  enrageTimer: number;
  maxHealth: number;
  currentHealth: number;
  damageEvents: DamageEvent[];
}

export interface DamageEvent {
  type: 'tank_damage' | 'raid_damage' | 'random_target' | 'debuff';
  damage: number;
  interval: number; // seconds between occurrences
  targetCount?: number; // for raid damage
  debuffId?: string;
}

export interface GameState {
  player: PlayerState;
  raid: RaidMember[];
  boss: BossEncounter | null;
  isRunning: boolean;
  elapsedTime: number;
  score: number;
  healingDone: number;
  overhealing: number;
}

export interface CombatLogEntry {
  timestamp: number;
  message: string;
  type: 'heal' | 'damage' | 'buff' | 'debuff' | 'system';
  amount?: number;
  isCrit?: boolean;
}
