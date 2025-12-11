import type { Boss, Debuff } from './types';

// Authentic Molten Core debuffs
export const DEBUFFS: Record<string, Omit<Debuff, 'duration'>> = {
  // Lucifron
  impending_doom: {
    id: 'impending_doom',
    name: 'Impending Doom',
    icon: '/icons/spell_shadow_nightofthedead.jpg',
    maxDuration: 10,
    type: 'magic',
    damagePerTick: 0, // No tick damage - explodes at the end
    explodesOnExpiry: true, // Explodes for 2000 shadow damage if not dispelled
    explosionDamage: 2000,
  },
  lucifrons_curse: {
    id: 'lucifrons_curse',
    name: "Lucifron's Curse",
    icon: '/icons/spell_shadow_blackplague.jpg',
    maxDuration: 20,
    type: 'curse',
    damagePerTick: 0, // No damage, but doubles mana costs - MUST dispel!
    increasesManaCost: true, // Special flag for mana cost doubling
  },
  dominate_mind: {
    id: 'dominate_mind',
    name: 'Dominate Mind',
    icon: '/icons/spell_shadow_shadowworddominate.jpg',
    maxDuration: 15,
    type: 'magic',
    damagePerTick: 0, // MC'd player attacks raid members
    isMindControl: true, // Special flag for mind control behavior
  },
  // Magmadar
  panic: {
    id: 'panic',
    name: 'Panic',
    icon: '/icons/spell_shadow_deathscream.jpg',
    maxDuration: 8,
    type: 'magic',
    damagePerTick: 0, // Fear effect - no healing during this
    targetZones: ['melee', 'tank'] as const, // Only hits melee and tanks, not ranged healers
  },
  lava_bomb: {
    id: 'lava_bomb',
    name: 'Lava Bomb',
    icon: '/icons/spell_fire_selfdestruct.jpg',
    maxDuration: 8,
    type: 'magic',
    dispellable: false, // Cannot be dispelled!
    damagePerTick: 400, // 3200 total over 8 seconds = 400 per tick
    tickInterval: 1,
  },
  magma_spit: {
    id: 'magma_spit',
    name: 'Magma Spit',
    icon: '/icons/spell_fire_meteorstorm.jpg',
    maxDuration: 30,
    type: 'magic',
    damagePerTick: 75, // 75 fire damage every 3 seconds
    tickInterval: 3,
    damageType: 'fire' as const,
    maxStacks: 3, // Can stack up to 3 times
    targetZones: ['melee'] as const, // Only hits melee
  },
  frenzy: {
    id: 'frenzy',
    name: 'Frenzy',
    icon: '/icons/ability_druid_challangingroar.jpg',
    maxDuration: 10, // Lasts until Tranq Shot (simulated after 2 seconds)
    type: 'enrage', // Special type - applied to boss, not raid
    damagePerTick: 0,
    isBossDebuff: true, // This goes on the boss, not raid members
  },
  // Gehennas
  gehennas_curse: {
    id: 'gehennas_curse',
    name: "Gehennas' Curse",
    icon: '/icons/spell_shadow_gathershadows.jpg',
    maxDuration: 30,
    type: 'curse',
    damagePerTick: 0,
    healingReduction: 0.75, // Reduces ALL healing effects by 75%
  },
  rain_of_fire: {
    id: 'rain_of_fire',
    name: 'Rain of Fire',
    icon: '/icons/spell_shadow_rainoffire.jpg',
    maxDuration: 6,
    type: 'magic',
    dispellable: false, // Cannot be dispelled!
    damagePerTick: 700, // 700 damage every 2 seconds
    tickInterval: 2,
    damageType: 'fire' as const,
  },
  shadow_bolt: {
    id: 'shadow_bolt',
    name: 'Shadow Bolt',
    icon: '/icons/spell_shadow_shadowbolt.jpg',
    maxDuration: 0, // Instant damage, no debuff
    type: 'magic',
    damagePerTick: 0,
  },
  // Garr
  magma_shackles: {
    id: 'magma_shackles',
    name: 'Magma Shackles',
    icon: '/icons/spell_nature_earthbind.jpg',
    maxDuration: 15,
    type: 'magic',
    damagePerTick: 80,
    tickInterval: 3,
  },
  eruption: {
    id: 'eruption',
    name: 'Eruption',
    icon: '/icons/spell_fire_volcano.jpg',
    maxDuration: 0,
    type: 'magic',
    damagePerTick: 0,
  },
  antimagic_pulse: {
    id: 'antimagic_pulse',
    name: 'Antimagic Pulse',
    icon: '/icons/spell_holy_dispelmagic.jpg',
    maxDuration: 0,
    type: 'magic',
    damagePerTick: 0,
  },
  // Shazzrah
  shazzrahs_curse: {
    id: 'shazzrahs_curse',
    name: "Shazzrah's Curse",
    icon: '/icons/spell_shadow_antishadow.jpg',
    maxDuration: 300, // 5 minutes
    type: 'curse',
    damagePerTick: 0,
    increasesMagicDamageTaken: 2.0, // DOUBLES magic damage taken
  },
  arcane_explosion: {
    id: 'arcane_explosion',
    name: 'Arcane Explosion',
    icon: '/icons/spell_nature_wispsplode.jpg',
    maxDuration: 0, // Instant damage
    type: 'magic',
    damagePerTick: 0,
  },
  deaden_magic: {
    id: 'deaden_magic',
    name: 'Deaden Magic',
    icon: '/icons/spell_holy_sealofsalvation.jpg',
    maxDuration: 30,
    type: 'magic', // Can be dispelled by priest or purged by shaman
    damagePerTick: 0,
    isBossDebuff: true, // This goes on the boss
    reducesMagicDamage: 0.5, // Reduces magic damage Shazzrah takes by 50%
  },
  // Baron Geddon
  living_bomb: {
    id: 'living_bomb',
    name: 'Living Bomb',
    icon: '/icons/spell_fire_selfdestruct.jpg',
    maxDuration: 8,
    type: 'magic',
    dispellable: false, // Cannot be dispelled - must be moved to safe zone
    explodesOnExpiry: true, // Special handling - explodes for 3200 damage to target + nearby if not in safe zone
    explosionDamage: 3200,
  },
  ignite_mana: {
    id: 'ignite_mana',
    name: 'Ignite Mana',
    icon: '/icons/spell_fire_incinerate.jpg',
    maxDuration: 10,
    type: 'magic',
    damagePerTick: 200, // Burns mana and deals damage
    tickInterval: 1,
  },
  inferno: {
    id: 'inferno',
    name: 'Inferno',
    icon: '/icons/spell_fire_incinerate.jpg',
    maxDuration: 8,
    type: 'magic',
    dispellable: false, // Cannot be dispelled
    damagePerTick: 1000, // 1000 fire damage per second
    tickInterval: 1,
  },
  // Sulfuron
  shadow_word_pain: {
    id: 'shadow_word_pain',
    name: 'Shadow Word: Pain',
    icon: '/icons/spell_shadow_shadowwordpain.jpg',
    maxDuration: 18,
    type: 'magic',
    damagePerTick: 125,
    tickInterval: 3,
  },
  hand_of_ragnaros: {
    id: 'hand_of_ragnaros',
    name: 'Hand of Ragnaros',
    icon: '/icons/spell_fire_fireball.jpg',
    maxDuration: 2, // 2 second stun
    type: 'magic',
    damagePerTick: 0, // Stun effect
  },
  immolate: {
    id: 'immolate',
    name: 'Immolate',
    icon: '/icons/spell_fire_immolation.jpg',
    maxDuration: 3,
    type: 'magic',
    damagePerTick: 133, // ~400 over 3 seconds
    tickInterval: 1,
    damageType: 'fire' as const,
  },
  // Golemagg
  magma_splash: {
    id: 'magma_splash',
    name: 'Magma Splash',
    icon: '/icons/spell_fire_immolation.jpg',
    maxDuration: 15, // Shorter duration so stacks fall off during tank swap
    type: 'physical', // NOT dispellable
    damagePerTick: 100, // Per stack - stacking DoT (reduced from 150)
    tickInterval: 2,
  },
  golemagg_pyroblast: {
    id: 'golemagg_pyroblast',
    name: 'Pyroblast',
    icon: '/icons/spell_fire_fireball02.jpg',
    maxDuration: 12,
    type: 'magic', // Dispellable
    damagePerTick: 200,
    tickInterval: 3,
  },
  mangle: {
    id: 'mangle',
    name: 'Mangle',
    icon: '/icons/ability_druid_mangle2.jpg',
    maxDuration: 20,
    type: 'physical', // NOT dispellable
    damagePerTick: 300,
    tickInterval: 2,
  },
  // Majordomo
  blast_wave: {
    id: 'blast_wave',
    name: 'Blast Wave',
    icon: '/icons/spell_holy_excorcism_02.jpg',
    maxDuration: 6,
    type: 'magic',
    damagePerTick: 200,
    tickInterval: 1,
  },
  majordomo_teleport: {
    id: 'majordomo_teleport',
    name: 'Teleport',
    icon: '/icons/spell_arcane_blink.jpg',
    maxDuration: 5,
    type: 'magic',
    damagePerTick: 350, // Fire damage in the pit
    tickInterval: 1,
    damageType: 'fire' as const,
  },
  majordomo_shadow_shock: {
    id: 'majordomo_shadow_shock',
    name: 'Shadow Shock',
    icon: '/icons/spell_shadow_shadowbolt.jpg',
    maxDuration: 0, // Instant damage
    type: 'magic',
    damagePerTick: 0,
  },
  majordomo_fire_blast: {
    id: 'majordomo_fire_blast',
    name: 'Fire Blast',
    icon: '/icons/spell_fire_fireball.jpg',
    maxDuration: 0, // Instant damage
    type: 'magic',
    damagePerTick: 0,
  },
  // Ragnaros
  elemental_fire: {
    id: 'elemental_fire',
    name: 'Elemental Fire',
    icon: '/icons/spell_fire_flametounge.jpg',
    maxDuration: 8,
    type: 'magic',
    damagePerTick: 300,
    tickInterval: 1,
    damageType: 'fire' as const,
  },
  wrath_of_ragnaros: {
    id: 'wrath_of_ragnaros',
    name: 'Wrath of Ragnaros',
    icon: '/icons/spell_fire_soulburn.jpg',
    maxDuration: 10,
    type: 'magic',
    dispellable: false, // Cannot be dispelled - tank must swap
    damagePerTick: 0, // Knockback effect - forces tank swap
    forcesTankSwap: true, // Custom flag for tank swap mechanic
  },
  magma_blast: {
    id: 'magma_blast',
    name: 'Magma Blast',
    icon: '/icons/spell_fire_flameshock.jpg',
    maxDuration: 0, // Instant damage
    type: 'magic',
    damagePerTick: 0,
  },
  lava_burst: {
    id: 'lava_burst',
    name: 'Lava Burst',
    icon: '/icons/spell_fire_volcano.jpg',
    maxDuration: 6,
    type: 'magic',
    damagePerTick: 200,
    tickInterval: 2,
    damageType: 'fire' as const,
  },
  // Onyxia
  flame_breath: {
    id: 'flame_breath',
    name: 'Flame Breath',
    icon: '/icons/spell_fire_fire.jpg',
    maxDuration: 8,
    type: 'magic',
    damagePerTick: 150,
    tickInterval: 2,
  },
  bellowing_roar: {
    id: 'bellowing_roar',
    name: 'Bellowing Roar',
    icon: '/icons/ability_warstomp.jpg',
    maxDuration: 3,
    type: 'magic',
    damagePerTick: 0, // Fear effect - causes lava eruptions in P3
  },
  deep_breath: {
    id: 'deep_breath',
    name: 'Deep Breath',
    icon: '/icons/ability_mage_firestarter.jpg',
    maxDuration: 4,
    type: 'magic',
    damagePerTick: 500, // MASSIVE fire damage - the iconic Onyxia ability
    tickInterval: 1,
  },
  tail_sweep: {
    id: 'tail_sweep',
    name: 'Tail Sweep',
    icon: '/icons/inv_misc_monsterscales_05.jpg',
    maxDuration: 2,
    type: 'magic',
    damagePerTick: 0, // Knockback effect - initial damage handled separately
  },
  wing_buffet: {
    id: 'wing_buffet',
    name: 'Wing Buffet',
    icon: '/icons/ability_dragonflightblue_wingbuffet.jpg',
    maxDuration: 2,
    type: 'magic',
    damagePerTick: 0, // Knockback + threat reduction
  },
  cleave: {
    id: 'cleave',
    name: 'Cleave',
    icon: '/icons/ability_warrior_cleave.jpg',
    maxDuration: 1,
    type: 'magic',
    damagePerTick: 0, // Instant damage to tank and nearby
  },
  onyxia_fireball: {
    id: 'onyxia_fireball',
    name: 'Fireball',
    icon: '/icons/spell_fire_flamebolt.jpg',
    maxDuration: 6,
    type: 'magic',
    damagePerTick: 100, // Burning from fireball impact
    tickInterval: 2,
  },
  lava_eruption: {
    id: 'lava_eruption',
    name: 'Lava Eruption',
    icon: '/icons/spell_fire_volcano.jpg',
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
    icon: '/icons/spell_fire_incinerate.jpg',
    maxDuration: 10,
    type: 'magic',
    damagePerTick: 150,
    tickInterval: 2,
  },

  // Vaelastrasz the Corrupt - THE signature BWL debuff
  burning_adrenaline: {
    id: 'burning_adrenaline',
    name: 'Burning Adrenaline',
    icon: '/icons/spell_shadow_unholyfrenzy.jpg',
    maxDuration: 20,
    type: 'magic', // Undispellable in reality, but magic for consistency
    damagePerTick: 500, // Increasing damage until death
    tickInterval: 1,
  },
  essence_of_the_red: {
    id: 'essence_of_the_red',
    name: 'Essence of the Red',
    icon: '/icons/inv_misc_head_dragon_red.jpg',
    maxDuration: 180,
    type: 'magic',
    damagePerTick: 0, // Buff that gives unlimited mana - no damage
  },

  // Broodlord Lashlayer
  mortal_strike: {
    id: 'mortal_strike',
    name: 'Mortal Strike',
    icon: '/icons/ability_warrior_savageblow.jpg',
    maxDuration: 5,
    type: 'disease', // Cleansable
    damagePerTick: 0, // 50% healing reduction effect - simulated
  },
  blast_wave_broodlord: {
    id: 'blast_wave_broodlord',
    name: 'Blast Wave',
    icon: '/icons/spell_holy_excorcism_02.jpg',
    maxDuration: 6,
    type: 'magic',
    damagePerTick: 100,
    tickInterval: 1,
  },
  knock_away: {
    id: 'knock_away',
    name: 'Knock Away',
    icon: '/icons/inv_gauntlets_05.jpg',
    maxDuration: 2,
    type: 'magic',
    damagePerTick: 0, // Threat reduction
  },

  // Drake debuffs (Firemaw, Ebonroc, Flamegor)
  wing_buffet_bwl: {
    id: 'wing_buffet_bwl',
    name: 'Wing Buffet',
    icon: '/icons/ability_dragonflightblue_wingbuffet.jpg',
    maxDuration: 3,
    type: 'magic',
    damagePerTick: 0, // Knockback + threat reduction
  },
  flame_buffet: {
    id: 'flame_buffet',
    name: 'Flame Buffet',
    icon: '/icons/spell_fire_flameshock.jpg',
    maxDuration: 20,
    type: 'magic',
    damagePerTick: 150, // Stacking fire vulnerability
    tickInterval: 3,
  },
  shadow_flame: {
    id: 'shadow_flame',
    name: 'Shadow Flame',
    icon: '/icons/spell_fire_incinerate.jpg',
    maxDuration: 4,
    type: 'magic',
    damagePerTick: 1000, // MASSIVE damage - need Onyxia Scale Cloak!
    tickInterval: 2,
  },
  shadow_of_ebonroc: {
    id: 'shadow_of_ebonroc',
    name: 'Shadow of Ebonroc',
    icon: '/icons/spell_shadow_gathershadows.jpg',
    maxDuration: 8,
    type: 'magic',
    damagePerTick: 0, // Heals the boss when tank is healed - tank swap!
  },
  frenzy_bwl: {
    id: 'frenzy_bwl',
    name: 'Frenzy',
    icon: '/icons/ability_druid_challangingroar.jpg',
    maxDuration: 10,
    type: 'magic', // Hunter can Tranq Shot
    damagePerTick: 0, // Increased attack speed/damage
  },

  // Chromaggus - 5 breath types (random 2 per reset)
  incinerate: {
    id: 'incinerate',
    name: 'Incinerate',
    icon: '/icons/spell_fire_flamebolt.jpg',
    maxDuration: 6,
    type: 'magic',
    damagePerTick: 400,
    tickInterval: 1,
  },
  corrosive_acid: {
    id: 'corrosive_acid',
    name: 'Corrosive Acid',
    icon: '/icons/spell_nature_acid_01.jpg',
    maxDuration: 15,
    type: 'magic',
    damagePerTick: 175, // Also reduces armor
    tickInterval: 3,
  },
  frost_burn: {
    id: 'frost_burn',
    name: 'Frost Burn',
    icon: '/icons/spell_frost_chillingblast.jpg',
    maxDuration: 10,
    type: 'magic',
    damagePerTick: 75, // Also slows attack/cast speed
    tickInterval: 2,
  },
  ignite_flesh: {
    id: 'ignite_flesh',
    name: 'Ignite Flesh',
    icon: '/icons/spell_fire_fire.jpg',
    maxDuration: 8,
    type: 'magic',
    damagePerTick: 300,
    tickInterval: 1,
  },
  time_lapse: {
    id: 'time_lapse',
    name: 'Time Lapse',
    icon: '/icons/spell_arcane_portalironforge.jpg',
    maxDuration: 8,
    type: 'magic',
    damagePerTick: 0, // Stun + reduces health/mana
  },
  // Brood Afflictions - signature Chromaggus mechanic
  brood_affliction_red: {
    id: 'brood_affliction_red',
    name: 'Brood Affliction: Red',
    icon: '/icons/inv_misc_head_dragon_red.jpg',
    maxDuration: 60,
    type: 'disease',
    damagePerTick: 50,
    tickInterval: 3,
  },
  brood_affliction_green: {
    id: 'brood_affliction_green',
    name: 'Brood Affliction: Green',
    icon: '/icons/inv_misc_head_dragon_green.jpg',
    maxDuration: 60,
    type: 'poison',
    damagePerTick: 100, // Nature damage, heals Chromaggus
    tickInterval: 5,
  },
  brood_affliction_blue: {
    id: 'brood_affliction_blue',
    name: 'Brood Affliction: Blue',
    icon: '/icons/inv_misc_head_dragon_blue.jpg',
    maxDuration: 60,
    type: 'magic',
    damagePerTick: 0, // Drains mana, slows cast speed
  },
  brood_affliction_black: {
    id: 'brood_affliction_black',
    name: 'Brood Affliction: Black',
    icon: '/icons/inv_misc_head_dragon_black.jpg',
    maxDuration: 60,
    type: 'curse',
    damagePerTick: 75, // Fire damage + increases fire damage taken
    tickInterval: 3,
  },
  brood_affliction_bronze: {
    id: 'brood_affliction_bronze',
    name: 'Brood Affliction: Bronze',
    icon: '/icons/inv_misc_head_dragon_bronze.jpg',
    maxDuration: 4,
    type: 'magic', // 4 second stun
    damagePerTick: 0,
  },

  // Nefarian - Final Boss
  shadowflame_nef: {
    id: 'shadowflame_nef',
    name: 'Shadowflame',
    icon: '/icons/spell_fire_incinerate.jpg',
    maxDuration: 4,
    type: 'magic',
    damagePerTick: 800, // Massive if no Onyxia Scale Cloak!
    tickInterval: 1,
  },
  veil_of_shadow: {
    id: 'veil_of_shadow',
    name: 'Veil of Shadow',
    icon: '/icons/spell_shadow_gathershadows.jpg',
    maxDuration: 30,
    type: 'magic',
    damagePerTick: 0, // 75% healing reduction - MUST dispel!
  },
  fear_nef: {
    id: 'fear_nef',
    name: 'Fear',
    icon: '/icons/spell_shadow_possession.jpg',
    maxDuration: 4,
    type: 'magic',
    damagePerTick: 0,
  },
  // Class calls - unique debuffs for each class
  class_call_warrior: {
    id: 'class_call_warrior',
    name: 'Warrior Call',
    icon: '/icons/ability_warrior_sunder.jpg',
    maxDuration: 5,
    type: 'magic',
    damagePerTick: 0, // Forces Berserker Stance (take 10% more damage)
  },
  class_call_paladin: {
    id: 'class_call_paladin',
    name: 'Paladin Call',
    icon: '/icons/spell_holy_sealofwisdom.jpg',
    maxDuration: 5,
    type: 'magic',
    damagePerTick: 0, // Bubbles Nefarian, healing him
  },
  class_call_priest: {
    id: 'class_call_priest',
    name: 'Priest Call',
    icon: '/icons/spell_holy_guardianspirit.jpg',
    maxDuration: 10,
    type: 'magic',
    damagePerTick: 100, // Direct heals hurt targets instead
    tickInterval: 2,
  },
  class_call_druid: {
    id: 'class_call_druid',
    name: 'Druid Call',
    icon: '/icons/ability_druid_catform.jpg',
    maxDuration: 5,
    type: 'magic',
    damagePerTick: 0, // Forces cat form, stuck
  },
  class_call_mage: {
    id: 'class_call_mage',
    name: 'Mage Call',
    icon: '/icons/spell_frost_icestorm.jpg',
    maxDuration: 5,
    type: 'magic',
    damagePerTick: 0, // Polymorphs raid members
  },
  class_call_warlock: {
    id: 'class_call_warlock',
    name: 'Warlock Call',
    icon: '/icons/spell_shadow_demonictactics.jpg',
    maxDuration: 5,
    type: 'magic',
    damagePerTick: 150, // Hellfire effect - damages self and nearby
    tickInterval: 1,
  },
  class_call_hunter: {
    id: 'class_call_hunter',
    name: 'Hunter Call',
    icon: '/icons/ability_hunter_pet_goto.jpg',
    maxDuration: 5,
    type: 'magic',
    damagePerTick: 0, // Ranged weapons break
  },
  class_call_rogue: {
    id: 'class_call_rogue',
    name: 'Rogue Call',
    icon: '/icons/ability_rogue_ambush.jpg',
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
    icon: '/icons/spell_nature_chainlightning.jpg',
    maxDuration: 4,
    type: 'magic',
    damagePerTick: 250,
    tickInterval: 1,
  },
  thunderclap_thunderaan: {
    id: 'thunderclap_thunderaan',
    name: 'Thunderclap',
    icon: '/icons/spell_nature_thunderclap.jpg',
    maxDuration: 6,
    type: 'magic',
    damagePerTick: 0, // Stun + initial burst
  },
  storm_cloud: {
    id: 'storm_cloud',
    name: 'Storm Cloud',
    icon: '/icons/spell_nature_eyeofthestorm.jpg',
    maxDuration: 10,
    type: 'magic',
    damagePerTick: 175,
    tickInterval: 2,
  },
  winds_of_the_windlord: {
    id: 'winds_of_the_windlord',
    name: 'Winds of the Windlord',
    icon: '/icons/spell_nature_cyclone.jpg',
    maxDuration: 8,
    type: 'magic',
    damagePerTick: 200,
    tickInterval: 2,
  },
};

// Molten Core encounters with authentic abilities
export const ENCOUNTERS: Boss[] = [
  // Boss 1: Lucifron
  // Signature: Impending Doom (dispel or take big damage), Lucifron's Curse (doubles mana costs), Dominate Mind
  {
    id: 'lucifron',
    name: 'Lucifron',
    maxHealth: 1055340,
    currentHealth: 1055340,
    enrageTimer: 180,
    damageEvents: [
      { type: 'tank_damage', damage: 600, interval: 2, damageType: 'shadow' }, // Shadow Shock on tank
      { type: 'debuff', damage: 0, interval: 12, debuffId: 'impending_doom' }, // Must dispel!
      { type: 'debuff', damage: 0, interval: 20, debuffId: 'lucifrons_curse', targetCount: 3 }, // Curse on 3 random - doubles mana costs!
      { type: 'debuff', damage: 0, interval: 18, debuffId: 'dominate_mind' }, // Mind control a player!
      { type: 'raid_damage', damage: 150, interval: 8, targetCount: 5, damageType: 'shadow' }, // Shadow Shock cleave
    ],
  },
  // Boss 2: Magmadar
  // Signature: Panic (mass fear on melee/tanks), Lava Bomb (undispellable fire DoT), Frenzy (tank buster), Magma Spit (melee stacking DoT)
  {
    id: 'magmadar',
    name: 'Magmadar',
    maxHealth: 2478264,
    currentHealth: 2478264,
    enrageTimer: 240,
    damageEvents: [
      { type: 'tank_damage', damage: 900, interval: 2 }, // Normal melee (physical)
      { type: 'frenzy', damage: 0, interval: 25 }, // Frenzy - increases tank damage, hunters Tranq Shot after 2s
      { type: 'debuff', damage: 0, interval: 25, debuffId: 'panic', targetCount: 15 }, // Mass fear on melee/tanks (not healers)
      { type: 'lava_bomb', damage: 0, interval: 12 }, // Lava Bomb - undispellable DoT, random chance target doesn't move
      { type: 'debuff', damage: 0, interval: 8, debuffId: 'magma_spit', targetCount: 2 }, // Magma Spit - stacking DoT on melee
    ],
  },
  // Boss 3: Gehennas
  // Signature: Gehennas' Curse (75% healing reduction on entire raid), Rain of Fire (5 targets, player didn't move), Shadow Bolt
  {
    id: 'gehennas',
    name: 'Gehennas',
    maxHealth: 1055340,
    currentHealth: 1055340,
    enrageTimer: 180,
    damageEvents: [
      { type: 'tank_damage', damage: 700, interval: 2 }, // Melee (physical)
      { type: 'debuff', damage: 0, interval: 15, debuffId: 'gehennas_curse', targetCount: 40 }, // Raid-wide curse - 75% healing reduction
      { type: 'rain_of_fire', damage: 0, interval: 6 }, // Rain of Fire on 5 targets with "didn't move" mechanic
      { type: 'random_target', damage: 800, interval: 5, damageType: 'shadow' }, // Shadow Bolt
    ],
  },
  // Boss 4: Garr
  // Signature: 8 Firesworn adds that explode on death, Magma Shackles, Anti-magic Pulse
  {
    id: 'garr',
    name: 'Garr',
    maxHealth: 1978614,
    currentHealth: 1978614,
    enrageTimer: 300,
    currentPhase: 1,
    phaseTransitions: [
      { phase: 2, healthPercent: 88.9, message: 'A Firesworn explodes!' },
      { phase: 3, healthPercent: 77.8, message: 'A Firesworn explodes!' },
      { phase: 4, healthPercent: 66.7, message: 'A Firesworn explodes!' },
      { phase: 5, healthPercent: 55.6, message: 'A Firesworn explodes!' },
      { phase: 6, healthPercent: 44.4, message: 'A Firesworn explodes!' },
      { phase: 7, healthPercent: 33.3, message: 'A Firesworn explodes!' },
      { phase: 8, healthPercent: 22.2, message: 'A Firesworn explodes!' },
      { phase: 9, healthPercent: 11.1, message: 'The last Firesworn explodes! Garr is vulnerable!' },
    ],
    damageEvents: [
      { type: 'tank_damage', damage: 800, interval: 2 }, // Melee (physical)
      { type: 'debuff', damage: 0, interval: 15, debuffId: 'magma_shackles' },
      { type: 'antimagic_pulse', damage: 0, interval: 5 }, // Dispels 1 buff from all raiders
      { type: 'random_target', damage: 400, interval: 4, damageType: 'fire', activeInPhases: [1, 2, 3, 4, 5, 6, 7, 8] }, // Add damage (fire) - only while adds alive
    ],
  },
  // Boss 5: Baron Geddon
  // Signature: Living Bomb (player explodes), Ignite Mana (mana burn), Inferno (pulsing AoE - melee must move)
  {
    id: 'baron_geddon',
    name: 'Baron Geddon',
    maxHealth: 1758768,
    currentHealth: 1758768,
    enrageTimer: 240,
    damageEvents: [
      { type: 'tank_damage', damage: 900, interval: 2, damageType: 'fire' }, // Fire elemental melee
      { type: 'debuff', damage: 0, interval: 20, debuffId: 'living_bomb' }, // LIVING BOMB! Run away!
      { type: 'debuff', damage: 0, interval: 15, debuffId: 'ignite_mana' }, // Mana burn
      { type: 'inferno', damage: 0, interval: 30, damageType: 'fire' }, // INFERNO - melee must run away!
    ],
  },
  // Boss 6: Shazzrah
  // Signature: Blink (teleport + threat wipe), Arcane Explosion, Shazzrah's Curse (magic damage increase), Deaden Magic
  {
    id: 'shazzrah',
    name: 'Shazzrah',
    maxHealth: 1055340,
    currentHealth: 1055340,
    enrageTimer: 180,
    damageEvents: [
      { type: 'tank_damage', damage: 500, interval: 1.5 }, // Fast melee (physical)
      { type: 'shazzrah_curse', damage: 0, interval: 15 }, // Applies curse to ~8 random players - doubles magic damage taken
      { type: 'shazzrah_blink', damage: 1000, interval: 20, damageType: 'arcane' }, // Blink every 20s + 1000 arcane explosion to ~8 players near blink target
      { type: 'deaden_magic', damage: 0, interval: 45 }, // Boss gains 50% magic damage reduction buff
    ],
  },
  // Boss 7: Golemagg the Incinerator
  // Signature: 3-tank fight with tank swapping, Magma Splash stacking debuff, Core Ragers, Earthquake at 10%
  {
    id: 'golemagg',
    name: 'Golemagg the Incinerator',
    maxHealth: 2478264,
    currentHealth: 2478264,
    enrageTimer: 300,
    requiresTankAssignment: true, // Requires tank assignment modal
    currentPhase: 1, // 1 = normal, 2 = earthquake phase (<10%)
    phaseTransitions: [
      { phase: 2, healthPercent: 10, message: 'Golemagg begins to cause Earthquakes!' },
    ],
    damageEvents: [
      // Golemagg melee on current assigned tank
      { type: 'tank_damage', damage: 800, interval: 2 },

      // Magma Splash - stacking debuff on Golemagg tanks, triggers tank swap
      { type: 'golemagg_magma_splash', damage: 0, interval: 3 },

      // Pyroblast - random raid member, instant + DoT
      { type: 'golemagg_pyroblast', damage: 1500, interval: 18, damageType: 'fire' },

      // Core Rager Mangle - DoT on dog tank
      { type: 'core_rager_mangle', damage: 0, interval: 8 },

      // Core Rager melee - constant damage on dog tank (2 dogs)
      { type: 'core_rager_melee', damage: 500, interval: 2 },

      // Earthquake - melee only, phase 2 only (10% health)
      { type: 'golemagg_earthquake', damage: 1500, interval: 3, activeInPhases: [2] },
    ],
  },
  // Boss 8: Sulfuron Harbinger
  // Signature: 4 Flamewaker Priests (Dark Mending heal, Immolate, SW:P), Hand of Ragnaros (stun), Inspire
  // Multi-add fight: All 4 priests visible with separate health bars, must die before Sulfuron is attackable
  {
    id: 'sulfuron',
    name: 'Sulfuron Harbinger',
    maxHealth: 1319076, // Sulfuron's HP (only attackable after priests die)
    currentHealth: 1319076,
    enrageTimer: 420, // 7 minutes - longer fight with adds
    currentPhase: 1, // Phase 1 = priests alive, Phase 2 = Sulfuron phase
    adds: [
      { id: 'priest1', name: 'Flamewaker Priest', maxHealth: 200000, currentHealth: 200000, isAlive: true },
      { id: 'priest2', name: 'Flamewaker Priest', maxHealth: 200000, currentHealth: 200000, isAlive: true },
      { id: 'priest3', name: 'Flamewaker Priest', maxHealth: 200000, currentHealth: 200000, isAlive: true },
      { id: 'priest4', name: 'Flamewaker Priest', maxHealth: 200000, currentHealth: 200000, isAlive: true },
    ],
    phaseTransitions: [
      { phase: 2, healthPercent: 0, message: 'All Flamewaker Priests are dead! Sulfuron is vulnerable!' },
    ],
    damageEvents: [
      // === SULFURON'S ABILITIES (all phases) ===
      { type: 'tank_damage', damage: 600, interval: 2 }, // Sulfuron melee (physical)
      { type: 'hand_of_ragnaros', damage: 900, interval: 12, damageType: 'fire' }, // AoE stun on melee/tanks

      // === PRIEST ABILITIES (phase 1 only - stops when all priests dead) ===
      { type: 'inspire', damage: 0, interval: 30, activeInPhases: [1] }, // Buff priests +25% damage
      { type: 'dark_mending', damage: 0, interval: 15, activeInPhases: [1] }, // Interruptable heal
      { type: 'sulfuron_immolate', damage: 800, interval: 8, damageType: 'fire', activeInPhases: [1] }, // Immolate
      { type: 'debuff', damage: 0, interval: 10, debuffId: 'shadow_word_pain', activeInPhases: [1] }, // SW:P DoT
    ],
  },
  // Boss 9: Majordomo Executus
  // Signature: 4 Flamewaker Elites + 4 Flamewaker Healers, Magic Reflection, Teleport
  // Majordomo himself is NOT attackable - fight ends when all 8 adds die
  // 5 tanks required: 1 for Majordomo, 4 for adds (each tanks 2 adds)
  {
    id: 'majordomo',
    name: 'Majordomo Executus',
    maxHealth: 1998600, // Majordomo's HP - but he's not attackable!
    currentHealth: 1998600,
    enrageTimer: 420, // 7 minutes - add fight takes time
    requiresTankAssignment: true, // Requires 5-tank assignment modal
    currentPhase: 1, // Phase 1 = adds alive, Phase 2 = victory (Majordomo submits)
    adds: [
      // 4 Flamewaker Elites (fire damage, melee)
      { id: 'elite1', name: 'Flamewaker Elite', maxHealth: 180000, currentHealth: 180000, isAlive: true },
      { id: 'elite2', name: 'Flamewaker Elite', maxHealth: 180000, currentHealth: 180000, isAlive: true },
      { id: 'elite3', name: 'Flamewaker Elite', maxHealth: 180000, currentHealth: 180000, isAlive: true },
      { id: 'elite4', name: 'Flamewaker Elite', maxHealth: 180000, currentHealth: 180000, isAlive: true },
      // 4 Flamewaker Healers (shadow damage, can heal adds)
      { id: 'healer1', name: 'Flamewaker Healer', maxHealth: 140000, currentHealth: 140000, isAlive: true },
      { id: 'healer2', name: 'Flamewaker Healer', maxHealth: 140000, currentHealth: 140000, isAlive: true },
      { id: 'healer3', name: 'Flamewaker Healer', maxHealth: 140000, currentHealth: 140000, isAlive: true },
      { id: 'healer4', name: 'Flamewaker Healer', maxHealth: 140000, currentHealth: 140000, isAlive: true },
    ],
    phaseTransitions: [
      { phase: 2, healthPercent: 0, message: 'All adds are dead! Majordomo Executus submits!' },
    ],
    damageEvents: [
      // === MAJORDOMO'S TELEPORT ===
      // Teleports his tank into the fire pit - fire damage DoT
      { type: 'majordomo_teleport', damage: 0, interval: 20 },

      // === FLAMEWAKER ELITE ABILITIES ===
      // Tank damage from Elites (split across 4 add tanks)
      { type: 'majordomo_elite_melee', damage: 400, interval: 2 },
      // Fire Blast - instant fire damage on random targets
      { type: 'majordomo_fire_blast', damage: 500, interval: 6, damageType: 'fire' },

      // === FLAMEWAKER HEALER ABILITIES ===
      // Shadow Shock - instant shadow damage
      { type: 'majordomo_shadow_shock', damage: 450, interval: 5, damageType: 'shadow' },
      // Shadow Bolt - interruptible shadow damage (usually kicked)
      { type: 'majordomo_shadow_bolt', damage: 600, interval: 8, damageType: 'shadow' },
      // Fireball - interruptible fire damage (usually kicked)
      { type: 'majordomo_fireball', damage: 550, interval: 10, damageType: 'fire' },
      // Dark Mending - heals adds if not interrupted (same as Sulfuron)
      { type: 'majordomo_dark_mending', damage: 0, interval: 12 },

      // === MAGIC REFLECTION ===
      // All adds gain magic reflection shield (10 seconds) - DPS must stop!
      { type: 'majordomo_magic_reflection', damage: 0, interval: 30 },
    ],
  },
  // Boss 10: Ragnaros (Final Boss)
  // Signature: Wrath of Ragnaros (tank swap knockback), Elemental Fire, Magma Blast, Lava Burst
  // Submerge Phase: After 3 minutes, Ragnaros submerges and 8 Sons of Flame spawn
  // Sons must be killed within 90 seconds or Ragnaros re-emerges with Sons still alive
  // 2-tank fight with tank swap on Wrath of Ragnaros
  {
    id: 'ragnaros',
    name: 'Ragnaros',
    maxHealth: 3297690,
    currentHealth: 3297690,
    enrageTimer: 480,
    requiresTankAssignment: true, // Requires 2-tank assignment for tank swap
    currentPhase: 1, // Phase 1 = fighting Ragnaros, Phase 2 = submerged (Sons), Phase 3 = Ragnaros returns
    adds: [
      // 8 Sons of Flame - spawn during submerge phase
      { id: 'son1', name: 'Son of Flame', maxHealth: 80000, currentHealth: 80000, isAlive: false },
      { id: 'son2', name: 'Son of Flame', maxHealth: 80000, currentHealth: 80000, isAlive: false },
      { id: 'son3', name: 'Son of Flame', maxHealth: 80000, currentHealth: 80000, isAlive: false },
      { id: 'son4', name: 'Son of Flame', maxHealth: 80000, currentHealth: 80000, isAlive: false },
      { id: 'son5', name: 'Son of Flame', maxHealth: 80000, currentHealth: 80000, isAlive: false },
      { id: 'son6', name: 'Son of Flame', maxHealth: 80000, currentHealth: 80000, isAlive: false },
      { id: 'son7', name: 'Son of Flame', maxHealth: 80000, currentHealth: 80000, isAlive: false },
      { id: 'son8', name: 'Son of Flame', maxHealth: 80000, currentHealth: 80000, isAlive: false },
    ],
    phaseTransitions: [
      { phase: 2, healthPercent: -1, message: 'Ragnaros submerges! Sons of Flame emerge!' }, // Special trigger - time based
      { phase: 3, healthPercent: -1, message: 'Ragnaros re-emerges from the lava!' }, // Triggered when Sons die or 90s timer
    ],
    damageEvents: [
      // === PHASE 1 & 3: RAGNAROS ACTIVE ===
      // Massive fire melee on tank
      { type: 'ragnaros_melee', damage: 1200, interval: 2.5, damageType: 'fire', activeInPhases: [1, 3] },

      // Elemental Fire - Fire DoT on current tank
      { type: 'ragnaros_elemental_fire', damage: 0, interval: 10, activeInPhases: [1, 3] },

      // Wrath of Ragnaros - Knockback, forces tank swap (heavy damage to knocked tank)
      { type: 'ragnaros_wrath', damage: 2500, interval: 25, damageType: 'fire', activeInPhases: [1, 3] },

      // Lava Burst - Random ranged + splash damage to nearby players
      { type: 'ragnaros_lava_burst', damage: 1500, interval: 12, damageType: 'fire', activeInPhases: [1, 3] },

      // Magma Blast - Only if no tank in melee (both tanks dead)
      { type: 'ragnaros_magma_blast', damage: 4000, interval: 3, damageType: 'fire', activeInPhases: [1, 3] },

      // === PHASE 2: SONS OF FLAME (Ragnaros submerged) ===
      // Sons of Flame melee random raid members
      { type: 'sons_of_flame_melee', damage: 350, interval: 2, activeInPhases: [2] },
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
