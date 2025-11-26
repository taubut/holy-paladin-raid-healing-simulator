import type { Boss, Debuff } from './types';

// Authentic Molten Core debuffs
export const DEBUFFS: Record<string, Omit<Debuff, 'duration'>> = {
  // Lucifron
  impending_doom: {
    id: 'impending_doom',
    name: 'Impending Doom',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_nightofthedead.jpg',
    maxDuration: 10,
    type: 'magic',
    damagePerTick: 200, // Ticks once at end for big damage if not dispelled
    tickInterval: 10,
  },
  lucifrons_curse: {
    id: 'lucifrons_curse',
    name: "Lucifron's Curse",
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_blackplague.jpg',
    maxDuration: 15,
    type: 'curse',
    damagePerTick: 0, // No damage, but represents mana cost increase
  },
  // Magmadar
  panic: {
    id: 'panic',
    name: 'Panic',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_deathscream.jpg',
    maxDuration: 8,
    type: 'magic',
    damagePerTick: 0, // Fear effect - no healing during this
  },
  // Gehennas
  gehennas_curse: {
    id: 'gehennas_curse',
    name: "Gehennas' Curse",
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_curseofmannoroth.jpg',
    maxDuration: 30,
    type: 'curse',
    damagePerTick: 0, // Reduces healing received by 75% - simulated as DoT
  },
  rain_of_fire: {
    id: 'rain_of_fire',
    name: 'Rain of Fire',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_rainoffire.jpg',
    maxDuration: 6,
    type: 'magic',
    damagePerTick: 150,
    tickInterval: 1,
  },
  // Garr
  magma_shackles: {
    id: 'magma_shackles',
    name: 'Magma Shackles',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_fireball.jpg',
    maxDuration: 15,
    type: 'magic',
    damagePerTick: 80,
    tickInterval: 3,
  },
  // Shazzrah
  shazzrahs_curse: {
    id: 'shazzrahs_curse',
    name: "Shazzrah's Curse",
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_curseofsargeras.jpg',
    maxDuration: 20,
    type: 'curse',
    damagePerTick: 100, // Increases magic damage taken - simulated as DoT
    tickInterval: 2,
  },
  // Baron Geddon
  living_bomb: {
    id: 'living_bomb',
    name: 'Living Bomb',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_selfdestruct.jpg',
    maxDuration: 8,
    type: 'magic',
    damagePerTick: 400, // Explodes at end - ticks represent building damage
    tickInterval: 8,
  },
  ignite_mana: {
    id: 'ignite_mana',
    name: 'Ignite Mana',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_incinerate.jpg',
    maxDuration: 10,
    type: 'magic',
    damagePerTick: 200, // Burns mana and deals damage
    tickInterval: 1,
  },
  // Sulfuron
  shadow_word_pain: {
    id: 'shadow_word_pain',
    name: 'Shadow Word: Pain',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_shadowwordpain.jpg',
    maxDuration: 18,
    type: 'magic',
    damagePerTick: 125,
    tickInterval: 3,
  },
  hand_of_ragnaros: {
    id: 'hand_of_ragnaros',
    name: 'Hand of Ragnaros',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_fireball02.jpg',
    maxDuration: 4,
    type: 'magic',
    damagePerTick: 0, // Stun effect
  },
  // Golemagg
  magma_splash: {
    id: 'magma_splash',
    name: 'Magma Splash',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_fire.jpg',
    maxDuration: 10,
    type: 'magic',
    damagePerTick: 100, // Stacking armor debuff simulated as DoT
    tickInterval: 2,
  },
  pyroblast: {
    id: 'pyroblast',
    name: 'Pyroblast',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_fireball02.jpg',
    maxDuration: 12,
    type: 'magic',
    damagePerTick: 175,
    tickInterval: 3,
  },
  // Majordomo
  blast_wave: {
    id: 'blast_wave',
    name: 'Blast Wave',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_excorcism_02.jpg',
    maxDuration: 6,
    type: 'magic',
    damagePerTick: 200,
    tickInterval: 1,
  },
  // Ragnaros
  elemental_fire: {
    id: 'elemental_fire',
    name: 'Elemental Fire',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_flameshock.jpg',
    maxDuration: 8,
    type: 'magic',
    damagePerTick: 300,
    tickInterval: 1,
  },
  wrath_of_ragnaros: {
    id: 'wrath_of_ragnaros',
    name: 'Wrath of Ragnaros',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_fireball02.jpg',
    maxDuration: 1,
    type: 'magic',
    damagePerTick: 0, // Knockback effect - burst damage handled separately
  },
  // Onyxia
  flame_breath: {
    id: 'flame_breath',
    name: 'Flame Breath',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_fire.jpg',
    maxDuration: 8,
    type: 'magic',
    damagePerTick: 150,
    tickInterval: 2,
  },
  bellowing_roar: {
    id: 'bellowing_roar',
    name: 'Bellowing Roar',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_warstomp.jpg',
    maxDuration: 3,
    type: 'magic',
    damagePerTick: 0, // Fear effect - causes lava eruptions in P3
  },
  deep_breath: {
    id: 'deep_breath',
    name: 'Deep Breath',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_mage_firestarter.jpg',
    maxDuration: 4,
    type: 'magic',
    damagePerTick: 500, // MASSIVE fire damage - the iconic Onyxia ability
    tickInterval: 1,
  },
  tail_sweep: {
    id: 'tail_sweep',
    name: 'Tail Sweep',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_monsterscales_05.jpg',
    maxDuration: 2,
    type: 'magic',
    damagePerTick: 0, // Knockback effect - initial damage handled separately
  },
  wing_buffet: {
    id: 'wing_buffet',
    name: 'Wing Buffet',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_dragonflightblue_wingbuffet.jpg',
    maxDuration: 2,
    type: 'magic',
    damagePerTick: 0, // Knockback + threat reduction
  },
  cleave: {
    id: 'cleave',
    name: 'Cleave',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_warrior_cleave.jpg',
    maxDuration: 1,
    type: 'magic',
    damagePerTick: 0, // Instant damage to tank and nearby
  },
  onyxia_fireball: {
    id: 'onyxia_fireball',
    name: 'Fireball',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_flamebolt.jpg',
    maxDuration: 6,
    type: 'magic',
    damagePerTick: 100, // Burning from fireball impact
    tickInterval: 2,
  },
  lava_eruption: {
    id: 'lava_eruption',
    name: 'Lava Eruption',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_volcano.jpg',
    maxDuration: 5,
    type: 'magic',
    damagePerTick: 175, // Standing in lava crack
    tickInterval: 1,
  },
};

// Molten Core encounters with authentic abilities
export const ENCOUNTERS: Boss[] = [
  // Boss 1: Lucifron
  // Signature: Impending Doom (dispel or take big damage), Lucifron's Curse (mana drain curse)
  {
    id: 'lucifron',
    name: 'Lucifron',
    maxHealth: 1000000,
    currentHealth: 1000000,
    enrageTimer: 180,
    damageEvents: [
      { type: 'tank_damage', damage: 600, interval: 2, damageType: 'shadow' }, // Shadow Shock on tank
      { type: 'debuff', damage: 0, interval: 15, debuffId: 'impending_doom' }, // Must dispel!
      { type: 'debuff', damage: 0, interval: 20, debuffId: 'lucifrons_curse' }, // Curse on random
      { type: 'raid_damage', damage: 150, interval: 8, targetCount: 5, damageType: 'shadow' }, // Shadow Shock cleave
    ],
  },
  // Boss 2: Magmadar
  // Signature: Panic (mass fear), Lava Bomb (fire patches), Frenzy (tank buster)
  {
    id: 'magmadar',
    name: 'Magmadar',
    maxHealth: 1200000,
    currentHealth: 1200000,
    enrageTimer: 240,
    damageEvents: [
      { type: 'tank_damage', damage: 900, interval: 2 }, // Normal melee (physical)
      { type: 'tank_damage', damage: 1800, interval: 25 }, // Frenzy burst (physical)
      { type: 'debuff', damage: 0, interval: 30, debuffId: 'panic' }, // Mass fear
      { type: 'raid_damage', damage: 350, interval: 8, targetCount: 8, damageType: 'fire' }, // Lava Bomb AoE
      { type: 'random_target', damage: 500, interval: 6, damageType: 'fire' }, // Lava Bomb direct
    ],
  },
  // Boss 3: Gehennas
  // Signature: Gehennas' Curse (75% healing reduction), Rain of Fire, Shadow Bolt
  {
    id: 'gehennas',
    name: 'Gehennas',
    maxHealth: 900000,
    currentHealth: 900000,
    enrageTimer: 180,
    damageEvents: [
      { type: 'tank_damage', damage: 700, interval: 2 }, // Melee (physical)
      { type: 'debuff', damage: 0, interval: 12, debuffId: 'gehennas_curse' }, // Healing reduction curse
      { type: 'debuff', damage: 0, interval: 10, debuffId: 'rain_of_fire' }, // Rain of Fire DoT
      { type: 'random_target', damage: 800, interval: 5, damageType: 'shadow' }, // Shadow Bolt
      { type: 'raid_damage', damage: 250, interval: 8, targetCount: 6, damageType: 'fire' }, // Rain of Fire splash
    ],
  },
  // Boss 4: Garr
  // Signature: 8 Firesworn adds that explode on death, Magma Shackles, Anti-magic Pulse
  {
    id: 'garr',
    name: 'Garr',
    maxHealth: 1500000,
    currentHealth: 1500000,
    enrageTimer: 300,
    damageEvents: [
      { type: 'tank_damage', damage: 800, interval: 2 }, // Melee (physical)
      { type: 'debuff', damage: 0, interval: 15, debuffId: 'magma_shackles' },
      { type: 'raid_damage', damage: 600, interval: 20, targetCount: 12, damageType: 'fire' }, // Firesworn Explosion
      { type: 'random_target', damage: 400, interval: 4, damageType: 'fire' }, // Add damage (fire)
      { type: 'raid_damage', damage: 200, interval: 10, targetCount: 20, damageType: 'arcane' }, // Anti-magic Pulse
    ],
  },
  // Boss 5: Shazzrah
  // Signature: Blink (teleport + threat wipe), Arcane Explosion, Shazzrah's Curse (magic damage increase)
  {
    id: 'shazzrah',
    name: 'Shazzrah',
    maxHealth: 850000,
    currentHealth: 850000,
    enrageTimer: 180,
    damageEvents: [
      { type: 'tank_damage', damage: 500, interval: 1.5 }, // Fast melee (physical)
      { type: 'debuff', damage: 0, interval: 10, debuffId: 'shazzrahs_curse' }, // Increases magic damage
      { type: 'raid_damage', damage: 400, interval: 3, targetCount: 10, damageType: 'arcane' }, // Arcane Explosion spam
      { type: 'tank_damage', damage: 1200, interval: 20 }, // Blink + new tank (physical)
      { type: 'random_target', damage: 600, interval: 8, damageType: 'arcane' }, // Post-blink chaos
    ],
  },
  // Boss 6: Baron Geddon
  // Signature: Living Bomb (player explodes), Ignite Mana (mana burn), Inferno (pulsing AoE)
  {
    id: 'baron_geddon',
    name: 'Baron Geddon',
    maxHealth: 1300000,
    currentHealth: 1300000,
    enrageTimer: 240,
    damageEvents: [
      { type: 'tank_damage', damage: 900, interval: 2, damageType: 'fire' }, // Fire elemental melee
      { type: 'debuff', damage: 0, interval: 20, debuffId: 'living_bomb' }, // LIVING BOMB! Run away!
      { type: 'debuff', damage: 0, interval: 15, debuffId: 'ignite_mana' }, // Mana burn
      { type: 'raid_damage', damage: 500, interval: 10, targetCount: 15, damageType: 'fire' }, // Inferno pulse
      { type: 'raid_damage', damage: 300, interval: 5, targetCount: 8, damageType: 'fire' }, // Inferno buildup
    ],
  },
  // Boss 7: Sulfuron Harbinger
  // Signature: 4 Flamewaker Priests (heal + SW:P), Hand of Ragnaros (stun)
  {
    id: 'sulfuron',
    name: 'Sulfuron Harbinger',
    maxHealth: 1100000,
    currentHealth: 1100000,
    enrageTimer: 240,
    damageEvents: [
      { type: 'tank_damage', damage: 750, interval: 2 }, // Melee (physical)
      { type: 'debuff', damage: 0, interval: 8, debuffId: 'shadow_word_pain' }, // Priest SW:P
      { type: 'debuff', damage: 0, interval: 25, debuffId: 'hand_of_ragnaros' }, // Stun tank
      { type: 'tank_damage', damage: 1500, interval: 25, damageType: 'fire' }, // Dark Strike during stun
      { type: 'raid_damage', damage: 300, interval: 6, targetCount: 8, damageType: 'fire' }, // Flamewaker damage
      { type: 'random_target', damage: 450, interval: 5, damageType: 'shadow' }, // Shadow Bolt from priests
    ],
  },
  // Boss 8: Golemagg the Incinerator
  // Signature: Magma Splash (stacking armor debuff), Pyroblast, Two Core Rager dogs
  {
    id: 'golemagg',
    name: 'Golemagg the Incinerator',
    maxHealth: 2000000,
    currentHealth: 2000000,
    enrageTimer: 300,
    damageEvents: [
      { type: 'tank_damage', damage: 800, interval: 2 }, // Melee (physical)
      { type: 'debuff', damage: 0, interval: 12, debuffId: 'magma_splash' }, // Stacking debuff
      { type: 'debuff', damage: 0, interval: 18, debuffId: 'pyroblast' }, // Pyroblast DoT
      { type: 'tank_damage', damage: 1400, interval: 15, damageType: 'fire' }, // Fire damage from stacks
      { type: 'raid_damage', damage: 400, interval: 10, targetCount: 8 }, // Earthquake (physical)
      { type: 'random_target', damage: 600, interval: 7, damageType: 'fire' }, // Core Rager fire damage
    ],
  },
  // Boss 9: Majordomo Executus
  // Signature: 4 Elites + 4 Healers, Blast Wave, Teleport to fire pit, Magic Reflection
  {
    id: 'majordomo',
    name: 'Majordomo Executus',
    maxHealth: 1600000,
    currentHealth: 1600000,
    enrageTimer: 240,
    damageEvents: [
      { type: 'tank_damage', damage: 700, interval: 2 }, // Elite melee (physical)
      { type: 'debuff', damage: 0, interval: 10, debuffId: 'blast_wave' }, // Blast Wave
      { type: 'debuff', damage: 0, interval: 15, debuffId: 'shadow_word_pain' }, // Healer SW:P
      { type: 'raid_damage', damage: 350, interval: 5, targetCount: 8, damageType: 'fire' }, // Blast Wave fire
      { type: 'random_target', damage: 800, interval: 12, damageType: 'fire' }, // Teleport fire damage
      { type: 'tank_damage', damage: 1000, interval: 8 }, // Elite Shield Slam (physical)
    ],
  },
  // Boss 10: Ragnaros (Final Boss)
  // Signature: Wrath of Ragnaros (knockback), Elemental Fire, Magma Blast, Sons of Flame submerge
  {
    id: 'ragnaros',
    name: 'Ragnaros',
    maxHealth: 3500000,
    currentHealth: 3500000,
    enrageTimer: 480,
    damageEvents: [
      { type: 'tank_damage', damage: 1200, interval: 2.5, damageType: 'fire' }, // Massive fire melee
      { type: 'debuff', damage: 0, interval: 12, debuffId: 'elemental_fire' }, // Fire DoT on tank
      { type: 'debuff', damage: 0, interval: 30, debuffId: 'wrath_of_ragnaros' }, // Knockback
      { type: 'raid_damage', damage: 600, interval: 8, targetCount: 10, damageType: 'fire' }, // Wrath splash damage
      { type: 'random_target', damage: 1500, interval: 15, damageType: 'fire' }, // Magma Blast (if no melee)
      { type: 'raid_damage', damage: 400, interval: 60, targetCount: 20, damageType: 'fire' }, // Sons of Flame phase
      { type: 'tank_damage', damage: 2000, interval: 45, damageType: 'fire' }, // Lava Splash burst
    ],
  },
];

// Training dummy for practice - mix of damage types for testing resistances
export const TRAINING_ENCOUNTER: Boss = {
  id: 'training',
  name: 'Training Dummy',
  maxHealth: 5000000,
  currentHealth: 5000000,
  enrageTimer: 600,
  damageEvents: [
    { type: 'tank_damage', damage: 400, interval: 3 }, // Physical melee
    { type: 'random_target', damage: 300, interval: 5, damageType: 'fire' }, // Fire blast
    { type: 'raid_damage', damage: 150, interval: 10, targetCount: 5, damageType: 'shadow' }, // Shadow pulse
  ],
};

// =========================================================================
// ONYXIA'S LAIR - Single boss dragon raid
// =========================================================================
// Onyxia is a 3-phase fight (authentic vanilla WoW percentages):
// Phase 1 (100%-65%): Ground phase with cleave, tail sweep, wing buffet, flame breath
// Phase 2 (65%-40%): Air phase - Onyxia flies up, Deep Breath, fireballs, whelps
// Phase 3 (40%-0%): Ground phase with Bellowing Roar fear, lava eruptions from floor

export const ONYXIA_ENCOUNTER: Boss = {
  id: 'onyxia',
  name: 'Onyxia',
  maxHealth: 2500000,  // 2.5M HP
  currentHealth: 2500000,
  enrageTimer: 900,  // 15 minutes (long fight)
  currentPhase: 1,
  phaseTransitions: [
    { phase: 2, healthPercent: 65, message: 'Onyxia takes to the air! "This meaningless exertion bores me!"' },
    { phase: 3, healthPercent: 40, message: 'Onyxia lands with a thunderous crash! "It seems you\'ll need another lesson!"' },
  ],
  damageEvents: [
    // =====================================================
    // PHASE 1: Ground Phase (100% - 65%)
    // Tank her at the back of the room, melee behind her
    // =====================================================
    // Melee attacks + Cleave - hits tank and nearby melee (physical)
    { type: 'tank_damage', damage: 700, interval: 2, activeInPhases: [1] },
    { type: 'debuff', damage: 0, interval: 8, debuffId: 'cleave', activeInPhases: [1] },
    { type: 'raid_damage', damage: 400, interval: 8, targetCount: 3, activeInPhases: [1] },  // Cleave splash (physical)

    // Wing Buffet - frontal knockback, reduces threat (physical)
    { type: 'debuff', damage: 0, interval: 15, debuffId: 'wing_buffet', activeInPhases: [1] },
    { type: 'raid_damage', damage: 350, interval: 15, targetCount: 4, activeInPhases: [1] },  // Wing Buffet (physical)

    // Tail Sweep - hits anyone behind her (physical)
    { type: 'debuff', damage: 0, interval: 12, debuffId: 'tail_sweep', targetCount: 4, activeInPhases: [1] },
    { type: 'raid_damage', damage: 500, interval: 12, targetCount: 4, activeInPhases: [1] },  // Tail Sweep (physical)

    // Flame Breath - massive frontal cone, fire damage
    { type: 'debuff', damage: 0, interval: 20, debuffId: 'flame_breath', targetCount: 2, activeInPhases: [1] },

    // =====================================================
    // PHASE 2: Air Phase (65% - 40%) - DEEP BREATH!
    // She flies to different positions and breathes fire
    // Whelps spawn from eggs along the walls
    // =====================================================
    // No tank damage while flying - she's in the air!

    // DEEP BREATH - The iconic Onyxia ability! Fire damage
    // "Onyxia takes a deep breath..." - GET OUT OF THE WAY!
    { type: 'debuff', damage: 0, interval: 18, debuffId: 'deep_breath', targetCount: 5, activeInPhases: [2] },

    // Fireballs rain down while she's flying - fire damage
    { type: 'debuff', damage: 0, interval: 5, debuffId: 'onyxia_fireball', targetCount: 3, activeInPhases: [2] },
    { type: 'raid_damage', damage: 400, interval: 5, targetCount: 6, activeInPhases: [2], damageType: 'fire' },  // Fireball impact

    // Onyxian Whelps - swarm from the eggs! Fire breath whelps
    { type: 'random_target', damage: 150, interval: 2, activeInPhases: [2], damageType: 'fire' },  // Whelp fire breath
    { type: 'random_target', damage: 150, interval: 3, activeInPhases: [2], damageType: 'fire' },  // More whelps
    { type: 'random_target', damage: 150, interval: 4, activeInPhases: [2], damageType: 'fire' },  // Even more whelps
    { type: 'raid_damage', damage: 200, interval: 6, targetCount: 5, activeInPhases: [2] },  // Whelp melee (physical)

    // =====================================================
    // PHASE 3: Ground Phase (40% - 0%) - CHAOS!
    // She lands and is ANGRY. More abilities, more damage.
    // Bellowing Roar fears the raid, causing lava eruptions
    // =====================================================
    // Harder hitting melee + Cleave (physical)
    { type: 'tank_damage', damage: 900, interval: 2, activeInPhases: [3] },
    { type: 'debuff', damage: 0, interval: 6, debuffId: 'cleave', activeInPhases: [3] },
    { type: 'raid_damage', damage: 500, interval: 6, targetCount: 4, activeInPhases: [3] },  // Cleave splash (physical)

    // Wing Buffet - more frequent in P3 (physical)
    { type: 'debuff', damage: 0, interval: 12, debuffId: 'wing_buffet', activeInPhases: [3] },
    { type: 'raid_damage', damage: 400, interval: 12, targetCount: 5, activeInPhases: [3] },

    // Tail Sweep - still dangerous (physical)
    { type: 'debuff', damage: 0, interval: 10, debuffId: 'tail_sweep', targetCount: 5, activeInPhases: [3] },
    { type: 'raid_damage', damage: 550, interval: 10, targetCount: 5, activeInPhases: [3] },

    // Flame Breath - more frequent and hits more people (fire)
    { type: 'debuff', damage: 0, interval: 15, debuffId: 'flame_breath', targetCount: 3, activeInPhases: [3] },

    // BELLOWING ROAR - AoE Fear! The whole raid runs in terror
    { type: 'debuff', damage: 0, interval: 22, debuffId: 'bellowing_roar', targetCount: 20, activeInPhases: [3] },

    // Lava Eruptions - floor cracks erupt during fear! Fire damage
    { type: 'debuff', damage: 0, interval: 22, debuffId: 'lava_eruption', targetCount: 8, activeInPhases: [3] },
    { type: 'raid_damage', damage: 350, interval: 22, targetCount: 10, activeInPhases: [3], damageType: 'fire' },  // Eruption burst

    // Remaining whelps from Phase 2 still attacking (fire)
    { type: 'random_target', damage: 100, interval: 5, activeInPhases: [3], damageType: 'fire' },
  ],
};

// Export Onyxia as an array for the raid system
export const ONYXIA_ENCOUNTERS: Boss[] = [ONYXIA_ENCOUNTER];

// Rename ENCOUNTERS to MOLTEN_CORE_ENCOUNTERS for clarity (keep ENCOUNTERS as alias for backward compat)
export const MOLTEN_CORE_ENCOUNTERS: Boss[] = ENCOUNTERS;
