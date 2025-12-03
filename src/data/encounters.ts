import type { BossEncounter, Debuff } from '../types/game';

// Classic WoW style debuffs
export const DEBUFFS: Record<string, Omit<Debuff, 'duration'>> = {
  mortal_strike: {
    id: 'mortal_strike',
    name: 'Mortal Strike',
    icon: '/icons/ability_warrior_savageblow.jpg',
    maxDuration: 5,
    type: 'disease', // Cleansable
    damagePerTick: 0,
  },
  burning_adrenaline: {
    id: 'burning_adrenaline',
    name: 'Burning Adrenaline',
    icon: '/icons/spell_shadow_unholyfrenzy.jpg',
    maxDuration: 10,
    type: 'magic',
    damagePerTick: 200,
    tickInterval: 1,
  },
  shadow_word_pain: {
    id: 'shadow_word_pain',
    name: 'Shadow Word: Pain',
    icon: '/icons/spell_shadow_shadowwordpain.jpg',
    maxDuration: 8,
    type: 'magic',
    damagePerTick: 150,
    tickInterval: 2,
  },
  poison_bolt: {
    id: 'poison_bolt',
    name: 'Poison Bolt',
    icon: '/icons/spell_nature_corrosivebreath.jpg',
    maxDuration: 10,
    type: 'poison',
    damagePerTick: 100,
    tickInterval: 2,
  },
  curse_of_doom: {
    id: 'curse_of_doom',
    name: 'Curse of Doom',
    icon: '/icons/spell_shadow_auraofdarkness.jpg',
    maxDuration: 15,
    type: 'curse', // Paladin can't dispel curses in Classic
    damagePerTick: 0, // Explodes at end
  },
};

// Molten Core style encounters
export const ENCOUNTERS: BossEncounter[] = [
  {
    id: 'lucifron',
    name: 'Lucifron',
    phase: 1,
    isActive: false,
    enrageTimer: 180, // 3 minutes
    maxHealth: 1000000,
    currentHealth: 1000000,
    damageEvents: [
      { type: 'tank_damage', damage: 800, interval: 2 },
      { type: 'raid_damage', damage: 200, interval: 8, targetCount: 5 },
      { type: 'debuff', damage: 0, interval: 12, debuffId: 'shadow_word_pain' },
    ],
  },
  {
    id: 'magmadar',
    name: 'Magmadar',
    phase: 1,
    isActive: false,
    enrageTimer: 240,
    maxHealth: 1200000,
    currentHealth: 1200000,
    damageEvents: [
      { type: 'tank_damage', damage: 1200, interval: 2.5 },
      { type: 'raid_damage', damage: 400, interval: 10, targetCount: 10 },
      { type: 'random_target', damage: 600, interval: 5 },
    ],
  },
  {
    id: 'gehennas',
    name: 'Gehennas',
    phase: 1,
    isActive: false,
    enrageTimer: 180,
    maxHealth: 900000,
    currentHealth: 900000,
    damageEvents: [
      { type: 'tank_damage', damage: 700, interval: 2 },
      { type: 'raid_damage', damage: 300, interval: 6, targetCount: 8 },
      { type: 'debuff', damage: 0, interval: 10, debuffId: 'shadow_word_pain' },
      { type: 'debuff', damage: 0, interval: 15, debuffId: 'poison_bolt' },
    ],
  },
  {
    id: 'garr',
    name: 'Garr',
    phase: 1,
    isActive: false,
    enrageTimer: 300,
    maxHealth: 1500000,
    currentHealth: 1500000,
    damageEvents: [
      { type: 'tank_damage', damage: 900, interval: 2 },
      { type: 'raid_damage', damage: 500, interval: 12, targetCount: 15 },
      { type: 'random_target', damage: 800, interval: 8 },
    ],
  },
  {
    id: 'baron_geddon',
    name: 'Baron Geddon',
    phase: 1,
    isActive: false,
    enrageTimer: 240,
    maxHealth: 1300000,
    currentHealth: 1300000,
    damageEvents: [
      { type: 'tank_damage', damage: 1000, interval: 2 },
      { type: 'raid_damage', damage: 600, interval: 15, targetCount: 20 }, // Inferno
      { type: 'debuff', damage: 0, interval: 20, debuffId: 'burning_adrenaline' },
    ],
  },
  {
    id: 'shazzrah',
    name: 'Shazzrah',
    phase: 1,
    isActive: false,
    enrageTimer: 180,
    maxHealth: 850000,
    currentHealth: 850000,
    damageEvents: [
      { type: 'tank_damage', damage: 600, interval: 1.5 },
      { type: 'raid_damage', damage: 400, interval: 8, targetCount: 12 },
      { type: 'debuff', damage: 0, interval: 10, debuffId: 'curse_of_doom' },
    ],
  },
  {
    id: 'golemagg',
    name: 'Golemagg the Incinerator',
    phase: 1,
    isActive: false,
    enrageTimer: 300,
    maxHealth: 2000000,
    currentHealth: 2000000,
    damageEvents: [
      { type: 'tank_damage', damage: 1100, interval: 2.5 },
      { type: 'raid_damage', damage: 350, interval: 10, targetCount: 8 },
      { type: 'random_target', damage: 700, interval: 6 },
    ],
  },
  {
    id: 'majordomo',
    name: 'Majordomo Executus',
    phase: 1,
    isActive: false,
    enrageTimer: 240,
    maxHealth: 1600000,
    currentHealth: 1600000,
    damageEvents: [
      { type: 'tank_damage', damage: 800, interval: 2 },
      { type: 'raid_damage', damage: 300, interval: 5, targetCount: 6 },
      { type: 'debuff', damage: 0, interval: 8, debuffId: 'shadow_word_pain' },
      { type: 'random_target', damage: 500, interval: 4 },
    ],
  },
  {
    id: 'ragnaros',
    name: 'Ragnaros',
    phase: 1,
    isActive: false,
    enrageTimer: 480,
    maxHealth: 3500000,
    currentHealth: 3500000,
    damageEvents: [
      { type: 'tank_damage', damage: 1500, interval: 3 },
      { type: 'raid_damage', damage: 800, interval: 20, targetCount: 25 }, // Wrath of Ragnaros
      { type: 'random_target', damage: 1000, interval: 8 },
      { type: 'debuff', damage: 0, interval: 25, debuffId: 'burning_adrenaline' },
    ],
  },
];

// Training dummy encounter for practice
export const TRAINING_ENCOUNTER: BossEncounter = {
  id: 'training',
  name: 'Training Dummy',
  phase: 1,
  isActive: false,
  enrageTimer: 600,
  maxHealth: 5000000,
  currentHealth: 5000000,
  damageEvents: [
    { type: 'tank_damage', damage: 400, interval: 3 },
    { type: 'random_target', damage: 300, interval: 5 },
    { type: 'raid_damage', damage: 150, interval: 10, targetCount: 5 },
  ],
};
