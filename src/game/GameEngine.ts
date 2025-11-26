import type { GameState, RaidMember, Spell, CombatLogEntry, WoWClass, Equipment, PlayerStats, ConsumableBuff, WorldBuff, Boss, DamageType, PartyAura, BuffEffect } from './types';
import { createEmptyEquipment } from './types';
import { PARTY_AURAS } from './auras';
import { DEBUFFS, ENCOUNTERS, TRAINING_ENCOUNTER } from './encounters';
import { DEFAULT_ACTION_BAR, BLESSING_OF_LIGHT_VALUES } from './spells';
import type { GearItem, WearableClass, EquipmentSlot, LegendaryMaterialId, LegendaryMaterial } from './items';
import { ALL_ITEMS, LEGENDARY_MATERIALS } from './items';
import { rollBossLoot, getBossDKPReward, calculateDKPCost } from './lootTables';
import { RAIDS, getRaidById, DEFAULT_RAID_ID } from './raids';

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
  mage: { min: 2800, max: 3500 },
  warlock: { min: 3200, max: 4000 },
  druid: { min: 3800, max: 4800 },
};

// AI Healer configuration - HPS per healer based on class
const AI_HEALER_HPS: Record<string, number> = {
  priest: 350,   // Strong raid healer
  paladin: 280,  // Good single target
  druid: 300,    // HoT based
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
    icon: 'https://wow.zamimg.com/images/wow/icons/large/spell_holy_prayerofhealing.jpg',
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
    effect: { staminaBonus: 30, manaRegenBonus: 10 }, // 300 HP = ~30 sta
    unlockBoss: 'nefarian',
    unlockRaid: 'Blackwing Lair',
    comingSoon: true,
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

export class GameEngine {
  private state: GameState;
  private intervalId: number | null = null;
  private damageTimers: Record<string, number> = {};
  private listeners: Set<() => void> = new Set();
  private actionBar: Spell[];
  private castTimeout: number | null = null;
  private aiHealerCooldowns: Record<string, number> = {};

  constructor() {
    this.actionBar = DEFAULT_ACTION_BAR.map(s => ({ ...s }));
    this.state = this.createInitialState();
    this.initializePaladinAuras();  // Set up default auras for all paladins
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
      combatLog: [],
      manaPotionCooldown: 0,
      divineFavorActive: false,
      otherHealersEnabled: true,
      otherHealersHealing: 0,
      // Loot and gear system
      playerEquipment: createEmptyEquipment(),
      playerDKP: { points: 50, earnedThisRaid: 0 },
      pendingLoot: [],
      showLootModal: false,
      inspectedMember: null,
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
      // Player bag for storing extra gear
      playerBag: [],
      // Five-Second Rule tracking
      lastSpellCastTime: -10, // Start with full regen (as if no spell cast in last 10 seconds)
      // Raid management and party auras
      raidManagementMode: false,
      paladinAuraAssignments: [],  // Will be initialized with default auras for each paladin
    };
  }

  private getPaladinCountForRaidSize(size: 20 | 40): number {
    return size === 40 ? 4 : 2;
  }

  private generateRaid(size: 20 | 40 = 20, playerName: string = 'Healadin'): RaidMember[] {
    const raid: RaidMember[] = [];
    const usedNames = new Set<string>();

    // Paladin count: 20-man = 2 (player + 1), 40-man = 4 (player + 3)
    // This determines how many blessings can be active
    const paladinCount = size === 40 ? 4 : 2;
    const otherPaladins = paladinCount - 1; // -1 because player is a paladin

    // Composition adjusted for paladin requirements
    const composition = size === 40
      ? { tanks: 4, healers: 9, dps: 26, paladins: otherPaladins }
      : { tanks: 2, healers: 4, dps: 13, paladins: otherPaladins };

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

    // Add player as first healer (paladin) - will be assigned group at end
    usedNames.add(playerName);
    raid.push({
      id: PLAYER_ID,
      name: playerName,
      class: 'paladin',
      role: 'healer',
      currentHealth: PLAYER_BASE_HEALTH,
      maxHealth: PLAYER_BASE_HEALTH,
      buffs: [],
      debuffs: [],
      isAlive: true,
      dps: 0,
      group: 1, // Will be reassigned
      equipment: createEmptyEquipment(),
      gearScore: 0,
    });

    // Tanks
    for (let i = 0; i < composition.tanks; i++) {
      const maxHealth = getRandomHealth('warrior', true);
      raid.push({
        id: `member_${id++}`,
        name: getRandomName('warrior'),
        class: 'warrior',
        role: 'tank',
        currentHealth: maxHealth,
        maxHealth,
        buffs: [],
        debuffs: [],
        isAlive: true,
        dps: 150,
        group: 1, // Will be reassigned
        equipment: createEmptyEquipment(),
        gearScore: 0,
      });
    }

    // Other Paladins (healers) - these provide additional blessings
    for (let i = 0; i < composition.paladins; i++) {
      const maxHealth = getRandomHealth('paladin', false);
      raid.push({
        id: `member_${id++}`,
        name: getRandomName('paladin'),
        class: 'paladin',
        role: 'healer',
        currentHealth: maxHealth,
        maxHealth,
        buffs: [],
        debuffs: [],
        isAlive: true,
        dps: 0,
        group: 1, // Will be reassigned
        equipment: createEmptyEquipment(),
        gearScore: 0,
      });
    }

    // Other Healers (priests, druids - no more paladins)
    const otherHealerClasses: WoWClass[] = ['priest', 'druid'];
    const remainingHealers = composition.healers - composition.paladins;
    for (let i = 0; i < remainingHealers; i++) {
      const wowClass = otherHealerClasses[i % otherHealerClasses.length];
      const maxHealth = getRandomHealth(wowClass, false);
      raid.push({
        id: `member_${id++}`,
        name: getRandomName(wowClass),
        class: wowClass,
        role: 'healer',
        currentHealth: maxHealth,
        maxHealth,
        buffs: [],
        debuffs: [],
        isAlive: true,
        dps: 0,
        group: 1, // Will be reassigned
        equipment: createEmptyEquipment(),
        gearScore: 0,
      });
    }

    // DPS - ensure we have mages, warlocks, druids for buffs
    const dpsClasses: WoWClass[] = ['mage', 'warlock', 'druid', 'rogue', 'hunter', 'warrior'];
    for (let i = 0; i < composition.dps; i++) {
      const wowClass = dpsClasses[i % dpsClasses.length];
      const maxHealth = getRandomHealth(wowClass, false);
      raid.push({
        id: `member_${id++}`,
        name: getRandomName(wowClass),
        class: wowClass,
        role: 'dps',
        currentHealth: maxHealth,
        maxHealth,
        buffs: [],
        debuffs: [],
        isAlive: true,
        dps: 400 + Math.floor(Math.random() * 200),
        group: 1, // Will be reassigned
        equipment: createEmptyEquipment(),
        gearScore: 0,
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

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  private addCombatLogEntry(entry: Omit<CombatLogEntry, 'timestamp'>) {
    this.state.combatLog = [
      { ...entry, timestamp: Date.now() },
      ...this.state.combatLog.slice(0, 99),
    ];
  }

  selectTarget(id: string) {
    this.state.selectedTargetId = id;
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

    // Reset action bar cooldowns
    this.actionBar.forEach(spell => {
      spell.currentCooldown = 0;
    });

    this.addCombatLogEntry({ message: `${encounter.name} engaged!`, type: 'system' });
    this.startGameLoop();
    this.notify();
  }

  stopEncounter() {
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

  // Reset raid lockout - clears defeated bosses for current raid, allowing player to start fresh
  resetRaidLockout() {
    // Reset per-raid defeated bosses for current raid
    const currentRaidId = this.state.selectedRaidId;
    this.state.defeatedBossesByRaid[currentRaidId] = [];

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

    const raid = this.getCurrentRaid();
    const raidName = raid?.name || 'Raid';
    this.addCombatLogEntry({ message: `${raidName} lockout reset! All bosses are available again.`, type: 'system' });
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

    // Need a target for most spells
    if (!this.state.selectedTargetId && spell.id !== 'divine_favor') {
      this.addCombatLogEntry({ message: 'No target selected!', type: 'system' });
      this.notify();
      return;
    }

    const target = this.state.raid.find(m => m.id === this.state.selectedTargetId);
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
        d => d.type === 'magic' || d.type === 'poison' || d.type === 'disease'
      );

      if (!dispellable) {
        this.addCombatLogEntry({ message: 'Nothing to dispel!', type: 'system' });
        this.notify();
        return;
      }

      this.state.playerMana -= spell.manaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime; // FSR tracking
      this.state.globalCooldown = GCD_DURATION;
      target.debuffs = target.debuffs.filter(d => d.id !== dispellable.id);
      this.addCombatLogEntry({ message: `Cleansed ${dispellable.name} from ${target.name}`, type: 'buff' });
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

      target.currentHealth = target.maxHealth;
      this.state.playerMana = 0; // Drains all mana
      this.state.lastSpellCastTime = this.state.elapsedTime; // FSR tracking
      this.state.globalCooldown = GCD_DURATION;
      this.state.healingDone += actualHeal;
      this.state.overhealing += overheal;

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

    // Cast time spells (Holy Light, Flash of Light)
    if (spell.castTime > 0) {
      if (!target.isAlive) {
        this.addCombatLogEntry({ message: 'Cannot heal dead target!', type: 'system' });
        this.notify();
        return;
      }

      // Don't deduct mana yet - wait until cast completes
      this.state.isCasting = true;
      this.state.castingSpell = spell;
      this.state.castProgress = 0;

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

          const currentTarget = this.state.raid.find(m => m.id === this.state.selectedTargetId);
          if (currentTarget && currentTarget.isAlive) {
            this.applyHeal(currentTarget, spell);
          }

          this.state.isCasting = false;
          this.state.castingSpell = null;
          this.state.castProgress = 0;
          this.state.globalCooldown = GCD_DURATION;

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

    target.currentHealth = Math.min(target.maxHealth, target.currentHealth + totalHeal);
    this.state.healingDone += actualHeal;
    this.state.overhealing += overheal;

    this.addCombatLogEntry({
      message: `${spell.name} ${isCrit ? 'CRITS ' : 'heals '}${target.name} for ${actualHeal}${overheal > 0 ? ` (${overheal} overheal)` : ''}`,
      type: 'heal',
      amount: actualHeal,
      isCrit,
    });
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

    // Check paladin auras (raid-wide)
    this.state.paladinAuraAssignments.forEach(assignment => {
      if (!assignment.auraId) return;
      const paladin = this.state.raid.find(m => m.id === assignment.paladinId);
      if (!paladin?.isAlive) return;

      const aura = PARTY_AURAS[assignment.auraId];
      if (aura) {
        activeAuras.push(aura);
      }
    });

    return activeAuras;
  }

  // Recalculate and apply all party aura buffs
  public recalculateAuras() {
    // Clear existing aura buffs
    this.state.raid.forEach(m => {
      m.buffs = m.buffs.filter(b => !b.id.startsWith('aura_'));
    });

    // Apply automatic party auras
    Object.values(PARTY_AURAS).forEach(aura => {
      if (!aura.isAutomatic) return;

      // Find providers of this aura
      const providers = this.state.raid.filter(m =>
        m.isAlive && m.class === aura.providerClass
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

    // Apply paladin auras (manual selection, raid-wide)
    this.state.paladinAuraAssignments.forEach(assignment => {
      if (!assignment.auraId) return;
      const paladin = this.state.raid.find(m => m.id === assignment.paladinId);
      if (!paladin?.isAlive) return;

      const aura = PARTY_AURAS[assignment.auraId];
      if (!aura) return;

      // Paladin auras are raid-wide
      this.state.raid.forEach(target => {
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
                  tank.isAlive = false;
                  this.addCombatLogEntry({ message: `${tank.name} has died!`, type: 'damage' });
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
                  member.isAlive = false;
                  this.addCombatLogEntry({ message: `${member.name} has died!`, type: 'damage' });
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
                  target.isAlive = false;
                  this.addCombatLogEntry({ message: `${target.name} has died!`, type: 'damage' });
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
                member.isAlive = false;
                this.addCombatLogEntry({ message: `${member.name} has died!`, type: 'damage' });
              }
            }
            return { ...debuff, duration: debuff.duration - delta };
          })
          .filter(d => d.duration > 0);

        // Update buff durations
        member.buffs = member.buffs
          .map(b => ({ ...b, duration: b.duration - delta }))
          .filter(b => b.duration > 0);
      });

      // AI Healers - other healers in the raid automatically heal
      if (this.state.otherHealersEnabled) {
        const aiHealers = this.state.raid.filter(
          m => m.role === 'healer' && m.isAlive
        );

        aiHealers.forEach(healer => {
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
            const baseHps = AI_HEALER_HPS[healer.class] || 300;
            // Gear scaling: each gear score point adds 0.5 HPS
            const gearBonus = healer.gearScore * 0.5;
            const hps = baseHps + gearBonus;

            // Heal amount varies (simulating different spell choices)
            const baseHeal = hps * (1.5 + Math.random() * 1.5); // 1.5-3s worth of HPS
            const isCrit = Math.random() < 0.12; // ~12% crit chance
            const healAmount = Math.floor(isCrit ? baseHeal * 1.5 : baseHeal);

            const actualHeal = Math.min(healAmount, target.maxHealth - target.currentHealth);
            target.currentHealth = Math.min(target.maxHealth, target.currentHealth + healAmount);
            this.state.otherHealersHealing += actualHeal;

            // Set cooldown (1.5-2.5s cast time simulation)
            this.aiHealerCooldowns[healer.id] = 1.5 + Math.random();
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
            }
          });

          return sum + m.dps + gearDpsBonus + buffDpsBonus;
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

    // Roll loot from boss table with bad luck protection
    const { items: loot, hadPaladinLoot, legendaryMaterial } = rollBossLoot(bossId, this.state.bossKillsWithoutPaladinLoot);

    // Update bad luck counter
    if (hadPaladinLoot) {
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
    }

    this.notify();
  }

  // Check if a class can equip an item (public for admin panel)
  canEquip(wowClass: WoWClass, item: GearItem): boolean {
    return item.classes.includes('all') || item.classes.includes(wowClass as WearableClass);
  }

  // Compute player stats from equipment
  computePlayerStats(): PlayerStats {
    let spellPower = 0;
    let mana = 0;
    let crit = 5; // Base 5% crit
    let mp5 = 0;

    Object.values(this.state.playerEquipment).forEach(item => {
      if (item) {
        spellPower += (item.stats.spellPower || 0) + (item.stats.healingPower || 0);
        mana += (item.stats.mana || 0) + (item.stats.intellect || 0) * 15;
        crit += item.stats.critChance || 0;
        mp5 += item.stats.mp5 || 0;
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
    if (!this.canEquip('paladin', item)) {
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
    if (!this.canEquip('paladin', item)) {
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

  // Equip an item on a raid member
  private equipItemOnMember(member: RaidMember, item: GearItem) {
    const slot = item.slot;
    member.equipment[slot] = item;
    member.gearScore = this.calculateGearScore(member.equipment);
  }

  // Player claims loot with DKP
  claimLoot(itemId: string) {
    const itemIndex = this.state.pendingLoot.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = this.state.pendingLoot[itemIndex];
    const cost = calculateDKPCost(item);

    // Check if player can equip
    if (!this.canEquip('paladin', item)) {
      this.addCombatLogEntry({ message: `Cannot equip ${item.name} (wrong class)`, type: 'system' });
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

  // Player passes on loot - AI claims it
  passLoot(itemId: string) {
    const itemIndex = this.state.pendingLoot.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = this.state.pendingLoot[itemIndex];

    // Find eligible raid members who can use this item
    const eligibleMembers = this.state.raid.filter(m =>
      m.isAlive &&
      this.canEquip(m.class, item) &&
      // Prefer members who don't have this slot filled yet, or have lower ilvl item
      (!m.equipment[item.slot] || m.equipment[item.slot]!.itemLevel < item.itemLevel)
    );

    if (eligibleMembers.length > 0) {
      // Random winner from eligible members
      const winner = eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];
      this.equipItemOnMember(winner, item);
      this.addCombatLogEntry({ message: `${winner.name} receives ${item.name}`, type: 'system' });
    } else {
      this.addCombatLogEntry({ message: `${item.name} - no eligible raiders, item is disenchanted`, type: 'system' });
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
    this.notify();
  }

  // Get DKP cost for an item
  getItemDKPCost(item: GearItem): number {
    return calculateDKPCost(item);
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
      version: 5, // Bumped for player bag support
      timestamp: Date.now(),
      player: {
        name: this.state.playerName,
        equipment: this.state.playerEquipment,
        dkp: this.state.playerDKP.points,
        bag: this.state.playerBag, // v5: Player bag inventory
      },
      // Save full raid member data to preserve names across loads
      raidMembers: this.state.raid.map(m => ({
        id: m.id,
        name: m.name,
        class: m.class,
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
      unlockedWorldBuffs: this.state.unlockedWorldBuffs, // Persist world buff unlocks
      bossKillsWithoutPaladinLoot: this.state.bossKillsWithoutPaladinLoot, // Bad luck protection
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

      // Version 2+ saves include full raid member data - restore exact names and stats
      if (data.version >= 2 && data.raidMembers) {
        // Rebuild raid from saved data to preserve exact names
        this.state.raid = data.raidMembers.map((saved: {
          id: string;
          name: string;
          class: WoWClass;
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
          role: saved.role,
          currentHealth: saved.maxHealth,
          maxHealth: saved.maxHealth,
          buffs: [],
          debuffs: [],
          isAlive: true,
          dps: saved.dps,
          group: saved.group,
          equipment: saved.equipment || createEmptyEquipment(),
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

  // Export all saves to a JSON file for backup
  exportSavesToFile(customFileName?: string) {
    const saves: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('mc_healer_save_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            saves[key] = JSON.parse(raw);
          } catch {
            saves[key] = raw;
          }
        }
      }
    }

    const exportData = {
      exportVersion: 1,
      exportDate: new Date().toISOString(),
      saves,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Use custom filename if provided, otherwise use default with date
    const fileName = customFileName?.trim()
      ? `${customFileName.trim().replace(/\.json$/i, '')}.json`
      : `wow-healer-saves-${new Date().toISOString().split('T')[0]}.json`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.addCombatLogEntry({ message: `Exported ${Object.keys(saves).length} save(s) to file`, type: 'system' });
    this.notify();
  }

  // Import saves from a JSON file
  importSavesFromFile(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);

          if (!data.saves || typeof data.saves !== 'object') {
            reject(new Error('Invalid save file format'));
            return;
          }

          let importedCount = 0;
          for (const [key, value] of Object.entries(data.saves)) {
            if (key.startsWith('mc_healer_save_')) {
              localStorage.setItem(key, JSON.stringify(value));
              importedCount++;
            }
          }

          this.addCombatLogEntry({ message: `Imported ${importedCount} save(s) from file`, type: 'system' });
          this.notify();
          resolve(importedCount);
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

  // Apply all available buffs from raid members (respects paladin blessing slots)
  applyAllRaidBuffs() {
    const raidClasses = new Set(this.state.raid.filter(m => m.id !== PLAYER_ID && m.isAlive).map(m => m.class));

    Object.values(RAID_BUFFS).forEach(buffDef => {
      const isPaladinBlessing = 'isPaladinBlessing' in buffDef && buffDef.isPaladinBlessing;

      // Skip paladin blessings that aren't in the active list
      if (isPaladinBlessing && !this.state.activePaladinBlessings.includes(buffDef.id)) {
        return;
      }

      // Apply if caster class is available (or it's a world buff)
      if (!buffDef.casterClass || raidClasses.has(buffDef.casterClass)) {
        this.applyRaidBuff(buffDef.id);
      }
    });
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

    const slot = item.slot;
    const oldItem = member.equipment[slot];
    member.equipment[slot] = item;
    member.gearScore = this.calculateGearScore(member.equipment);

    // If this is the player, also update playerEquipment and stats
    if (memberId === PLAYER_ID) {
      this.state.playerEquipment[slot] = item;
      const stats = this.computePlayerStats();
      this.state.spellPower = stats.totalSpellPower;
      this.state.maxMana = stats.totalMaxMana;
      this.state.critChance = stats.totalCritChance;
    }

    this.addCombatLogEntry({
      message: `[Admin] Equipped ${item.name} on ${member.name}${oldItem ? ` (replaced ${oldItem.name})` : ''}`,
      type: 'system',
    });
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

    // Create new member
    const newMember: RaidMember = {
      id: newId,
      name: sanitizedName,
      class: wowClass,
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

  // Check if player can craft Thunderfury (has both bindings + killed Firemaw)
  canCraftThunderfury(): boolean {
    const hasLeftBinding = this.state.legendaryMaterials.includes('bindings_of_the_windseeker_left');
    const hasRightBinding = this.state.legendaryMaterials.includes('bindings_of_the_windseeker_right');
    const hasKilledFiremaw = this.state.defeatedBosses.includes('firemaw');
    return hasLeftBinding && hasRightBinding && hasKilledFiremaw;
  }

  // Check if player has the materials for Thunderfury but needs Firemaw
  hasThunderfuryMaterialsButNeedsFiremaw(): boolean {
    const hasLeftBinding = this.state.legendaryMaterials.includes('bindings_of_the_windseeker_left');
    const hasRightBinding = this.state.legendaryMaterials.includes('bindings_of_the_windseeker_right');
    const hasKilledFiremaw = this.state.defeatedBosses.includes('firemaw');
    return hasLeftBinding && hasRightBinding && !hasKilledFiremaw;
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
    this.notify();
    return true;
  }

  // Craft Thunderfury and equip on a raid member (requires Prince Thunderaan kill simulation)
  craftThunderfury(memberId: string): boolean {
    if (!this.canCraftThunderfury()) {
      if (this.hasThunderfuryMaterialsButNeedsFiremaw()) {
        this.addCombatLogEntry({
          message: 'Cannot craft Thunderfury - must defeat Firemaw in Blackwing Lair first!',
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
}
