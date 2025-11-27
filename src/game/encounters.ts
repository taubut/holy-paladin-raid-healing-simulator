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

  // =========================================================================
  // BLACKWING LAIR DEBUFFS
  // =========================================================================

  // Razorgore the Untamed
  conflagration: {
    id: 'conflagration',
    name: 'Conflagration',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_incinerate.jpg',
    maxDuration: 10,
    type: 'magic',
    damagePerTick: 150,
    tickInterval: 2,
  },

  // Vaelastrasz the Corrupt - THE signature BWL debuff
  burning_adrenaline: {
    id: 'burning_adrenaline',
    name: 'Burning Adrenaline',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_unholyfrenzy.jpg',
    maxDuration: 20,
    type: 'magic', // Undispellable in reality, but magic for consistency
    damagePerTick: 500, // Increasing damage until death
    tickInterval: 1,
  },
  essence_of_the_red: {
    id: 'essence_of_the_red',
    name: 'Essence of the Red',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_dragon_red.jpg',
    maxDuration: 180,
    type: 'magic',
    damagePerTick: 0, // Buff that gives unlimited mana - no damage
  },

  // Broodlord Lashlayer
  mortal_strike: {
    id: 'mortal_strike',
    name: 'Mortal Strike',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_warrior_savageblow.jpg',
    maxDuration: 5,
    type: 'disease', // Cleansable
    damagePerTick: 0, // 50% healing reduction effect - simulated
  },
  blast_wave_broodlord: {
    id: 'blast_wave_broodlord',
    name: 'Blast Wave',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_excorcism_02.jpg',
    maxDuration: 6,
    type: 'magic',
    damagePerTick: 100,
    tickInterval: 1,
  },
  knock_away: {
    id: 'knock_away',
    name: 'Knock Away',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_gauntlets_05.jpg',
    maxDuration: 2,
    type: 'magic',
    damagePerTick: 0, // Threat reduction
  },

  // Drake debuffs (Firemaw, Ebonroc, Flamegor)
  wing_buffet_bwl: {
    id: 'wing_buffet_bwl',
    name: 'Wing Buffet',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_dragonflightblue_wingbuffet.jpg',
    maxDuration: 3,
    type: 'magic',
    damagePerTick: 0, // Knockback + threat reduction
  },
  flame_buffet: {
    id: 'flame_buffet',
    name: 'Flame Buffet',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_flameshock.jpg',
    maxDuration: 20,
    type: 'magic',
    damagePerTick: 150, // Stacking fire vulnerability
    tickInterval: 3,
  },
  shadow_flame: {
    id: 'shadow_flame',
    name: 'Shadow Flame',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_incinerate.jpg',
    maxDuration: 4,
    type: 'magic',
    damagePerTick: 1000, // MASSIVE damage - need Onyxia Scale Cloak!
    tickInterval: 2,
  },
  shadow_of_ebonroc: {
    id: 'shadow_of_ebonroc',
    name: 'Shadow of Ebonroc',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_gathershadows.jpg',
    maxDuration: 8,
    type: 'magic',
    damagePerTick: 0, // Heals the boss when tank is healed - tank swap!
  },
  frenzy_bwl: {
    id: 'frenzy_bwl',
    name: 'Frenzy',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_druid_challangingroar.jpg',
    maxDuration: 10,
    type: 'magic', // Hunter can Tranq Shot
    damagePerTick: 0, // Increased attack speed/damage
  },

  // Chromaggus - 5 breath types (random 2 per reset)
  incinerate: {
    id: 'incinerate',
    name: 'Incinerate',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_flamebolt.jpg',
    maxDuration: 6,
    type: 'magic',
    damagePerTick: 400,
    tickInterval: 1,
  },
  corrosive_acid: {
    id: 'corrosive_acid',
    name: 'Corrosive Acid',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_acid_01.jpg',
    maxDuration: 15,
    type: 'magic',
    damagePerTick: 175, // Also reduces armor
    tickInterval: 3,
  },
  frost_burn: {
    id: 'frost_burn',
    name: 'Frost Burn',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_frost_chillingblast.jpg',
    maxDuration: 10,
    type: 'magic',
    damagePerTick: 75, // Also slows attack/cast speed
    tickInterval: 2,
  },
  ignite_flesh: {
    id: 'ignite_flesh',
    name: 'Ignite Flesh',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_fire.jpg',
    maxDuration: 8,
    type: 'magic',
    damagePerTick: 300,
    tickInterval: 1,
  },
  time_lapse: {
    id: 'time_lapse',
    name: 'Time Lapse',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_arcane_portalironforge.jpg',
    maxDuration: 8,
    type: 'magic',
    damagePerTick: 0, // Stun + reduces health/mana
  },
  // Brood Afflictions - signature Chromaggus mechanic
  brood_affliction_red: {
    id: 'brood_affliction_red',
    name: 'Brood Affliction: Red',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_dragon_red.jpg',
    maxDuration: 60,
    type: 'disease',
    damagePerTick: 50,
    tickInterval: 3,
  },
  brood_affliction_green: {
    id: 'brood_affliction_green',
    name: 'Brood Affliction: Green',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_dragon_green.jpg',
    maxDuration: 60,
    type: 'poison',
    damagePerTick: 100, // Nature damage, heals Chromaggus
    tickInterval: 5,
  },
  brood_affliction_blue: {
    id: 'brood_affliction_blue',
    name: 'Brood Affliction: Blue',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_dragon_blue.jpg',
    maxDuration: 60,
    type: 'magic',
    damagePerTick: 0, // Drains mana, slows cast speed
  },
  brood_affliction_black: {
    id: 'brood_affliction_black',
    name: 'Brood Affliction: Black',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_dragon_black.jpg',
    maxDuration: 60,
    type: 'curse',
    damagePerTick: 75, // Fire damage + increases fire damage taken
    tickInterval: 3,
  },
  brood_affliction_bronze: {
    id: 'brood_affliction_bronze',
    name: 'Brood Affliction: Bronze',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_dragon_bronze.jpg',
    maxDuration: 4,
    type: 'magic', // 4 second stun
    damagePerTick: 0,
  },

  // Nefarian - Final Boss
  shadowflame_nef: {
    id: 'shadowflame_nef',
    name: 'Shadowflame',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_fire_incinerate.jpg',
    maxDuration: 4,
    type: 'magic',
    damagePerTick: 800, // Massive if no Onyxia Scale Cloak!
    tickInterval: 1,
  },
  veil_of_shadow: {
    id: 'veil_of_shadow',
    name: 'Veil of Shadow',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_gathershadows.jpg',
    maxDuration: 30,
    type: 'magic',
    damagePerTick: 0, // 75% healing reduction - MUST dispel!
  },
  fear_nef: {
    id: 'fear_nef',
    name: 'Fear',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_possession.jpg',
    maxDuration: 4,
    type: 'magic',
    damagePerTick: 0,
  },
  // Class calls - unique debuffs for each class
  class_call_warrior: {
    id: 'class_call_warrior',
    name: 'Warrior Call',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_warrior_sunder.jpg',
    maxDuration: 5,
    type: 'magic',
    damagePerTick: 0, // Forces Berserker Stance (take 10% more damage)
  },
  class_call_paladin: {
    id: 'class_call_paladin',
    name: 'Paladin Call',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_sealofwisdom.jpg',
    maxDuration: 5,
    type: 'magic',
    damagePerTick: 0, // Bubbles Nefarian, healing him
  },
  class_call_priest: {
    id: 'class_call_priest',
    name: 'Priest Call',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_guardianspirit.jpg',
    maxDuration: 10,
    type: 'magic',
    damagePerTick: 100, // Direct heals hurt targets instead
    tickInterval: 2,
  },
  class_call_druid: {
    id: 'class_call_druid',
    name: 'Druid Call',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_druid_catform.jpg',
    maxDuration: 5,
    type: 'magic',
    damagePerTick: 0, // Forces cat form, stuck
  },
  class_call_mage: {
    id: 'class_call_mage',
    name: 'Mage Call',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_frost_icestorm.jpg',
    maxDuration: 5,
    type: 'magic',
    damagePerTick: 0, // Polymorphs raid members
  },
  class_call_warlock: {
    id: 'class_call_warlock',
    name: 'Warlock Call',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_demonictactics.jpg',
    maxDuration: 5,
    type: 'magic',
    damagePerTick: 150, // Hellfire effect - damages self and nearby
    tickInterval: 1,
  },
  class_call_hunter: {
    id: 'class_call_hunter',
    name: 'Hunter Call',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_hunter_pet_goto.jpg',
    maxDuration: 5,
    type: 'magic',
    damagePerTick: 0, // Ranged weapons break
  },
  class_call_rogue: {
    id: 'class_call_rogue',
    name: 'Rogue Call',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_rogue_ambush.jpg',
    maxDuration: 5,
    type: 'magic',
    damagePerTick: 0, // Teleports rogues to Nefarian
  },

  // =========================================================================
  // SILITHUS - THUNDERAAN DEBUFFS
  // =========================================================================
  chain_lightning: {
    id: 'chain_lightning',
    name: 'Chain Lightning',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_chainlightning.jpg',
    maxDuration: 4,
    type: 'magic',
    damagePerTick: 250,
    tickInterval: 1,
  },
  thunderclap_thunderaan: {
    id: 'thunderclap_thunderaan',
    name: 'Thunderclap',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_thunderclap.jpg',
    maxDuration: 6,
    type: 'magic',
    damagePerTick: 0, // Stun + initial burst
  },
  storm_cloud: {
    id: 'storm_cloud',
    name: 'Storm Cloud',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_eyeofthestorm.jpg',
    maxDuration: 10,
    type: 'magic',
    damagePerTick: 175,
    tickInterval: 2,
  },
  winds_of_the_windlord: {
    id: 'winds_of_the_windlord',
    name: 'Winds of the Windlord',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_cyclone.jpg',
    maxDuration: 8,
    type: 'magic',
    damagePerTick: 200,
    tickInterval: 2,
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

// =========================================================================
// BLACKWING LAIR - 8 bosses (Nefarian's domain)
// =========================================================================

// Boss 1: Razorgore the Untamed
// 2-phase fight: P1 destroy eggs while controlling Razorgore, P2 kill him
export const RAZORGORE: Boss = {
  id: 'razorgore',
  name: 'Razorgore the Untamed',
  maxHealth: 1000000,
  currentHealth: 1000000,
  enrageTimer: 300,
  currentPhase: 1,
  phaseTransitions: [
    { phase: 2, healthPercent: 99, message: 'All eggs have been destroyed! Razorgore breaks free of his control!' },
  ],
  damageEvents: [
    // Phase 1: Egg destruction - raid takes damage from adds
    { type: 'raid_damage', damage: 200, interval: 3, targetCount: 6, activeInPhases: [1] },
    { type: 'raid_damage', damage: 150, interval: 4, targetCount: 4, activeInPhases: [1] },
    { type: 'random_target', damage: 300, interval: 5, activeInPhases: [1] },
    { type: 'tank_damage', damage: 500, interval: 2.5, activeInPhases: [1] },
    { type: 'debuff', damage: 0, interval: 12, debuffId: 'conflagration', activeInPhases: [1] },
    // Phase 2: Fighting Razorgore directly
    { type: 'tank_damage', damage: 1000, interval: 2, activeInPhases: [2] },
    { type: 'raid_damage', damage: 400, interval: 10, targetCount: 8, activeInPhases: [2] },
    { type: 'raid_damage', damage: 300, interval: 20, targetCount: 15, activeInPhases: [2] },
    { type: 'debuff', damage: 0, interval: 15, debuffId: 'conflagration', activeInPhases: [2] },
    { type: 'random_target', damage: 600, interval: 6, activeInPhases: [2], damageType: 'fire' },
  ],
};

// Boss 2: Vaelastrasz the Corrupt
// Brutal DPS race with Burning Adrenaline (20s death timer on random players)
export const VAELASTRASZ: Boss = {
  id: 'vaelastrasz',
  name: 'Vaelastrasz the Corrupt',
  maxHealth: 1800000,
  currentHealth: 1800000,
  enrageTimer: 180, // Very short - essence of the red makes it a DPS race
  damageEvents: [
    { type: 'tank_damage', damage: 1200, interval: 1.5, damageType: 'fire' },
    { type: 'tank_damage', damage: 2000, interval: 15, damageType: 'fire' },
    { type: 'debuff', damage: 0, interval: 8, debuffId: 'cleave' },
    { type: 'raid_damage', damage: 500, interval: 8, targetCount: 4 },
    // Burning Adrenaline - THE signature mechanic
    { type: 'debuff', damage: 0, interval: 15, debuffId: 'burning_adrenaline' },
    { type: 'raid_damage', damage: 800, interval: 20, targetCount: 10, damageType: 'fire' },
    // Fire Nova - raid-wide pulse
    { type: 'raid_damage', damage: 600, interval: 12, targetCount: 25, damageType: 'fire' },
    // Tail Sweep
    { type: 'raid_damage', damage: 400, interval: 10, targetCount: 5 },
  ],
};

// Boss 3: Broodlord Lashlayer
// Heavy tank damage with Mortal Strike healing reduction
export const BROODLORD: Boss = {
  id: 'broodlord',
  name: 'Broodlord Lashlayer',
  maxHealth: 1500000,
  currentHealth: 1500000,
  enrageTimer: 360,
  damageEvents: [
    { type: 'tank_damage', damage: 1100, interval: 2 },
    { type: 'debuff', damage: 0, interval: 8, debuffId: 'mortal_strike' },
    { type: 'debuff', damage: 0, interval: 15, debuffId: 'knock_away' },
    { type: 'tank_damage', damage: 1500, interval: 15 },
    // Blast Wave
    { type: 'debuff', damage: 0, interval: 12, debuffId: 'blast_wave_broodlord' },
    { type: 'raid_damage', damage: 700, interval: 12, targetCount: 12, damageType: 'fire' },
    // Cleave
    { type: 'raid_damage', damage: 400, interval: 6, targetCount: 3 },
    { type: 'random_target', damage: 350, interval: 5 },
  ],
};

// Boss 4: Firemaw
// Stacking Flame Buffet - must LoS to reset stacks
export const FIREMAW: Boss = {
  id: 'firemaw',
  name: 'Firemaw',
  maxHealth: 1600000,
  currentHealth: 1600000,
  enrageTimer: 420,
  damageEvents: [
    { type: 'tank_damage', damage: 1000, interval: 2 },
    { type: 'tank_damage', damage: 800, interval: 4 },
    // Wing Buffet
    { type: 'debuff', damage: 0, interval: 18, debuffId: 'wing_buffet_bwl' },
    { type: 'raid_damage', damage: 350, interval: 18, targetCount: 6 },
    // Flame Buffet - STACKING debuff
    { type: 'debuff', damage: 0, interval: 5, debuffId: 'flame_buffet' },
    { type: 'raid_damage', damage: 250, interval: 5, targetCount: 20, damageType: 'fire' },
    // Shadow Flame - need Onyxia Scale Cloak
    { type: 'debuff', damage: 0, interval: 25, debuffId: 'shadow_flame', targetCount: 5 },
    { type: 'raid_damage', damage: 1500, interval: 25, targetCount: 5, damageType: 'shadow' },
    // Tail Sweep
    { type: 'raid_damage', damage: 400, interval: 12, targetCount: 4 },
  ],
};

// Boss 5: Ebonroc
// Shadow of Ebonroc - healing the tank heals the boss (tank swap required)
export const EBONROC: Boss = {
  id: 'ebonroc',
  name: 'Ebonroc',
  maxHealth: 1600000,
  currentHealth: 1600000,
  enrageTimer: 420,
  damageEvents: [
    { type: 'tank_damage', damage: 1100, interval: 2 },
    { type: 'tank_damage', damage: 900, interval: 4 },
    // Shadow of Ebonroc - signature mechanic
    { type: 'debuff', damage: 0, interval: 15, debuffId: 'shadow_of_ebonroc' },
    { type: 'tank_damage', damage: 600, interval: 15 },
    // Wing Buffet
    { type: 'debuff', damage: 0, interval: 20, debuffId: 'wing_buffet_bwl' },
    { type: 'raid_damage', damage: 350, interval: 20, targetCount: 5 },
    // Shadow Flame
    { type: 'debuff', damage: 0, interval: 28, debuffId: 'shadow_flame', targetCount: 4 },
    { type: 'raid_damage', damage: 1400, interval: 28, targetCount: 4, damageType: 'shadow' },
    // Tail Sweep
    { type: 'raid_damage', damage: 400, interval: 10, targetCount: 4 },
  ],
};

// Boss 6: Flamegor
// Frenzy - increased damage, Tranq Shot required
export const FLAMEGOR: Boss = {
  id: 'flamegor',
  name: 'Flamegor',
  maxHealth: 1600000,
  currentHealth: 1600000,
  enrageTimer: 420,
  damageEvents: [
    { type: 'tank_damage', damage: 1000, interval: 2 },
    { type: 'tank_damage', damage: 800, interval: 4 },
    // Frenzy - big damage increase
    { type: 'debuff', damage: 0, interval: 20, debuffId: 'frenzy_bwl' },
    { type: 'tank_damage', damage: 1800, interval: 20 },
    // Fire Nova - raid-wide
    { type: 'raid_damage', damage: 450, interval: 10, targetCount: 25, damageType: 'fire' },
    // Wing Buffet
    { type: 'debuff', damage: 0, interval: 22, debuffId: 'wing_buffet_bwl' },
    { type: 'raid_damage', damage: 350, interval: 22, targetCount: 5 },
    // Shadow Flame
    { type: 'debuff', damage: 0, interval: 30, debuffId: 'shadow_flame', targetCount: 4 },
    { type: 'raid_damage', damage: 1400, interval: 30, targetCount: 4, damageType: 'shadow' },
    // Tail Sweep
    { type: 'raid_damage', damage: 400, interval: 12, targetCount: 4 },
  ],
};

// Boss 7: Chromaggus
// 5 Brood Afflictions - different dispel types, 2 random breath attacks
export const CHROMAGGUS: Boss = {
  id: 'chromaggus',
  name: 'Chromaggus',
  maxHealth: 2200000,
  currentHealth: 2200000,
  enrageTimer: 600,
  currentPhase: 1,
  phaseTransitions: [
    { phase: 2, healthPercent: 20, message: 'Chromaggus goes into a frenzy! He is now ENRAGED!' },
  ],
  damageEvents: [
    // Standard melee
    { type: 'tank_damage', damage: 900, interval: 2, activeInPhases: [1] },
    { type: 'tank_damage', damage: 1400, interval: 2, activeInPhases: [2] },
    // Breath attacks (simulating 2 random breaths)
    { type: 'raid_damage', damage: 600, interval: 15, targetCount: 20, damageType: 'fire' },
    { type: 'debuff', damage: 0, interval: 15, debuffId: 'incinerate' },
    { type: 'raid_damage', damage: 300, interval: 18, targetCount: 25, damageType: 'arcane' },
    { type: 'debuff', damage: 0, interval: 18, debuffId: 'time_lapse' },
    // Brood Afflictions - multiple debuff types
    { type: 'debuff', damage: 0, interval: 10, debuffId: 'brood_affliction_red' },
    { type: 'debuff', damage: 0, interval: 12, debuffId: 'brood_affliction_green' },
    { type: 'debuff', damage: 0, interval: 14, debuffId: 'brood_affliction_blue' },
    { type: 'debuff', damage: 0, interval: 16, debuffId: 'brood_affliction_black' },
    { type: 'debuff', damage: 0, interval: 20, debuffId: 'brood_affliction_bronze' },
    // Frenzy
    { type: 'debuff', damage: 0, interval: 25, debuffId: 'frenzy_bwl' },
    { type: 'tank_damage', damage: 1500, interval: 25, activeInPhases: [1] },
    { type: 'tank_damage', damage: 2200, interval: 25, activeInPhases: [2] },
    { type: 'random_target', damage: 500, interval: 8, damageType: 'shadow' },
  ],
};

// Boss 8: Nefarian (Final Boss)
// 3-phase fight: P1 adds, P2 Nefarian with class calls, P3 bone constructs
export const NEFARIAN: Boss = {
  id: 'nefarian',
  name: 'Nefarian',
  maxHealth: 3200000,
  currentHealth: 3200000,
  enrageTimer: 900,
  currentPhase: 1,
  phaseTransitions: [
    { phase: 2, healthPercent: 99, message: 'Nefarian lands! "Enough! Now you vermin shall feel the force of my anger!"' },
    { phase: 3, healthPercent: 20, message: 'Bone Constructs rise from the fallen! "Impossible! Rise, my fallen minions!"' },
  ],
  damageEvents: [
    // PHASE 1: Drakonid Adds
    { type: 'tank_damage', damage: 700, interval: 2, activeInPhases: [1] },
    { type: 'raid_damage', damage: 300, interval: 4, targetCount: 8, activeInPhases: [1] },
    { type: 'random_target', damage: 400, interval: 3, activeInPhases: [1], damageType: 'fire' },
    { type: 'raid_damage', damage: 250, interval: 5, targetCount: 6, activeInPhases: [1], damageType: 'shadow' },
    // PHASE 2: Nefarian (100% - 20%)
    { type: 'tank_damage', damage: 1300, interval: 2, activeInPhases: [2] },
    { type: 'debuff', damage: 0, interval: 6, debuffId: 'cleave', activeInPhases: [2] },
    { type: 'raid_damage', damage: 500, interval: 6, targetCount: 4, activeInPhases: [2] },
    // Veil of Shadow - 75% healing reduction
    { type: 'debuff', damage: 0, interval: 20, debuffId: 'veil_of_shadow', activeInPhases: [2] },
    // Shadowflame breath
    { type: 'debuff', damage: 0, interval: 18, debuffId: 'shadowflame_nef', targetCount: 6, activeInPhases: [2] },
    { type: 'raid_damage', damage: 1200, interval: 18, targetCount: 6, activeInPhases: [2], damageType: 'shadow' },
    // Fear
    { type: 'debuff', damage: 0, interval: 30, debuffId: 'fear_nef', targetCount: 10, activeInPhases: [2] },
    // Class Calls
    { type: 'debuff', damage: 0, interval: 25, debuffId: 'class_call_priest', activeInPhases: [2] },
    { type: 'debuff', damage: 0, interval: 35, debuffId: 'class_call_paladin', activeInPhases: [2] },
    { type: 'debuff', damage: 0, interval: 45, debuffId: 'class_call_warlock', activeInPhases: [2] },
    { type: 'debuff', damage: 0, interval: 55, debuffId: 'class_call_mage', activeInPhases: [2] },
    // Tail Sweep
    { type: 'raid_damage', damage: 450, interval: 12, targetCount: 5, activeInPhases: [2] },
    // PHASE 3: Bone Constructs (20% - 0%)
    { type: 'tank_damage', damage: 1500, interval: 1.8, activeInPhases: [3] },
    { type: 'debuff', damage: 0, interval: 5, debuffId: 'cleave', activeInPhases: [3] },
    { type: 'raid_damage', damage: 600, interval: 5, targetCount: 5, activeInPhases: [3] },
    // Bone Constructs attacking raid
    { type: 'raid_damage', damage: 350, interval: 3, targetCount: 10, activeInPhases: [3] },
    { type: 'random_target', damage: 500, interval: 4, activeInPhases: [3] },
    // Continue Shadowflame
    { type: 'debuff', damage: 0, interval: 15, debuffId: 'shadowflame_nef', targetCount: 8, activeInPhases: [3] },
    { type: 'raid_damage', damage: 1400, interval: 15, targetCount: 8, activeInPhases: [3], damageType: 'shadow' },
    // Continue Veil of Shadow
    { type: 'debuff', damage: 0, interval: 18, debuffId: 'veil_of_shadow', activeInPhases: [3] },
    // Fear continues
    { type: 'debuff', damage: 0, interval: 25, debuffId: 'fear_nef', targetCount: 12, activeInPhases: [3] },
    // Continued class calls
    { type: 'debuff', damage: 0, interval: 22, debuffId: 'class_call_priest', activeInPhases: [3] },
  ],
};

// Export all BWL encounters
export const BWL_ENCOUNTERS: Boss[] = [
  RAZORGORE,
  VAELASTRASZ,
  BROODLORD,
  FIREMAW,
  EBONROC,
  FLAMEGOR,
  CHROMAGGUS,
  NEFARIAN,
];

// =========================================================================
// SILITHUS - THUNDERAAN (Hidden boss for Thunderfury questline)
// =========================================================================

// Prince Thunderaan, the Wind Lord
// Unlocked after collecting both Bindings of the Windseeker + killing Firemaw
export const THUNDERAAN_ENCOUNTER: Boss = {
  id: 'thunderaan',
  name: 'Prince Thunderaan, the Wind Lord',
  maxHealth: 3000000,
  currentHealth: 3000000,
  enrageTimer: 600,
  currentPhase: 1,
  phaseTransitions: [
    { phase: 2, healthPercent: 50, message: 'Thunderaan summons Air Elementals! "Feel the fury of the wind!"' },
    { phase: 3, healthPercent: 20, message: 'Thunderaan unleashes the storm! "I AM THE WIND LORD!"' },
  ],
  damageEvents: [
    // PHASE 1: Wind Lord basics (100%-50%)
    { type: 'tank_damage', damage: 1000, interval: 2, activeInPhases: [1], damageType: 'nature' },
    { type: 'debuff', damage: 0, interval: 10, debuffId: 'chain_lightning', targetCount: 3, activeInPhases: [1, 2, 3] },
    { type: 'debuff', damage: 0, interval: 15, debuffId: 'thunderclap_thunderaan', targetCount: 8, activeInPhases: [1, 2, 3] },
    { type: 'raid_damage', damage: 400, interval: 15, targetCount: 8, activeInPhases: [1], damageType: 'nature' },
    // PHASE 2: Air Elemental adds (50%-20%)
    { type: 'tank_damage', damage: 1100, interval: 2, activeInPhases: [2], damageType: 'nature' },
    { type: 'debuff', damage: 0, interval: 8, debuffId: 'storm_cloud', targetCount: 4, activeInPhases: [2, 3] },
    { type: 'random_target', damage: 300, interval: 3, activeInPhases: [2], damageType: 'nature' },
    { type: 'raid_damage', damage: 350, interval: 6, targetCount: 6, activeInPhases: [2], damageType: 'nature' },
    // PHASE 3: Full storm fury (20%-0%)
    { type: 'tank_damage', damage: 1400, interval: 2, activeInPhases: [3], damageType: 'nature' },
    { type: 'debuff', damage: 0, interval: 6, debuffId: 'winds_of_the_windlord', targetCount: 6, activeInPhases: [3] },
    { type: 'raid_damage', damage: 500, interval: 5, targetCount: 10, activeInPhases: [3], damageType: 'nature' },
    { type: 'random_target', damage: 600, interval: 4, activeInPhases: [3], damageType: 'nature' },
  ],
};

export const SILITHUS_ENCOUNTERS: Boss[] = [THUNDERAAN_ENCOUNTER];
