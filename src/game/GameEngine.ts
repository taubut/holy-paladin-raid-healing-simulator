import type { GameState, RaidMember, Spell, CombatLogEntry, WoWClass, WoWSpec, Equipment, PlayerStats, ConsumableBuff, WorldBuff, Boss, DamageType, PartyAura, BuffEffect, Faction, PlayerHealerClass, PositionZone, Totem, TotemElement, LootBid, LootResult } from './types';
import { createEmptyEquipment, CLASS_SPECS } from './types';
// Shaman imports for action bar switching and totems
import { DEFAULT_SHAMAN_ACTION_BAR } from './shamanSpells';
import { getTotemById, TOTEMS_BY_ELEMENT } from './totems';
import { PARTY_AURAS, memberProvidesAura } from './auras';
import { DEBUFFS, ENCOUNTERS, TRAINING_ENCOUNTER } from './encounters';
import { DEFAULT_ACTION_BAR, BLESSING_OF_LIGHT_VALUES } from './spells';
import type { GearItem, WearableClass, EquipmentSlot, LegendaryMaterialId, LegendaryMaterial, QuestMaterialId, QuestRewardId, EnchantId, EnchantSlot } from './items';
import { ALL_ITEMS, LEGENDARY_MATERIALS, QUEST_MATERIALS, ALL_QUEST_REWARDS, ENCHANTS } from './items';
import { rollBossLoot, getBossDKPReward, calculateDKPCost, canSpecBenefitFrom } from './lootTables';
import { RAIDS, getRaidById, DEFAULT_RAID_ID } from './raids';
import { getPreRaidBisForSpec } from './preRaidBisSets';
import posthog from 'posthog-js';

const GCD_DURATION = 1.5;
const MANA_POTION_COOLDOWN = 120;
const MANA_POTION_RESTORE = 2000;

// Classic WoW style names
const CLASS_NAMES: Record<WoWClass, string[]> = {
  warrior: ['Thunderfury', 'Shieldwall', 'Ironfoe', 'Grommash', 'Lothar'],
  paladin: ['Uther', 'Tirion', 'Bolvar', 'Turalyon', 'Mograine'],
  hunter: ['Rexxar', 'Alleria', 'Hemet', 'Nathanos', 'Sylvanas'],
  rogue: ['Garona', 'Mathias', 'Valeera', 'Edwin', 'Ravenholdt'],
  priest: ['Benedictus', 'Moira', 'Anduin', 'Velen', 'Whitemane'],
  shaman: ['Thrall', 'Drektar', 'Nobundo', 'Rehgar', 'Zuljin'],
  mage: ['Jaina', 'Khadgar', 'Antonidas', 'Rhonin', 'Medivh'],
  warlock: ['Guldan', 'Wilfred', 'Kanrethad', 'Helcular', 'Dreadmist'],
  druid: ['Malfurion', 'Hamuul', 'Cenarius', 'Staghelm', 'Remulos'],
};

const CLASS_HEALTH: Record<WoWClass, { min: number; max: number }> = {
  warrior: { min: 5500, max: 7000 },
  paladin: { min: 4000, max: 5000 },
  hunter: { min: 3500, max: 4200 },
  rogue: { min: 3200, max: 4000 },
  priest: { min: 3000, max: 3800 },
  shaman: { min: 3500, max: 4500 },  // Mail armor, similar to paladin
  mage: { min: 2800, max: 3500 },
  warlock: { min: 3200, max: 4000 },
  druid: { min: 3800, max: 4800 },
};

// AI Healer configuration - HPS per healer based on class
const AI_HEALER_HPS: Record<string, number> = {
  priest: 350,   // Strong raid healer
  paladin: 280,  // Good single target
  shaman: 320,   // Chain Heal is powerful for raid healing
  druid: 300,    // HoT based
};

// AI Healer mana pools and regeneration by class
const AI_HEALER_MANA: Record<string, { maxMana: number; mp5: number }> = {
  priest: { maxMana: 5500, mp5: 45 },   // Good pool and regen
  paladin: { maxMana: 4500, mp5: 35 },  // Lower pool, efficient heals
  shaman: { maxMana: 4800, mp5: 40 },   // Balanced
  druid: { maxMana: 5000, mp5: 50 },    // Good regen
};

// Player's base health as a Holy Paladin
const PLAYER_BASE_HEALTH = 4200;
const PLAYER_ID = 'player';

// Raid Buff Definitions - Authentic Vanilla WoW buffs
export const RAID_BUFFS = {
  // Priest Buffs
  power_word_fortitude: {
    id: 'power_word_fortitude',
    name: 'Prayer of Fortitude',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_prayeroffortitude.jpg',
    duration: 3600,
    maxDuration: 3600,
    effect: { staminaBonus: 54 },
    casterClass: 'priest' as WoWClass,
  },
  divine_spirit: {
    id: 'divine_spirit',
    name: 'Prayer of Spirit',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_divinespirit.jpg',
    duration: 3600,
    maxDuration: 3600,
    effect: { spiritBonus: 40 },
    casterClass: 'priest' as WoWClass,
  },
  // Mage Buffs
  arcane_intellect: {
    id: 'arcane_intellect',
    name: 'Arcane Brilliance',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_arcaneintellect.jpg',
    duration: 3600,
    maxDuration: 3600,
    effect: { intellectBonus: 31 },
    casterClass: 'mage' as WoWClass,
  },
  // Druid Buffs
  mark_of_the_wild: {
    id: 'mark_of_the_wild',
    name: 'Gift of the Wild',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_nature_giftofthewild.jpg',
    duration: 3600,
    maxDuration: 3600,
    effect: { allStatsBonus: 12, armorBonus: 285 },
    casterClass: 'druid' as WoWClass,
  },
  // Paladin Blessings - Each requires a paladin slot
  blessing_of_wisdom: {
    id: 'blessing_of_wisdom',
    name: 'Greater Blessing of Wisdom',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_greaterblessingofwisdom.jpg',
    duration: 900,
    maxDuration: 900,
    effect: { manaRegenBonus: 33 },
    casterClass: 'paladin' as WoWClass,
    isPaladinBlessing: true,
  },
  blessing_of_kings: {
    id: 'blessing_of_kings',
    name: 'Greater Blessing of Kings',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_magic_greaterblessingofkings.jpg',
    duration: 900,
    maxDuration: 900,
    effect: { allStatsBonus: 10 }, // 10% but we'll treat as flat for simplicity
    casterClass: 'paladin' as WoWClass,
    isPaladinBlessing: true,
  },
  blessing_of_might: {
    id: 'blessing_of_might',
    name: 'Greater Blessing of Might',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_greaterblessingofkings.jpg',
    duration: 900,
    maxDuration: 900,
    effect: { attackPowerBonus: 185 },
    casterClass: 'paladin' as WoWClass,
    isPaladinBlessing: true,
  },
  blessing_of_light: {
    id: 'blessing_of_light_buff',
    name: 'Greater Blessing of Light',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_prayerofhealing02.jpg',
    duration: 900,
    maxDuration: 900,
    effect: { healingReceivedBonus: 400 }, // +400 to Holy Light heals received
    casterClass: 'paladin' as WoWClass,
    isPaladinBlessing: true,
  },
  blessing_of_salvation: {
    id: 'blessing_of_salvation',
    name: 'Greater Blessing of Salvation',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_sealofsalvation.jpg',
    duration: 900,
    maxDuration: 900,
    effect: {}, // Reduces threat by 30% - not mechanically relevant here but thematic
    casterClass: 'paladin' as WoWClass,
    isPaladinBlessing: true,
  },
};

// =========================================================================
// CONSUMABLES - Role-based buffs that auto-apply to entire raid
// =========================================================================
export const CONSUMABLES: Record<string, ConsumableBuff> = {
  // Healer Consumables
  flask_of_distilled_wisdom: {
    id: 'flask_of_distilled_wisdom',
    name: 'Flask of Distilled Wisdom',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_potion_97.jpg',
    duration: 7200,
    effect: { mana: 2000 },
    role: 'healer',
  },
  mageblood_potion: {
    id: 'mageblood_potion',
    name: 'Mageblood Potion',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_potion_45.jpg',
    duration: 3600,
    effect: { manaRegenBonus: 12 },
    role: 'healer',
  },
  nightfin_soup: {
    id: 'nightfin_soup',
    name: 'Nightfin Soup',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_fish_21.jpg',
    duration: 900,
    effect: { manaRegenBonus: 8 },
    role: 'healer',
  },
  brilliant_mana_oil: {
    id: 'brilliant_mana_oil',
    name: 'Brilliant Mana Oil',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_potion_100.jpg',
    duration: 1800,
    effect: { manaRegenBonus: 12, healingPower: 25 },
    role: 'healer',
  },
  greater_arcane_elixir: {
    id: 'greater_arcane_elixir',
    name: 'Greater Arcane Elixir',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_potion_25.jpg',
    duration: 3600,
    effect: { healingPower: 35 },
    role: 'healer',
  },
  // DPS Consumables
  flask_of_supreme_power: {
    id: 'flask_of_supreme_power',
    name: 'Flask of Supreme Power',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_potion_41.jpg',
    duration: 7200,
    effect: { healingPower: 150 }, // +150 Spell Power
    role: 'dps',
  },
  mongoose_elixir: {
    id: 'mongoose_elixir',
    name: 'Elixir of the Mongoose',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_potion_32.jpg',
    duration: 3600,
    effect: { spellCritBonus: 2 }, // +25 Agi, +2% Crit simplified
    role: 'dps',
  },
  winterfall_firewater: {
    id: 'winterfall_firewater',
    name: 'Winterfall Firewater',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_potion_92.jpg',
    duration: 1200,
    effect: { attackPowerBonus: 35 },
    role: 'dps',
  },
  juju_power: {
    id: 'juju_power',
    name: 'Juju Power',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_monsterscales_11.jpg',
    duration: 1800,
    effect: { attackPowerBonus: 30 },
    role: 'dps',
  },
  grilled_squid: {
    id: 'grilled_squid',
    name: 'Grilled Squid',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_fish_13.jpg',
    duration: 900,
    effect: { spellCritBonus: 1 }, // +10 Agility simplified
    role: 'dps',
  },
  // Tank Consumables
  flask_of_the_titans: {
    id: 'flask_of_the_titans',
    name: 'Flask of the Titans',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_potion_62.jpg',
    duration: 7200,
    effect: { staminaBonus: 120 }, // +1200 HP = ~120 sta
    role: 'tank',
  },
  elixir_of_fortitude: {
    id: 'elixir_of_fortitude',
    name: 'Elixir of Fortitude',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_potion_43.jpg',
    duration: 3600,
    effect: { staminaBonus: 12 }, // +120 HP = ~12 sta
    role: 'tank',
  },
  elixir_of_superior_defense: {
    id: 'elixir_of_superior_defense',
    name: 'Elixir of Superior Defense',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_potion_86.jpg',
    duration: 3600,
    effect: { armorBonus: 450 },
    role: 'tank',
  },
  rumsey_rum_black_label: {
    id: 'rumsey_rum_black_label',
    name: 'Rumsey Rum Black Label',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_drink_04.jpg',
    duration: 900,
    effect: { staminaBonus: 15 },
    role: 'tank',
  },
};

// =========================================================================
// WORLD BUFFS - Progression-gated buffs
// =========================================================================
export const WORLD_BUFFS: Record<string, WorldBuff> = {
  // Always Available World Buffs
  songflower_serenade: {
    id: 'songflower_serenade',
    name: 'Songflower Serenade',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_mindvision.jpg',
    duration: 7200,
    effect: { allStatsBonus: 15, spellCritBonus: 5 },
    unlockBoss: undefined, // Always available
  },
  dire_maul_tribute: {
    id: 'dire_maul_tribute',
    name: 'Dire Maul Tribute',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_lesserheal02.jpg',
    duration: 7200,
    effect: { staminaBonus: 15, spellCritBonus: 3 }, // 15% HP simplified as stamina
    unlockBoss: undefined, // Always available
  },
  // Onyxia World Buff - Unlocks after first Onyxia kill
  rallying_cry_dragonslayer: {
    id: 'rallying_cry_dragonslayer',
    name: 'Rallying Cry of the Dragonslayer',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_head_dragon_01.jpg',
    duration: 7200,
    effect: { spellCritBonus: 10, attackPowerBonus: 140 },
    unlockBoss: 'onyxia',  // Requires first kill of Onyxia
    unlockRaid: "Onyxia's Lair",
    // Not comingSoon - this buff unlocks when player kills Onyxia for the first time
  },
  warchiefs_blessing: {
    id: 'warchiefs_blessing',
    name: "Warchief's Blessing",
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_arcane_teleportorgrimmar.jpg',
    duration: 7200,
    effect: { staminaBonus: 30, manaRegenBonus: 10, attackSpeedBonus: 15 }, // 300 HP = ~30 sta, 15% atk speed, 10 mp5
    unlockBoss: 'nefarian',
    unlockRaid: 'Blackwing Lair',
    // Unlocks when player defeats Nefarian for the first time
  },
  spirit_of_zandalar: {
    id: 'spirit_of_zandalar',
    name: 'Spirit of Zandalar',
    icon: 'https://wow.zamimg.com/images/wow/icons/large/ability_creature_poison_05.jpg',
    duration: 7200,
    effect: { allStatsBonus: 10 }, // 10% all stats simplified
    unlockBoss: 'hakkar',
    unlockRaid: "Zul'Gurub",
    comingSoon: true,
  },
};

// Callback for when a heal is applied - used for multiplayer sync
export type HealAppliedCallback = (data: {
  targetIndex: number;
  targetId: string;
  healAmount: number;
  spellName: string;
  spellId: string;
  playerName: string;
}) => void;

// Callback for when a dispel is applied - used for multiplayer sync
export type DispelAppliedCallback = (data: {
  targetIndex: number;
  targetId: string;
  debuffId: string;
  spellName: string;
  playerName: string;
}) => void;

export class GameEngine {
  private state: GameState;
  private intervalId: number | null = null;
  private damageTimers: Record<string, number> = {};
  private listeners: Set<() => void> = new Set();
  private actionBar: Spell[];
  private castTimeout: number | null = null;
  private aiHealerCooldowns: Record<string, number> = {};
  private aiHealerDispelCooldowns: Record<string, number> = {};
  private specialAlertCallback: ((message: string) => void) | null = null;
  private onHealApplied: HealAppliedCallback | null = null;
  private onDispelApplied: DispelAppliedCallback | null = null;
  private isMultiplayerClient: boolean = false; // If true, don't apply heals locally - they'll come from host

  constructor() {
    this.actionBar = DEFAULT_ACTION_BAR.map(s => ({ ...s }));
    this.state = this.createInitialState();
    this.initializePaladinAuras();  // Set up default auras for all paladins
    this.initializeShamanTotems();  // Set up default totems for all NPC shamans
  }

  private createInitialState(): GameState {
    const playerName = 'Healadin';
    const raidSize: 20 | 40 = 20;
    // 20-man has 2 paladins (player + 1), 40-man has 4 paladins (player + 3)
    const maxBlessings = this.getPaladinCountForRaidSize(raidSize);
    return {
      raid: this.generateRaid(raidSize, playerName),
      boss: null,
      selectedTargetId: null,
      isRunning: false,
      elapsedTime: 0,
      bossEnraged: false,
      playerMana: 4394,
      maxMana: 4394,
      spellPower: 0,
      critChance: 5,
      isCasting: false,
      castingSpell: null,
      castProgress: 0,
      globalCooldown: 0,
      healingDone: 0,
      overhealing: 0,
      // Healing meter stats
      dispelsDone: 0,
      spellHealing: {},
      aiHealerStats: {},
      lastEncounterResult: null,
      combatLog: [],
      manaPotionCooldown: 0,
      divineFavorActive: false,
      otherHealersEnabled: true,
      otherHealersHealing: 0,
      // Loot and gear system
      playerEquipment: getPreRaidBisForSpec('holy_paladin'),  // Default to Holy Paladin pre-raid BiS
      playerDKP: { points: 50, earnedThisRaid: 0 },
      pendingLoot: [],
      showLootModal: false,
      showAuctionHouse: false,
      inspectedMember: null,
      // Multiplayer loot bidding
      lootBids: {},
      lootBidTimer: 0,
      lootResults: [],
      // Player identity
      playerName,
      playerId: PLAYER_ID,
      playerBuffs: [],
      // Paladin blessing system - default to Kings and Wisdom for 20-man
      activePaladinBlessings: ['blessing_of_kings', 'blessing_of_wisdom'],
      maxPaladinBlessings: maxBlessings,
      // Raid progression
      defeatedBosses: [],  // Legacy - kept for backward compatibility
      defeatedBossesByRaid: {},  // Per-raid defeated bosses
      raidInProgress: false,
      selectedRaidId: DEFAULT_RAID_ID,  // Default to Molten Core
      firstKills: [],  // Boss IDs killed for the first time ever (for world buff unlocks)
      // Consumables and World Buffs
      activeConsumables: [],
      activeWorldBuffs: [],
      unlockedWorldBuffs: [], // Persisted across saves
      // Bad luck protection
      bossKillsWithoutPaladinLoot: 0,
      // Legendary materials inventory
      legendaryMaterials: [],
      // Quest materials inventory (dragon heads for turn-in rewards)
      questMaterials: [],
      // Track which quest rewards have been claimed (can only claim once per character)
      claimedQuestRewards: [],
      // Track which quest rewards have been assigned to raid members (each member can only receive once)
      raidMemberQuestRewards: {},
      // Track the most recently obtained quest material (for loot screen notification)
      lastObtainedQuestMaterial: null,
      // Player bag for storing extra gear
      playerBag: [],
      // Materials bag for enchanting materials
      materialsBag: { nexus_crystal: 0 },
      // Five-Second Rule tracking
      lastSpellCastTime: -10, // Start with full regen (as if no spell cast in last 10 seconds)
      // Raid management and party auras
      raidManagementMode: false,
      paladinAuraAssignments: [],  // Will be initialized with default auras for each paladin
      shamanTotemAssignments: [],  // Will be initialized with default totems for each shaman
      // Mouseover healing - cast spells on whoever the mouse is hovering over
      mouseoverTargetId: null,
      mouseoverHealingEnabled: false,
      // Faction and class system
      faction: 'alliance' as Faction,
      playerClass: 'paladin' as PlayerHealerClass,
      // Shaman-specific state (initialized but not used until faction is Horde)
      activeTotems: [],
      totemCooldowns: [],
      naturesSwiftnessActive: false,
      naturesSwiftnessCooldown: 0,
      // Faction-specific progress (each faction maintains separate gear/bag/DKP)
      allianceEquipment: getPreRaidBisForSpec('holy_paladin'),
      allianceBag: [],
      allianceDKP: { points: 0, earnedThisRaid: 0 },
      hordeEquipment: getPreRaidBisForSpec('restoration_shaman'),
      hordeBag: [],
      hordeDKP: { points: 0, earnedThisRaid: 0 },
      // Hidden boss unlocks
      silithusUnlocked: false,
      thunderaanDefeated: false,
      // Living Bomb Safe Zone
      membersInSafeZone: new Set<string>(),
      // Cloud save trigger
      pendingCloudSave: false,
    };
  }

  // Request a cloud save - App.tsx watches this flag
  requestCloudSave(): void {
    this.state.pendingCloudSave = true;
    this.notify();
  }

  // Clear the pending cloud save flag (called by App.tsx after saving)
  clearPendingCloudSave(): void {
    this.state.pendingCloudSave = false;
  }

  private getPaladinCountForRaidSize(size: 20 | 40): number {
    return size === 40 ? 4 : 2;
  }

  // Determine position zone for Chain Heal bouncing
  private getPositionZone(wowClass: WoWClass, spec: WoWSpec, role: 'tank' | 'healer' | 'dps'): PositionZone {
    if (role === 'tank') return 'tank';
    if (role === 'healer') return 'ranged';

    // DPS melee classes/specs
    const meleeClasses: WoWClass[] = ['warrior', 'rogue'];
    const meleeSpecs: WoWSpec[] = ['feral_tank', 'feral_dps', 'enhancement', 'retribution', 'arms', 'fury', 'protection_warrior', 'protection_paladin'];

    if (meleeClasses.includes(wowClass) || meleeSpecs.includes(spec)) {
      return 'melee';
    }
    return 'ranged';
  }

  private generateRaid(size: 20 | 40 = 20, playerName: string = 'Healadin', faction: Faction = 'alliance'): RaidMember[] {
    const raid: RaidMember[] = [];
    const usedNames = new Set<string>();

    // Faction-specific healer class: Paladin for Alliance, Shaman for Horde
    const healerClass: WoWClass = faction === 'alliance' ? 'paladin' : 'shaman';
    const healerSpec: WoWSpec = faction === 'alliance' ? 'holy_paladin' : 'restoration_shaman';

    // Faction healer count: 20-man = 2 (player + 1), 40-man = 4 (player + 3)
    // Alliance: This determines how many blessings can be active
    // Horde: Shamans provide totems instead
    const factionHealerCount = size === 40 ? 4 : 2;
    const otherFactionHealers = factionHealerCount - 1; // -1 because player is one

    // Composition adjusted for faction requirements
    const composition = size === 40
      ? { tanks: 4, healers: 9, dps: 26, factionHealers: otherFactionHealers }
      : { tanks: 2, healers: 4, dps: 13, factionHealers: otherFactionHealers };

    let id = 0;

    const getRandomName = (wowClass: WoWClass): string => {
      const names = CLASS_NAMES[wowClass];
      const available = names.filter(n => !usedNames.has(n));
      if (available.length === 0) {
        return `${names[Math.floor(Math.random() * names.length)]}${Math.floor(Math.random() * 99)}`;
      }
      const name = available[Math.floor(Math.random() * available.length)];
      usedNames.add(name);
      return name;
    };

    const getRandomHealth = (wowClass: WoWClass, isTank: boolean): number => {
      const range = CLASS_HEALTH[wowClass];
      const base = Math.floor(Math.random() * (range.max - range.min) + range.min);
      return isTank ? Math.floor(base * 1.4) : base;
    };

    // Get pre-raid BiS gear and calculate gear score for a spec
    const getPreRaidGearAndScore = (spec: WoWSpec): { equipment: Equipment; gearScore: number } => {
      const equipment = getPreRaidBisForSpec(spec);
      const gearScore = this.calculateGearScore(equipment);
      return { equipment, gearScore };
    };

    // Add player as first healer (paladin/shaman based on faction) - will be assigned group at end
    usedNames.add(playerName);
    const playerGear = getPreRaidGearAndScore(healerSpec);
    raid.push({
      id: PLAYER_ID,
      name: playerName,
      class: healerClass,
      spec: healerSpec,  // Player is Holy Paladin (Alliance) or Resto Shaman (Horde)
      role: 'healer',
      currentHealth: PLAYER_BASE_HEALTH,
      maxHealth: PLAYER_BASE_HEALTH,
      buffs: [],
      debuffs: [],
      isAlive: true,
      dps: 0,
      group: 1, // Will be reassigned
      equipment: playerGear.equipment,
      gearScore: playerGear.gearScore,
      positionZone: 'ranged',  // Healers are in ranged zone
    });

    // Tanks
    for (let i = 0; i < composition.tanks; i++) {
      const maxHealth = getRandomHealth('warrior', true);
      const tankGear = getPreRaidGearAndScore('protection_warrior');
      raid.push({
        id: `member_${id++}`,
        name: getRandomName('warrior'),
        class: 'warrior',
        spec: 'protection_warrior',  // Tank warriors are Protection spec
        role: 'tank',
        currentHealth: maxHealth,
        maxHealth,
        buffs: [],
        debuffs: [],
        isAlive: true,
        dps: 150,
        group: 1, // Will be reassigned
        equipment: tankGear.equipment,
        gearScore: tankGear.gearScore,
        positionZone: 'tank',  // Tanks are in their own zone
      });
    }

    // Other faction-specific healers (Paladins for Alliance, Shamans for Horde)
    // Alliance: these provide additional blessings
    // Horde: these provide totems and chain heal support
    for (let i = 0; i < composition.factionHealers; i++) {
      const maxHealth = getRandomHealth(healerClass, false);
      const factionHealerGear = getPreRaidGearAndScore(healerSpec);
      raid.push({
        id: `member_${id++}`,
        name: getRandomName(healerClass),
        class: healerClass,
        spec: healerSpec,  // Holy Paladin (Alliance) or Resto Shaman (Horde)
        role: 'healer',
        currentHealth: maxHealth,
        maxHealth,
        buffs: [],
        debuffs: [],
        isAlive: true,
        dps: 0,
        group: 1, // Will be reassigned
        equipment: factionHealerGear.equipment,
        gearScore: factionHealerGear.gearScore,
        positionZone: 'ranged',  // Healers are in ranged zone
      });
    }

    // Other Healers (priests, druids - no more faction-specific healers)
    const otherHealerClasses: WoWClass[] = ['priest', 'druid'];
    const remainingHealers = composition.healers - composition.factionHealers;
    for (let i = 0; i < remainingHealers; i++) {
      const wowClass = otherHealerClasses[i % otherHealerClasses.length];
      const maxHealth = getRandomHealth(wowClass, false);
      // Assign appropriate healer spec
      const spec: WoWSpec = wowClass === 'priest' ? 'holy_priest' : 'restoration';
      const otherHealerGear = getPreRaidGearAndScore(spec);
      raid.push({
        id: `member_${id++}`,
        name: getRandomName(wowClass),
        class: wowClass,
        spec,
        role: 'healer',
        currentHealth: maxHealth,
        maxHealth,
        buffs: [],
        debuffs: [],
        isAlive: true,
        dps: 0,
        group: 1, // Will be reassigned
        equipment: otherHealerGear.equipment,
        gearScore: otherHealerGear.gearScore,
        positionZone: 'ranged',  // Healers are in ranged zone
      });
    }

    // DPS - ensure we have mages, warlocks, druids for buffs
    const dpsClasses: WoWClass[] = ['mage', 'warlock', 'druid', 'rogue', 'hunter', 'warrior'];
    // Default DPS specs for each class
    const dpsSpecs: Record<WoWClass, WoWSpec> = {
      mage: 'fire_mage',
      warlock: 'destruction',
      druid: 'balance',  // Moonkin - provides Moonkin Aura!
      rogue: 'combat',
      hunter: 'marksmanship',  // Provides Trueshot Aura!
      warrior: 'fury',
      paladin: 'retribution',  // Not used in initial DPS pool but needed for typing
      priest: 'shadow',  // Not used in initial DPS pool but needed for typing
      shaman: 'enhancement',  // Enhancement for melee DPS
    };
    for (let i = 0; i < composition.dps; i++) {
      const wowClass = dpsClasses[i % dpsClasses.length];
      const maxHealth = getRandomHealth(wowClass, false);
      const spec = dpsSpecs[wowClass];
      const dpsGear = getPreRaidGearAndScore(spec);
      raid.push({
        id: `member_${id++}`,
        name: getRandomName(wowClass),
        class: wowClass,
        spec,
        role: 'dps',
        currentHealth: maxHealth,
        maxHealth,
        buffs: [],
        debuffs: [],
        isAlive: true,
        dps: 400 + Math.floor(Math.random() * 200),
        group: 1, // Will be reassigned
        equipment: dpsGear.equipment,
        gearScore: dpsGear.gearScore,
        positionZone: this.getPositionZone(wowClass, spec, 'dps'),
      });
    }

    // Now assign groups properly - 5 per group, sequential
    raid.forEach((member, index) => {
      member.group = Math.floor(index / 5) + 1;
    });

    return raid;
  }

  getState(): GameState {
    return this.state;
  }

  getActionBar(): Spell[] {
    return this.actionBar;
  }

  // =========================================================================
  // RAID SELECTION METHODS
  // =========================================================================

  // Select a different raid
  selectRaid(raidId: string): void {
    const raid = getRaidById(raidId);
    if (!raid || !raid.available) return;
    if (this.state.isRunning) return;  // Can't change raids during combat

    this.state.selectedRaidId = raidId;
    this.notify();
  }

  // Get encounters for current raid
  getCurrentRaidEncounters(): Boss[] {
    const raid = getRaidById(this.state.selectedRaidId);
    return raid?.encounters || ENCOUNTERS;
  }

  // Get defeated bosses for current raid
  getDefeatedBossesForCurrentRaid(): string[] {
    return this.state.defeatedBossesByRaid[this.state.selectedRaidId] || [];
  }

  // Get current raid info
  getCurrentRaid() {
    return getRaidById(this.state.selectedRaidId);
  }

  // Get all available raids
  getAllRaids() {
    return RAIDS;
  }

  // Check if a world buff is unlocked (based on firstKills)
  isWorldBuffUnlocked(buff: WorldBuff): boolean {
    if (!buff.unlockBoss) return true;  // No unlock requirement
    if (buff.comingSoon) return false;  // Coming soon buffs are always locked
    return this.state.firstKills.includes(buff.unlockBoss);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Set callback for special alerts (like Thunderaan summon)
  setSpecialAlertCallback(callback: (message: string) => void): void {
    this.specialAlertCallback = callback;
  }

  // Set callback for when heals are applied (for multiplayer sync)
  setOnHealApplied(callback: HealAppliedCallback | null): void {
    this.onHealApplied = callback;
  }

  // Set callback for when dispels are applied (for multiplayer sync)
  setOnDispelApplied(callback: DispelAppliedCallback | null): void {
    this.onDispelApplied = callback;
  }

  // Set multiplayer client mode - heals won't be applied locally, just sent to host
  setMultiplayerClientMode(isClient: boolean): void {
    this.isMultiplayerClient = isClient;
  }

  // Trigger a special alert (used for legendary/secret unlocks)
  private triggerSpecialAlert(message: string): void {
    if (this.specialAlertCallback) {
      this.specialAlertCallback(message);
    }
  }

  // =========================================================================
  // CLASS/SPEC MANAGEMENT METHODS
  // =========================================================================

  // Change a raid member's class and spec (cannot change player)
  changeMemberClassAndSpec(memberId: string, newClass: WoWClass, newSpec: WoWSpec): void {
    if (this.state.isRunning) return;  // Can't change during combat
    if (memberId === PLAYER_ID) return;  // Can't change player - they're always Holy Paladin

    const member = this.state.raid.find(m => m.id === memberId);
    if (!member) return;

    // Validate that the spec belongs to the class
    const classSpecs = CLASS_SPECS[newClass];
    const specDef = classSpecs.find(s => s.id === newSpec);
    if (!specDef) return;  // Invalid spec for this class

    // Update member
    member.class = newClass;
    member.spec = newSpec;
    member.role = specDef.role;

    // Update health based on new class and role
    const healthRange = CLASS_HEALTH[newClass];
    const baseHealth = Math.floor(Math.random() * (healthRange.max - healthRange.min) + healthRange.min);
    member.maxHealth = specDef.role === 'tank' ? Math.floor(baseHealth * 1.4) : baseHealth;
    member.currentHealth = member.maxHealth;

    // Update position zone for Chain Heal bouncing
    member.positionZone = this.getPositionZone(newClass, newSpec, specDef.role);

    // If changing a paladin, may need to update paladin aura assignments
    if (member.class !== 'paladin') {
      // Remove any aura assignment for this member (they're no longer a paladin)
      this.state.paladinAuraAssignments = this.state.paladinAuraAssignments.filter(
        a => a.paladinId !== memberId
      );
    } else {
      // If they became a paladin, initialize their aura assignment
      const existingAssignment = this.state.paladinAuraAssignments.find(a => a.paladinId === memberId);
      if (!existingAssignment) {
        this.state.paladinAuraAssignments.push({ paladinId: memberId, auraId: null });
      }
    }

    // Recalculate max paladin blessings based on new paladin count
    const paladinCount = this.state.raid.filter(m => m.class === 'paladin').length;
    this.state.maxPaladinBlessings = paladinCount;

    this.notify();
  }

  // Get the role for a spec
  getSpecRole(spec: WoWSpec): 'tank' | 'healer' | 'dps' {
    for (const classSpecs of Object.values(CLASS_SPECS)) {
      const specDef = classSpecs.find(s => s.id === spec);
      if (specDef) return specDef.role;
    }
    return 'dps';  // Default fallback
  }

  // Helper to derive a default spec from class and role (for loading old saves without spec data)
  getDefaultSpecForClassRole(wowClass: WoWClass, role: 'tank' | 'healer' | 'dps'): WoWSpec {
    const specs = CLASS_SPECS[wowClass];
    const matchingSpec = specs.find(s => s.role === role);
    return matchingSpec?.id || specs[0].id;
  }

  // =========================================================================
  // FACTION SYSTEM
  // =========================================================================

  // Get current faction
  getFaction(): Faction {
    return this.state.faction;
  }

  // Get current player healer class
  getPlayerClass(): PlayerHealerClass {
    return this.state.playerClass;
  }

  // Switch faction (Alliance <-> Horde)
  // This changes the player class and will regenerate raid with appropriate composition
  switchFaction(newFaction: Faction): void {
    if (this.state.isRunning) {
      this.addCombatLogEntry({
        message: 'Cannot switch factions during combat!',
        type: 'system',
      });
      return;
    }

    if (this.state.faction === newFaction) return;

    // Save current faction's equipment, bag, and DKP before switching
    const oldFaction = this.state.faction;
    if (oldFaction === 'alliance') {
      this.state.allianceEquipment = this.state.playerEquipment;
      this.state.allianceBag = [...this.state.playerBag];
      this.state.allianceDKP = { ...this.state.playerDKP };
    } else {
      this.state.hordeEquipment = this.state.playerEquipment;
      this.state.hordeBag = [...this.state.playerBag];
      this.state.hordeDKP = { ...this.state.playerDKP };
    }

    // Change faction and player class
    this.state.faction = newFaction;
    this.state.playerClass = newFaction === 'alliance' ? 'paladin' : 'shaman';

    // Load new faction's equipment, bag, and DKP
    if (newFaction === 'alliance') {
      this.state.playerEquipment = this.state.allianceEquipment;
      this.state.playerBag = [...this.state.allianceBag];
      this.state.playerDKP = { ...this.state.allianceDKP };
    } else {
      this.state.playerEquipment = this.state.hordeEquipment;
      this.state.playerBag = [...this.state.hordeBag];
      this.state.playerDKP = { ...this.state.hordeDKP };
    }

    // Update player stats from new equipment (computePlayerStats uses current equipment)
    const newStats = this.computePlayerStats();
    this.state.spellPower = newStats.totalSpellPower;
    this.state.maxMana = newStats.totalMaxMana;
    this.state.critChance = newStats.totalCritChance;
    // Reset mana to max with new gear
    this.state.playerMana = this.state.maxMana;

    // Reset shaman-specific state
    this.state.activeTotems = [];
    this.state.totemCooldowns = [];
    this.state.naturesSwiftnessActive = false;
    this.state.naturesSwiftnessCooldown = 0;

    // Update player in raid to reflect new class
    const player = this.state.raid.find(m => m.id === PLAYER_ID);
    if (player) {
      player.class = this.state.playerClass;
      player.spec = this.state.playerClass === 'paladin' ? 'holy_paladin' : 'restoration_shaman';
      player.name = this.state.playerClass === 'paladin' ? 'Healadin' : 'Chainheal';
      this.state.playerName = player.name;
    }

    // Switch action bar based on class
    if (this.state.playerClass === 'shaman') {
      this.actionBar = DEFAULT_SHAMAN_ACTION_BAR.map(s => ({ ...s }));
    } else {
      this.actionBar = DEFAULT_ACTION_BAR.map(s => ({ ...s }));
    }

    // Reset paladin-specific state when switching to Horde
    if (newFaction === 'horde') {
      this.state.divineFavorActive = false;
    }

    // Regenerate raid with appropriate composition (Paladins for Alliance, Shamans for Horde)
    const raidSize: 20 | 40 = 20; // Default to 20-man
    this.state.raid = this.generateRaid(raidSize, this.state.playerName, newFaction);

    // Update max blessings based on faction (Horde has 0 paladin blessings)
    this.state.maxPaladinBlessings = newFaction === 'alliance' ? this.getPaladinCountForRaidSize(raidSize) : 0;

    // Clear paladin aura assignments for Horde (they don't have paladins)
    // Clear shaman totem assignments for Alliance (they don't have shamans in Vanilla)
    if (newFaction === 'horde') {
      this.state.paladinAuraAssignments = [];
      this.state.activePaladinBlessings = [];
      // Reinitialize shaman totems for Horde
      this.initializeShamanTotems();
    } else {
      // Reinitialize paladin auras for Alliance
      this.initializePaladinAuras();
      this.state.activePaladinBlessings = ['blessing_of_kings', 'blessing_of_wisdom'];
      // Clear shaman totem assignments for Alliance
      this.state.shamanTotemAssignments = [];
    }

    this.addCombatLogEntry({
      message: `Switched to ${newFaction === 'alliance' ? 'Alliance' : 'Horde'} - Now playing ${this.state.playerClass === 'paladin' ? 'Holy Paladin' : 'Restoration Shaman'}`,
      type: 'system',
    });

    // Track class selection in PostHog
    posthog.capture('class_selected', {
      class_name: this.state.playerClass,
      faction: newFaction,
      previous_class: oldFaction === 'alliance' ? 'paladin' : 'shaman'
    });

    // Recalculate party auras for the new raid composition
    this.recalculateAuras();

    this.notify();
  }

  // =========================================================================
  // TOTEM SYSTEM (Shaman)
  // =========================================================================

  // Get active totems for display
  getActiveTotems() {
    return this.state.activeTotems;
  }

  // Get available totems for a given element
  getTotemsForElement(element: TotemElement): Totem[] {
    return TOTEMS_BY_ELEMENT[element];
  }

  // Drop a totem - replaces any existing totem of the same element
  dropTotem(totemId: string): void {
    if (this.state.playerClass !== 'shaman') {
      this.addCombatLogEntry({ message: 'Only shamans can use totems!', type: 'system' });
      this.notify();
      return;
    }

    const totem = getTotemById(totemId);
    if (!totem) {
      this.addCombatLogEntry({ message: 'Unknown totem!', type: 'system' });
      this.notify();
      return;
    }

    // Check GCD
    if (this.state.globalCooldown > 0) return;

    // Check mana
    if (this.state.playerMana < totem.manaCost) {
      this.addCombatLogEntry({ message: 'Not enough mana!', type: 'system' });
      this.notify();
      return;
    }

    // Check if this totem is on cooldown (for totems with cooldowns like Mana Tide)
    const existingCooldown = this.state.totemCooldowns.find(tc => tc.totemId === totemId);
    if (existingCooldown && existingCooldown.remainingCooldown > 0) {
      this.addCombatLogEntry({ message: `${totem.name} is on cooldown!`, type: 'system' });
      this.notify();
      return;
    }

    // Check if an NPC shaman in the player's group already has this totem assigned
    const player = this.state.raid.find(m => m.id === this.state.playerId);
    const playerGroup = player?.group || 1;

    const npcShamanWithSameTotem = this.state.shamanTotemAssignments.find(assignment => {
      const shaman = this.state.raid.find(m => m.id === assignment.shamanId);
      if (!shaman || shaman.group !== playerGroup) return false;

      return assignment.earthTotemId === totemId ||
             assignment.fireTotemId === totemId ||
             assignment.waterTotemId === totemId ||
             assignment.airTotemId === totemId;
    });

    if (npcShamanWithSameTotem) {
      const npcShaman = this.state.raid.find(m => m.id === npcShamanWithSameTotem.shamanId);
      this.addCombatLogEntry({
        message: `${npcShaman?.name || 'Another shaman'} already has ${totem.name} in your group!`,
        type: 'system'
      });
      this.notify();
      return;
    }

    // Deduct mana
    this.state.playerMana -= totem.manaCost;
    this.state.lastSpellCastTime = this.state.elapsedTime; // FSR tracking
    this.state.globalCooldown = 1.5; // Totems trigger GCD

    // Remove any existing totem of the same element and its buffs
    const existingTotemIndex = this.state.activeTotems.findIndex(at => at.element === totem.element);
    if (existingTotemIndex !== -1) {
      const oldTotem = this.state.activeTotems[existingTotemIndex];
      this.addCombatLogEntry({ message: `${oldTotem.name} fades.`, type: 'system' });
      // Remove old totem buffs from party members
      const partyMembers = this.state.raid.filter(m => m.group === oldTotem.group);
      partyMembers.forEach(member => {
        member.buffs = member.buffs.filter(b => b.id !== `totem_${oldTotem.element}_${oldTotem.id}`);
      });
      this.state.activeTotems.splice(existingTotemIndex, 1);
    }

    // Add the new totem - totems affect the player's group
    this.state.activeTotems.push({
      ...totem,
      remainingDuration: totem.duration,
      lastTickTime: this.state.elapsedTime * 1000, // Convert to milliseconds for tick tracking
      group: playerGroup,
    });

    // Apply totem buff to all party members
    const partyMembers = this.state.raid.filter(m => m.group === playerGroup && m.isAlive);
    partyMembers.forEach(member => {
      // Remove any existing buff from same element (shouldn't exist, but safety check)
      member.buffs = member.buffs.filter(b => !b.id.startsWith(`totem_${totem.element}_`));
      // Add new totem buff
      member.buffs.push({
        id: `totem_${totem.element}_${totem.id}`,
        name: totem.name,
        icon: totem.icon,
        duration: totem.duration,
        maxDuration: totem.duration,
        effect: totem.effect,
      });
    });

    // Set cooldown if the totem has one
    if (totem.cooldown > 0) {
      const cooldownIndex = this.state.totemCooldowns.findIndex(tc => tc.totemId === totemId);
      if (cooldownIndex !== -1) {
        this.state.totemCooldowns[cooldownIndex].remainingCooldown = totem.cooldown;
      } else {
        this.state.totemCooldowns.push({ totemId, remainingCooldown: totem.cooldown });
      }
    }

    this.addCombatLogEntry({ message: `${totem.name} placed.`, type: 'buff' });
    this.notify();
  }

  // Destroy a specific totem by element
  destroyTotem(element: TotemElement): void {
    const totemIndex = this.state.activeTotems.findIndex(at => at.element === element);
    if (totemIndex !== -1) {
      const totem = this.state.activeTotems[totemIndex];
      this.addCombatLogEntry({ message: `${totem.name} destroyed.`, type: 'system' });
      // Remove totem buff from party members
      const partyMembers = this.state.raid.filter(m => m.group === totem.group);
      partyMembers.forEach(member => {
        member.buffs = member.buffs.filter(b => b.id !== `totem_${totem.element}_${totem.id}`);
      });
      this.state.activeTotems.splice(totemIndex, 1);
      this.notify();
    }
  }

  // Process totem ticks - called from game loop
  private tickTotems(delta: number): void {
    if (this.state.playerClass !== 'shaman') return;

    // Update totem cooldowns
    this.state.totemCooldowns.forEach(tc => {
      if (tc.remainingCooldown > 0) {
        tc.remainingCooldown = Math.max(0, tc.remainingCooldown - delta);
      }
    });

    // Process each active totem
    const expiredTotems: number[] = [];
    const now = this.state.elapsedTime * 1000; // Convert to milliseconds

    this.state.activeTotems.forEach((activeTotem, index) => {
      // Reduce duration
      activeTotem.remainingDuration -= delta;

      // Get party members affected by this totem
      const partyMembers = this.state.raid.filter(m => m.group === activeTotem.group);

      // Update buff durations on party members
      partyMembers.forEach(member => {
        const buff = member.buffs.find(b => b.id === `totem_${activeTotem.element}_${activeTotem.id}`);
        if (buff) {
          buff.duration = activeTotem.remainingDuration;
        }
      });

      if (activeTotem.remainingDuration <= 0) {
        expiredTotems.push(index);
        this.addCombatLogEntry({ message: `${activeTotem.name} fades.`, type: 'system' });
        // Remove totem buffs from party members
        partyMembers.forEach(member => {
          member.buffs = member.buffs.filter(b => b.id !== `totem_${activeTotem.element}_${activeTotem.id}`);
        });
        return;
      }

      // Process totem tick effects based on tickRate (default 2 seconds)
      const tickRate = (activeTotem.tickRate || 2) * 1000; // Convert to milliseconds
      if (now - activeTotem.lastTickTime >= tickRate) {
        activeTotem.lastTickTime = now;

        // Get alive party members for tick effects
        const alivePartyMembers = partyMembers.filter(m => m.isAlive);

        // HEALING STREAM TOTEM - heals party every tick
        if (activeTotem.effect.healingReceivedBonus && activeTotem.id === 'healing_stream_totem') {
          alivePartyMembers.forEach(member => {
            const healAmount = activeTotem.effect.healingReceivedBonus || 0;
            const actualHeal = Math.min(healAmount, member.maxHealth - member.currentHealth);
            if (actualHeal > 0) {
              member.currentHealth += actualHeal;
              this.state.healingDone += actualHeal;
              // Track per-spell healing for meter breakdown
              this.state.spellHealing['healing_stream_totem'] = (this.state.spellHealing['healing_stream_totem'] || 0) + actualHeal;
            }
          });
        }

        // MANA REGEN TOTEMS (Mana Spring, Mana Tide) - restore mana per tick
        if (activeTotem.effect.manaRegenBonus) {
          // Mana is restored directly per tick (not mp5 formula)
          const manaGain = activeTotem.effect.manaRegenBonus;
          this.state.playerMana = Math.min(this.state.maxMana, this.state.playerMana + manaGain);
        }

        // TREMOR TOTEM - removes Fear/Charm/Sleep every tick
        if (activeTotem.effect.fearImmunity) {
          alivePartyMembers.forEach(member => {
            const beforeCount = member.debuffs.length;
            member.debuffs = member.debuffs.filter(d =>
              d.type !== 'magic' || (d.name?.toLowerCase().indexOf('fear') === -1 &&
                                     d.name?.toLowerCase().indexOf('charm') === -1 &&
                                     d.name?.toLowerCase().indexOf('sleep') === -1));
            if (member.debuffs.length < beforeCount) {
              // TODO: Could add combat log entry for fear removal
            }
          });
        }

        // POISON CLEANSING TOTEM - removes 1 poison per member every tick
        if (activeTotem.effect.cleansesPoison) {
          alivePartyMembers.forEach(member => {
            const poisonIdx = member.debuffs.findIndex(d => d.type === 'poison');
            if (poisonIdx >= 0) {
              member.debuffs.splice(poisonIdx, 1);
            }
          });
        }

        // DISEASE CLEANSING TOTEM - removes 1 disease per member every tick
        if (activeTotem.effect.cleansesDisease) {
          alivePartyMembers.forEach(member => {
            const diseaseIdx = member.debuffs.findIndex(d => d.type === 'disease');
            if (diseaseIdx >= 0) {
              member.debuffs.splice(diseaseIdx, 1);
            }
          });
        }
      }
    });

    // Remove expired totems (in reverse order to maintain indices)
    for (let i = expiredTotems.length - 1; i >= 0; i--) {
      this.state.activeTotems.splice(expiredTotems[i], 1);
    }
  }

  // Track last tick time for NPC shaman totems
  private npcShamanTotemLastTick: Record<string, number> = {};

  // Tick NPC shaman totem effects (mana regen, healing stream, cleansing, etc.)
  private tickNpcShamanTotems(_delta: number): void {
    if (this.state.faction !== 'horde') return; // Only Horde has NPC shamans

    const now = Date.now();
    const player = this.state.raid.find(m => m.name === this.state.playerName);
    if (!player) return;

    // Process each NPC shaman's totem assignments
    this.state.shamanTotemAssignments.forEach(assignment => {
      const shaman = this.state.raid.find(m => m.id === assignment.shamanId);
      if (!shaman?.isAlive || shaman.name === this.state.playerName) return;

      // Only affect party members in same group as the shaman
      if (player.group !== shaman.group) return;

      const totemIds = [
        assignment.earthTotemId,
        assignment.fireTotemId,
        assignment.waterTotemId,
        assignment.airTotemId,
      ].filter(Boolean) as string[];

      totemIds.forEach(totemId => {
        const totem = getTotemById(totemId);
        if (!totem) return;

        const tickKey = `${shaman.id}_${totemId}`;
        const tickRate = (totem.tickRate || 2) * 1000; // Convert to ms
        const lastTick = this.npcShamanTotemLastTick[tickKey] || 0;

        if (now - lastTick >= tickRate) {
          this.npcShamanTotemLastTick[tickKey] = now;

          // Get party members in shaman's group
          const partyMembers = this.state.raid.filter(m => m.group === shaman.group && m.isAlive);

          // MANA REGEN (Mana Spring: +10/2s, Mana Tide: +170/3s)
          if (totem.effect.manaRegenBonus) {
            // Only player gets mana (NPCs don't have mana pools)
            if (player.group === shaman.group) {
              this.state.playerMana = Math.min(this.state.maxMana,
                this.state.playerMana + totem.effect.manaRegenBonus);
            }
          }

          // HEALING STREAM (+14 HP/2s to party)
          if (totem.effect.healingReceivedBonus) {
            partyMembers.forEach(member => {
              const healAmount = totem.effect.healingReceivedBonus || 0;
              const actualHeal = Math.min(healAmount, member.maxHealth - member.currentHealth);
              member.currentHealth = Math.min(member.maxHealth, member.currentHealth + healAmount);
              this.state.healingDone += actualHeal;
              // Track per-spell healing for meter breakdown
              this.state.spellHealing['healing_stream_totem'] = (this.state.spellHealing['healing_stream_totem'] || 0) + actualHeal;
            });
          }

          // TREMOR TOTEM - would remove fear/charm/sleep if those debuff types existed
          // Currently the game doesn't have fear mechanics implemented as debuffs

          // POISON CLEANSING (removes 1 poison per member every 5s)
          if (totem.effect.cleansesPoison) {
            partyMembers.forEach(member => {
              const poisonIdx = member.debuffs.findIndex(d => d.type === 'poison');
              if (poisonIdx >= 0) {
                member.debuffs.splice(poisonIdx, 1);
              }
            });
          }

          // DISEASE CLEANSING (removes 1 disease per member every 5s)
          if (totem.effect.cleansesDisease) {
            partyMembers.forEach(member => {
              const diseaseIdx = member.debuffs.findIndex(d => d.type === 'disease');
              if (diseaseIdx >= 0) {
                member.debuffs.splice(diseaseIdx, 1);
              }
            });
          }
        }
      });
    });
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  addCombatLogEntry(entry: Omit<CombatLogEntry, 'timestamp'>) {
    this.state.combatLog = [
      { ...entry, timestamp: Date.now() },
      ...this.state.combatLog.slice(0, 99),
    ];
  }

  selectTarget(id: string) {
    this.state.selectedTargetId = id;
    this.notify();
  }

  // Set mouseover target for mouseover healing
  setMouseoverTarget(id: string | null) {
    if (this.state.mouseoverTargetId !== id) {
      this.state.mouseoverTargetId = id;
      this.notify();
    }
  }

  // Toggle mouseover healing mode
  setMouseoverHealingEnabled(enabled: boolean) {
    this.state.mouseoverHealingEnabled = enabled;
    // Clear mouseover target when disabling
    if (!enabled) {
      this.state.mouseoverTargetId = null;
    }
    this.notify();
  }

  startEncounter(encounterId: string) {
    if (this.state.isRunning) return;

    // Get encounters for current raid
    const raidEncounters = this.getCurrentRaidEncounters();
    const defeatedBosses = this.getDefeatedBossesForCurrentRaid();

    const encounter = encounterId === 'training'
      ? TRAINING_ENCOUNTER
      : raidEncounters.find(e => e.id === encounterId);

    if (!encounter) return;

    // Check if boss is already defeated (can't fight again until raid reset)
    if (encounterId !== 'training' && defeatedBosses.includes(encounterId)) {
      this.addCombatLogEntry({ message: `${encounter.name} is already defeated! Reset the raid to fight again.`, type: 'system' });
      this.notify();
      return;
    }

    // Check if this boss is available (must defeat previous bosses first)
    if (encounterId !== 'training') {
      const bossIndex = raidEncounters.findIndex(e => e.id === encounterId);
      if (bossIndex > 0) {
        const previousBoss = raidEncounters[bossIndex - 1];
        if (!defeatedBosses.includes(previousBoss.id)) {
          this.addCombatLogEntry({ message: `Must defeat ${previousBoss.name} first!`, type: 'system' });
          this.notify();
          return;
        }
      }
    }

    // Mark raid as in progress
    this.state.raidInProgress = true;

    // Store current buffs to re-apply after health reset
    const savedBuffs = this.state.raid.map(m => ({
      id: m.id,
      buffs: [...m.buffs],
    }));

    // Reset raid health and debuffs but keep buffs
    this.state.raid.forEach(member => {
      member.currentHealth = member.maxHealth;
      member.isAlive = true;
      member.debuffs = [];
      // Restore buffs
      const savedMember = savedBuffs.find(s => s.id === member.id);
      if (savedMember) {
        member.buffs = savedMember.buffs;
      }
    });

    // Recalculate player stats from buffs (to ensure buff bonuses are preserved)
    this.recalculateStatsFromBuffs();

    // Update player health after recalculating stats
    const player = this.getPlayerMember();
    if (player) {
      player.currentHealth = player.maxHealth;
    }

    // Create boss
    this.state.boss = { ...encounter, currentHealth: encounter.maxHealth };
    this.state.isRunning = true;
    this.state.elapsedTime = 0;
    this.state.playerMana = this.state.maxMana;
    this.state.healingDone = 0;
    this.state.overhealing = 0;
    // Reset healing meter stats
    this.state.dispelsDone = 0;
    this.state.spellHealing = {};
    this.state.aiHealerStats = {};
    this.state.lastEncounterResult = null; // Clear previous encounter result
    this.state.globalCooldown = 0;
    this.state.isCasting = false;
    this.state.castingSpell = null;
    this.state.castProgress = 0;
    this.state.manaPotionCooldown = 0;
    this.state.divineFavorActive = false;
    this.state.otherHealersHealing = 0;
    this.state.bossEnraged = false;
    this.state.combatLog = [];
    this.damageTimers = {};
    this.aiHealerCooldowns = {};
    this.aiHealerDispelCooldowns = {};

    // Reset action bar cooldowns
    this.actionBar.forEach(spell => {
      spell.currentCooldown = 0;
    });

    this.addCombatLogEntry({ message: `${encounter.name} engaged!`, type: 'system' });

    // Track encounter start in PostHog
    posthog.capture('encounter_started', {
      boss_name: encounter.name,
      boss_id: encounterId,
      raid_name: this.getCurrentRaid()?.name,
      raid_size: this.state.raid.length,
      player_class: this.state.playerClass,
      gear_score: this.getPlayerMember()?.gearScore || 0,
      is_training: encounterId === 'training'
    });

    this.startGameLoop();
    this.notify();
  }

  stopEncounter() {
    // Track abandoned encounter if still running (manual stop)
    if (this.state.isRunning && this.state.boss && !this.state.lastEncounterResult) {
      posthog.capture('encounter_abandoned', {
        boss_name: this.state.boss.name,
        boss_id: this.state.boss.id,
        time_elapsed: this.state.elapsedTime,
        player_class: this.state.playerClass
      });
    }

    this.state.isRunning = false;
    this.state.boss = null;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.castTimeout !== null) {
      clearTimeout(this.castTimeout);
      this.castTimeout = null;
    }
    this.addCombatLogEntry({ message: 'Encounter ended.', type: 'system' });
    this.notify();
  }

  // Clear the encounter result (dismiss the post-encounter summary)
  clearEncounterResult() {
    this.state.lastEncounterResult = null;
    this.notify();
  }

  resetRaid(size: 20 | 40 = 20) {
    // Preserve player equipment when resetting raid
    const playerEquipment = this.state.playerEquipment;
    this.state.raid = this.generateRaid(size, this.state.playerName);
    // Re-apply player equipment to the player raid member
    const player = this.getPlayerMember();
    if (player) {
      player.equipment = playerEquipment;
      player.gearScore = this.calculateGearScore(playerEquipment);
    }
    this.state.selectedTargetId = null;

    // Update max paladin blessings based on raid size
    const paladinCount = size === 40 ? 4 : 2;
    this.state.maxPaladinBlessings = paladinCount;

    // Trim active blessings if we now have fewer paladin slots
    if (this.state.activePaladinBlessings.length > paladinCount) {
      this.state.activePaladinBlessings = this.state.activePaladinBlessings.slice(0, paladinCount);
    }

    // Clear all buffs when resetting raid
    this.state.playerBuffs = [];
    this.state.raid.forEach(m => { m.buffs = []; });

    this.notify();
  }

  // Reset raid lockout - clears defeated bosses for ALL raids, allowing player to start fresh
  resetRaidLockout() {
    // Reset per-raid defeated bosses for ALL raids
    for (const raidId of Object.keys(this.state.defeatedBossesByRaid)) {
      this.state.defeatedBossesByRaid[raidId] = [];
    }

    // Legacy field
    this.state.defeatedBosses = [];
    this.state.raidInProgress = false;
    this.state.playerDKP.earnedThisRaid = 0;

    // Reset raid health/mana
    this.state.raid.forEach(member => {
      member.currentHealth = member.maxHealth;
      member.isAlive = true;
      member.debuffs = [];
    });
    this.state.playerMana = this.state.maxMana;

    this.addCombatLogEntry({ message: `All raid lockouts reset! All bosses are available again.`, type: 'system' });
    this.notify();
  }

  // Reset health and mana for all raid members (like drinking/eating between pulls)
  restoreRaid() {
    this.state.raid.forEach(member => {
      member.currentHealth = member.maxHealth;
      member.isAlive = true;
      member.debuffs = [];
    });
    this.state.playerMana = this.state.maxMana;

    this.addCombatLogEntry({ message: 'Raid restored to full health and mana.', type: 'system' });
    this.notify();
  }

  // Get next available boss in progression order for current raid
  getNextBoss(): string | null {
    const raidEncounters = this.getCurrentRaidEncounters();
    const defeatedBosses = this.getDefeatedBossesForCurrentRaid();
    for (const encounter of raidEncounters) {
      if (!defeatedBosses.includes(encounter.id)) {
        return encounter.id;
      }
    }
    return null; // All bosses defeated
  }

  // Check if a boss is available to fight (in current raid)
  isBossAvailable(bossId: string): boolean {
    const defeatedBosses = this.getDefeatedBossesForCurrentRaid();
    return !defeatedBosses.includes(bossId);
  }

  setPlayerName(name: string) {
    this.state.playerName = name;
    const player = this.getPlayerMember();
    if (player) {
      player.name = name;
    }
    this.notify();
  }

  getPlayerMember(): RaidMember | undefined {
    return this.state.raid.find(m => m.id === PLAYER_ID);
  }

  /**
   * Configure multiplayer healers - replaces NPC healers with player healers
   * @param players Array of player info with id, name, and class
   */
  setupMultiplayerHealers(players: Array<{ id: string; name: string; playerClass: 'paladin' | 'shaman' | 'priest' | 'druid' }>) {
    // Find all healer slots in the raid (excluding player)
    const healerIndices: number[] = [];
    this.state.raid.forEach((member, index) => {
      if (member.role === 'healer' && member.id !== PLAYER_ID) {
        healerIndices.push(index);
      }
    });

    // Replace NPC healers with multiplayer players
    players.forEach((player, i) => {
      if (i >= healerIndices.length) return; // No more slots

      const index = healerIndices[i];
      const existingMember = this.state.raid[index];

      // Determine spec based on class
      const specMap: Record<string, WoWSpec> = {
        paladin: 'holy_paladin',
        shaman: 'restoration_shaman',
        priest: 'holy_priest',
        druid: 'restoration',
      };

      // Replace the NPC healer with the player
      this.state.raid[index] = {
        ...existingMember,
        id: `mp_${player.id}`, // Prefix to distinguish multiplayer players
        name: player.name,
        class: player.playerClass as WoWClass,
        spec: specMap[player.playerClass] || 'holy_paladin',
      };
    });

    this.notify();
  }

  /**
   * Get all multiplayer player members in the raid
   */
  getMultiplayerMembers(): RaidMember[] {
    return this.state.raid.filter(m => m.id.startsWith('mp_'));
  }

  toggleOtherHealers() {
    this.state.otherHealersEnabled = !this.state.otherHealersEnabled;
    this.addCombatLogEntry({
      message: `Other healers ${this.state.otherHealersEnabled ? 'enabled' : 'disabled'}`,
      type: 'system',
    });
    this.notify();
  }

  useManaPotion() {
    if (this.state.manaPotionCooldown > 0) {
      this.addCombatLogEntry({ message: 'Mana potion is on cooldown!', type: 'system' });
      this.notify();
      return;
    }

    const restored = Math.min(MANA_POTION_RESTORE, this.state.maxMana - this.state.playerMana);
    this.state.playerMana = Math.min(this.state.maxMana, this.state.playerMana + MANA_POTION_RESTORE);
    this.state.manaPotionCooldown = MANA_POTION_COOLDOWN;
    this.addCombatLogEntry({ message: `Used Major Mana Potion (+${restored} mana)`, type: 'buff' });
    this.notify();
  }

  // Cancel the current cast
  cancelCast() {
    if (this.state.isCasting && this.castTimeout) {
      clearTimeout(this.castTimeout);
      this.castTimeout = null;
      this.state.isCasting = false;
      this.state.castingSpell = null;
      this.state.castProgress = 0;
      this.addCombatLogEntry({ message: 'Cast cancelled', type: 'system' });
      this.notify();
    }
  }

  castSpell(spell: Spell) {
    // Check if player is dead - can't cast if dead!
    // In multiplayer client mode, use PLAYER_ID to find local player since names sync from host
    const player = this.isMultiplayerClient
      ? this.state.raid.find(m => m.id === PLAYER_ID)
      : this.state.raid.find(m => m.name === this.state.playerName);
    if (!player?.isAlive) {
      this.addCombatLogEntry({ message: 'You are dead!', type: 'system' });
      this.notify();
      return;
    }

    // If already casting, cancel the current cast
    if (this.state.isCasting) {
      this.cancelCast();
      return;
    }

    // Check GCD for spells that use it
    if (this.state.globalCooldown > 0 && spell.isOnGlobalCooldown) return;

    // Check mana
    if (this.state.playerMana < spell.manaCost) {
      this.addCombatLogEntry({ message: 'Not enough mana!', type: 'system' });
      this.notify();
      return;
    }

    // Check spell cooldown
    const actionBarSpell = this.actionBar.find(s => s.id === spell.id);
    if (actionBarSpell && actionBarSpell.currentCooldown > 0) {
      this.addCombatLogEntry({ message: `${spell.name} is on cooldown!`, type: 'system' });
      this.notify();
      return;
    }

    // Divine Favor - just activate the buff
    if (spell.id === 'divine_favor') {
      this.state.divineFavorActive = true;
      this.state.playerMana -= spell.manaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime; // FSR tracking
      if (actionBarSpell) actionBarSpell.currentCooldown = spell.cooldown;
      this.addCombatLogEntry({ message: 'Divine Favor activated - next heal will crit!', type: 'buff' });
      this.notify();
      return;
    }

    // Nature's Swiftness - makes next heal instant (Shaman)
    if (spell.id === 'natures_swiftness') {
      this.state.naturesSwiftnessActive = true;
      this.state.playerMana -= spell.manaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime; // FSR tracking
      if (actionBarSpell) actionBarSpell.currentCooldown = spell.cooldown;
      this.addCombatLogEntry({ message: "Nature's Swiftness activated - next nature spell is instant!", type: 'buff' });
      this.notify();
      return;
    }

    // Determine target based on mouseover healing mode
    // When mouseover healing is enabled, use mouseoverTargetId; otherwise use selectedTargetId
    const targetId = this.state.mouseoverHealingEnabled
      ? this.state.mouseoverTargetId
      : this.state.selectedTargetId;

    // Need a target for most spells
    if (!targetId && spell.id !== 'divine_favor') {
      const message = this.state.mouseoverHealingEnabled
        ? 'No mouseover target!'
        : 'No target selected!';
      this.addCombatLogEntry({ message, type: 'system' });
      this.notify();
      return;
    }

    const target = this.state.raid.find(m => m.id === targetId);
    if (!target) return;

    // Blessing of Light - instant buff application
    if (spell.id === 'blessing_of_light') {
      this.state.playerMana -= spell.manaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime; // FSR tracking
      this.state.globalCooldown = GCD_DURATION;

      // Remove existing BoL and add new one
      target.buffs = target.buffs.filter(b => b.id !== 'blessing_of_light');
      target.buffs.push({
        id: 'blessing_of_light',
        name: 'Blessing of Light',
        icon: spell.icon,
        duration: 300,
        maxDuration: 300,
        effect: BLESSING_OF_LIGHT_VALUES,
      });

      this.addCombatLogEntry({ message: `Blessing of Light applied to ${target.name}`, type: 'buff' });
      this.notify();
      return;
    }

    // Cleanse - remove a dispellable debuff
    if (spell.id === 'cleanse') {
      const dispellable = target.debuffs.find(
        d => (d.type === 'magic' || d.type === 'poison' || d.type === 'disease') && d.dispellable !== false
      );

      if (!dispellable) {
        this.addCombatLogEntry({ message: 'Nothing to dispel!', type: 'system' });
        this.notify();
        return;
      }

      this.state.playerMana -= spell.manaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime; // FSR tracking
      this.state.globalCooldown = GCD_DURATION;

      // Find target index for multiplayer sync
      const targetIndex = this.state.raid.findIndex(m => m.id === target.id);

      // Call multiplayer callback if set
      if (this.onDispelApplied) {
        this.onDispelApplied({
          targetIndex,
          targetId: target.id,
          debuffId: dispellable.id,
          spellName: spell.name,
          playerName: this.state.playerName,
        });
      }

      // In multiplayer client mode, don't apply locally - host will sync it
      if (!this.isMultiplayerClient) {
        target.debuffs = target.debuffs.filter(d => d.id !== dispellable.id);
        // Track dispels for healing meter
        this.state.dispelsDone++;
      }
      this.addCombatLogEntry({ message: `Cleansed ${dispellable.name} from ${target.name}`, type: 'buff' });
      this.notify();
      return;
    }

    // Cure Poison (Shaman) - remove a poison debuff only
    if (spell.id === 'cure_poison') {
      const poison = target.debuffs.find(d => d.type === 'poison');

      if (!poison) {
        this.addCombatLogEntry({ message: 'No poison to remove!', type: 'system' });
        this.notify();
        return;
      }

      this.state.playerMana -= spell.manaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime; // FSR tracking
      this.state.globalCooldown = GCD_DURATION;

      // Find target index for multiplayer sync
      const targetIndex = this.state.raid.findIndex(m => m.id === target.id);

      // Call multiplayer callback if set
      if (this.onDispelApplied) {
        this.onDispelApplied({
          targetIndex,
          targetId: target.id,
          debuffId: poison.id,
          spellName: spell.name,
          playerName: this.state.playerName,
        });
      }

      // In multiplayer client mode, don't apply locally - host will sync it
      if (!this.isMultiplayerClient) {
        target.debuffs = target.debuffs.filter(d => d.id !== poison.id);
        // Track dispels for healing meter
        this.state.dispelsDone++;
      }
      this.addCombatLogEntry({ message: `Cured ${poison.name} from ${target.name}`, type: 'buff' });
      this.notify();
      return;
    }

    // Cure Disease (Shaman) - remove a disease debuff only
    if (spell.id === 'cure_disease') {
      const disease = target.debuffs.find(d => d.type === 'disease');

      if (!disease) {
        this.addCombatLogEntry({ message: 'No disease to remove!', type: 'system' });
        this.notify();
        return;
      }

      this.state.playerMana -= spell.manaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime; // FSR tracking
      this.state.globalCooldown = GCD_DURATION;

      // Find target index for multiplayer sync
      const targetIndex = this.state.raid.findIndex(m => m.id === target.id);

      // Call multiplayer callback if set
      if (this.onDispelApplied) {
        this.onDispelApplied({
          targetIndex,
          targetId: target.id,
          debuffId: disease.id,
          spellName: spell.name,
          playerName: this.state.playerName,
        });
      }

      // In multiplayer client mode, don't apply locally - host will sync it
      if (!this.isMultiplayerClient) {
        target.debuffs = target.debuffs.filter(d => d.id !== disease.id);
        // Track dispels for healing meter
        this.state.dispelsDone++;
      }
      this.addCombatLogEntry({ message: `Cured ${disease.name} from ${target.name}`, type: 'buff' });
      this.notify();
      return;
    }

    // Lay on Hands - instant full heal
    if (spell.id === 'lay_on_hands') {
      if (!target.isAlive) {
        this.addCombatLogEntry({ message: 'Cannot heal dead target!', type: 'system' });
        this.notify();
        return;
      }

      const healAmount = target.maxHealth;
      const actualHeal = Math.min(healAmount, target.maxHealth - target.currentHealth);
      const overheal = healAmount - actualHeal;

      // Find target index for multiplayer sync
      const targetIndex = this.state.raid.findIndex(m => m.id === target.id);

      // Call multiplayer callback if set
      if (this.onHealApplied) {
        this.onHealApplied({
          targetIndex,
          targetId: target.id,
          healAmount: healAmount,
          spellName: spell.name,
          spellId: spell.id,
          playerName: this.state.playerName,
        });
      }

      // In multiplayer client mode, don't apply heal locally
      if (this.isMultiplayerClient) {
        this.state.playerMana = 0; // Still drain mana
        this.state.lastSpellCastTime = this.state.elapsedTime;
        this.state.globalCooldown = GCD_DURATION;
        if (actionBarSpell) actionBarSpell.currentCooldown = spell.cooldown;
        this.addCombatLogEntry({
          message: `Lay on Hands heals ${target.name} for ${actualHeal}${overheal > 0 ? ` (${overheal} overheal)` : ''} (syncing...)`,
          type: 'heal',
          amount: actualHeal,
        });
        this.notify();
        return;
      }

      target.currentHealth = target.maxHealth;
      this.state.playerMana = 0; // Drains all mana
      this.state.lastSpellCastTime = this.state.elapsedTime; // FSR tracking
      this.state.globalCooldown = GCD_DURATION;
      this.state.healingDone += actualHeal;
      this.state.overhealing += overheal;
      // Track per-spell healing for meter breakdown
      this.state.spellHealing[spell.id] = (this.state.spellHealing[spell.id] || 0) + actualHeal;

      if (actionBarSpell) actionBarSpell.currentCooldown = spell.cooldown;

      this.addCombatLogEntry({
        message: `Lay on Hands heals ${target.name} for ${actualHeal}${overheal > 0 ? ` (${overheal} overheal)` : ''}`,
        type: 'heal',
        amount: actualHeal,
      });
      this.notify();
      return;
    }

    // Holy Shock - instant heal
    if (spell.id === 'holy_shock') {
      if (!target.isAlive) {
        this.addCombatLogEntry({ message: 'Cannot heal dead target!', type: 'system' });
        this.notify();
        return;
      }

      this.state.playerMana -= spell.manaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime; // FSR tracking
      this.state.globalCooldown = GCD_DURATION;
      if (actionBarSpell) actionBarSpell.currentCooldown = spell.cooldown;

      this.applyHeal(target, spell);
      this.notify();
      return;
    }

    // Cast time spells (Holy Light, Flash of Light, Healing Wave, Lesser Healing Wave, Chain Heal)
    if (spell.castTime > 0) {
      if (!target.isAlive) {
        this.addCombatLogEntry({ message: 'Cannot heal dead target!', type: 'system' });
        this.notify();
        return;
      }

      // Check for Nature's Swiftness - makes the spell instant
      const isInstant = this.state.naturesSwiftnessActive;
      if (isInstant) {
        this.state.naturesSwiftnessActive = false;
        this.addCombatLogEntry({ message: "Nature's Swiftness consumed!", type: 'buff' });
      }

      // Determine effective cast time
      const effectiveCastTime = isInstant ? 0 : spell.castTime;

      if (effectiveCastTime === 0) {
        // Instant cast (Nature's Swiftness active)
        this.state.playerMana -= spell.manaCost;
        this.state.lastSpellCastTime = this.state.elapsedTime; // FSR tracking
        this.state.globalCooldown = GCD_DURATION;

        // Check if this is a Chain Heal spell
        if (spell.maxBounces && spell.maxBounces > 0) {
          this.applyChainHeal(target, spell);
        } else {
          this.applyHeal(target, spell);
        }

        if (actionBarSpell && spell.cooldown > 0) {
          actionBarSpell.currentCooldown = spell.cooldown;
        }

        this.notify();
        return;
      }

      // Don't deduct mana yet - wait until cast completes
      this.state.isCasting = true;
      this.state.castingSpell = spell;
      this.state.castProgress = 0;

      // GCD starts when cast BEGINS, not when it ends (like real WoW)
      // This allows casting the next spell immediately after a long cast finishes
      if (spell.isOnGlobalCooldown) {
        this.state.globalCooldown = GCD_DURATION;
      }

      this.castTimeout = window.setTimeout(() => {
        if (this.state.isCasting && this.state.castingSpell?.id === spell.id) {
          // Check if we still have enough mana when cast completes
          if (this.state.playerMana < spell.manaCost) {
            this.addCombatLogEntry({ message: 'Not enough mana!', type: 'system' });
            this.state.isCasting = false;
            this.state.castingSpell = null;
            this.state.castProgress = 0;
            this.notify();
            return;
          }

          // Deduct mana when cast completes
          this.state.playerMana -= spell.manaCost;
          this.state.lastSpellCastTime = this.state.elapsedTime; // FSR tracking

          // Use the original target from when cast started (stored in targetId closure)
          const currentTarget = this.state.raid.find(m => m.id === targetId);
          if (currentTarget && currentTarget.isAlive) {
            // Check if this is a Chain Heal spell
            if (spell.maxBounces && spell.maxBounces > 0) {
              this.applyChainHeal(currentTarget, spell);
            } else {
              this.applyHeal(currentTarget, spell);
            }
          }

          this.state.isCasting = false;
          this.state.castingSpell = null;
          this.state.castProgress = 0;
          // GCD already started at cast BEGIN (line 1986-1988), not here at cast end

          if (actionBarSpell && spell.cooldown > 0) {
            actionBarSpell.currentCooldown = spell.cooldown;
          }

          this.notify();
        }
      }, spell.castTime * 1000);

      this.notify();
    }
  }

  private applyHeal(target: RaidMember, spell: Spell) {
    // Calculate base heal
    const baseHeal = spell.healAmount.min + Math.random() * (spell.healAmount.max - spell.healAmount.min);
    const spellPowerBonus = this.state.spellPower * spell.spellPowerCoefficient;
    let totalHeal = Math.floor(baseHeal + spellPowerBonus);

    // Check for Blessing of Light bonus
    const bolBuff = target.buffs.find(b => b.id === 'blessing_of_light');
    if (bolBuff?.effect) {
      if (spell.name === 'Holy Light') {
        totalHeal += bolBuff.effect.holyLightBonus || 0;
      } else if (spell.name === 'Flash of Light') {
        totalHeal += bolBuff.effect.flashOfLightBonus || 0;
      }
    }

    // Check for crit
    let isCrit = Math.random() * 100 < this.state.critChance;

    // Divine Favor guarantees crit
    if (this.state.divineFavorActive) {
      isCrit = true;
      this.state.divineFavorActive = false;
      this.addCombatLogEntry({ message: 'Divine Favor consumed!', type: 'buff' });
    }

    if (isCrit) {
      totalHeal = Math.floor(totalHeal * 1.5);

      // Illumination: Refund 60% of base mana cost on crit
      const illuminationRefund = Math.floor(spell.manaCost * 0.6);
      this.state.playerMana = Math.min(
        this.state.maxMana,
        this.state.playerMana + illuminationRefund
      );
      this.addCombatLogEntry({
        message: `Illumination! Refunded ${illuminationRefund} mana`,
        type: 'buff',
      });

      // Track crit heal time for animation
      target.lastCritHealTime = Date.now();
    }

    const actualHeal = Math.min(totalHeal, target.maxHealth - target.currentHealth);
    const overheal = totalHeal - actualHeal;

    // Find target index for multiplayer sync
    const targetIndex = this.state.raid.findIndex(m => m.id === target.id);

    // Call multiplayer callback if set
    if (this.onHealApplied) {
      this.onHealApplied({
        targetIndex,
        targetId: target.id,
        healAmount: totalHeal,
        spellName: spell.name,
        spellId: spell.id,
        playerName: this.state.playerName,
      });
    }

    // In multiplayer client mode, don't apply heal to target locally - host will sync it back
    // But DO track our own healing stats for the meter
    if (this.isMultiplayerClient) {
      // Track healing stats locally for the meter (even though host applies the actual heal)
      this.state.healingDone += actualHeal;
      this.state.overhealing += overheal;
      this.state.spellHealing[spell.id] = (this.state.spellHealing[spell.id] || 0) + actualHeal;

      this.addCombatLogEntry({
        message: `${spell.name} ${isCrit ? 'CRITS ' : 'heals '}${target.name} for ${actualHeal}${overheal > 0 ? ` (${overheal} overheal)` : ''}`,
        type: 'heal',
        amount: actualHeal,
        isCrit,
      });
      return;
    }

    target.currentHealth = Math.min(target.maxHealth, target.currentHealth + totalHeal);
    this.state.healingDone += actualHeal;
    this.state.overhealing += overheal;
    // Track per-spell healing for meter breakdown
    this.state.spellHealing[spell.id] = (this.state.spellHealing[spell.id] || 0) + actualHeal;

    this.addCombatLogEntry({
      message: `${spell.name} ${isCrit ? 'CRITS ' : 'heals '}${target.name} for ${actualHeal}${overheal > 0 ? ` (${overheal} overheal)` : ''}`,
      type: 'heal',
      amount: actualHeal,
      isCrit,
    });
  }

  // Chain Heal - bounces to nearby injured targets within the same position zone
  private applyChainHeal(primaryTarget: RaidMember, spell: Spell) {
    const maxBounces = spell.maxBounces || 2;
    const bounceReduction = spell.bounceReduction || 0.5;
    const healedTargets: Set<string> = new Set();

    // Calculate base heal for primary target
    const baseHeal = spell.healAmount.min + Math.random() * (spell.healAmount.max - spell.healAmount.min);
    const spellPowerBonus = this.state.spellPower * spell.spellPowerCoefficient;
    let currentHealAmount = Math.floor(baseHeal + spellPowerBonus);

    // Check for crit (applies to primary target only in Vanilla)
    const isCrit = Math.random() * 100 < this.state.critChance;
    if (isCrit) {
      currentHealAmount = Math.floor(currentHealAmount * 1.5);
      primaryTarget.lastCritHealTime = Date.now();
    }

    // Heal primary target
    this.applyChainHealToTarget(primaryTarget, spell, currentHealAmount, isCrit, 1);
    healedTargets.add(primaryTarget.id);

    // Find bounce targets - must be in same position zone, alive, and injured
    let currentZone = primaryTarget.positionZone;
    let bouncesRemaining = maxBounces;

    for (let bounce = 0; bounce < maxBounces && bouncesRemaining > 0; bounce++) {
      // Reduce heal for each bounce
      currentHealAmount = Math.floor(currentHealAmount * (1 - bounceReduction));

      // Find the most injured target in the same position zone that hasn't been healed
      const eligibleTargets = this.state.raid.filter(member =>
        member.isAlive &&
        !healedTargets.has(member.id) &&
        member.positionZone === currentZone &&
        member.currentHealth < member.maxHealth
      ).sort((a, b) => {
        // Sort by missing health percentage (most injured first)
        const aHealthPercent = a.currentHealth / a.maxHealth;
        const bHealthPercent = b.currentHealth / b.maxHealth;
        return aHealthPercent - bHealthPercent;
      });

      if (eligibleTargets.length === 0) {
        // No more targets in zone, try to find targets in adjacent zones
        // In Vanilla, Chain Heal could jump between zones if no nearby targets
        const otherZoneTargets = this.state.raid.filter(member =>
          member.isAlive &&
          !healedTargets.has(member.id) &&
          member.currentHealth < member.maxHealth
        ).sort((a, b) => {
          const aHealthPercent = a.currentHealth / a.maxHealth;
          const bHealthPercent = b.currentHealth / b.maxHealth;
          return aHealthPercent - bHealthPercent;
        });

        if (otherZoneTargets.length > 0) {
          const bounceTarget = otherZoneTargets[0];
          this.applyChainHealToTarget(bounceTarget, spell, currentHealAmount, false, bounce + 2);
          healedTargets.add(bounceTarget.id);
          currentZone = bounceTarget.positionZone;
          bouncesRemaining--;
        } else {
          break; // No more valid targets
        }
      } else {
        const bounceTarget = eligibleTargets[0];
        this.applyChainHealToTarget(bounceTarget, spell, currentHealAmount, false, bounce + 2);
        healedTargets.add(bounceTarget.id);
        bouncesRemaining--;
      }
    }
  }

  private applyChainHealToTarget(target: RaidMember, spell: Spell, healAmount: number, isCrit: boolean, bounceNumber: number) {
    const actualHeal = Math.min(healAmount, target.maxHealth - target.currentHealth);
    const overheal = healAmount - actualHeal;

    target.currentHealth = Math.min(target.maxHealth, target.currentHealth + healAmount);
    this.state.healingDone += actualHeal;
    this.state.overhealing += overheal;
    // Track per-spell healing for meter breakdown
    this.state.spellHealing[spell.id] = (this.state.spellHealing[spell.id] || 0) + actualHeal;

    const bounceText = bounceNumber > 1 ? ` (bounce ${bounceNumber - 1})` : '';
    this.addCombatLogEntry({
      message: `${spell.name}${bounceText} ${isCrit ? 'CRITS ' : 'heals '}${target.name} for ${actualHeal}${overheal > 0 ? ` (${overheal} overheal)` : ''}`,
      type: 'heal',
      amount: actualHeal,
      isCrit,
    });
  }

  // Get predicted Chain Heal bounce targets for preview UI
  // Returns array of member IDs that would be bounced to (not including primary target)
  getChainHealBounceTargets(primaryTargetId: string, maxBounces: number = 2): string[] {
    const primaryTarget = this.state.raid.find(m => m.id === primaryTargetId);
    if (!primaryTarget || !primaryTarget.isAlive) return [];

    const healedTargets: Set<string> = new Set([primaryTargetId]);
    const bounceTargetIds: string[] = [];
    let currentZone = primaryTarget.positionZone;

    for (let bounce = 0; bounce < maxBounces; bounce++) {
      // Find the most injured target in the same position zone that hasn't been healed
      const eligibleTargets = this.state.raid.filter(member =>
        member.isAlive &&
        !healedTargets.has(member.id) &&
        member.positionZone === currentZone &&
        member.currentHealth < member.maxHealth
      ).sort((a, b) => {
        const aHealthPercent = a.currentHealth / a.maxHealth;
        const bHealthPercent = b.currentHealth / b.maxHealth;
        return aHealthPercent - bHealthPercent;
      });

      if (eligibleTargets.length === 0) {
        // Try other zones
        const otherZoneTargets = this.state.raid.filter(member =>
          member.isAlive &&
          !healedTargets.has(member.id) &&
          member.currentHealth < member.maxHealth
        ).sort((a, b) => {
          const aHealthPercent = a.currentHealth / a.maxHealth;
          const bHealthPercent = b.currentHealth / b.maxHealth;
          return aHealthPercent - bHealthPercent;
        });

        if (otherZoneTargets.length > 0) {
          const bounceTarget = otherZoneTargets[0];
          bounceTargetIds.push(bounceTarget.id);
          healedTargets.add(bounceTarget.id);
          currentZone = bounceTarget.positionZone;
        } else {
          break;
        }
      } else {
        const bounceTarget = eligibleTargets[0];
        bounceTargetIds.push(bounceTarget.id);
        healedTargets.add(bounceTarget.id);
      }
    }

    return bounceTargetIds;
  }

  // === Party Aura System ===

  // Calculate damage reduction based on armor and resistance from active auras
  private calculateDamageReduction(member: RaidMember, baseDamage: number, damageType: DamageType = 'physical'): number {
    let finalDamage = baseDamage;

    // Get total armor/resistance bonuses from buffs (including aura buffs)
    let totalArmorBonus = 0;
    let totalResistance = 0;

    const resistanceMap: Record<string, keyof BuffEffect> = {
      fire: 'fireResistance',
      frost: 'frostResistance',
      shadow: 'shadowResistance',
      nature: 'natureResistance',
      arcane: 'arcaneResistance',
    };

    // Sum up bonuses from all buffs
    member.buffs.forEach(buff => {
      if (buff.effect) {
        totalArmorBonus += buff.effect.armorBonus || 0;
        if (resistanceMap[damageType]) {
          totalResistance += buff.effect[resistanceMap[damageType]] as number || 0;
        }
      }
    });

    // Physical damage reduction from armor
    if (damageType === 'physical') {
      // Classic WoW armor formula: DR = Armor / (Armor + 400 + 85 * Level)
      // At level 60: DR = Armor / (Armor + 5500)
      const armorDR = totalArmorBonus / (totalArmorBonus + 5500);
      finalDamage = Math.floor(baseDamage * (1 - armorDR));
    }

    // Elemental resistance reduction
    if (resistanceMap[damageType] && totalResistance > 0) {
      // Classic resistance formula: average 75% reduction at 315 resistance
      // Simplified: each point of resistance = ~0.24% reduction, cap at 75%
      const resistDR = Math.min(0.75, totalResistance * 0.0024);
      finalDamage = Math.floor(baseDamage * (1 - resistDR));
    }

    return finalDamage;
  }

  // Handle member death - cancel player cast if player dies
  private handleMemberDeath(member: RaidMember): void {
    member.isAlive = false;
    this.addCombatLogEntry({ message: `${member.name} has died!`, type: 'damage' });

    // If the player died, cancel any in-progress cast
    if (member.name === this.state.playerName) {
      if (this.state.isCasting && this.castTimeout !== null) {
        clearTimeout(this.castTimeout);
        this.castTimeout = null;
        this.state.isCasting = false;
        this.state.castingSpell = null;
        this.state.castProgress = 0;
      }
      this.addCombatLogEntry({ message: 'You have fallen in battle!', type: 'system' });
    }
  }

  // Living Bomb Safe Zone - set whether a member is in the safe zone
  public setMemberInSafeZone(memberId: string, inSafeZone: boolean): void {
    if (inSafeZone) {
      this.state.membersInSafeZone.add(memberId);
    } else {
      this.state.membersInSafeZone.delete(memberId);
    }
    this.notify();
  }

  // Handle Living Bomb explosion when debuff expires
  private handleLivingBombExplosion(member: RaidMember, damage: number): void {
    const isInSafeZone = this.state.membersInSafeZone.has(member.id);

    // Apply damage to the bomb target
    member.currentHealth -= damage;
    if (member.currentHealth <= 0) {
      member.currentHealth = 0;
      this.handleMemberDeath(member);
    }

    if (isInSafeZone) {
      // Safe explosion - only target takes damage
      this.addCombatLogEntry({
        message: `${member.name}'s Living Bomb detonated safely in the safe zone!`,
        type: 'system'
      });
      // Remove from safe zone
      this.state.membersInSafeZone.delete(member.id);
    } else {
      // Raid explosion - splash damage to nearby members
      this.addCombatLogEntry({
        message: `${member.name}'s Living Bomb EXPLODED in the raid!`,
        type: 'damage'
      });

      // Find 4-5 nearby targets (prioritize same group)
      const aliveMembers = this.state.raid.filter(m => m.isAlive && m.id !== member.id);
      const sameGroup = aliveMembers.filter(m => m.group === member.group);
      const otherGroups = aliveMembers.filter(m => m.group !== member.group);

      // Take up to 5 targets, same group first
      const splashTargets = [...sameGroup, ...otherGroups].slice(0, 5);

      splashTargets.forEach(target => {
        target.currentHealth -= damage;
        if (target.currentHealth <= 0) {
          target.currentHealth = 0;
          this.handleMemberDeath(target);
        }
      });

      if (splashTargets.length > 0) {
        this.addCombatLogEntry({
          message: `Living Bomb hit ${splashTargets.length} nearby raiders for ${damage} damage each!`,
          type: 'damage'
        });
      }
    }
  }

  // Get active auras affecting a specific member based on their group (used by UI)
  public getActiveAurasForMember(member: RaidMember): PartyAura[] {
    const activeAuras: PartyAura[] = [];

    // Check automatic auras (non-paladin) - party-scoped
    Object.values(PARTY_AURAS).forEach(aura => {
      if (!aura.isAutomatic) return;

      // Find providers of this aura in the same group
      const provider = this.state.raid.find(m =>
        m.isAlive &&
        m.class === aura.providerClass &&
        m.group === member.group
      );

      if (provider) {
        activeAuras.push(aura);
      }
    });

    // Check paladin auras (party-scoped, not raid-wide)
    this.state.paladinAuraAssignments.forEach(assignment => {
      if (!assignment.auraId) return;
      const paladin = this.state.raid.find(m => m.id === assignment.paladinId);
      if (!paladin?.isAlive) return;

      // Only affect members in the same party as the paladin
      if (paladin.group !== member.group) return;

      const aura = PARTY_AURAS[assignment.auraId];
      if (aura) {
        activeAuras.push(aura);
      }
    });

    return activeAuras;
  }

  // Recalculate and apply all party aura buffs
  public recalculateAuras() {
    // Clear existing aura buffs (paladin auras and shaman totem auras)
    this.state.raid.forEach(m => {
      m.buffs = m.buffs.filter(b => !b.id.startsWith('aura_') && !b.id.startsWith('shaman_totem_'));
    });

    // Apply automatic party auras
    Object.values(PARTY_AURAS).forEach(aura => {
      if (!aura.isAutomatic) return;

      // Find providers of this aura (using memberProvidesAura for proper spec checking)
      const providers = this.state.raid.filter(m =>
        m.isAlive && memberProvidesAura(m, aura)
      );

      providers.forEach(provider => {
        const targets = aura.scope === 'party'
          ? this.state.raid.filter(m => m.group === provider.group)
          : this.state.raid;

        targets.forEach(target => {
          if (!target.buffs.find(b => b.id === `aura_${aura.id}`)) {
            target.buffs.push({
              id: `aura_${aura.id}`,
              name: aura.name,
              icon: aura.icon,
              duration: Infinity,
              maxDuration: Infinity,
              effect: aura.effect,
            });
          }
        });
      });
    });

    // Apply paladin auras (manual selection, party-scoped like in Classic WoW)
    this.state.paladinAuraAssignments.forEach(assignment => {
      if (!assignment.auraId) return;
      const paladin = this.state.raid.find(m => m.id === assignment.paladinId);
      if (!paladin?.isAlive) return;

      const aura = PARTY_AURAS[assignment.auraId];
      if (!aura) return;

      // Paladin auras only affect the paladin's party (5 people), not the whole raid
      const partyMembers = this.state.raid.filter(m => m.group === paladin.group);
      partyMembers.forEach(target => {
        if (!target.buffs.find(b => b.id === `aura_${aura.id}`)) {
          target.buffs.push({
            id: `aura_${aura.id}`,
            name: aura.name,
            icon: aura.icon,
            duration: Infinity,
            maxDuration: Infinity,
            effect: aura.effect,
          });
        }
      });
    });

    // Apply NPC shaman totem auras (party-scoped, persistent buffs)
    this.state.shamanTotemAssignments.forEach(assignment => {
      const shaman = this.state.raid.find(m => m.id === assignment.shamanId);
      if (!shaman?.isAlive || shaman.name === this.state.playerName) return; // Skip dead shamans and player (player has active totems instead)

      // Get all assigned totems for this shaman
      const totemIds = [
        assignment.earthTotemId,
        assignment.fireTotemId,
        assignment.waterTotemId,
        assignment.airTotemId,
      ].filter(Boolean) as string[];

      totemIds.forEach(totemId => {
        const totem = getTotemById(totemId);
        if (!totem) return;

        // NPC Shaman totems are party-scoped (only affect their party group)
        const partyMembers = this.state.raid.filter(m => m.group === shaman.group);
        partyMembers.forEach(target => {
          // Use unique buff ID per shaman to allow multiple shaman totems
          const buffId = `shaman_totem_${shaman.id}_${totem.id}`;
          if (!target.buffs.find(b => b.id === buffId)) {
            target.buffs.push({
              id: buffId,
              name: totem.name,
              icon: totem.icon,
              duration: Infinity, // NPC totems are persistent (like auras)
              maxDuration: Infinity,
              effect: totem.effect,
            });
          }
        });
      });
    });

    this.notify();
  }

  // Move a raid member to a different group
  public moveMemberToGroup(memberId: string, targetGroup: number) {
    if (this.state.isRunning) return; // Can't move during combat

    const member = this.state.raid.find(m => m.id === memberId);
    if (member && targetGroup >= 1 && targetGroup <= 8) {
      // Check if target group has space (max 5 per group)
      const groupMembers = this.state.raid.filter(m => m.group === targetGroup);
      if (groupMembers.length >= 5) {
        this.addCombatLogEntry({
          message: `Group ${targetGroup} is full!`,
          type: 'system',
        });
        return;
      }

      member.group = targetGroup;
      this.recalculateAuras();
      this.notify();
    }
  }

  // Swap two raid members' positions (groups)
  public swapMembers(memberId1: string, memberId2: string) {
    if (this.state.isRunning) return; // Can't swap during combat

    const member1 = this.state.raid.find(m => m.id === memberId1);
    const member2 = this.state.raid.find(m => m.id === memberId2);

    if (member1 && member2 && member1.id !== member2.id) {
      const tempGroup = member1.group;
      member1.group = member2.group;
      member2.group = tempGroup;
      this.recalculateAuras();
      this.notify();
    }
  }

  // Set a paladin's active aura
  public setPaladinAura(paladinId: string, auraId: string | null) {
    const paladin = this.state.raid.find(m => m.id === paladinId && m.class === 'paladin');
    if (!paladin) return;

    const existing = this.state.paladinAuraAssignments.find(a => a.paladinId === paladinId);
    if (existing) {
      existing.auraId = auraId;
    } else {
      this.state.paladinAuraAssignments.push({ paladinId, auraId });
    }

    this.recalculateAuras();
  }

  // Get a paladin's current aura
  public getPaladinAura(paladinId: string): string | null {
    const assignment = this.state.paladinAuraAssignments.find(a => a.paladinId === paladinId);
    return assignment?.auraId || null;
  }

  // Toggle raid management mode
  public toggleRaidManagementMode() {
    if (this.state.isRunning) return; // Can't toggle during combat
    this.state.raidManagementMode = !this.state.raidManagementMode;
    this.notify();
  }

  // Initialize default paladin aura assignments
  private initializePaladinAuras() {
    const paladins = this.state.raid.filter(m => m.class === 'paladin');
    const defaultAuras = ['devotion_aura', 'concentration_aura', 'fire_resistance_aura', 'shadow_resistance_aura'];

    this.state.paladinAuraAssignments = paladins.map((paladin, index) => ({
      paladinId: paladin.id,
      auraId: defaultAuras[index % defaultAuras.length],
    }));

    this.recalculateAuras();
  }

  // Initialize default shaman totem assignments for NPC shamans
  private initializeShamanTotems() {
    const shamans = this.state.raid.filter(m => m.class === 'shaman' && m.name !== this.state.playerName);

    // Default totems for each element - sensible raid setup
    // Water: Mana Spring (for healer mana), Earth: Stoneskin (for tanks),
    // Air: Varies by group role, Fire: Fire Resistance (for MC/BWL)
    this.state.shamanTotemAssignments = shamans.map((shaman) => {
      // Vary air totem based on which group - melee groups get Windfury, caster groups get Tranquil Air
      const isMeleeGroup = shaman.group <= 2; // Groups 1-2 are typically melee
      return {
        shamanId: shaman.id,
        earthTotemId: 'stoneskin_totem',
        fireTotemId: 'fire_resistance_totem',
        waterTotemId: 'mana_spring_totem',
        airTotemId: isMeleeGroup ? 'windfury_totem' : 'tranquil_air_totem',
      };
    });

    this.recalculateAuras();
  }

  // Set a specific totem for a shaman (element-based)
  public setShamanTotem(shamanId: string, element: TotemElement, totemId: string | null) {
    const shaman = this.state.raid.find(m => m.id === shamanId && m.class === 'shaman');
    if (!shaman) return;

    // Validate that totem belongs to the correct element
    if (totemId) {
      const totem = getTotemById(totemId);
      if (!totem || totem.element !== element) return;
    }

    // Check for duplicates in same group (no two shamans can have same totem in same party)
    if (totemId) {
      const otherShamansInGroup = this.state.shamanTotemAssignments.filter(a => {
        const otherShaman = this.state.raid.find(m => m.id === a.shamanId);
        return otherShaman && otherShaman.group === shaman.group && a.shamanId !== shamanId;
      });

      for (const otherAssignment of otherShamansInGroup) {
        if (otherAssignment.earthTotemId === totemId ||
            otherAssignment.fireTotemId === totemId ||
            otherAssignment.waterTotemId === totemId ||
            otherAssignment.airTotemId === totemId) {
          // Can't assign - another shaman in same group already has this totem
          this.addCombatLogEntry({
            message: `Cannot assign ${getTotemById(totemId)?.name} - another shaman in the group already has it!`,
            type: 'system',
          });
          return;
        }
      }
    }

    let existing = this.state.shamanTotemAssignments.find(a => a.shamanId === shamanId);
    if (!existing) {
      existing = {
        shamanId,
        earthTotemId: null,
        fireTotemId: null,
        waterTotemId: null,
        airTotemId: null,
      };
      this.state.shamanTotemAssignments.push(existing);
    }

    // Set the totem for the appropriate element
    switch (element) {
      case 'earth':
        existing.earthTotemId = totemId;
        break;
      case 'fire':
        existing.fireTotemId = totemId;
        break;
      case 'water':
        existing.waterTotemId = totemId;
        break;
      case 'air':
        existing.airTotemId = totemId;
        break;
    }

    this.recalculateAuras();
  }

  // Get a shaman's current totem assignments
  public getShamanTotems(shamanId: string): import('./types').ShamanTotemAssignment | null {
    const assignment = this.state.shamanTotemAssignments.find(a => a.shamanId === shamanId);
    return assignment || null;
  }

  private startGameLoop() {
    let lastTick = Date.now();

    this.intervalId = window.setInterval(() => {
      const now = Date.now();
      const delta = Math.min((now - lastTick) / 1000, 0.5);
      lastTick = now;

      if (!this.state.isRunning || !this.state.boss) return;

      this.state.elapsedTime += delta;

      // Update GCD
      if (this.state.globalCooldown > 0) {
        this.state.globalCooldown = Math.max(0, this.state.globalCooldown - delta);
      }

      // Update cast progress
      if (this.state.isCasting && this.state.castingSpell) {
        this.state.castProgress = Math.min(1, this.state.castProgress + delta / this.state.castingSpell.castTime);
      }

      // Update action bar cooldowns
      this.actionBar.forEach(spell => {
        if (spell.currentCooldown > 0) {
          spell.currentCooldown = Math.max(0, spell.currentCooldown - delta);
        }
      });

      // Update mana potion cooldown
      if (this.state.manaPotionCooldown > 0) {
        this.state.manaPotionCooldown = Math.max(0, this.state.manaPotionCooldown - delta);
      }

      // Update totem ticks (Shaman player totems)
      this.tickTotems(delta);

      // Update NPC shaman totem effects (mana regen, healing, cleansing)
      this.tickNpcShamanTotems(delta);

      // Mana regen with Five-Second Rule (FSR)
      if (!this.state.isCasting) {
        const timeSinceLastCast = this.state.elapsedTime - this.state.lastSpellCastTime;
        const isInFSR = timeSinceLastCast < 5; // Within 5-second rule

        // Get MP5 from gear
        const mp5FromGear = this.computePlayerStats().totalMp5;

        if (isInFSR) {
          // Inside FSR: Only MP5 from gear works
          const mp5Regen = (mp5FromGear / 5) * delta;
          this.state.playerMana = Math.min(this.state.maxMana, this.state.playerMana + mp5Regen);
        } else {
          // Outside FSR: Full regen (base + spirit + MP5)
          const baseRegen = 10; // Base per-second regen
          const spiritRegen = this.getSpiritBasedRegen();
          const mp5Regen = mp5FromGear / 5;
          const totalRegen = (baseRegen + spiritRegen + mp5Regen) * delta;
          this.state.playerMana = Math.min(this.state.maxMana, this.state.playerMana + totalRegen);
        }
      }

      // In multiplayer client mode, skip all boss/damage processing - host handles that
      // Client only needs cooldown tracking and cast progress (handled above)
      if (this.isMultiplayerClient) {
        this.notify();
        return;
      }

      // Process phase transitions for multi-phase bosses (like Onyxia)
      if (this.state.boss.phaseTransitions && this.state.boss.phaseTransitions.length > 0) {
        const currentHealthPercent = (this.state.boss.currentHealth / this.state.boss.maxHealth) * 100;
        const currentPhase = this.state.boss.currentPhase || 1;

        // Find if we should transition to a new phase
        for (const transition of this.state.boss.phaseTransitions) {
          if (transition.phase > currentPhase && currentHealthPercent <= transition.healthPercent) {
            this.state.boss.currentPhase = transition.phase;
            this.addCombatLogEntry({
              message: transition.message,
              type: 'system',
            });
            // Reset damage timers on phase transition so abilities fire fresh
            this.damageTimers = {};
            break;
          }
        }
      }

      // Process boss damage events
      // Enrage multiplier: 3x damage when enraged (very dangerous!)
      const enrageMultiplier = this.state.bossEnraged ? 3.0 : 1.0;
      const currentPhase = this.state.boss.currentPhase || 1;

      this.state.boss.damageEvents.forEach((event, index) => {
        // Skip events not active in current phase
        if (event.activeInPhases && !event.activeInPhases.includes(currentPhase)) {
          return;
        }

        const timerId = `${event.type}_${index}`;
        const lastTrigger = this.damageTimers[timerId] || 0;

        if (this.state.elapsedTime - lastTrigger >= event.interval) {
          this.damageTimers[timerId] = this.state.elapsedTime;

          // Apply enrage multiplier to damage
          const damage = Math.floor(event.damage * enrageMultiplier);

          // Get damage type for resistance calculations (default to physical)
          const damageType: DamageType = event.damageType || 'physical';

          switch (event.type) {
            case 'tank_damage': {
              const tank = this.state.raid.find(m => m.role === 'tank' && m.isAlive);
              if (tank) {
                const reducedDamage = this.calculateDamageReduction(tank, damage, damageType);
                tank.currentHealth = Math.max(0, tank.currentHealth - reducedDamage);
                if (tank.currentHealth === 0) {
                  this.handleMemberDeath(tank);
                }
              }
              break;
            }

            case 'raid_damage': {
              const alive = this.state.raid.filter(m => m.isAlive);
              const targets = alive.sort(() => Math.random() - 0.5).slice(0, event.targetCount || 5);
              targets.forEach(member => {
                const reducedDamage = this.calculateDamageReduction(member, damage, damageType);
                member.currentHealth = Math.max(0, member.currentHealth - reducedDamage);
                if (member.currentHealth === 0) {
                  this.handleMemberDeath(member);
                }
              });
              break;
            }

            case 'random_target': {
              const alive = this.state.raid.filter(m => m.isAlive);
              if (alive.length > 0) {
                const target = alive[Math.floor(Math.random() * alive.length)];
                const reducedDamage = this.calculateDamageReduction(target, damage, damageType);
                target.currentHealth = Math.max(0, target.currentHealth - reducedDamage);
                if (target.currentHealth === 0) {
                  this.handleMemberDeath(target);
                }
              }
              break;
            }

            case 'debuff': {
              if (event.debuffId) {
                const template = DEBUFFS[event.debuffId];
                if (template) {
                  const alive = this.state.raid.filter(m => m.isAlive);
                  if (alive.length > 0) {
                    // Support multi-target debuffs (e.g., Deep Breath hits 5 players)
                    const targetCount = event.targetCount || 1;
                    const targets = alive.sort(() => Math.random() - 0.5).slice(0, targetCount);

                    // Special announcement for Deep Breath
                    if (event.debuffId === 'deep_breath') {
                      this.addCombatLogEntry({
                        message: 'Onyxia takes a deep breath...',
                        type: 'system',
                      });
                    }

                    targets.forEach(target => {
                      target.debuffs.push({ ...template, duration: template.maxDuration || 15 });
                      this.addCombatLogEntry({ message: `${target.name} is afflicted by ${template.name}!`, type: 'debuff' });
                    });
                  }
                }
              }
              break;
            }
          }
        }
      });

      // Process debuff ticks and durations (also affected by enrage)
      this.state.raid.forEach(member => {
        if (!member.isAlive) return;

        member.debuffs = member.debuffs
          .map(debuff => {
            if (debuff.damagePerTick && debuff.tickInterval) {
              const tickDamage = (debuff.damagePerTick * delta * enrageMultiplier) / debuff.tickInterval;
              member.currentHealth -= tickDamage;
              if (member.currentHealth <= 0) {
                member.currentHealth = 0;
                this.handleMemberDeath(member);
              }
            }
            return { ...debuff, duration: debuff.duration - delta };
          })
          .filter(debuff => {
            // Check for Living Bomb explosion when debuff expires
            if (debuff.duration <= 0 && debuff.explodesOnExpiry && debuff.explosionDamage) {
              this.handleLivingBombExplosion(member, debuff.explosionDamage);
            }
            return debuff.duration > 0;
          });

        // Update buff durations
        member.buffs = member.buffs
          .map(b => ({ ...b, duration: b.duration - delta }))
          .filter(b => b.duration > 0);
      });

      // AI Healers - other healers in the raid automatically heal
      // Disable AI healers in multiplayer client mode (host handles all AI healing)
      if (this.state.otherHealersEnabled && !this.isMultiplayerClient) {
        const aiHealers = this.state.raid.filter(
          m => m.role === 'healer' && m.isAlive && m.id !== PLAYER_ID
        );

        aiHealers.forEach(healer => {
          // Initialize AI healer stats with mana if not exists
          if (!this.state.aiHealerStats[healer.id]) {
            const manaConfig = AI_HEALER_MANA[healer.class] || { maxMana: 5000, mp5: 40 };
            this.state.aiHealerStats[healer.id] = {
              healingDone: 0,
              dispelsDone: 0,
              name: healer.name,
              class: healer.class,
              currentMana: manaConfig.maxMana,
              maxMana: manaConfig.maxMana,
              mp5: manaConfig.mp5,
              manaPotionCooldown: 0,
            };
          }

          const stats = this.state.aiHealerStats[healer.id];

          // MP5 regeneration (mana per 5 seconds, scaled to delta)
          stats.currentMana = Math.min(stats.maxMana, stats.currentMana + (stats.mp5 * delta / 5));

          // Tick down mana potion cooldown
          if (stats.manaPotionCooldown > 0) {
            stats.manaPotionCooldown -= delta;
          }

          // Use mana potion if low on mana (30% threshold)
          if (stats.currentMana < stats.maxMana * 0.3 && stats.manaPotionCooldown <= 0) {
            // Major Mana Potion restores 1350-2250 mana
            const restored = 1350 + Math.random() * 900;
            stats.currentMana = Math.min(stats.maxMana, stats.currentMana + restored);
            stats.manaPotionCooldown = 120; // 2 minute cooldown

            this.addCombatLogEntry({
              message: `${healer.name} uses Major Mana Potion`,
              type: 'buff',
            });
          }

          // Each healer has a cast time cooldown (~2s average)
          const cooldown = this.aiHealerCooldowns[healer.id] || 0;
          if (cooldown > 0) {
            this.aiHealerCooldowns[healer.id] = cooldown - delta;
            return;
          }

          // Find injured raid members (prioritize tanks, then lowest health %)
          const injured = this.state.raid
            .filter(m => m.isAlive && m.currentHealth < m.maxHealth * 0.9)
            .sort((a, b) => {
              // Tanks get priority
              if (a.role === 'tank' && b.role !== 'tank') return -1;
              if (b.role === 'tank' && a.role !== 'tank') return 1;
              // Then sort by health %
              return (a.currentHealth / a.maxHealth) - (b.currentHealth / b.maxHealth);
            });

          if (injured.length > 0) {
            const target = injured[0];
            const targetHealthPct = target.currentHealth / target.maxHealth;
            const baseHps = AI_HEALER_HPS[healer.class] || 300;
            // Gear scaling: each gear score point adds 0.5 HPS
            const gearBonus = healer.gearScore * 0.5;
            const hps = baseHps + gearBonus;

            // Spell choice based on target health and mana efficiency
            // Mana costs aligned with player spell costs:
            // - Player Flash of Light: ~140 mana for ~450 heal (0.31 mana per HP)
            // - Player Holy Light R6: ~365 mana for ~900 heal (0.40 mana per HP)
            // - Player Holy Light R9: ~660 mana for ~1800 heal (0.37 mana per HP)
            let baseHeal: number;
            let manaCost: number;
            let castTime: number;

            if (targetHealthPct < 0.35) {
              // Emergency - use big heal (like Holy Light R9)
              baseHeal = hps * 3.0; // ~1050 HP heal
              manaCost = baseHeal * 0.55; // ~578 mana - expensive but powerful
              castTime = 2.5;
            } else if (targetHealthPct < 0.6) {
              // Normal healing - medium heal (like Holy Light R6)
              baseHeal = hps * 2.0; // ~700 HP heal
              manaCost = baseHeal * 0.45; // ~315 mana
              castTime = 2.0;
            } else {
              // Top-off - small efficient heal (like Flash of Light)
              baseHeal = hps * 1.2; // ~420 HP heal
              manaCost = baseHeal * 0.32; // ~134 mana - similar to FoL
              castTime = 1.5;
            }

            // OOM behavior - skip healing if not enough mana (unless critical emergency)
            const isCriticalEmergency = targetHealthPct < 0.25 && target.role === 'tank';
            if (stats.currentMana < manaCost && !isCriticalEmergency) {
              // Not enough mana - wait for regen (but still set a short cooldown)
              this.aiHealerCooldowns[healer.id] = 0.5;
              return;
            }

            // Spend mana (minimum 0)
            stats.currentMana = Math.max(0, stats.currentMana - manaCost);

            const isCrit = Math.random() < 0.12; // ~12% crit chance
            const healAmount = Math.floor(isCrit ? baseHeal * 1.5 : baseHeal);

            const actualHeal = Math.min(healAmount, target.maxHealth - target.currentHealth);
            target.currentHealth = Math.min(target.maxHealth, target.currentHealth + healAmount);
            this.state.otherHealersHealing += actualHeal;

            // Track healing done
            stats.healingDone += actualHeal;

            // Set cooldown based on spell cast time (with some variance)
            this.aiHealerCooldowns[healer.id] = castTime + (Math.random() * 0.3 - 0.15);
          }
        });

        // AI Healer Dispelling - separate from healing cooldown
        aiHealers.forEach(healer => {
          const stats = this.state.aiHealerStats[healer.id];
          if (!stats) return;

          // Check dispel cooldown (GCD-based, ~1.5s)
          const dispelCooldown = this.aiHealerDispelCooldowns[healer.id] || 0;
          if (dispelCooldown > 0) {
            this.aiHealerDispelCooldowns[healer.id] = dispelCooldown - delta;
            return;
          }

          // Determine what debuff types this healer can dispel based on class
          // Paladin: magic, poison, disease
          // Priest: magic, disease
          // Shaman: poison, disease
          // Druid: poison, curse
          const canDispel: Record<string, string[]> = {
            paladin: ['magic', 'poison', 'disease'],
            priest: ['magic', 'disease'],
            shaman: ['poison', 'disease'],
            druid: ['poison', 'curse'],
          };
          const dispellableTypes = canDispel[healer.class] || [];
          if (dispellableTypes.length === 0) return;

          // AI healers wait 2-3 seconds before dispelling to give player a chance
          // A debuff is "new" if duration is within 2.5s of maxDuration
          const AI_DISPEL_REACTION_DELAY = 2.5;

          // Find raid members with dispellable debuffs that are old enough for AI to dispel
          const membersWithDebuffs = this.state.raid
            .filter(m => m.isAlive && m.debuffs.some(d => {
              if (!dispellableTypes.includes(d.type)) return false;
              if (d.dispellable === false) return false;
              // Check if debuff has been active long enough for AI to react
              const maxDur = d.maxDuration || d.duration;
              const timeActive = maxDur - d.duration;
              return timeActive >= AI_DISPEL_REACTION_DELAY;
            }))
            .sort((a, b) => {
              // Tanks get highest priority
              if (a.role === 'tank' && b.role !== 'tank') return -1;
              if (b.role === 'tank' && a.role !== 'tank') return 1;
              // Healers get second priority
              if (a.role === 'healer' && b.role !== 'healer') return -1;
              if (b.role === 'healer' && a.role !== 'healer') return 1;
              // Then by number of debuffs
              return b.debuffs.length - a.debuffs.length;
            });

          if (membersWithDebuffs.length > 0) {
            const target = membersWithDebuffs[0];
            // Find a debuff that's old enough to dispel
            const debuffToDispel = target.debuffs.find(d => {
              if (!dispellableTypes.includes(d.type)) return false;
              if (d.dispellable === false) return false;
              const maxDur = d.maxDuration || d.duration;
              const timeActive = maxDur - d.duration;
              return timeActive >= AI_DISPEL_REACTION_DELAY;
            });

            if (debuffToDispel) {
              // Mana cost for dispel (~60-75 mana like player spells)
              const dispelManaCost = 65;

              // Check if healer has enough mana
              if (stats.currentMana < dispelManaCost) {
                // Not enough mana - set short cooldown and skip
                this.aiHealerDispelCooldowns[healer.id] = 0.5;
                return;
              }

              // Spend mana
              stats.currentMana -= dispelManaCost;

              // Remove the debuff
              target.debuffs = target.debuffs.filter(d => d.id !== debuffToDispel.id);

              // Track dispel for the meter
              stats.dispelsDone++;

              // Add combat log entry
              this.addCombatLogEntry({
                message: `${healer.name} dispels ${debuffToDispel.name} from ${target.name}`,
                type: 'system',
              });

              // Set GCD cooldown (1.5s with slight variance)
              this.aiHealerDispelCooldowns[healer.id] = 1.5 + (Math.random() * 0.2 - 0.1);
            }
          }
        });
      }

      // Boss takes damage from raid DPS (base DPS + gear scaling + buff bonuses)
      const totalDps = this.state.raid
        .filter(m => m.isAlive)
        .reduce((sum, m) => {
          // Gear scaling: each gear score point adds 1 DPS for DPS roles, 0.5 for others
          const gearDpsBonus = m.role === 'dps' ? m.gearScore * 1.0 : m.gearScore * 0.5;

          // Calculate DPS bonus from buffs (Attack Power, crit, etc.)
          let buffDpsBonus = 0;
          let attackSpeedMultiplier = 1;
          m.buffs.forEach(buff => {
            if (buff.effect) {
              // Attack Power: 14 AP = 1 DPS for physical classes
              if (buff.effect.attackPowerBonus) {
                buffDpsBonus += buff.effect.attackPowerBonus / 14;
              }
              // Crit bonus: each 1% crit adds ~2% DPS
              if (buff.effect.spellCritBonus && m.role === 'dps') {
                buffDpsBonus += (m.dps * buff.effect.spellCritBonus * 0.02);
              }
              // All stats bonus gives some DPS through agility/strength
              if (buff.effect.allStatsBonus && m.role === 'dps') {
                buffDpsBonus += buff.effect.allStatsBonus * 0.5;
              }
              // Attack speed bonus: directly multiplies DPS
              if (buff.effect.attackSpeedBonus) {
                attackSpeedMultiplier *= (1 + buff.effect.attackSpeedBonus / 100);
              }
            }
          });

          return sum + (m.dps + gearDpsBonus + buffDpsBonus) * attackSpeedMultiplier;
        }, 0);

      this.state.boss.currentHealth = Math.max(0, this.state.boss.currentHealth - totalDps * delta);

      // Check victory
      if (this.state.boss.currentHealth === 0) {
        this.addCombatLogEntry({ message: `VICTORY! ${this.state.boss.name} has been defeated!`, type: 'system' });
        this.handleBossVictory(this.state.boss.id);
        return;
      }

      // Check enrage - boss deals massively increased damage when enraged
      if (this.state.elapsedTime >= this.state.boss.enrageTimer && !this.state.bossEnraged) {
        this.state.bossEnraged = true;
        this.addCombatLogEntry({
          message: `⚠️ ${this.state.boss.name} has ENRAGED! Damage increased by 300%!`,
          type: 'damage'
        });
      }

      // Check wipe
      const aliveCount = this.state.raid.filter(m => m.isAlive).length;
      if (aliveCount === 0) {
        this.addCombatLogEntry({ message: 'WIPE! The raid has been defeated!', type: 'system' });
        this.state.lastEncounterResult = 'wipe';

        // Track wipe in PostHog
        const hps = this.state.elapsedTime > 0 ? this.state.healingDone / this.state.elapsedTime : 0;
        const overhealPercent = this.state.healingDone > 0
          ? (this.state.overhealing / (this.state.healingDone + this.state.overhealing)) * 100
          : 0;
        posthog.capture('encounter_completed', {
          boss_name: this.state.boss?.name,
          boss_id: this.state.boss?.id,
          result: 'wipe',
          duration_seconds: this.state.elapsedTime,
          hps: Math.round(hps),
          overhealing_percent: Math.round(overhealPercent),
          player_class: this.state.playerClass,
          gear_score: this.getPlayerMember()?.gearScore || 0
        });

        this.stopEncounter();
        return;
      }

      this.notify();
    }, 100);
  }

  // =========================================================================
  // LOOT & EQUIPMENT SYSTEM
  // =========================================================================

  private handleBossVictory(bossId: string) {
    // Play victory fanfare
    const fanfare = new Audio('/sounds/FF_Fanfare.mp3');
    fanfare.volume = 0.5;
    fanfare.play().catch(() => {}); // Ignore autoplay restrictions

    // Track victory in PostHog
    const hps = this.state.elapsedTime > 0 ? this.state.healingDone / this.state.elapsedTime : 0;
    const overhealPercent = this.state.healingDone > 0
      ? (this.state.overhealing / (this.state.healingDone + this.state.overhealing)) * 100
      : 0;
    posthog.capture('encounter_completed', {
      boss_name: this.state.boss?.name,
      boss_id: bossId,
      result: 'kill',
      duration_seconds: this.state.elapsedTime,
      hps: Math.round(hps),
      overhealing_percent: Math.round(overhealPercent),
      player_class: this.state.playerClass,
      gear_score: this.getPlayerMember()?.gearScore || 0,
      is_first_kill: !this.state.firstKills.includes(bossId)
    });

    // Mark encounter result for summary display
    this.state.lastEncounterResult = 'victory';

    // Stop the encounter first
    this.state.isRunning = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.castTimeout !== null) {
      clearTimeout(this.castTimeout);
      this.castTimeout = null;
    }

    // Mark boss as defeated (unless it's training dummy)
    if (bossId !== 'training') {
      // Track per-raid defeated bosses
      const currentRaidId = this.state.selectedRaidId;
      if (!this.state.defeatedBossesByRaid[currentRaidId]) {
        this.state.defeatedBossesByRaid[currentRaidId] = [];
      }
      if (!this.state.defeatedBossesByRaid[currentRaidId].includes(bossId)) {
        this.state.defeatedBossesByRaid[currentRaidId].push(bossId);
      }

      // Legacy field for backward compatibility
      if (!this.state.defeatedBosses.includes(bossId)) {
        this.state.defeatedBosses.push(bossId);
      }

      // Check for first-time kill (world buff unlock)
      if (!this.state.firstKills.includes(bossId)) {
        this.state.firstKills.push(bossId);

        // Check if this boss unlocks a world buff
        const raid = RAIDS.find(r => r.encounters.some(e => e.id === bossId));
        if (raid?.worldBuffUnlock === bossId) {
          this.addCombatLogEntry({
            message: `FIRST KILL! Rallying Cry of the Dragonslayer world buff unlocked!`,
            type: 'system',
          });
        }
      }
    }

    // Award DKP
    const dkpReward = getBossDKPReward(bossId);
    this.state.playerDKP.points += dkpReward;
    this.state.playerDKP.earnedThisRaid += dkpReward;
    this.addCombatLogEntry({ message: `+${dkpReward} DKP earned!`, type: 'system' });

    // Roll loot from boss table with bad luck protection and faction filtering
    const { items: loot, hadPlayerClassLoot, legendaryMaterial } = rollBossLoot(
      bossId,
      this.state.bossKillsWithoutPaladinLoot, // TODO: Rename to bossKillsWithoutPlayerClassLoot
      this.state.faction,
      this.state.playerClass
    );

    // Update bad luck counter
    if (hadPlayerClassLoot) {
      this.state.bossKillsWithoutPaladinLoot = 0;
    } else {
      this.state.bossKillsWithoutPaladinLoot++;
    }

    // Handle legendary material drop
    if (legendaryMaterial) {
      // Check if player already has this material
      if (!this.state.legendaryMaterials.includes(legendaryMaterial.id)) {
        this.state.legendaryMaterials.push(legendaryMaterial.id);
        this.addCombatLogEntry({
          message: `LEGENDARY DROP: ${legendaryMaterial.name}!`,
          type: 'system',
        });
      } else {
        this.addCombatLogEntry({
          message: `${legendaryMaterial.name} dropped, but you already have it!`,
          type: 'system',
        });
      }
    }

    // Handle quest material drops (dragon heads) - always drop, go directly to inventory
    const questMaterial = Object.values(QUEST_MATERIALS).find(qm => qm.dropsFrom === bossId);
    if (questMaterial) {
      this.state.questMaterials.push(questMaterial.id);
      this.state.lastObtainedQuestMaterial = questMaterial.id;
      this.addCombatLogEntry({
        message: `QUEST ITEM: ${questMaterial.name} obtained!`,
        type: 'system',
      });
    } else {
      // Clear last obtained if no quest material dropped
      this.state.lastObtainedQuestMaterial = null;
    }

    if (loot.length > 0) {
      this.state.pendingLoot = loot;
      this.state.showLootModal = true;
      this.addCombatLogEntry({ message: `${loot.length} items dropped!`, type: 'system' });
    }

    // Check if raid is complete
    if (bossId === 'ragnaros') {
      this.addCombatLogEntry({ message: 'MOLTEN CORE CLEARED! You have defeated Ragnaros!', type: 'system' });
    } else if (bossId === 'onyxia') {
      this.addCombatLogEntry({ message: "ONYXIA'S LAIR CLEARED! The dragon is slain!", type: 'system' });
    } else if (bossId === 'nefarian') {
      this.addCombatLogEntry({ message: 'BLACKWING LAIR CLEARED! Nefarian has been defeated!', type: 'system' });
    } else if (bossId === 'thunderaan') {
      // Mark Thunderaan as defeated - allows Thunderfury crafting
      this.state.thunderaanDefeated = true;
      this.addCombatLogEntry({ message: 'PRINCE THUNDERAAN DEFEATED! You may now forge Thunderfury!', type: 'system' });
    }

    // Check for Silithus unlock: requires both bindings + Firemaw kill
    if (bossId === 'firemaw' && !this.state.silithusUnlocked) {
      const hasLeftBinding = this.state.legendaryMaterials.includes('bindings_of_the_windseeker_left');
      const hasRightBinding = this.state.legendaryMaterials.includes('bindings_of_the_windseeker_right');

      if (hasLeftBinding && hasRightBinding) {
        this.state.silithusUnlocked = true;
        this.addCombatLogEntry({ message: 'The Bindings resonate with power...', type: 'system' });
        // Trigger special alert for the UI
        this.triggerSpecialAlert('Prince Thunderaan has been summoned! Check the raid list to challenge him in Silithus!');
      }
    }

    this.notify();
  }

  // Check if a class can equip an item (public for admin panel)
  canEquip(wowClass: WoWClass, item: GearItem): boolean {
    return item.classes.includes('all') || item.classes.includes(wowClass as WearableClass);
  }

  // Check if a raid member can benefit from an item based on their spec
  // Used for intelligent loot assignment (e.g., caster weapons don't go to warriors)
  canBenefitFrom(member: RaidMember, item: GearItem): boolean {
    return canSpecBenefitFrom(member.spec, item.itemCategory);
  }

  // Compute player stats from equipment
  computePlayerStats(): PlayerStats {
    let spellPower = 0;
    let mana = 0;
    let crit = 5; // Base 5% crit
    let mp5 = 0;

    Object.values(this.state.playerEquipment).forEach(item => {
      if (item) {
        // Base item stats
        spellPower += (item.stats.spellPower || 0) + (item.stats.healingPower || 0);
        mana += (item.stats.mana || 0) + (item.stats.intellect || 0) * 15;
        crit += item.stats.critChance || 0;
        mp5 += item.stats.mp5 || 0;

        // Enchant stats
        if (item.enchantId) {
          const enchant = ENCHANTS[item.enchantId as EnchantId];
          if (enchant && enchant.stats) {
            spellPower += (enchant.stats.spellPower || 0) + (enchant.stats.healingPower || 0);
            mana += (enchant.stats.intellect || 0) * 15;
            crit += enchant.stats.critChance || 0;
            mp5 += enchant.stats.mp5 || 0;
          }
        }
      }
    });

    return {
      baseSpellPower: 0,
      baseMaxMana: 4394,
      baseCritChance: 5,
      totalSpellPower: spellPower,
      totalMaxMana: 4394 + mana,
      totalCritChance: crit,
      totalMp5: mp5,
    };
  }

  // Calculate spirit-based mana regeneration (per second)
  private getSpiritBasedRegen(): number {
    // Get spirit from buffs
    let spirit = 0;
    this.state.playerBuffs.forEach(buff => {
      if (buff.effect?.spiritBonus) {
        spirit += buff.effect.spiritBonus;
      }
    });

    // Classic formula: Spirit / 5 gives roughly the per-second regen
    // Base Holy Paladin has minimal spirit, but buffs can add significant amounts
    return spirit / 5;
  }

  // Calculate gear score for a member
  private calculateGearScore(equipment: Equipment): number {
    let score = 0;
    Object.values(equipment).forEach(item => {
      if (item) {
        score += item.itemLevel;
      }
    });
    return score;
  }

  // Equip an item on the player
  equipItem(item: GearItem) {
    // Check if player can equip
    if (!this.canEquip(this.state.playerClass, item)) {
      this.addCombatLogEntry({ message: `Cannot equip ${item.name} (wrong class)`, type: 'system' });
      return;
    }

    const slot = item.slot;
    const oldItem = this.state.playerEquipment[slot];

    // If there was an old item, put it in the bag
    if (oldItem) {
      this.state.playerBag.push(oldItem);
    }

    this.state.playerEquipment[slot] = item;

    // Also update the player's RaidMember equipment (for inspection display)
    const player = this.getPlayerMember();
    if (player) {
      player.equipment[slot] = item;
      player.gearScore = this.calculateGearScore(player.equipment);
    }

    // Update player stats
    const stats = this.computePlayerStats();
    this.state.spellPower = stats.totalSpellPower;
    this.state.maxMana = stats.totalMaxMana;
    this.state.critChance = stats.totalCritChance;

    // Track gear equipped in PostHog
    const newGearScore = player?.gearScore || 0;
    posthog.capture('gear_equipped', {
      slot: item.slot,
      item_name: item.name,
      item_level: item.itemLevel,
      rarity: item.rarity,
      total_gear_score: newGearScore,
      player_class: this.state.playerClass
    });

    this.addCombatLogEntry({
      message: `Equipped ${item.name}${oldItem ? ` (${oldItem.name} moved to bag)` : ''}`,
      type: 'system',
    });
    this.notify();
  }

  // Equip an item from the player's bag
  equipFromBag(bagIndex: number) {
    if (bagIndex < 0 || bagIndex >= this.state.playerBag.length) {
      return;
    }

    const item = this.state.playerBag[bagIndex];

    // Check if player can equip
    if (!this.canEquip(this.state.playerClass, item)) {
      this.addCombatLogEntry({ message: `Cannot equip ${item.name} (wrong class)`, type: 'system' });
      return;
    }

    // Remove item from bag
    this.state.playerBag.splice(bagIndex, 1);

    // Equip the item (this will put any existing equipped item in the bag)
    this.equipItem(item);
  }

  // Get player bag contents
  getPlayerBag(): GearItem[] {
    return this.state.playerBag;
  }

  // Add an item directly to the player's bag (admin function)
  adminAddItemToBag(item: GearItem) {
    // Check bag size limit (16 slots)
    if (this.state.playerBag.length >= 16) {
      this.addCombatLogEntry({ message: 'Bag is full! Cannot add more items.', type: 'system' });
      this.notify();
      return;
    }

    this.state.playerBag.push(item);
    this.addCombatLogEntry({
      message: `[Admin] Added ${item.name} to bag`,
      type: 'system',
    });
    this.notify();
  }

  // Get materials bag contents
  getMaterialsBag(): { nexus_crystal: number } {
    return this.state.materialsBag;
  }

  // Disenchant a single item from the bag (by index)
  // Returns: 'disenchanted' | 'destroyed' | false
  disenchantItem(bagIndex: number): 'disenchanted' | 'destroyed' | false {
    if (bagIndex < 0 || bagIndex >= this.state.playerBag.length) {
      return false;
    }

    const item = this.state.playerBag[bagIndex];

    // Pre-raid BiS items cannot be disenchanted - they get destroyed instead
    if (item.isPreRaidBis) {
      // Remove item from bag (destroy it)
      this.state.playerBag.splice(bagIndex, 1);

      this.addCombatLogEntry({
        message: `${item.name} destroyed (pre-raid items cannot be disenchanted)`,
        type: 'system',
      });

      this.requestCloudSave();
      this.notify();
      return 'destroyed';
    }

    // Remove item from bag
    this.state.playerBag.splice(bagIndex, 1);

    // Add nexus crystal
    this.state.materialsBag.nexus_crystal += 1;

    this.addCombatLogEntry({
      message: `Disenchanted ${item.name} into a Nexus Crystal`,
      type: 'system',
    });

    this.requestCloudSave();
    this.notify();
    return 'disenchanted';
  }

  // Disenchant all items in the player's bag
  // Returns: { disenchanted: number, destroyed: number }
  disenchantAll(): { disenchanted: number; destroyed: number } {
    const itemCount = this.state.playerBag.length;
    if (itemCount === 0) {
      this.addCombatLogEntry({ message: 'No items to disenchant!', type: 'system' });
      this.notify();
      return { disenchanted: 0, destroyed: 0 };
    }

    // Separate pre-raid BiS items from disenchantable items
    const preRaidItems = this.state.playerBag.filter(i => i.isPreRaidBis);
    const disenchantableItems = this.state.playerBag.filter(i => !i.isPreRaidBis);

    // Clear the bag
    this.state.playerBag = [];

    // Add nexus crystals only for disenchantable items
    this.state.materialsBag.nexus_crystal += disenchantableItems.length;

    // Log pre-raid items being destroyed
    if (preRaidItems.length > 0) {
      this.addCombatLogEntry({
        message: `Destroyed ${preRaidItems.length} pre-raid item${preRaidItems.length > 1 ? 's' : ''} (cannot be disenchanted): ${preRaidItems.map(i => i.name).join(', ')}`,
        type: 'system',
      });
    }

    // Log disenchanted items
    if (disenchantableItems.length > 0) {
      this.addCombatLogEntry({
        message: `Disenchanted ${disenchantableItems.length} item${disenchantableItems.length > 1 ? 's' : ''} into ${disenchantableItems.length} Nexus Crystal${disenchantableItems.length > 1 ? 's' : ''}: ${disenchantableItems.map(i => i.name).join(', ')}`,
        type: 'system',
      });
    }

    this.requestCloudSave();
    this.notify();
    return { disenchanted: disenchantableItems.length, destroyed: preRaidItems.length };
  }

  // Equip an item on a raid member (only if it's an upgrade)
  // Returns true if item was equipped, false if current item is better
  private equipItemOnMember(member: RaidMember, item: GearItem, forceEquip: boolean = false): boolean {
    const slot = item.slot;
    const currentItem = member.equipment[slot];

    // Check if this is an upgrade (or if we're forcing equip, e.g. for player)
    const isUpgrade = !currentItem || item.itemLevel > currentItem.itemLevel;

    if (!isUpgrade && !forceEquip) {
      return false; // Current item is better, don't equip
    }

    member.equipment[slot] = item;

    // Clear offhand when equipping 2H weapon
    if (slot === 'weapon' && item.weaponType === 'two_hand') {
      member.equipment.offhand = null;
    }

    member.gearScore = this.calculateGearScore(member.equipment);
    return true;
  }

  // Player claims loot with DKP
  claimLoot(itemId: string) {
    const itemIndex = this.state.pendingLoot.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = this.state.pendingLoot[itemIndex];
    const cost = calculateDKPCost(item);
    const player = this.getPlayerMember();

    // Check if player can equip
    if (!this.canEquip(this.state.playerClass, item)) {
      this.addCombatLogEntry({ message: `Cannot equip ${item.name} (wrong class)`, type: 'system' });
      this.notify();
      return;
    }

    // Check if item benefits player's spec (prevent warriors taking caster gear, etc.)
    if (player && !this.canBenefitFrom(player, item)) {
      this.addCombatLogEntry({ message: `${item.name} doesn't benefit your spec`, type: 'system' });
      this.notify();
      return;
    }

    // Check DKP
    if (this.state.playerDKP.points < cost) {
      this.addCombatLogEntry({ message: `Not enough DKP! Need ${cost}, have ${this.state.playerDKP.points}`, type: 'system' });
      this.notify();
      return;
    }

    // Deduct DKP and equip
    this.state.playerDKP.points -= cost;
    this.equipItem(item);
    this.state.pendingLoot.splice(itemIndex, 1);

    this.addCombatLogEntry({ message: `Claimed ${item.name} for ${cost} DKP`, type: 'buff' });
    this.notify();
  }

  // Player passes on loot - AI claims it if upgrade, otherwise goes to player bag
  passLoot(itemId: string) {
    const itemIndex = this.state.pendingLoot.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = this.state.pendingLoot[itemIndex];

    // Find eligible raid members (excluding player) who can use AND benefit from this item
    // Spec-aware: caster weapons won't go to warriors, melee weapons won't go to mages, etc.
    const eligibleMembers = this.state.raid.filter(m =>
      m.id !== 'player' && // Don't include player in pass distribution
      m.isAlive &&
      this.canEquip(m.class, item) &&
      this.canBenefitFrom(m, item) && // Check if spec can benefit from item category
      // Only members who don't have this slot filled yet, or have lower ilvl item
      (!m.equipment[item.slot] || m.equipment[item.slot]!.itemLevel < item.itemLevel)
    );

    if (eligibleMembers.length > 0) {
      // Random winner from eligible members
      const winner = eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];
      this.equipItemOnMember(winner, item);
      this.addCombatLogEntry({ message: `${winner.name} receives ${item.name}`, type: 'system' });
    } else {
      // No AI players need this - send to player's bag for offspec/disenchant/later use
      this.state.playerBag.push(item);
      this.addCombatLogEntry({ message: `${item.name} sent to your bag (no upgrades needed)`, type: 'system' });
    }

    this.state.pendingLoot.splice(itemIndex, 1);
    this.notify();
  }

  // Close loot modal and distribute remaining items
  closeLootModal() {
    // Auto-pass remaining items
    while (this.state.pendingLoot.length > 0) {
      this.passLoot(this.state.pendingLoot[0].id);
    }
    this.state.showLootModal = false;
    this.state.boss = null;
    // Request cloud save after loot distribution (items were won/passed)
    this.requestCloudSave();
    this.notify();
  }

  // Get DKP cost for an item
  getItemDKPCost(item: GearItem): number {
    return calculateDKPCost(item);
  }

  // =========================================================================
  // AUCTION HOUSE - ENCHANTING SYSTEM
  // =========================================================================

  // Open the Auction House (only available between encounters)
  openAuctionHouse(): void {
    if (this.state.isRunning) {
      this.addCombatLogEntry({ message: 'Auction House is not available during combat', type: 'system' });
      return;
    }
    this.state.showAuctionHouse = true;
    this.notify();
  }

  // Close the Auction House
  closeAuctionHouse(): void {
    this.state.showAuctionHouse = false;
    this.notify();
  }

  // Purchase and apply an enchant to player's equipment
  purchaseEnchant(enchantId: EnchantId, slot: EquipmentSlot): boolean {
    const enchant = ENCHANTS[enchantId];
    if (!enchant) {
      this.addCombatLogEntry({ message: 'Invalid enchant', type: 'system' });
      return false;
    }

    // Check if player has enough Nexus Crystals
    if (this.state.materialsBag.nexus_crystal < enchant.cost) {
      this.addCombatLogEntry({
        message: `Not enough Nexus Crystals! Need ${enchant.cost}, have ${this.state.materialsBag.nexus_crystal}`,
        type: 'system'
      });
      return false;
    }

    // Check if slot has an item equipped
    const item = this.state.playerEquipment[slot];
    if (!item) {
      this.addCombatLogEntry({ message: `No item equipped in ${slot} slot`, type: 'system' });
      return false;
    }

    // Check if enchant is valid for this slot
    if (!enchant.slots.includes(slot as EnchantSlot)) {
      this.addCombatLogEntry({ message: `${enchant.name} cannot be applied to ${slot}`, type: 'system' });
      return false;
    }

    // Deduct cost and apply enchant
    this.state.materialsBag.nexus_crystal -= enchant.cost;
    item.enchantId = enchantId;

    // Recalculate player stats to include enchant bonuses
    const stats = this.computePlayerStats();
    this.state.spellPower = stats.totalSpellPower;
    this.state.maxMana = stats.totalMaxMana;
    this.state.critChance = stats.totalCritChance;

    this.addCombatLogEntry({
      message: `Applied ${enchant.name} to ${item.name}`,
      type: 'buff'
    });

    this.requestCloudSave();
    this.notify();
    return true;
  }

  // Purchase and apply an enchant to a raid member's equipment
  purchaseEnchantForMember(enchantId: EnchantId, slot: EquipmentSlot, memberId: string): boolean {
    const enchant = ENCHANTS[enchantId];
    if (!enchant) {
      this.addCombatLogEntry({ message: 'Invalid enchant', type: 'system' });
      return false;
    }

    // Find the raid member
    const member = this.state.raid.find((m: RaidMember) => m.id === memberId);
    if (!member) {
      this.addCombatLogEntry({ message: 'Raid member not found', type: 'system' });
      return false;
    }

    // Check if player has enough Nexus Crystals
    if (this.state.materialsBag.nexus_crystal < enchant.cost) {
      this.addCombatLogEntry({
        message: `Not enough Nexus Crystals! Need ${enchant.cost}, have ${this.state.materialsBag.nexus_crystal}`,
        type: 'system'
      });
      return false;
    }

    // Check if slot has an item equipped
    const item = member.equipment[slot];
    if (!item) {
      this.addCombatLogEntry({ message: `${member.name} has no item in ${slot} slot`, type: 'system' });
      return false;
    }

    // Check if enchant is valid for this slot
    if (!enchant.slots.includes(slot as EnchantSlot)) {
      this.addCombatLogEntry({ message: `${enchant.name} cannot be applied to ${slot}`, type: 'system' });
      return false;
    }

    // Deduct cost and apply enchant
    this.state.materialsBag.nexus_crystal -= enchant.cost;
    item.enchantId = enchantId;

    this.addCombatLogEntry({
      message: `Applied ${enchant.name} to ${member.name}'s ${item.name}`,
      type: 'buff'
    });

    this.requestCloudSave();
    this.notify();
    return true;
  }

  // =========================================================================
  // MULTIPLAYER LOOT BIDDING SYSTEM
  // =========================================================================

  // Start the loot bidding window (called by host when loot drops)
  startLootBidding(bidDuration: number = 15) {
    // Initialize bids for each pending loot item
    this.state.lootBids = {};
    this.state.lootResults = [];
    for (const item of this.state.pendingLoot) {
      this.state.lootBids[item.id] = [];
    }
    this.state.lootBidTimer = bidDuration;
    this.notify();
  }

  // Add a bid for an item (called when player clicks "Need" on an item)
  addLootBid(itemId: string, playerId: string, playerName: string, playerClass: WoWClass, dkp: number) {
    const item = this.state.pendingLoot.find(i => i.id === itemId);
    if (!item) return;

    // Check if player can equip this item
    if (!this.canEquip(playerClass, item)) {
      return; // Can't bid on items you can't use
    }

    // Check DKP
    const cost = calculateDKPCost(item);
    if (dkp < cost) {
      return; // Not enough DKP
    }

    // Check if already bid
    if (!this.state.lootBids[itemId]) {
      this.state.lootBids[itemId] = [];
    }

    const existingBid = this.state.lootBids[itemId].find(b => b.playerId === playerId);
    if (existingBid) {
      return; // Already bid
    }

    // Add bid with random roll for tie-breaking
    const bid = {
      playerId,
      playerName,
      playerClass,
      dkp,
      roll: Math.floor(Math.random() * 100) + 1,
      timestamp: Date.now(),
    };
    this.state.lootBids[itemId].push(bid);

    this.addCombatLogEntry({
      message: `${playerName} rolls Need on ${item.name}`,
      type: 'system'
    });
    this.notify();
  }

  // Remove a bid (player changed their mind)
  removeLootBid(itemId: string, playerId: string) {
    if (!this.state.lootBids[itemId]) return;

    const bidIndex = this.state.lootBids[itemId].findIndex(b => b.playerId === playerId);
    if (bidIndex !== -1) {
      const bid = this.state.lootBids[itemId][bidIndex];
      const item = this.state.pendingLoot.find(i => i.id === itemId);
      this.state.lootBids[itemId].splice(bidIndex, 1);

      if (item) {
        this.addCombatLogEntry({
          message: `${bid.playerName} passes on ${item.name}`,
          type: 'system'
        });
      }
      this.notify();
    }
  }

  // Resolve all loot bids (called when timer expires or host clicks resolve)
  resolveLootBids(): LootResult[] {
    const results: LootResult[] = [];

    for (const item of [...this.state.pendingLoot]) {
      const bids = this.state.lootBids[item.id] || [];
      const cost = calculateDKPCost(item);

      if (bids.length === 0) {
        // No bids - pass to AI
        this.passLoot(item.id);
        continue;
      }

      // Sort by DKP (highest first), then by roll (highest first) for ties
      bids.sort((a, b) => {
        if (b.dkp !== a.dkp) return b.dkp - a.dkp;
        return b.roll - a.roll;
      });

      const winner = bids[0];
      const hadTie = bids.length > 1 && bids[1].dkp === winner.dkp;

      // Record the result
      const result: LootResult = {
        itemId: item.id,
        itemName: item.name,
        winnerId: winner.playerId,
        winnerName: winner.playerName,
        winnerClass: winner.playerClass,
        dkpSpent: cost,
        roll: hadTie ? winner.roll : undefined,
      };
      results.push(result);

      // Log the result
      if (hadTie) {
        this.addCombatLogEntry({
          message: `${winner.playerName} wins ${item.name} with roll ${winner.roll}! (${cost} DKP)`,
          type: 'buff',
        });
      } else {
        this.addCombatLogEntry({
          message: `${winner.playerName} wins ${item.name}! (${cost} DKP)`,
          type: 'buff',
        });
      }

      // Remove item from pending loot
      const itemIndex = this.state.pendingLoot.findIndex(i => i.id === item.id);
      if (itemIndex !== -1) {
        this.state.pendingLoot.splice(itemIndex, 1);
      }
    }

    this.state.lootResults = results;
    this.state.lootBids = {};
    this.state.lootBidTimer = 0;
    this.notify();

    return results;
  }

  // Apply loot result to a specific player (called after resolution)
  applyLootToPlayer(itemId: string, playerId: string, dkpCost: number) {
    // This is called on each client to apply the loot to the winner
    // If this player won, equip the item and deduct DKP
    if (playerId === this.state.playerId) {
      // Find the item in loot results
      const result = this.state.lootResults.find(r => r.itemId === itemId);
      if (!result) return;

      // Find the item (might need to fetch from items database)
      // For now, we'll need to pass the item through the result
      this.state.playerDKP.points -= dkpCost;
      this.notify();
    }
  }

  // Check if current player has bid on an item
  hasPlayerBidOnItem(itemId: string): boolean {
    const bids = this.state.lootBids[itemId];
    if (!bids) return false;
    return bids.some(b => b.playerId === this.state.playerId);
  }

  // Get all bids for an item
  getBidsForItem(itemId: string): LootBid[] {
    return this.state.lootBids[itemId] || [];
  }

  // Update bid timer (called each second during bidding)
  tickLootBidTimer() {
    if (this.state.lootBidTimer > 0) {
      this.state.lootBidTimer--;
      this.notify();
    }
  }

  // Clear loot results (dismiss the results display)
  clearLootResults() {
    this.state.lootResults = [];
    this.notify();
  }

  // Apply a loot result - equip item to winner and deduct DKP
  applyLootResult(result: LootResult) {
    // Find the item from the all items list (it's been removed from pendingLoot at this point)
    const item = ALL_ITEMS[result.itemId];
    if (!item) return;

    // Check if the local player is the winner
    if (result.winnerId === this.state.playerId) {
      // Deduct DKP
      this.state.playerDKP.points -= result.dkpSpent;

      // Add item to player's bag
      this.state.playerBag.push({
        ...item,
        id: `${item.id}_${Date.now()}`, // Unique ID for the bag slot
      });

      this.addCombatLogEntry({
        message: `You won ${item.name}! (-${result.dkpSpent} DKP)`,
        type: 'buff',
      });

      this.notify();
    }
  }

  // =========================================================================
  // INSPECTION SYSTEM
  // =========================================================================

  inspectMember(memberId: string) {
    // Only allow inspection between fights
    if (this.state.isRunning) return;

    const member = this.state.raid.find(m => m.id === memberId);
    if (member) {
      this.state.inspectedMember = member;
      this.notify();
    }
  }

  closeInspection() {
    this.state.inspectedMember = null;
    this.notify();
  }

  // =========================================================================
  // SAVE/LOAD SYSTEM
  // =========================================================================

  saveGame(slotName: string = 'default') {
    const saveData = {
      version: 7, // Bumped for legendary materials support
      timestamp: Date.now(),
      player: {
        name: this.state.playerName,
        equipment: this.state.playerEquipment,
        dkp: this.state.playerDKP.points,
        bag: this.state.playerBag, // v5: Player bag inventory
        materialsBag: this.state.materialsBag, // v10: Materials bag (nexus crystals)
      },
      // Save full raid member data to preserve names across loads
      raidMembers: this.state.raid.map(m => ({
        id: m.id,
        name: m.name,
        class: m.class,
        spec: m.spec, // v6: Spec support
        role: m.role,
        maxHealth: m.maxHealth,
        dps: m.dps,
        group: m.group,
        equipment: m.equipment,
        gearScore: m.gearScore,
      })),
      raidSize: this.state.raid.length as 20 | 40,
      defeatedBosses: this.state.defeatedBosses, // Legacy - kept for backward compatibility
      defeatedBossesByRaid: this.state.defeatedBossesByRaid, // Per-raid progression (v4+)
      selectedRaidId: this.state.selectedRaidId, // Currently selected raid (v4+)
      firstKills: this.state.firstKills, // Permanent boss kills for world buff unlocks (v4+)
      activePaladinBlessings: this.state.activePaladinBlessings,
      paladinAuraAssignments: this.state.paladinAuraAssignments, // v6: Paladin aura assignments
      shamanTotemAssignments: this.state.shamanTotemAssignments, // v7: Shaman totem assignments
      unlockedWorldBuffs: this.state.unlockedWorldBuffs, // Persist world buff unlocks
      bossKillsWithoutPaladinLoot: this.state.bossKillsWithoutPaladinLoot, // Bad luck protection
      legendaryMaterials: this.state.legendaryMaterials, // v7: Legendary materials (Bindings, Eye of Sulfuras)
      questMaterials: this.state.questMaterials, // v8: Quest materials (Dragon heads)
      claimedQuestRewards: this.state.claimedQuestRewards, // v8: Claimed quest rewards (one per head type)
      raidMemberQuestRewards: this.state.raidMemberQuestRewards, // v9: Track raid member quest claims
    };

    localStorage.setItem(`mc_healer_save_${slotName}`, JSON.stringify(saveData));
    this.addCombatLogEntry({ message: `Game saved: ${slotName}`, type: 'system' });
    this.notify();
  }

  // Get save info for display
  getSaveInfo(slotName: string): { name: string; timestamp: number; playerName: string } | null {
    const raw = localStorage.getItem(`mc_healer_save_${slotName}`);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      return {
        name: slotName,
        timestamp: data.timestamp,
        playerName: data.player?.name || 'Unknown',
      };
    } catch {
      return null;
    }
  }

  loadGame(slotName: string = 'default') {
    const raw = localStorage.getItem(`mc_healer_save_${slotName}`);
    if (!raw) {
      this.addCombatLogEntry({ message: `No save found: ${slotName}`, type: 'system' });
      this.notify();
      return false;
    }

    try {
      const data = JSON.parse(raw);

      // Load player name and data
      if (data.player.name) {
        this.state.playerName = data.player.name;
      }
      this.state.playerEquipment = data.player.equipment;
      this.state.playerDKP.points = data.player.dkp;

      // Load player bag (v5+)
      if (data.player.bag) {
        this.state.playerBag = data.player.bag;
      } else {
        this.state.playerBag = [];
      }

      // Load materials bag (v10+)
      if (data.player.materialsBag) {
        this.state.materialsBag = data.player.materialsBag;
      } else {
        this.state.materialsBag = { nexus_crystal: 0 };
      }

      // Version 2+ saves include full raid member data - restore exact names and stats
      if (data.version >= 2 && data.raidMembers) {
        // Rebuild raid from saved data to preserve exact names
        this.state.raid = data.raidMembers.map((saved: {
          id: string;
          name: string;
          class: WoWClass;
          spec?: WoWSpec;
          role: 'tank' | 'healer' | 'dps';
          maxHealth: number;
          dps: number;
          group: number;
          equipment: Equipment;
          gearScore: number;
        }) => ({
          id: saved.id,
          name: saved.name,
          class: saved.class,
          spec: saved.spec || this.getDefaultSpecForClassRole(saved.class, saved.role), // v6: Restore spec or derive from class/role
          role: saved.role,
          currentHealth: saved.maxHealth,
          maxHealth: saved.maxHealth,
          buffs: [],
          debuffs: [],
          isAlive: true,
          dps: saved.dps,
          group: saved.group,
          equipment: this.migrateEquipment(saved.equipment),
          gearScore: saved.gearScore || 0,
        }));

        // Restore defeated bosses and paladin blessings
        if (data.defeatedBosses) {
          this.state.defeatedBosses = data.defeatedBosses;
          this.state.raidInProgress = data.defeatedBosses.length > 0;
        }
        if (data.activePaladinBlessings) {
          this.state.activePaladinBlessings = data.activePaladinBlessings;
        }

        // Restore paladin aura assignments (v6+)
        if (data.paladinAuraAssignments) {
          this.state.paladinAuraAssignments = data.paladinAuraAssignments;
        }

        // Restore shaman totem assignments (v7+)
        if (data.shamanTotemAssignments) {
          this.state.shamanTotemAssignments = data.shamanTotemAssignments;
        }

        // Update max paladin blessings based on raid size
        const raidSize = data.raidSize || this.state.raid.length;
        this.state.maxPaladinBlessings = raidSize >= 40 ? 4 : 2;

        // Restore unlocked world buffs (v3+)
        if (data.unlockedWorldBuffs) {
          this.state.unlockedWorldBuffs = data.unlockedWorldBuffs;
        }

        // Restore bad luck protection counter (v3+)
        if (data.bossKillsWithoutPaladinLoot !== undefined) {
          this.state.bossKillsWithoutPaladinLoot = data.bossKillsWithoutPaladinLoot;
        }

        // Restore legendary materials (v7+)
        if (data.legendaryMaterials) {
          this.state.legendaryMaterials = data.legendaryMaterials;
        }

        // Restore quest materials (v8+)
        if (data.questMaterials) {
          this.state.questMaterials = data.questMaterials;
        }
        if (data.claimedQuestRewards) {
          this.state.claimedQuestRewards = data.claimedQuestRewards;
        }
        // Migrate from old boolean format
        if (data.claimedOnyxiaReward === true) {
          this.state.claimedQuestRewards = ['head_of_onyxia'];
        }
        // Restore raid member quest rewards (v9+)
        if (data.raidMemberQuestRewards) {
          this.state.raidMemberQuestRewards = data.raidMemberQuestRewards;
        }

        // Restore multi-raid progression (v4+)
        if (data.defeatedBossesByRaid) {
          this.state.defeatedBossesByRaid = data.defeatedBossesByRaid;
        } else if (data.defeatedBosses && data.defeatedBosses.length > 0) {
          // Migrate legacy save: assume all defeated bosses were in Molten Core
          this.state.defeatedBossesByRaid = { molten_core: data.defeatedBosses };
        }

        if (data.selectedRaidId) {
          this.state.selectedRaidId = data.selectedRaidId;
        }

        // Restore firstKills for permanent world buff unlocks (v4+)
        if (data.firstKills) {
          this.state.firstKills = data.firstKills;
        }
      } else {
        // Legacy v1 save - just update equipment on existing raid
        const player = this.getPlayerMember();
        if (player) {
          player.name = data.player.name;
          player.equipment = data.player.equipment;
          player.gearScore = this.calculateGearScore(data.player.equipment);
        }

        // Load raid member equipment (legacy format)
        data.raidMembers?.forEach((saved: { id: string; name?: string; equipment: Equipment; gearScore: number }) => {
          if (saved.id === PLAYER_ID) return;
          const member = this.state.raid.find(m => m.id === saved.id);
          if (member) {
            if (saved.name) member.name = saved.name;
            member.equipment = saved.equipment;
            member.gearScore = saved.gearScore;
          }
        });
      }

      // Update player stats from equipment
      const stats = this.computePlayerStats();
      this.state.spellPower = stats.totalSpellPower;
      this.state.maxMana = stats.totalMaxMana;
      this.state.critChance = stats.totalCritChance;

      // Clear buffs on load
      this.state.playerBuffs = [];
      this.state.activeConsumables = [];
      this.state.activeWorldBuffs = [];

      // Reapply party auras from saved assignments
      this.recalculateAuras();

      this.addCombatLogEntry({ message: `Game loaded: ${slotName}`, type: 'system' });
      this.notify();
      return true;
    } catch {
      this.addCombatLogEntry({ message: `Failed to load: ${slotName}`, type: 'system' });
      this.notify();
      return false;
    }
  }

  listSaves(): string[] {
    const saves: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('mc_healer_save_')) {
        saves.push(key.replace('mc_healer_save_', ''));
      }
    }
    return saves;
  }

  deleteSave(slotName: string) {
    localStorage.removeItem(`mc_healer_save_${slotName}`);
    this.addCombatLogEntry({ message: `Save deleted: ${slotName}`, type: 'system' });
    this.notify();
  }

  // Export current game state as JSON (for cloud saves)
  exportSaveData(): unknown {
    return {
      version: 8,
      timestamp: Date.now(),
      // Top-level faction and class for character selection screen
      faction: this.state.faction,
      playerClass: this.state.playerClass,
      gearScore: this.getPlayerMember()?.gearScore || 0,
      player: {
        name: this.state.playerName,
        equipment: this.state.playerEquipment,
        dkp: this.state.playerDKP.points,
        bag: this.state.playerBag,
        materialsBag: this.state.materialsBag,
      },
      raidMembers: this.state.raid.map(m => ({
        id: m.id,
        name: m.name,
        class: m.class,
        spec: m.spec,
        role: m.role,
        maxHealth: m.maxHealth,
        dps: m.dps,
        group: m.group,
        equipment: m.equipment,
        gearScore: m.gearScore,
      })),
      raidSize: this.state.raid.length as 20 | 40,
      defeatedBosses: this.state.defeatedBosses,
      defeatedBossesByRaid: this.state.defeatedBossesByRaid,
      selectedRaidId: this.state.selectedRaidId,
      firstKills: this.state.firstKills,
      activePaladinBlessings: this.state.activePaladinBlessings,
      paladinAuraAssignments: this.state.paladinAuraAssignments,
      shamanTotemAssignments: this.state.shamanTotemAssignments,
      unlockedWorldBuffs: this.state.unlockedWorldBuffs,
      bossKillsWithoutPaladinLoot: this.state.bossKillsWithoutPaladinLoot,
      legendaryMaterials: this.state.legendaryMaterials,
      questMaterials: this.state.questMaterials,
      claimedQuestRewards: this.state.claimedQuestRewards,
      raidMemberQuestRewards: this.state.raidMemberQuestRewards,
    };
  }

  // Migrate equipment from old save format to new format with all 17 slots
  // Also refreshes item stats from ALL_ITEMS to pick up any hotfixes
  private migrateEquipment(equipment: Partial<Equipment> | undefined): Equipment {
    const emptyEquipment = createEmptyEquipment();
    if (!equipment) return emptyEquipment;

    // Create refreshed equipment by looking up each item from ALL_ITEMS
    // This ensures players always get the latest item stats when loading saves
    const refreshedEquipment: Equipment = { ...emptyEquipment };

    for (const [slot, item] of Object.entries(equipment)) {
      if (item && item.id) {
        // Look up the fresh item data from ALL_ITEMS
        const freshItem = ALL_ITEMS[item.id];
        if (freshItem) {
          // Use the fresh item data but preserve the enchantId from the save
          refreshedEquipment[slot as EquipmentSlot] = {
            ...freshItem,
            enchantId: item.enchantId, // Preserve player's enchant
          };
        } else {
          // Item no longer exists in ALL_ITEMS, keep the saved version
          refreshedEquipment[slot as EquipmentSlot] = item;
        }
      }
    }

    return refreshedEquipment;
  }

  // Import game state from JSON (for cloud saves)
  importSaveData(data: unknown): boolean {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const saveData = data as any;

      // Load player data
      if (saveData.player.name) {
        this.state.playerName = saveData.player.name;
      }
      // Migrate player equipment to ensure all 17 slots exist
      this.state.playerEquipment = this.migrateEquipment(saveData.player.equipment);
      this.state.playerDKP.points = saveData.player.dkp;
      this.state.playerBag = saveData.player.bag || [];
      this.state.materialsBag = saveData.player.materialsBag || { nexus_crystal: 0 };

      // Restore raid members
      if (saveData.raidMembers) {
        this.state.raid = saveData.raidMembers.map((saved: {
          id: string;
          name: string;
          class: WoWClass;
          spec?: WoWSpec;
          role: 'tank' | 'healer' | 'dps';
          maxHealth: number;
          dps: number;
          group: number;
          equipment: Equipment;
          gearScore: number;
        }) => ({
          id: saved.id,
          name: saved.name,
          class: saved.class,
          spec: saved.spec || this.getDefaultSpecForClassRole(saved.class, saved.role),
          role: saved.role,
          currentHealth: saved.maxHealth,
          maxHealth: saved.maxHealth,
          buffs: [],
          debuffs: [],
          isAlive: true,
          dps: saved.dps,
          group: saved.group,
          equipment: this.migrateEquipment(saved.equipment),
          gearScore: saved.gearScore || 0,
          positionZone: 'melee' as PositionZone, // Default position
        }));
      }

      // Restore progression and settings
      if (saveData.defeatedBosses) {
        this.state.defeatedBosses = saveData.defeatedBosses;
        this.state.raidInProgress = saveData.defeatedBosses.length > 0;
      }
      if (saveData.activePaladinBlessings) {
        this.state.activePaladinBlessings = saveData.activePaladinBlessings;
      }
      if (saveData.paladinAuraAssignments) {
        this.state.paladinAuraAssignments = saveData.paladinAuraAssignments;
      }
      if (saveData.shamanTotemAssignments) {
        this.state.shamanTotemAssignments = saveData.shamanTotemAssignments;
      }
      if (saveData.unlockedWorldBuffs) {
        this.state.unlockedWorldBuffs = saveData.unlockedWorldBuffs;
      }
      if (saveData.bossKillsWithoutPaladinLoot !== undefined) {
        this.state.bossKillsWithoutPaladinLoot = saveData.bossKillsWithoutPaladinLoot;
      }
      if (saveData.legendaryMaterials) {
        this.state.legendaryMaterials = saveData.legendaryMaterials;
      }
      if (saveData.questMaterials) {
        this.state.questMaterials = saveData.questMaterials;
      }
      if (saveData.claimedQuestRewards) {
        this.state.claimedQuestRewards = saveData.claimedQuestRewards;
      }
      // Migrate from old boolean format
      if (saveData.claimedOnyxiaReward === true && !this.state.claimedQuestRewards.includes('head_of_onyxia')) {
        this.state.claimedQuestRewards = [...this.state.claimedQuestRewards, 'head_of_onyxia'];
      }
      if (saveData.raidMemberQuestRewards) {
        this.state.raidMemberQuestRewards = saveData.raidMemberQuestRewards;
      }
      if (saveData.defeatedBossesByRaid) {
        this.state.defeatedBossesByRaid = saveData.defeatedBossesByRaid;
      }
      if (saveData.selectedRaidId) {
        this.state.selectedRaidId = saveData.selectedRaidId;
      }
      if (saveData.firstKills) {
        this.state.firstKills = saveData.firstKills;
      }

      // Update max paladin blessings
      const raidSize = saveData.raidSize || this.state.raid.length;
      this.state.maxPaladinBlessings = raidSize >= 40 ? 4 : 2;

      // Sync player's raid member equipment with playerEquipment to ensure same reference
      const player = this.getPlayerMember();
      if (player) {
        player.equipment = this.state.playerEquipment;
        player.gearScore = this.calculateGearScore(this.state.playerEquipment);
      }

      // Update player stats
      const stats = this.computePlayerStats();
      this.state.spellPower = stats.totalSpellPower;
      this.state.maxMana = stats.totalMaxMana;
      this.state.critChance = stats.totalCritChance;

      // Clear buffs
      this.state.playerBuffs = [];
      this.state.activeConsumables = [];
      this.state.activeWorldBuffs = [];

      // Reapply party auras from saved assignments
      this.recalculateAuras();

      this.addCombatLogEntry({ message: 'Cloud save loaded', type: 'system' });
      this.notify();
      return true;
    } catch (e) {
      console.error('Failed to import save data:', e);
      this.addCombatLogEntry({ message: 'Failed to load cloud save', type: 'system' });
      this.notify();
      return false;
    }
  }

  // Export current game state to a JSON file
  exportCurrentGameToFile(customFileName?: string) {
    const saveData = this.exportSaveData();

    const exportData = {
      exportVersion: 2,
      exportDate: new Date().toISOString(),
      playerName: this.state.playerName,
      saveData,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Use custom filename if provided, otherwise use player name with date
    const defaultName = `${this.state.playerName || 'healer'}-${new Date().toISOString().split('T')[0]}`;
    const fileName = customFileName?.trim()
      ? `${customFileName.trim().replace(/\.json$/i, '')}.json`
      : `${defaultName}.json`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.addCombatLogEntry({ message: `Exported save to file: ${fileName}`, type: 'system' });
    this.notify();
  }

  // Import game state from a JSON file
  importGameFromFile(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);

          // Support both old format (v1 with saves object) and new format (v2 with saveData)
          if (data.exportVersion === 2 && data.saveData) {
            // New format - single save
            this.importSaveData(data.saveData);
            this.addCombatLogEntry({ message: `Imported save from file`, type: 'system' });
            this.notify();
            resolve(true);
          } else if (data.saves && typeof data.saves === 'object') {
            // Old format - import first save found
            const saveKeys = Object.keys(data.saves);
            if (saveKeys.length > 0) {
              const firstSave = data.saves[saveKeys[0]];
              this.importSaveData(firstSave);
              this.addCombatLogEntry({ message: `Imported save from file`, type: 'system' });
              this.notify();
              resolve(true);
            } else {
              reject(new Error('No saves found in file'));
            }
          } else {
            reject(new Error('Invalid save file format'));
          }
        } catch (err) {
          reject(new Error('Failed to parse save file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // =========================================================================
  // BUFF SYSTEM
  // =========================================================================

  // Apply a raid buff to ALL raid members
  applyRaidBuff(buffId: string) {
    const buffDef = RAID_BUFFS[buffId as keyof typeof RAID_BUFFS];
    if (!buffDef) return;

    // Check if this is a paladin blessing - they have special handling
    const isPaladinBlessing = 'isPaladinBlessing' in buffDef && buffDef.isPaladinBlessing;

    // Check if AI caster class exists in raid (or it's a world buff)
    if (buffDef.casterClass && !isPaladinBlessing) {
      const caster = this.state.raid.find(m => m.class === buffDef.casterClass && m.isAlive && m.id !== PLAYER_ID);
      if (!caster) {
        this.addCombatLogEntry({ message: `No ${buffDef.casterClass} available to cast ${buffDef.name}!`, type: 'system' });
        this.notify();
        return;
      }
    }

    // For paladin blessings, check if it's in the active list
    if (isPaladinBlessing && !this.state.activePaladinBlessings.includes(buffId)) {
      this.addCombatLogEntry({ message: `${buffDef.name} is not assigned to a paladin!`, type: 'system' });
      this.notify();
      return;
    }

    // Create buff object
    const buffToApply = {
      id: buffDef.id,
      name: buffDef.name,
      icon: buffDef.icon,
      duration: buffDef.duration,
      maxDuration: buffDef.maxDuration,
      effect: buffDef.effect,
    };

    // Apply to player's buff tracking
    this.state.playerBuffs = this.state.playerBuffs.filter(b => b.id !== buffId);
    this.state.playerBuffs.push(buffToApply);

    // Apply to ALL raid members
    this.state.raid.forEach(member => {
      member.buffs = member.buffs.filter(b => b.id !== buffId);
      member.buffs.push({ ...buffToApply });
    });

    this.recalculateStatsFromBuffs();
    this.addCombatLogEntry({ message: `${buffDef.name} applied to raid!`, type: 'buff' });
    this.notify();
  }

  // Remove a buff from ALL raid members
  removeRaidBuff(buffId: string) {
    this.state.playerBuffs = this.state.playerBuffs.filter(b => b.id !== buffId);
    this.state.raid.forEach(member => {
      member.buffs = member.buffs.filter(b => b.id !== buffId);
    });
    this.recalculateStatsFromBuffs();
    this.notify();
  }

  // Apply all available buffs from raid members (respects paladin blessing slots and faction)
  applyAllRaidBuffs() {
    const raidClasses = new Set(this.state.raid.filter(m => m.id !== PLAYER_ID && m.isAlive).map(m => m.class));

    Object.values(RAID_BUFFS).forEach(buffDef => {
      const isPaladinBlessing = 'isPaladinBlessing' in buffDef && buffDef.isPaladinBlessing;

      // Skip ALL paladin blessings for Horde (they don't have Paladins)
      if (isPaladinBlessing && this.state.faction === 'horde') {
        return;
      }

      // Skip paladin blessings that aren't in the active list (Alliance only)
      if (isPaladinBlessing && !this.state.activePaladinBlessings.includes(buffDef.id)) {
        return;
      }

      // Apply if caster class is available (or it's a world buff)
      if (!buffDef.casterClass || raidClasses.has(buffDef.casterClass)) {
        this.applyRaidBuff(buffDef.id);
      }
    });
  }

  // Apply ALL buffs: raid buffs + consumables + available world buffs
  applyAllBuffs() {
    // 1. Apply all raid buffs
    this.applyAllRaidBuffs();

    // 2. Apply all consumables
    this.applyConsumables();

    // 3. Apply all available world buffs
    const worldBuffStatus = this.getWorldBuffStatus();
    worldBuffStatus.forEach(({ buff, isAvailable, isComingSoon }) => {
      if (isAvailable && !isComingSoon) {
        this.applyWorldBuff(buff.id);
      }
    });

    this.addCombatLogEntry({ message: 'All buffs, consumables, and world buffs applied!', type: 'system' });
  }

  // Clear all buffs from ALL raid members
  clearAllRaidBuffs() {
    this.state.playerBuffs = [];
    this.state.raid.forEach(member => {
      member.buffs = [];
    });
    this.recalculateStatsFromBuffs();
    this.addCombatLogEntry({ message: 'All buffs cleared', type: 'system' });
    this.notify();
  }

  // =========================================================================
  // PALADIN BLESSING MANAGEMENT
  // =========================================================================

  // Toggle a paladin blessing on/off in the active list
  togglePaladinBlessing(blessingId: string) {
    const isActive = this.state.activePaladinBlessings.includes(blessingId);

    if (isActive) {
      // Remove blessing
      this.state.activePaladinBlessings = this.state.activePaladinBlessings.filter(b => b !== blessingId);
      // Also remove the buff from raid if it was applied
      this.removeRaidBuff(blessingId);
      this.addCombatLogEntry({ message: `Paladin blessing slot freed up`, type: 'system' });
    } else {
      // Check if we have room for another blessing
      if (this.state.activePaladinBlessings.length >= this.state.maxPaladinBlessings) {
        this.addCombatLogEntry({
          message: `Cannot add more blessings! Only ${this.state.maxPaladinBlessings} paladins in raid.`,
          type: 'system'
        });
        this.notify();
        return;
      }
      // Add blessing
      this.state.activePaladinBlessings.push(blessingId);
      this.addCombatLogEntry({ message: `Paladin assigned to blessing`, type: 'system' });
    }

    this.notify();
  }

  // Get all available paladin blessings with their status
  getPaladinBlessings(): Array<{
    buff: typeof RAID_BUFFS[keyof typeof RAID_BUFFS];
    isAssigned: boolean;
    isApplied: boolean;
  }> {
    const paladinBlessings = Object.values(RAID_BUFFS).filter(
      b => 'isPaladinBlessing' in b && b.isPaladinBlessing
    );

    return paladinBlessings.map(buff => ({
      buff,
      isAssigned: this.state.activePaladinBlessings.includes(buff.id),
      isApplied: this.state.playerBuffs.some(b => b.id === buff.id),
    }));
  }

  // Recalculate player stats including buff bonuses
  private recalculateStatsFromBuffs() {
    const gearStats = this.computePlayerStats();

    let bonusInt = 0;
    let bonusSta = 0;
    let bonusSpirit = 0;
    let bonusCrit = 0;
    let bonusMp5 = 0;
    let bonusHealingPower = 0;
    let bonusMana = 0;

    this.state.playerBuffs.forEach(buff => {
      if (buff.effect) {
        bonusInt += buff.effect.intellectBonus || 0;
        bonusSta += buff.effect.staminaBonus || 0;
        bonusSpirit += buff.effect.spiritBonus || 0;
        bonusCrit += buff.effect.spellCritBonus || 0;
        bonusMp5 += buff.effect.manaRegenBonus || 0;
        bonusHealingPower += buff.effect.healingPower || 0;
        bonusMana += buff.effect.mana || 0;
        // All stats bonus
        if (buff.effect.allStatsBonus) {
          bonusInt += buff.effect.allStatsBonus;
          bonusSta += buff.effect.allStatsBonus;
          bonusSpirit += buff.effect.allStatsBonus;
        }
      }
    });

    // Update stats (intellect gives 15 mana per point)
    this.state.maxMana = gearStats.totalMaxMana + (bonusInt * 15) + bonusMana;
    this.state.critChance = gearStats.totalCritChance + bonusCrit;
    this.state.spellPower = gearStats.totalSpellPower + bonusHealingPower;

    // Update ALL raid members' health based on their buffs
    this.state.raid.forEach(member => {
      // Calculate stamina bonus from this member's buffs
      let memberBonusSta = 0;
      member.buffs.forEach(buff => {
        if (buff.effect) {
          memberBonusSta += buff.effect.staminaBonus || 0;
          if (buff.effect.allStatsBonus) {
            memberBonusSta += buff.effect.allStatsBonus;
          }
        }
      });

      // Get base health for this member (stored when raid was generated)
      // We need to track base health - for now use class defaults
      const baseHealth = member.id === PLAYER_ID
        ? PLAYER_BASE_HEALTH
        : this.getBaseHealthForMember(member);

      const oldMaxHealth = member.maxHealth;
      member.maxHealth = baseHealth + (memberBonusSta * 10);

      // If health increased, add the difference to current health too
      if (member.maxHealth > oldMaxHealth) {
        member.currentHealth += (member.maxHealth - oldMaxHealth);
      }
      // Cap current health at max
      member.currentHealth = Math.min(member.currentHealth, member.maxHealth);
    });
  }

  // Get base health for a raid member based on class and role
  private getBaseHealthForMember(member: RaidMember): number {
    const classHealth = CLASS_HEALTH[member.class];
    // Use average of min/max as base, with tank bonus
    const baseAvg = (classHealth.min + classHealth.max) / 2;
    return member.role === 'tank' ? Math.floor(baseAvg * 1.4) : Math.floor(baseAvg);
  }

  // Get available buffs based on raid composition (excluding paladin blessings - those are handled separately)
  getAvailableBuffs(): Array<{ buff: typeof RAID_BUFFS[keyof typeof RAID_BUFFS]; available: boolean; hasBuff: boolean }> {
    const raidClasses = new Set(this.state.raid.filter(m => m.id !== PLAYER_ID && m.isAlive).map(m => m.class));

    // Filter out paladin blessings - they're managed separately
    return Object.values(RAID_BUFFS)
      .filter(buff => !('isPaladinBlessing' in buff && buff.isPaladinBlessing))
      .map(buff => ({
        buff,
        available: !buff.casterClass || raidClasses.has(buff.casterClass),
        hasBuff: this.state.playerBuffs.some(b => b.id === buff.id),
      }));
  }

  // =========================================================================
  // CONSUMABLES SYSTEM
  // =========================================================================

  // Apply all consumables - healer consumes to player, role-appropriate to AI
  applyConsumables() {
    // Get healer consumables for player
    const healerConsumes = Object.values(CONSUMABLES).filter(c => c.role === 'healer' || c.role === 'all');

    // Apply to player
    const player = this.getPlayerMember();
    if (player) {
      healerConsumes.forEach(consume => {
        this.applyConsumableToMember(player, consume);
      });
    }

    // Track active consumables (healer ones for display)
    this.state.activeConsumables = healerConsumes.map(c => c.id);

    // Also add to player buffs for tracking
    healerConsumes.forEach(consume => {
      const existingIdx = this.state.playerBuffs.findIndex(b => b.id === consume.id);
      if (existingIdx >= 0) {
        this.state.playerBuffs.splice(existingIdx, 1);
      }
      this.state.playerBuffs.push({
        id: consume.id,
        name: consume.name,
        icon: consume.icon,
        duration: consume.duration,
        maxDuration: consume.duration,
        effect: consume.effect,
      });
    });

    // Apply role-appropriate consumables to AI raid members
    this.state.raid.forEach(member => {
      if (member.id === PLAYER_ID) return;

      const roleConsumes = Object.values(CONSUMABLES).filter(c =>
        c.role === member.role || c.role === 'all'
      );
      roleConsumes.forEach(consume => {
        this.applyConsumableToMember(member, consume);
      });
    });

    this.recalculateStatsFromBuffs();
    this.addCombatLogEntry({ message: 'Consumables applied to raid!', type: 'buff' });
    this.notify();
  }

  // Apply a single consumable buff to a member
  private applyConsumableToMember(member: RaidMember, consume: ConsumableBuff) {
    // Remove existing buff with same ID
    member.buffs = member.buffs.filter(b => b.id !== consume.id);

    // Add the new buff
    member.buffs.push({
      id: consume.id,
      name: consume.name,
      icon: consume.icon,
      duration: consume.duration,
      maxDuration: consume.duration,
      effect: consume.effect,
    });
  }

  // Clear all consumable buffs
  clearConsumables() {
    this.state.activeConsumables.forEach(id => {
      // Remove from all raid members
      this.state.raid.forEach(m => {
        m.buffs = m.buffs.filter(b => b.id !== id);
      });
      // Remove from player buffs tracking
      this.state.playerBuffs = this.state.playerBuffs.filter(b => b.id !== id);
    });

    // Also clear any other consumable buffs that might be on raid members
    const allConsumableIds = Object.keys(CONSUMABLES);
    this.state.raid.forEach(m => {
      m.buffs = m.buffs.filter(b => !allConsumableIds.includes(b.id));
    });

    this.state.activeConsumables = [];
    this.recalculateStatsFromBuffs();
    this.addCombatLogEntry({ message: 'Consumables cleared from raid', type: 'system' });
    this.notify();
  }

  // Check if consumables are currently active
  hasActiveConsumables(): boolean {
    return this.state.activeConsumables.length > 0;
  }

  // =========================================================================
  // WORLD BUFFS SYSTEM
  // =========================================================================

  // Apply a world buff to entire raid
  applyWorldBuff(buffId: string) {
    const worldBuff = WORLD_BUFFS[buffId];
    if (!worldBuff) return;

    // Check if coming soon
    if (worldBuff.comingSoon) {
      this.addCombatLogEntry({
        message: `${worldBuff.name} will be available when ${worldBuff.unlockRaid} is released!`,
        type: 'system'
      });
      this.notify();
      return;
    }

    // Check if unlocked (if requires boss kill) - use firstKills for permanent unlock tracking
    if (worldBuff.unlockBoss && !this.state.firstKills.includes(worldBuff.unlockBoss)) {
      this.addCombatLogEntry({
        message: `Must defeat ${worldBuff.unlockBoss} to unlock ${worldBuff.name}!`,
        type: 'system'
      });
      this.notify();
      return;
    }

    // Create buff object
    const buffToApply = {
      id: worldBuff.id,
      name: worldBuff.name,
      icon: worldBuff.icon,
      duration: worldBuff.duration,
      maxDuration: worldBuff.duration,
      effect: worldBuff.effect,
    };

    // Apply to entire raid
    this.state.raid.forEach(member => {
      member.buffs = member.buffs.filter(b => b.id !== buffId);
      member.buffs.push({ ...buffToApply });
    });

    // Add to player buffs tracking
    this.state.playerBuffs = this.state.playerBuffs.filter(b => b.id !== buffId);
    this.state.playerBuffs.push(buffToApply);

    // Track active world buff
    if (!this.state.activeWorldBuffs.includes(buffId)) {
      this.state.activeWorldBuffs.push(buffId);
    }

    this.recalculateStatsFromBuffs();
    this.addCombatLogEntry({ message: `${worldBuff.name} applied to raid!`, type: 'buff' });
    this.notify();
  }

  // Clear all world buffs
  clearWorldBuffs() {
    this.state.activeWorldBuffs.forEach(id => {
      this.state.raid.forEach(m => {
        m.buffs = m.buffs.filter(b => b.id !== id);
      });
      this.state.playerBuffs = this.state.playerBuffs.filter(b => b.id !== id);
    });

    this.state.activeWorldBuffs = [];
    this.recalculateStatsFromBuffs();
    this.addCombatLogEntry({ message: 'World buffs cleared from raid', type: 'system' });
    this.notify();
  }

  // Check if a world buff is available (not "coming soon" and unlocked if needed)
  isWorldBuffAvailable(buffId: string): boolean {
    const worldBuff = WORLD_BUFFS[buffId];
    if (!worldBuff) return false;

    // Coming soon = not available
    if (worldBuff.comingSoon) return false;

    // No unlock requirement = always available
    if (!worldBuff.unlockBoss) return true;

    // Check if unlocked via first kill OR admin override
    return this.state.firstKills.includes(worldBuff.unlockBoss) ||
           this.state.unlockedWorldBuffs.includes(buffId);
  }

  // Check if a world buff is active
  isWorldBuffActive(buffId: string): boolean {
    return this.state.activeWorldBuffs.includes(buffId);
  }

  // Get all world buffs with their status
  getWorldBuffStatus(): Array<{
    buff: WorldBuff;
    isAvailable: boolean;
    isActive: boolean;
    isComingSoon: boolean;
  }> {
    return Object.values(WORLD_BUFFS).map(buff => ({
      buff,
      isAvailable: this.isWorldBuffAvailable(buff.id),
      isActive: this.isWorldBuffActive(buff.id),
      isComingSoon: buff.comingSoon || false,
    }));
  }

  // =========================================================================
  // ADMIN PANEL METHODS
  // =========================================================================

  // Get all items available in the game
  getAllItems(): GearItem[] {
    return Object.values(ALL_ITEMS);
  }

  // Get all items a specific class can equip
  getEquippableItemsForClass(wowClass: WoWClass): GearItem[] {
    return Object.values(ALL_ITEMS).filter(item => this.canEquip(wowClass, item));
  }

  // Admin: Equip item on any raid member with validation
  adminEquipItemOnMember(memberId: string, item: GearItem): boolean {
    const member = this.state.raid.find(m => m.id === memberId);
    if (!member) {
      this.addCombatLogEntry({ message: `[Admin] Member not found: ${memberId}`, type: 'system' });
      this.notify();
      return false;
    }

    // Validate class can equip
    if (!this.canEquip(member.class, item)) {
      this.addCombatLogEntry({
        message: `[Admin] ${member.name} (${member.class}) cannot equip ${item.name}`,
        type: 'system'
      });
      this.notify();
      return false;
    }

    // Prevent equipping offhand when 2H weapon is equipped
    if (item.slot === 'offhand' && member.equipment.weapon?.weaponType === 'two_hand') {
      this.addCombatLogEntry({
        message: `[Admin] Cannot equip ${item.name} - ${member.name} has a 2H weapon equipped`,
        type: 'system'
      });
      this.notify();
      return false;
    }

    // Determine the target slot, handling dual-wield for warriors and rogues
    let slot = item.slot;
    const canDualWield = member.class === 'warrior' || member.class === 'rogue';

    if (canDualWield && item.slot === 'weapon' && item.weaponType === 'one_hand') {
      // If main hand is already equipped, try to put in offhand
      if (member.equipment.weapon && !member.equipment.offhand) {
        slot = 'offhand' as EquipmentSlot;
      }
    }

    const oldItem = member.equipment[slot];
    member.equipment[slot] = item;

    // Clear offhand when equipping 2H weapon
    let clearedOffhand: GearItem | null = null;
    if (slot === 'weapon' && item.weaponType === 'two_hand') {
      clearedOffhand = member.equipment.offhand;
      member.equipment.offhand = null;
      if (memberId === PLAYER_ID) {
        this.state.playerEquipment.offhand = null;
      }
    }

    member.gearScore = this.calculateGearScore(member.equipment);

    // If this is the player, also update playerEquipment and stats
    if (memberId === PLAYER_ID) {
      this.state.playerEquipment[slot] = item;
      const stats = this.computePlayerStats();
      this.state.spellPower = stats.totalSpellPower;
      this.state.maxMana = stats.totalMaxMana;
      this.state.critChance = stats.totalCritChance;
    }

    let logMessage = `[Admin] Equipped ${item.name} on ${member.name}`;
    if (oldItem) logMessage += ` (replaced ${oldItem.name})`;
    if (clearedOffhand) logMessage += ` (removed ${clearedOffhand.name} from offhand)`;
    this.addCombatLogEntry({ message: logMessage, type: 'system' });
    this.notify();
    return true;
  }

  // Admin: Remove item from specific slot on any raid member
  adminRemoveItemFromMember(memberId: string, slot: EquipmentSlot): GearItem | null {
    const member = this.state.raid.find(m => m.id === memberId);
    if (!member) {
      this.addCombatLogEntry({ message: `[Admin] Member not found: ${memberId}`, type: 'system' });
      this.notify();
      return null;
    }

    const removedItem = member.equipment[slot];
    if (!removedItem) {
      this.addCombatLogEntry({ message: `[Admin] No item in ${slot} slot`, type: 'system' });
      this.notify();
      return null;
    }

    member.equipment[slot] = null;
    member.gearScore = this.calculateGearScore(member.equipment);

    // If this is the player, also update playerEquipment and stats
    if (memberId === PLAYER_ID) {
      this.state.playerEquipment[slot] = null;
      const stats = this.computePlayerStats();
      this.state.spellPower = stats.totalSpellPower;
      this.state.maxMana = stats.totalMaxMana;
      this.state.critChance = stats.totalCritChance;
    }

    this.addCombatLogEntry({
      message: `[Admin] Removed ${removedItem.name} from ${member.name}`,
      type: 'system',
    });
    this.notify();
    return removedItem;
  }

  // Admin: Gear all raid members with appropriate items for their class
  adminGearAllPlayers(): void {
    // All equipment slots including the new accessory slots
    const slots: EquipmentSlot[] = [
      'head', 'neck', 'shoulders', 'back', 'chest', 'wrist',
      'hands', 'waist', 'legs', 'feet',
      'ring1', 'ring2', 'trinket1', 'trinket2',
      'weapon'
    ];
    let totalEquipped = 0;

    for (const member of this.state.raid) {
      // Get all equippable items for this class that also benefit their spec
      const equippableItems = this.getEquippableItemsForClass(member.class)
        .filter(item => this.canBenefitFrom(member, item));

      for (const slot of slots) {
        // Skip if already equipped
        if (member.equipment[slot]) continue;

        // Find best item for this slot (highest item level)
        // For ring2/trinket2, use ring1/trinket1 slot items
        const targetSlot = slot === 'ring2' ? 'ring1' : slot === 'trinket2' ? 'trinket1' : slot;
        let itemsForSlot = equippableItems.filter(item => item.slot === targetSlot);

        // For ring2/trinket2, exclude already equipped items
        if (slot === 'ring2' && member.equipment.ring1) {
          itemsForSlot = itemsForSlot.filter(item => item.id !== member.equipment.ring1?.id);
        }
        if (slot === 'trinket2' && member.equipment.trinket1) {
          itemsForSlot = itemsForSlot.filter(item => item.id !== member.equipment.trinket1?.id);
        }

        if (itemsForSlot.length === 0) continue;

        // Sort by item level descending and pick the best
        const bestItem = itemsForSlot.sort((a, b) => b.itemLevel - a.itemLevel)[0];

        // Equip it
        member.equipment[slot] = bestItem;
        totalEquipped++;

        // If this is the player, also update playerEquipment
        if (member.id === PLAYER_ID) {
          this.state.playerEquipment[slot] = bestItem;
        }
      }

      // Handle offhand for dual-wield classes (warrior, rogue) or casters with 1H
      // Only if not using a 2H weapon
      if (!member.equipment.offhand && member.equipment.weapon?.weaponType !== 'two_hand') {
        const offhandItems = equippableItems.filter(item =>
          item.slot === 'offhand' ||
          ((member.class === 'warrior' || member.class === 'rogue') &&
           item.slot === 'weapon' && item.weaponType === 'one_hand')
        );
        if (offhandItems.length > 0) {
          const bestOffhand = offhandItems.sort((a, b) => b.itemLevel - a.itemLevel)[0];
          member.equipment.offhand = bestOffhand;
          totalEquipped++;
          if (member.id === PLAYER_ID) {
            this.state.playerEquipment.offhand = bestOffhand;
          }
        }
      }

      // Handle ranged slot (includes class relics: librams, totems, idols, wands)
      if (!member.equipment.ranged) {
        const rangedItems = equippableItems.filter(item => item.slot === 'ranged');
        if (rangedItems.length > 0) {
          const bestRanged = rangedItems.sort((a, b) => b.itemLevel - a.itemLevel)[0];
          member.equipment.ranged = bestRanged;
          totalEquipped++;
          if (member.id === PLAYER_ID) {
            this.state.playerEquipment.ranged = bestRanged;
          }
        }
      }

      // Update gear score
      member.gearScore = this.calculateGearScore(member.equipment);
    }

    // Update player stats if they got new gear
    const stats = this.computePlayerStats();
    this.state.spellPower = stats.totalSpellPower;
    this.state.maxMana = stats.totalMaxMana;
    this.state.critChance = stats.totalCritChance;

    this.addCombatLogEntry({
      message: `[Admin] Geared all raid members (${totalEquipped} items equipped)`,
      type: 'system',
    });
    this.notify();
  }

  // Admin: Set player DKP to specific value
  adminSetPlayerDKP(amount: number): void {
    const clampedAmount = Math.max(0, Math.min(9999, Math.floor(amount)));
    const oldDKP = this.state.playerDKP.points;
    this.state.playerDKP.points = clampedAmount;
    this.addCombatLogEntry({
      message: `[Admin] DKP set to ${clampedAmount} (was ${oldDKP})`,
      type: 'system',
    });
    this.notify();
  }

  // Admin: Add or subtract DKP
  adminModifyPlayerDKP(delta: number): void {
    const oldDKP = this.state.playerDKP.points;
    const newDKP = Math.max(0, Math.min(9999, this.state.playerDKP.points + delta));
    this.state.playerDKP.points = newDKP;
    this.addCombatLogEntry({
      message: `[Admin] DKP ${delta >= 0 ? '+' : ''}${delta} (${oldDKP} → ${newDKP})`,
      type: 'system',
    });
    this.notify();
  }

  // Admin: Toggle boss defeated status (for a specific raid)
  adminToggleBossDefeated(bossId: string, raidId?: string): boolean {
    const targetRaidId = raidId || this.state.selectedRaidId;

    // Initialize the array for target raid if it doesn't exist
    if (!this.state.defeatedBossesByRaid[targetRaidId]) {
      this.state.defeatedBossesByRaid[targetRaidId] = [];
    }

    const raidDefeated = this.state.defeatedBossesByRaid[targetRaidId];
    const isDefeated = raidDefeated.includes(bossId);

    if (isDefeated) {
      // Un-defeat the boss
      this.state.defeatedBossesByRaid[targetRaidId] = raidDefeated.filter(id => id !== bossId);
      this.state.defeatedBosses = this.state.defeatedBosses.filter(id => id !== bossId);
      // Also remove from firstKills
      this.state.firstKills = this.state.firstKills.filter(id => id !== bossId);
      this.addCombatLogEntry({ message: `[Admin] ${bossId} marked as NOT defeated`, type: 'system' });
    } else {
      // Mark boss as defeated
      this.state.defeatedBossesByRaid[targetRaidId].push(bossId);
      if (!this.state.defeatedBosses.includes(bossId)) {
        this.state.defeatedBosses.push(bossId);
      }
      // Also add to firstKills (for world buff unlocks)
      if (!this.state.firstKills.includes(bossId)) {
        this.state.firstKills.push(bossId);
      }
      this.addCombatLogEntry({ message: `[Admin] ${bossId} marked as defeated`, type: 'system' });

      // Check for special unlocks (same as handleBossVictory)
      // Thunderaan defeat tracking
      if (bossId === 'thunderaan') {
        this.state.thunderaanDefeated = true;
        this.addCombatLogEntry({ message: '[Admin] Thunderaan defeated - Thunderfury can now be forged!', type: 'system' });
      }

      // Silithus unlock: requires both bindings + Firemaw kill
      if (bossId === 'firemaw' && !this.state.silithusUnlocked) {
        const hasLeftBinding = this.state.legendaryMaterials.includes('bindings_of_the_windseeker_left');
        const hasRightBinding = this.state.legendaryMaterials.includes('bindings_of_the_windseeker_right');

        if (hasLeftBinding && hasRightBinding) {
          this.state.silithusUnlocked = true;
          this.addCombatLogEntry({ message: '[Admin] Silithus unlocked - Prince Thunderaan is now available!', type: 'system' });
          this.triggerSpecialAlert('Prince Thunderaan has been summoned! Check the raid list to challenge him in Silithus!');
        }
      }
    }

    // Update raid in progress status for the currently selected raid
    const currentRaidDefeated = this.state.defeatedBossesByRaid[this.state.selectedRaidId] || [];
    this.state.raidInProgress = currentRaidDefeated.length > 0;

    this.notify();
    return !isDefeated; // Return new defeated status
  }

  // Admin: Toggle world buff unlock
  adminToggleWorldBuffUnlocked(buffId: string): boolean {
    const isUnlocked = this.state.unlockedWorldBuffs.includes(buffId);

    if (isUnlocked) {
      this.state.unlockedWorldBuffs = this.state.unlockedWorldBuffs.filter(id => id !== buffId);
      // Also remove active buff if it was applied
      this.state.activeWorldBuffs = this.state.activeWorldBuffs.filter(id => id !== buffId);
      this.state.raid.forEach(m => {
        m.buffs = m.buffs.filter(b => b.id !== buffId);
      });
      this.state.playerBuffs = this.state.playerBuffs.filter(b => b.id !== buffId);
      this.addCombatLogEntry({ message: `[Admin] World buff ${buffId} locked`, type: 'system' });
    } else {
      this.state.unlockedWorldBuffs.push(buffId);
      this.addCombatLogEntry({ message: `[Admin] World buff ${buffId} unlocked`, type: 'system' });
    }

    this.notify();
    return !isUnlocked;
  }

  // Admin: Reset bad luck protection counter
  adminResetBadLuckProtection(): void {
    const oldCount = this.state.bossKillsWithoutPaladinLoot;
    this.state.bossKillsWithoutPaladinLoot = 0;
    this.addCombatLogEntry({
      message: `[Admin] Bad luck protection reset (was ${oldCount})`,
      type: 'system',
    });
    this.notify();
  }

  // Admin: Set bad luck protection counter
  adminSetBadLuckProtection(count: number): void {
    const clampedCount = Math.max(0, Math.floor(count));
    this.state.bossKillsWithoutPaladinLoot = clampedCount;
    this.addCombatLogEntry({
      message: `[Admin] Bad luck protection set to ${clampedCount}`,
      type: 'system',
    });
    this.notify();
  }

  // Admin: Toggle legendary material in inventory
  adminToggleLegendaryMaterial(materialId: LegendaryMaterialId): boolean {
    const hasIt = this.state.legendaryMaterials.includes(materialId);
    const material = LEGENDARY_MATERIALS[materialId];

    if (hasIt) {
      this.state.legendaryMaterials = this.state.legendaryMaterials.filter(id => id !== materialId);
      this.addCombatLogEntry({
        message: `[Admin] Removed ${material?.name || materialId}`,
        type: 'system',
      });
    } else {
      this.state.legendaryMaterials.push(materialId);
      this.addCombatLogEntry({
        message: `[Admin] Added ${material?.name || materialId}`,
        type: 'system',
      });
    }

    this.notify();
    return !hasIt;
  }

  // Admin: Check if player has a legendary material
  adminHasLegendaryMaterial(materialId: LegendaryMaterialId): boolean {
    return this.state.legendaryMaterials.includes(materialId);
  }

  // Admin: Clear all progression (defeated bosses, DKP earned this raid)
  adminClearAllProgression(): void {
    this.state.defeatedBosses = [];
    this.state.raidInProgress = false;
    this.state.playerDKP.earnedThisRaid = 0;
    this.addCombatLogEntry({ message: `[Admin] All progression cleared`, type: 'system' });
    this.notify();
  }

  // Admin: Rename any raid member
  adminRenameMember(memberId: string, newName: string): boolean {
    const member = this.state.raid.find(m => m.id === memberId);
    if (!member) {
      this.addCombatLogEntry({ message: `[Admin] Member not found: ${memberId}`, type: 'system' });
      this.notify();
      return false;
    }

    const sanitizedName = newName.trim() || 'Unnamed';
    const oldName = member.name;
    member.name = sanitizedName;

    // If this is the player, also update playerName
    if (memberId === PLAYER_ID) {
      this.state.playerName = sanitizedName;
    }

    this.addCombatLogEntry({
      message: `[Admin] Renamed ${oldName} to ${sanitizedName}`,
      type: 'system',
    });
    this.notify();
    return true;
  }

  // Admin: Change member class (resets incompatible equipment)
  adminChangeMemberClass(memberId: string, newClass: WoWClass): boolean {
    const member = this.state.raid.find(m => m.id === memberId);
    if (!member) {
      this.addCombatLogEntry({ message: `[Admin] Member not found: ${memberId}`, type: 'system' });
      this.notify();
      return false;
    }

    const oldClass = member.class;
    member.class = newClass;

    // Remove equipment that the new class cannot use
    const slots: EquipmentSlot[] = ['head', 'shoulders', 'chest', 'waist', 'legs', 'hands', 'wrist', 'feet', 'weapon'];
    let removedCount = 0;

    slots.forEach(slot => {
      const item = member.equipment[slot];
      if (item && !this.canEquip(newClass, item)) {
        member.equipment[slot] = null;
        removedCount++;
      }
    });

    member.gearScore = this.calculateGearScore(member.equipment);

    // If this is the player, sync playerEquipment and recalculate stats
    if (memberId === PLAYER_ID) {
      slots.forEach(slot => {
        this.state.playerEquipment[slot] = member.equipment[slot];
      });
      const stats = this.computePlayerStats();
      this.state.spellPower = stats.totalSpellPower;
      this.state.maxMana = stats.totalMaxMana;
      this.state.critChance = stats.totalCritChance;
    }

    this.addCombatLogEntry({
      message: `[Admin] Changed ${member.name} from ${oldClass} to ${newClass}${removedCount > 0 ? ` (removed ${removedCount} incompatible items)` : ''}`,
      type: 'system',
    });
    this.notify();
    return true;
  }

  // Admin: Delete member (cannot delete player)
  adminDeleteMember(memberId: string): boolean {
    if (memberId === PLAYER_ID) {
      this.addCombatLogEntry({ message: `[Admin] Cannot delete the player!`, type: 'system' });
      this.notify();
      return false;
    }

    const memberIndex = this.state.raid.findIndex(m => m.id === memberId);
    if (memberIndex === -1) {
      this.addCombatLogEntry({ message: `[Admin] Member not found: ${memberId}`, type: 'system' });
      this.notify();
      return false;
    }

    const member = this.state.raid[memberIndex];
    this.state.raid.splice(memberIndex, 1);

    // Update paladin blessing count if a paladin was removed
    if (member.class === 'paladin') {
      const paladinCount = this.state.raid.filter(m => m.class === 'paladin').length;
      this.state.maxPaladinBlessings = paladinCount;
      // Trim active blessings if we now have fewer paladin slots
      if (this.state.activePaladinBlessings.length > paladinCount) {
        this.state.activePaladinBlessings = this.state.activePaladinBlessings.slice(0, paladinCount);
      }
    }

    this.addCombatLogEntry({
      message: `[Admin] Removed ${member.name} (${member.class}) from raid`,
      type: 'system',
    });
    this.notify();
    return true;
  }

  // Admin: Add new member to raid
  adminAddMember(name: string, wowClass: WoWClass, role: 'tank' | 'healer' | 'dps'): RaidMember {
    const sanitizedName = name.trim() || 'NewMember';

    // Generate unique ID
    const existingIds = this.state.raid.map(m => m.id);
    let newId = `member_${this.state.raid.length}`;
    let idCounter = this.state.raid.length;
    while (existingIds.includes(newId)) {
      idCounter++;
      newId = `member_${idCounter}`;
    }

    // Calculate health based on class and role
    const classHealth = CLASS_HEALTH[wowClass];
    const baseHealth = (classHealth.min + classHealth.max) / 2;
    const maxHealth = role === 'tank' ? Math.floor(baseHealth * 1.4) : Math.floor(baseHealth);

    // Determine default spec for the class/role combination
    const classSpecs = CLASS_SPECS[wowClass];
    const matchingSpec = classSpecs.find(s => s.role === role);
    const spec = matchingSpec?.id || classSpecs[0].id;

    // Create new member
    const newMember: RaidMember = {
      id: newId,
      name: sanitizedName,
      class: wowClass,
      spec,
      role,
      currentHealth: maxHealth,
      maxHealth,
      buffs: [],
      debuffs: [],
      isAlive: true,
      dps: role === 'dps' ? 400 + Math.floor(Math.random() * 200) : role === 'tank' ? 150 : 0,
      group: Math.floor(this.state.raid.length / 5) + 1,
      equipment: createEmptyEquipment(),
      gearScore: 0,
      positionZone: this.getPositionZone(wowClass, spec, role),
    };

    this.state.raid.push(newMember);

    // Update paladin blessing count if a paladin was added
    if (wowClass === 'paladin') {
      const paladinCount = this.state.raid.filter(m => m.class === 'paladin').length;
      this.state.maxPaladinBlessings = paladinCount;
    }

    this.addCombatLogEntry({
      message: `[Admin] Added ${sanitizedName} (${wowClass} ${role}) to raid`,
      type: 'system',
    });
    this.notify();
    return newMember;
  }

  // Admin: Resize raid to 20 or 40
  adminResizeRaid(newSize: 20 | 40): void {
    const currentSize = this.state.raid.length;

    if (currentSize === newSize) {
      this.addCombatLogEntry({ message: `[Admin] Raid is already size ${newSize}`, type: 'system' });
      this.notify();
      return;
    }

    if (newSize > currentSize) {
      // Add members to reach target size
      const membersToAdd = newSize - currentSize;
      const dpsClasses: WoWClass[] = ['mage', 'warlock', 'rogue', 'hunter', 'warrior'];

      for (let i = 0; i < membersToAdd; i++) {
        const wowClass = dpsClasses[i % dpsClasses.length];
        const names = CLASS_NAMES[wowClass];
        const name = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 99);
        this.adminAddMember(name, wowClass, 'dps');
      }

      this.addCombatLogEntry({
        message: `[Admin] Expanded raid from ${currentSize} to ${newSize} (added ${membersToAdd} members)`,
        type: 'system',
      });
    } else {
      // Remove members to reach target size (keep player)
      const membersToRemove = currentSize - newSize;
      let removed = 0;

      // Remove from the end, but never remove the player
      for (let i = this.state.raid.length - 1; i >= 0 && removed < membersToRemove; i--) {
        if (this.state.raid[i].id !== PLAYER_ID) {
          this.state.raid.splice(i, 1);
          removed++;
        }
      }

      // Update paladin blessing count
      const paladinCount = this.state.raid.filter(m => m.class === 'paladin').length;
      this.state.maxPaladinBlessings = paladinCount;
      if (this.state.activePaladinBlessings.length > paladinCount) {
        this.state.activePaladinBlessings = this.state.activePaladinBlessings.slice(0, paladinCount);
      }

      this.addCombatLogEntry({
        message: `[Admin] Shrunk raid from ${currentSize} to ${this.state.raid.length} (removed ${removed} members)`,
        type: 'system',
      });
    }

    this.notify();
  }

  // Admin: Get all raid members
  adminGetRaidMembers(): RaidMember[] {
    return this.state.raid;
  }

  // Admin: Get member by ID
  adminGetMemberById(memberId: string): RaidMember | undefined {
    return this.state.raid.find(m => m.id === memberId);
  }

  // Admin: Get defeated bosses list
  adminGetDefeatedBosses(): string[] {
    return this.state.defeatedBosses;
  }

  // Admin: Get all encounters for display (for a specific raid or current raid)
  adminGetAllEncounters(raidId?: string): Array<{ id: string; name: string; isDefeated: boolean }> {
    const targetRaidId = raidId || this.state.selectedRaidId;
    const targetRaid = getRaidById(targetRaidId);
    const encounters = targetRaid?.encounters || ENCOUNTERS;
    const defeatedInRaid = this.state.defeatedBossesByRaid[targetRaidId] || [];

    return encounters.map(e => ({
      id: e.id,
      name: e.name,
      isDefeated: defeatedInRaid.includes(e.id),
    }));
  }

  // =========================================================================
  // LEGENDARY CRAFTING METHODS
  // =========================================================================

  // Get all legendary materials the player has
  getLegendaryMaterials(): LegendaryMaterial[] {
    return this.state.legendaryMaterials.map(id => LEGENDARY_MATERIALS[id]);
  }

  // Check if player can craft Sulfuras (has Eye of Sulfuras)
  canCraftSulfuras(): boolean {
    return this.state.legendaryMaterials.includes('eye_of_sulfuras');
  }

  // Check if player can craft Thunderfury (has both bindings + defeated Thunderaan)
  canCraftThunderfury(): boolean {
    const hasLeftBinding = this.state.legendaryMaterials.includes('bindings_of_the_windseeker_left');
    const hasRightBinding = this.state.legendaryMaterials.includes('bindings_of_the_windseeker_right');
    const hasDefeatedThunderaan = this.state.thunderaanDefeated;
    return hasLeftBinding && hasRightBinding && hasDefeatedThunderaan;
  }

  // Check if player has the materials for Thunderfury but needs to defeat Thunderaan
  hasThunderfuryMaterialsButNeedsThunderaan(): boolean {
    const hasLeftBinding = this.state.legendaryMaterials.includes('bindings_of_the_windseeker_left');
    const hasRightBinding = this.state.legendaryMaterials.includes('bindings_of_the_windseeker_right');
    const hasDefeatedThunderaan = this.state.thunderaanDefeated;
    return hasLeftBinding && hasRightBinding && !hasDefeatedThunderaan;
  }

  // Craft Sulfuras and equip on a raid member
  craftSulfuras(memberId: string): boolean {
    if (!this.canCraftSulfuras()) {
      this.addCombatLogEntry({ message: 'Cannot craft Sulfuras - missing Eye of Sulfuras!', type: 'system' });
      this.notify();
      return false;
    }

    const sulfuras = ALL_ITEMS['sulfuras'];
    if (!sulfuras) {
      this.addCombatLogEntry({ message: 'Error: Sulfuras item not found!', type: 'system' });
      this.notify();
      return false;
    }

    const member = this.state.raid.find(m => m.id === memberId);
    if (!member) {
      this.addCombatLogEntry({ message: 'Cannot craft Sulfuras - member not found!', type: 'system' });
      this.notify();
      return false;
    }

    // Check if class can equip
    if (!this.canEquip(member.class, sulfuras)) {
      this.addCombatLogEntry({
        message: `Cannot craft Sulfuras - ${member.class} cannot equip it!`,
        type: 'system'
      });
      this.notify();
      return false;
    }

    // Remove the Eye from inventory
    this.state.legendaryMaterials = this.state.legendaryMaterials.filter(
      id => id !== 'eye_of_sulfuras'
    );

    // Equip Sulfuras
    member.equipment.weapon = sulfuras;
    member.gearScore = this.calculateGearScore(member.equipment);

    // If this is the player, also update playerEquipment and stats
    if (memberId === 'player') {
      this.state.playerEquipment.weapon = sulfuras;
      const stats = this.computePlayerStats();
      this.state.spellPower = stats.totalSpellPower;
      this.state.maxMana = stats.totalMaxMana;
      this.state.critChance = stats.totalCritChance;
    }

    this.addCombatLogEntry({
      message: `LEGENDARY CRAFTED! ${member.name} now wields Sulfuras, Hand of Ragnaros!`,
      type: 'system',
    });

    // Request cloud save after legendary crafting
    this.requestCloudSave();

    this.notify();
    return true;
  }

  // Craft Thunderfury and equip on a raid member (requires Prince Thunderaan defeat)
  craftThunderfury(memberId: string): boolean {
    if (!this.canCraftThunderfury()) {
      if (this.hasThunderfuryMaterialsButNeedsThunderaan()) {
        this.addCombatLogEntry({
          message: 'Cannot craft Thunderfury - must defeat Prince Thunderaan in Silithus first!',
          type: 'system'
        });
      } else {
        this.addCombatLogEntry({
          message: 'Cannot craft Thunderfury - missing bindings!',
          type: 'system'
        });
      }
      this.notify();
      return false;
    }

    const thunderfury = ALL_ITEMS['thunderfury'];
    if (!thunderfury) {
      this.addCombatLogEntry({ message: 'Error: Thunderfury item not found!', type: 'system' });
      this.notify();
      return false;
    }

    const member = this.state.raid.find(m => m.id === memberId);
    if (!member) {
      this.addCombatLogEntry({ message: 'Cannot craft Thunderfury - member not found!', type: 'system' });
      this.notify();
      return false;
    }

    // Check if class can equip
    if (!this.canEquip(member.class, thunderfury)) {
      this.addCombatLogEntry({
        message: `Cannot craft Thunderfury - ${member.class} cannot equip it!`,
        type: 'system'
      });
      this.notify();
      return false;
    }

    // Remove the bindings from inventory
    this.state.legendaryMaterials = this.state.legendaryMaterials.filter(
      id => id !== 'bindings_of_the_windseeker_left' && id !== 'bindings_of_the_windseeker_right'
    );

    // Equip Thunderfury
    member.equipment.weapon = thunderfury;
    member.gearScore = this.calculateGearScore(member.equipment);

    // If this is the player, also update playerEquipment and stats
    if (memberId === 'player') {
      this.state.playerEquipment.weapon = thunderfury;
      const stats = this.computePlayerStats();
      this.state.spellPower = stats.totalSpellPower;
      this.state.maxMana = stats.totalMaxMana;
      this.state.critChance = stats.totalCritChance;
    }

    this.addCombatLogEntry({
      message: `LEGENDARY CRAFTED! ${member.name} now wields Thunderfury, Blessed Blade of the Windseeker!`,
      type: 'system',
    });

    // Request cloud save after legendary crafting
    this.requestCloudSave();

    this.notify();
    return true;
  }

  // Admin: Add legendary material to inventory
  adminAddLegendaryMaterial(materialId: LegendaryMaterialId): void {
    if (!this.state.legendaryMaterials.includes(materialId)) {
      this.state.legendaryMaterials.push(materialId);
      const material = LEGENDARY_MATERIALS[materialId];
      this.addCombatLogEntry({
        message: `[Admin] Added ${material.name} to inventory`,
        type: 'system',
      });
    } else {
      this.addCombatLogEntry({
        message: `[Admin] Already have this material`,
        type: 'system',
      });
    }
    this.notify();
  }

  // Admin: Remove legendary material from inventory
  adminRemoveLegendaryMaterial(materialId: LegendaryMaterialId): void {
    if (this.state.legendaryMaterials.includes(materialId)) {
      this.state.legendaryMaterials = this.state.legendaryMaterials.filter(id => id !== materialId);
      const material = LEGENDARY_MATERIALS[materialId];
      this.addCombatLogEntry({
        message: `[Admin] Removed ${material.name} from inventory`,
        type: 'system',
      });
    }
    this.notify();
  }

  // =========================================================================
  // QUEST REWARD METHODS (Dragon Heads)
  // =========================================================================

  // Get all quest materials the player has in inventory
  getQuestMaterials(): { material: QuestMaterialId; count: number }[] {
    // Count how many of each quest material the player has
    const counts = new Map<QuestMaterialId, number>();
    for (const materialId of this.state.questMaterials) {
      counts.set(materialId, (counts.get(materialId) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([material, count]) => ({ material, count }));
  }

  // Check if player can claim a reward for this quest material (hasn't claimed before)
  canClaimQuestReward(questMaterialId: QuestMaterialId): boolean {
    // Check if player has claimed this specific quest type before
    return !this.state.claimedQuestRewards.includes(questMaterialId);
  }

  // Check if player has at least one of this quest material
  hasQuestMaterial(questMaterialId: QuestMaterialId): boolean {
    return this.state.questMaterials.includes(questMaterialId);
  }

  // Claim a quest reward for yourself
  claimQuestRewardForSelf(questMaterialId: QuestMaterialId, rewardId: QuestRewardId): boolean {
    // Validate player has the quest material
    if (!this.hasQuestMaterial(questMaterialId)) {
      this.addCombatLogEntry({ message: 'You do not have this quest item!', type: 'system' });
      this.notify();
      return false;
    }

    // Validate player hasn't already claimed this quest reward
    if (!this.canClaimQuestReward(questMaterialId)) {
      this.addCombatLogEntry({ message: 'You have already claimed a reward from this quest!', type: 'system' });
      this.notify();
      return false;
    }

    // Get the reward item
    const rewardItem = ALL_QUEST_REWARDS[rewardId];
    if (!rewardItem) {
      this.addCombatLogEntry({ message: 'Invalid reward selection!', type: 'system' });
      this.notify();
      return false;
    }

    // Remove one instance of the quest material
    const materialIndex = this.state.questMaterials.indexOf(questMaterialId);
    if (materialIndex !== -1) {
      this.state.questMaterials.splice(materialIndex, 1);
    }

    // Mark as claimed (can only claim once per character per quest type)
    this.state.claimedQuestRewards.push(questMaterialId);

    // Add the reward to player's bag
    this.state.playerBag.push(rewardItem);

    const questMaterial = QUEST_MATERIALS[questMaterialId];
    this.addCombatLogEntry({
      message: `QUEST COMPLETE! You turned in ${questMaterial.name} and received ${rewardItem.name}!`,
      type: 'system',
    });

    // Request cloud save after quest turn-in
    this.requestCloudSave();

    this.notify();
    return true;
  }

  // Assign a quest reward to a raid member (when you've already claimed for yourself)
  assignQuestRewardToRaidMember(questMaterialId: QuestMaterialId, rewardId: QuestRewardId, memberId: string): boolean {
    // Validate player has the quest material
    if (!this.hasQuestMaterial(questMaterialId)) {
      this.addCombatLogEntry({ message: 'You do not have this quest item!', type: 'system' });
      this.notify();
      return false;
    }

    // Cannot assign to self - they should use claimQuestRewardForSelf
    if (memberId === 'player') {
      if (this.canClaimQuestReward(questMaterialId)) {
        // Redirect to self-claim method
        return this.claimQuestRewardForSelf(questMaterialId, rewardId);
      } else {
        this.addCombatLogEntry({ message: 'You have already claimed your reward - assign to a raid member instead!', type: 'system' });
        this.notify();
        return false;
      }
    }

    // Check if this raid member has already received a reward from this quest type
    const memberRewards = this.state.raidMemberQuestRewards[memberId] || [];
    if (memberRewards.includes(questMaterialId)) {
      const member = this.state.raid.find(m => m.id === memberId);
      const memberName = member ? member.name : 'This raid member';
      this.addCombatLogEntry({
        message: `${memberName} has already received a reward from this quest!`,
        type: 'system',
      });
      this.notify();
      return false;
    }

    // Get the reward item
    const rewardItem = ALL_QUEST_REWARDS[rewardId];
    if (!rewardItem) {
      this.addCombatLogEntry({ message: 'Invalid reward selection!', type: 'system' });
      this.notify();
      return false;
    }

    // Find the raid member
    const member = this.state.raid.find(m => m.id === memberId);
    if (!member) {
      this.addCombatLogEntry({ message: 'Raid member not found!', type: 'system' });
      this.notify();
      return false;
    }

    // Check if class can equip
    if (!this.canEquip(member.class, rewardItem)) {
      this.addCombatLogEntry({
        message: `${member.name} cannot equip ${rewardItem.name}!`,
        type: 'system',
      });
      this.notify();
      return false;
    }

    // Remove one instance of the quest material
    const materialIndex = this.state.questMaterials.indexOf(questMaterialId);
    if (materialIndex !== -1) {
      this.state.questMaterials.splice(materialIndex, 1);
    }

    // Track that this raid member has received a reward from this quest type
    if (!this.state.raidMemberQuestRewards[memberId]) {
      this.state.raidMemberQuestRewards[memberId] = [];
    }
    this.state.raidMemberQuestRewards[memberId].push(questMaterialId);

    // Equip the item (only if it's an upgrade)
    const wasEquipped = this.equipItemOnMember(member, rewardItem);

    const questMaterial = QUEST_MATERIALS[questMaterialId];
    const upgradeNote = wasEquipped ? '' : ' (not equipped - current item is better)';
    this.addCombatLogEntry({
      message: `QUEST COMPLETE! ${member.name} received ${rewardItem.name} from ${questMaterial.name}!${upgradeNote}`,
      type: 'system',
    });

    // Request cloud save after quest turn-in
    this.requestCloudSave();

    this.notify();
    return true;
  }

  // Admin: Add quest material to inventory
  adminAddQuestMaterial(materialId: QuestMaterialId): void {
    this.state.questMaterials.push(materialId);
    const material = QUEST_MATERIALS[materialId];
    this.addCombatLogEntry({
      message: `[Admin] Added ${material.name} to inventory`,
      type: 'system',
    });
    this.notify();
  }

  // Admin: Remove quest material from inventory
  adminRemoveQuestMaterial(materialId: QuestMaterialId): void {
    const index = this.state.questMaterials.indexOf(materialId);
    if (index !== -1) {
      this.state.questMaterials.splice(index, 1);
      const material = QUEST_MATERIALS[materialId];
      this.addCombatLogEntry({
        message: `[Admin] Removed ${material.name} from inventory`,
        type: 'system',
      });
    }
    this.notify();
  }

  // Admin: Reset claimed quest rewards (for testing)
  adminResetClaimedQuestRewards(): void {
    this.state.claimedQuestRewards = [];
    this.state.raidMemberQuestRewards = {};
    this.addCombatLogEntry({
      message: `[Admin] Reset all claimed quest rewards (player and raid members)`,
      type: 'system',
    });
    this.notify();
  }

  // Check if a raid member can receive a quest reward (hasn't claimed one yet)
  canRaidMemberClaimQuestReward(memberId: string, questMaterialId: QuestMaterialId): boolean {
    const memberRewards = this.state.raidMemberQuestRewards[memberId] || [];
    return !memberRewards.includes(questMaterialId);
  }
}
