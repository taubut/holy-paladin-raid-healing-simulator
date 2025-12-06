import type { GameState, RaidMember, Spell, CombatLogEntry, WoWClass, WoWSpec, Equipment, PlayerStats, ConsumableBuff, WorldBuff, Boss, DamageType, PartyAura, BuffEffect, Faction, PlayerHealerClass, PositionZone, Totem, TotemElement, LootBid, LootResult, Debuff, BenchPlayer, ActiveHoT } from './types';
import { createEmptyEquipment, CLASS_SPECS } from './types';
// Shaman imports for action bar switching and totems
import { DEFAULT_SHAMAN_ACTION_BAR, HEALING_WAVE, HEALING_WAVE_DOWNRANK, LESSER_HEALING_WAVE, LESSER_HEALING_WAVE_DOWNRANK, CHAIN_HEAL, CHAIN_HEAL_DOWNRANK } from './shamanSpells';
import { PRIEST_SPELLS, DEFAULT_PRIEST_ACTION_BAR, type HoTSpell as PriestHoTSpell } from './priestSpells';
import { DRUID_SPELLS, DEFAULT_DRUID_ACTION_BAR, type HoTSpell as DruidHoTSpell } from './druidSpells';
import { getTotemById, TOTEMS_BY_ELEMENT } from './totems';
import { PARTY_AURAS, memberProvidesAura } from './auras';
import { DEBUFFS, ENCOUNTERS, TRAINING_ENCOUNTER } from './encounters';
import { DEFAULT_ACTION_BAR, BLESSING_OF_LIGHT_VALUES, HOLY_LIGHT, HOLY_LIGHT_DOWNRANK, FLASH_OF_LIGHT, FLASH_OF_LIGHT_DOWNRANK } from './spells';
import type { GearItem, WearableClass, EquipmentSlot, LegendaryMaterialId, LegendaryMaterial, QuestMaterialId, QuestRewardId, EnchantId, EnchantSlot } from './items';
import { ALL_ITEMS, LEGENDARY_MATERIALS, QUEST_MATERIALS, ALL_QUEST_REWARDS, ENCHANTS, CLASS_ARMOR_PROFICIENCY } from './items';
import { rollBossLoot, getBossDKPReward, calculateDKPCost, canSpecBenefitFrom } from './lootTables';
import { RAIDS, getRaidById, DEFAULT_RAID_ID } from './raids';
import { getPreRaidBisForSpec } from './preRaidBisSets';
import posthog from 'posthog-js';

const GCD_DURATION = 1.5;
const MANA_POTION_COOLDOWN = 120;
const MANA_POTION_RESTORE = 2000;

// Classic WoW style names - extensive lists to avoid duplicates
const CLASS_NAMES: Record<WoWClass, string[]> = {
  warrior: [
    'Thunderfury', 'Shieldwall', 'Ironfoe', 'Grommash', 'Lothar', 'Saurfang', 'Nazgrel', 'Broxigar',
    'Varok', 'Garrosh', 'Durotan', 'Orgrim', 'Blackhand', 'Kilrogg', 'Kargath', 'Eitrigg', 'Thoras',
    'Trollbane', 'Danath', 'Kurdran', 'Muradin', 'Magni', 'Falstad', 'Gelbin', 'Varian', 'Llane',
    'Anduin', 'Bolvar', 'Alexandros', 'Renault', 'Taelan', 'Tirion', 'Maxwell', 'Abbendis', 'Dathrohan',
    'Isillien', 'Herod', 'Mograine', 'Ravencrest', 'Jarod', 'Shandris', 'Huln', 'Maiev', 'Naisha',
    'Akama', 'Khadgar', 'Cairne', 'Baine', 'Rokhan', 'Nazgrim', 'Malkorok', 'Zaela', 'Thura'
  ],
  paladin: [
    'Uther', 'Tirion', 'Bolvar', 'Turalyon', 'Mograine', 'Fordring', 'Lightbringer', 'Ashbringer',
    'Fairbanks', 'Abbendis', 'Dathrohan', 'Isillien', 'Valdelmar', 'Halford', 'Eligor', 'Taelan',
    'Maxwell', 'Mardenholde', 'Gavinrad', 'Saidan', 'Ballador', 'Maraad', 'Vindicator', 'Yrel',
    'Nobundo', 'Arator', 'Liadrin', 'Galvarad', 'Harthal', 'Aurius', 'Raleigh', 'Davil', 'Corder',
    'Pureheart', 'Trueheart', 'Greyson', 'Milton', 'Duthorian', 'Katherine', 'Dawnbringer', 'Sunwalker',
    'Dezco', 'Aponi', 'Sunstrider', 'Lorthemar', 'Rommath', 'Halduron', 'Brightwing', 'Silvermoon'
  ],
  hunter: [
    'Rexxar', 'Alleria', 'Hemet', 'Nathanos', 'Sylvanas', 'Vereesa', 'Shandris', 'Halduron',
    'Humar', 'Brokentoe', 'Nesingwary', 'Ajeck', 'Barnil', 'Sergra', 'Jorn', 'Mahren', 'Tethik',
    'Swiftarrow', 'Tracker', 'Pathfinder', 'Windrunner', 'Farstrider', 'Wildmane', 'Deadeye',
    'Quickshot', 'Eagleye', 'Hawkeye', 'Sniper', 'Stalker', 'Trapper', 'Beastmaster', 'Surviver',
    'Skullsplitter', 'Bloodhawk', 'Shadowhunter', 'Darkspear', 'Zulian', 'Vilebranch', 'Sharpbeak',
    'Swiftwind', 'Stormpike', 'Frostwolf', 'Thunderlord', 'Warsong', 'Bleedinghallow', 'Bonechewer',
    'Dragonmaw', 'Blackrock', 'Shadowmoon', 'Twilight', 'Stormreaver', 'Laughingskull'
  ],
  rogue: [
    'Garona', 'Mathias', 'Valeera', 'Edwin', 'Ravenholdt', 'Vanessa', 'Jorach', 'Tethys', 'Fleet',
    'Fahrad', 'Elling', 'Renzik', 'Anara', 'Lilian', 'Voss', 'Taoshi', 'Shokia', 'Kiryn', 'Suna',
    'Shadowblade', 'Nightslayer', 'Bloodfang', 'Deathmantle', 'Slayer', 'Netherblade', 'Bonescythe',
    'Shadowstep', 'Ambush', 'Eviscerate', 'Backstab', 'Sap', 'Pickpocket', 'Stealth', 'Vanish',
    'Shiv', 'Gouge', 'Sinister', 'Deadly', 'Mutilate', 'Envenom', 'Rupture', 'Garrote', 'Cheap',
    'Kidney', 'Blind', 'Sprint', 'Evasion', 'Blade', 'Flurry', 'Thistle', 'Defias', 'Syndicate'
  ],
  priest: [
    'Benedictus', 'Moira', 'Anduin', 'Velen', 'Whitemane', 'Tyrande', 'Alonsus', 'Faol', 'Calia',
    'Menethil', 'Natalie', 'Seline', 'Zabra', 'Hexx', 'Rohan', 'Talanji', 'Zolani', 'Zul',
    'Shadowmend', 'Holyfire', 'Lightwell', 'Renew', 'Serenity', 'Sanctuary', 'Prayer', 'Penance',
    'Absolution', 'Discipline', 'Devout', 'Vestment', 'Transcendence', 'Avatar', 'Confessor',
    'Inquisitor', 'Bishop', 'Archbishop', 'Cardinal', 'Pontiff', 'Oracle', 'Prophet', 'Seer',
    'Confessor', 'Absolver', 'Penitent', 'Faithful', 'Devoted', 'Pious', 'Sacred', 'Divine', 'Holy'
  ],
  shaman: [
    'Thrall', 'Drektar', 'Nobundo', 'Rehgar', 'Zuljin', 'Zuni', 'Kazragore', 'Geyah', 'Aggra',
    'Muln', 'Earthfury', 'Stormrage', 'Skybreaker', 'Thunderhorn', 'Farseer', 'Spiritwalker',
    'Elementspeaker', 'Windseeker', 'Firelord', 'Wavecaller', 'Earthbinder', 'Totemmaster',
    'Chainhealer', 'Stormcaller', 'Lavaburst', 'Earthshock', 'Windfury', 'Flametongue', 'Frostbrand',
    'Rockbiter', 'Thunderstorm', 'Maelstrom', 'Shamanistic', 'Ancestral', 'Spirit', 'Elemental',
    'Enhancement', 'Restoration', 'Totemic', 'Primal', 'Tribal', 'Warchief', 'Overlord', 'Chieftain',
    'Spiritbinder', 'Soulwalker', 'Ghostwolf', 'Hexmaster', 'Voodoo', 'Thex', 'Witchdoctor'
  ],
  mage: [
    'Jaina', 'Khadgar', 'Antonidas', 'Rhonin', 'Medivh', 'Aegwynn', 'Nielas', 'Modgud', 'Azshara',
    'Kelthuzad', 'Arugal', 'Thalnos', 'Atiesh', 'Aran', 'Millhouse', 'Kalec', 'Vargoth', 'Modera',
    'Frostfire', 'Arcane', 'Netherwind', 'Manaweave', 'Spellfire', 'Sorcerer', 'Arcanist', 'Magister',
    'Conjurer', 'Invoker', 'Warmage', 'Battlemage', 'Archmage', 'Highborne', 'Sunreaver', 'Kirin',
    'Dalaran', 'Silvermoon', 'Queldorei', 'Sindorei', 'Shendralar', 'Illidari', 'Nightborne',
    'Frostbolt', 'Fireball', 'Pyroblast', 'Blizzard', 'Flamestrike', 'Polymorph', 'Blink', 'Evocation'
  ],
  warlock: [
    'Guldan', 'Wilfred', 'Kanrethad', 'Helcular', 'Dreadmist', 'Nerzhul', 'Teron', 'Gorefiend',
    'Chogall', 'Darkness', 'Shadow', 'Void', 'Fel', 'Demonic', 'Infernal', 'Doomguard', 'Darkweaver',
    'Felhunter', 'Succubus', 'Voidwalker', 'Imp', 'Demonology', 'Affliction', 'Destruction', 'Bane',
    'Curse', 'Corruption', 'Agony', 'Doom', 'Haunt', 'Unstable', 'Drain', 'Siphon', 'Hellfire',
    'Soulstone', 'Healthstone', 'Soulwell', 'Demonologist', 'Summoner', 'Shadowcaster', 'Necrolyte',
    'Cultist', 'Acolyte', 'Twilight', 'Burning', 'Council', 'Cabal', 'Coven', 'Shadowflame', 'Nether'
  ],
  druid: [
    'Malfurion', 'Hamuul', 'Cenarius', 'Staghelm', 'Remulos', 'Tyrande', 'Illidan', 'Broll', 'Bearmantle',
    'Fandral', 'Naralex', 'Keeper', 'Archdruid', 'Dreamweaver', 'Moonglade', 'Cenarion', 'Dreamgrove',
    'Moonkin', 'Treant', 'Wildkin', 'Nightsaber', 'Stormcrow', 'Seaform', 'Treebark', 'Lifebloom',
    'Regrowth', 'Rejuvenation', 'Swiftmend', 'Wild', 'Nature', 'Starfall', 'Moonfire', 'Sunfire',
    'Wrath', 'Starfire', 'Hurricane', 'Typhoon', 'Entangle', 'Thorns', 'Barkskin', 'Tranquility',
    'Innervate', 'Rebirth', 'Dreamwalk', 'Moonshadow', 'Starweaver', 'Nightwing', 'Dawnfeather'
  ],
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

// AI Healer Spell Selection - Returns the appropriate spell based on target health and healer mana
interface AISpellChoice {
  spell: Spell;
  spellName: string;  // For combat log display
  useNaturesSwiftness?: boolean;  // Druid: pre-cast NS for instant HT
  consumeHoT?: boolean;           // Druid: Swiftmend consumes HoT
  applyShield?: boolean;          // Priest: Power Word: Shield (absorb shield)
  useInnerFocus?: boolean;        // Priest: pre-cast Inner Focus for free spell + 25% crit
}

// Context for druid-specific spell selection
interface DruidSpellContext {
  healerId: string;
  targetHoTs: ActiveHoT[];  // Active HoTs on target
  naturesSwiftnessCooldown: number;
  swiftmendCooldown: number;
}

// Context for priest-specific spell selection
interface PriestSpellContext {
  healerId: string;
  targetHoTs: ActiveHoT[];  // Active HoTs on target (for Renew)
  injuredInGroup: number;   // Number of injured members in same group (for Prayer of Healing)
  targetHasWeakenedSoul: boolean;  // Whether target has Weakened Soul (can't receive PW:S)
  targetHasShield: boolean;  // Whether target already has an absorb shield
  innerFocusCooldown: number;  // Inner Focus cooldown (180s / 3 min)
}

// Select spell for AI healer based on target health % and healer mana %
function selectAIHealerSpell(
  healerClass: WoWClass,
  targetHealthPct: number,
  healerManaPct: number,
  injuredCount: number,  // For Chain Heal decision
  druidContext?: DruidSpellContext,  // Optional context for druid special abilities
  priestContext?: PriestSpellContext  // Optional context for priest special abilities
): AISpellChoice | null {
  // Mana conservation: if below 30% mana, prefer efficient downranked spells
  const lowMana = healerManaPct < 0.30;

  switch (healerClass) {
    case 'priest': {
      // Holy Priest healing rotation based on Classic WoW guides:
      // - Heal R3 for low damage periods (most mana efficient: 255 mana, 566-643)
      // - Flash Heal R7 for urgent moderate damage (380 mana, 812-959)
      // - Greater Heal R5 for emergencies (710 mana, 1966-2195)
      // - Renew for mobile healing or topping off
      // - Prayer of Healing when 3+ group members injured
      // - Power Word: Shield for imminent danger
      // - Inner Focus: 3 min CD, next spell free + 25% crit (use with expensive spells)

      // Check if target already has THIS priest's Renew (waste prevention)
      const hasOwnRenew = priestContext?.targetHoTs.some(
        h => h.spellId === 'renew' && h.casterId === priestContext.healerId
      );
      // Check for group heal opportunity (3+ injured in same group)
      const groupHealOpportunity = priestContext && priestContext.injuredInGroup >= 3;
      // Check if target can receive Power Word: Shield
      const canReceiveShield = priestContext && !priestContext.targetHasWeakenedSoul && !priestContext.targetHasShield;
      // Critical mana (<15%) - use only most efficient spells
      const criticalMana = healerManaPct < 0.15;
      // Inner Focus available (3 min cooldown)
      const innerFocusReady = priestContext ? priestContext.innerFocusCooldown <= 0 : false;

      if (targetHealthPct < 0.35) {
        // Emergency - use Power Word: Shield first if target can receive it (instant absorb)
        // PW:S gives immediate protection while priest casts follow-up heal
        if (canReceiveShield) {
          return { spell: PRIEST_SPELLS.POWER_WORD_SHIELD, spellName: 'Power Word: Shield', applyShield: true };
        }
        // Inner Focus + Greater Heal R5 = free big heal with 25% crit bonus
        if (innerFocusReady && !criticalMana) {
          return { spell: PRIEST_SPELLS.GREATER_HEAL, spellName: 'Greater Heal', useInnerFocus: true };
        }
        // Use Greater Heal (or R1 spam if mana critical)
        if (criticalMana) {
          return { spell: PRIEST_SPELLS.GREATER_HEAL_RANK1, spellName: 'Greater Heal (Rank 1)' };
        }
        return lowMana
          ? { spell: PRIEST_SPELLS.GREATER_HEAL_DOWNRANK, spellName: 'Greater Heal (Rank 3)' }
          : { spell: PRIEST_SPELLS.GREATER_HEAL, spellName: 'Greater Heal' };
      } else if (targetHealthPct < 0.55) {
        // Moderate damage - consider Prayer of Healing if multiple injured
        if (groupHealOpportunity) {
          // Inner Focus + Prayer of Healing = free expensive AoE heal with crit bonus
          if (innerFocusReady) {
            return { spell: PRIEST_SPELLS.PRAYER_OF_HEALING, spellName: 'Prayer of Healing', useInnerFocus: true };
          }
          if (!lowMana) {
            return { spell: PRIEST_SPELLS.PRAYER_OF_HEALING, spellName: 'Prayer of Healing' };
          }
        }
        // Use Flash Heal for urgent damage, or downrank if low mana
        if (criticalMana) {
          return { spell: PRIEST_SPELLS.FLASH_HEAL_DOWNRANK, spellName: 'Flash Heal (Rank 4)' };
        }
        return lowMana
          ? { spell: PRIEST_SPELLS.FLASH_HEAL_DOWNRANK, spellName: 'Flash Heal (Rank 4)' }
          : { spell: PRIEST_SPELLS.FLASH_HEAL, spellName: 'Flash Heal' };
      } else if (targetHealthPct < 0.75) {
        // Light damage - use Renew if not already applied, else use efficient Heal R3
        if (!hasOwnRenew) {
          return { spell: PRIEST_SPELLS.RENEW, spellName: 'Renew' };
        }
        // Use Heal R3 - most mana efficient spell for non-urgent healing
        return { spell: PRIEST_SPELLS.HEAL, spellName: 'Heal' };
      } else {
        // Top-off (75%+) - use Renew HoT if not already applied
        if (!hasOwnRenew) {
          return { spell: PRIEST_SPELLS.RENEW, spellName: 'Renew' };
        }
        // Target already has our Renew - use efficient Heal R3 (255 mana)
        return { spell: PRIEST_SPELLS.HEAL, spellName: 'Heal' };
      }
    }

    case 'paladin':
      if (targetHealthPct < 0.35) {
        // Emergency - use Holy Light max rank
        return { spell: HOLY_LIGHT, spellName: 'Holy Light' };
      } else if (targetHealthPct < 0.60) {
        // Normal - use Flash of Light (or downrank if low mana)
        return lowMana
          ? { spell: FLASH_OF_LIGHT_DOWNRANK, spellName: 'Flash of Light (Rank 4)' }
          : { spell: FLASH_OF_LIGHT, spellName: 'Flash of Light' };
      } else {
        // Top-off - efficient Flash of Light downrank
        return { spell: FLASH_OF_LIGHT_DOWNRANK, spellName: 'Flash of Light (Rank 4)' };
      }

    case 'shaman':
      // Shaman AI: use Chain Heal when multiple targets are injured, otherwise single target
      if (injuredCount >= 3 && targetHealthPct < 0.70) {
        // Multiple injured - Chain Heal is very efficient
        return lowMana
          ? { spell: CHAIN_HEAL_DOWNRANK, spellName: 'Chain Heal (Rank 1)' }
          : { spell: CHAIN_HEAL, spellName: 'Chain Heal' };
      } else if (targetHealthPct < 0.35) {
        // Emergency single target - Healing Wave
        return { spell: HEALING_WAVE, spellName: 'Healing Wave' };
      } else if (targetHealthPct < 0.60) {
        // Normal - Lesser Healing Wave for speed
        return lowMana
          ? { spell: LESSER_HEALING_WAVE_DOWNRANK, spellName: 'Lesser Healing Wave (Rank 4)' }
          : { spell: LESSER_HEALING_WAVE, spellName: 'Lesser Healing Wave' };
      } else {
        // Top-off - efficient downranked heal
        return { spell: LESSER_HEALING_WAVE_DOWNRANK, spellName: 'Lesser Healing Wave (Rank 4)' };
      }

    case 'druid':
      // Check if target already has THIS druid's Rejuvenation (waste prevention)
      const hasOwnRejuv = druidContext?.targetHoTs.some(
        h => h.spellId === 'rejuvenation' && h.casterId === druidContext.healerId
      );
      // Check if target has ANY HoT from THIS druid (for Swiftmend)
      const hasOwnHoT = druidContext?.targetHoTs.some(
        h => (h.spellId === 'rejuvenation' || h.spellId === 'rejuvenation_downrank' || h.spellId === 'regrowth')
             && h.casterId === druidContext.healerId
      );
      const nsOffCooldown = druidContext ? druidContext.naturesSwiftnessCooldown <= 0 : false;
      const swiftmendOffCooldown = druidContext ? druidContext.swiftmendCooldown <= 0 : false;

      if (targetHealthPct < 0.35) {
        // Emergency healing - tank or critical target
        // Option 1: Nature's Swiftness + Healing Touch (instant big heal)
        if (nsOffCooldown) {
          return { spell: DRUID_SPELLS.HEALING_TOUCH, spellName: 'Healing Touch', useNaturesSwiftness: true };
        }
        // Option 2: Swiftmend if target has our HoT (instant, consumes HoT)
        if (hasOwnHoT && swiftmendOffCooldown) {
          return { spell: DRUID_SPELLS.SWIFTMEND, spellName: 'Swiftmend', consumeHoT: true };
        }
        // Fallback: Regular Healing Touch (3.5s cast)
        return { spell: DRUID_SPELLS.HEALING_TOUCH, spellName: 'Healing Touch' };
      } else if (targetHealthPct < 0.60) {
        // Moderate damage - use Swiftmend if available and has HoT
        if (hasOwnHoT && swiftmendOffCooldown) {
          return { spell: DRUID_SPELLS.SWIFTMEND, spellName: 'Swiftmend', consumeHoT: true };
        }
        // Normal - Regrowth (direct + HoT)
        return { spell: DRUID_SPELLS.REGROWTH, spellName: 'Regrowth' };
      } else {
        // Top-off - Rejuvenation HoT (very efficient)
        // Skip if target already has our Rejuvenation (waste prevention)
        if (hasOwnRejuv) {
          // Target already has our Rejuv - use downranked Regrowth instead if needed
          return { spell: DRUID_SPELLS.REGROWTH, spellName: 'Regrowth' };
        }
        return lowMana
          ? { spell: DRUID_SPELLS.REJUVENATION_DOWNRANK, spellName: 'Rejuvenation (Rank 7)' }
          : { spell: DRUID_SPELLS.REJUVENATION, spellName: 'Rejuvenation' };
      }

    default:
      return null;
  }
}

// Calculate heal amount from a spell (with some variance like real WoW)
function calculateSpellHeal(spell: Spell, healerGearScore: number): number {
  const minHeal = spell.healAmount.min;
  const maxHeal = spell.healAmount.max;
  // Random value between min and max
  const baseHeal = minHeal + Math.random() * (maxHeal - minHeal);
  // Add spell power bonus from gear (simplified: gear score * 0.3 = spell power)
  const spellPower = healerGearScore * 0.3;
  const spellPowerBonus = spellPower * spell.spellPowerCoefficient;
  return Math.floor(baseHeal + spellPowerBonus);
}

// Player's base health as a Holy Paladin
const PLAYER_BASE_HEALTH = 4200;
const PLAYER_ID = 'player';

// Raid Buff Definitions - Authentic Vanilla WoW buffs
export const RAID_BUFFS = {
  // Priest Buffs
  power_word_fortitude: {
    id: 'power_word_fortitude',
    name: 'Prayer of Fortitude',
    icon: '/icons/spell_holy_prayeroffortitude.jpg',
    duration: 3600,
    maxDuration: 3600,
    effect: { staminaBonus: 54 },
    casterClass: 'priest' as WoWClass,
  },
  divine_spirit: {
    id: 'divine_spirit',
    name: 'Prayer of Spirit',
    icon: '/icons/spell_holy_divinespirit.jpg',
    duration: 3600,
    maxDuration: 3600,
    effect: { spiritBonus: 40 },
    casterClass: 'priest' as WoWClass,
  },
  // Mage Buffs
  arcane_intellect: {
    id: 'arcane_intellect',
    name: 'Arcane Brilliance',
    icon: '/icons/spell_holy_arcaneintellect.jpg',
    duration: 3600,
    maxDuration: 3600,
    effect: { intellectBonus: 31 },
    casterClass: 'mage' as WoWClass,
  },
  // Druid Buffs
  mark_of_the_wild: {
    id: 'mark_of_the_wild',
    name: 'Gift of the Wild',
    icon: '/icons/spell_nature_giftofthewild.jpg',
    duration: 3600,
    maxDuration: 3600,
    effect: { allStatsBonus: 12, armorBonus: 285 },
    casterClass: 'druid' as WoWClass,
  },
  // Paladin Blessings - Each requires a paladin slot
  blessing_of_wisdom: {
    id: 'blessing_of_wisdom',
    name: 'Greater Blessing of Wisdom',
    icon: '/icons/spell_holy_greaterblessingofwisdom.jpg',
    duration: 900,
    maxDuration: 900,
    effect: { manaRegenBonus: 33 },
    casterClass: 'paladin' as WoWClass,
    isPaladinBlessing: true,
  },
  blessing_of_kings: {
    id: 'blessing_of_kings',
    name: 'Greater Blessing of Kings',
    icon: '/icons/spell_magic_greaterblessingofkings.jpg',
    duration: 900,
    maxDuration: 900,
    effect: { allStatsBonus: 10 }, // 10% but we'll treat as flat for simplicity
    casterClass: 'paladin' as WoWClass,
    isPaladinBlessing: true,
  },
  blessing_of_might: {
    id: 'blessing_of_might',
    name: 'Greater Blessing of Might',
    icon: '/icons/spell_holy_greaterblessingofkings.jpg',
    duration: 900,
    maxDuration: 900,
    effect: { attackPowerBonus: 185 },
    casterClass: 'paladin' as WoWClass,
    isPaladinBlessing: true,
  },
  blessing_of_light: {
    id: 'blessing_of_light_buff',
    name: 'Greater Blessing of Light',
    icon: '/icons/spell_holy_prayerofhealing02.jpg',
    duration: 900,
    maxDuration: 900,
    effect: { healingReceivedBonus: 400 }, // +400 to Holy Light heals received
    casterClass: 'paladin' as WoWClass,
    isPaladinBlessing: true,
  },
  blessing_of_salvation: {
    id: 'blessing_of_salvation',
    name: 'Greater Blessing of Salvation',
    icon: '/icons/spell_holy_sealofsalvation.jpg',
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
    icon: '/icons/inv_potion_97.jpg',
    duration: 7200,
    effect: { mana: 2000 },
    role: 'healer',
  },
  mageblood_potion: {
    id: 'mageblood_potion',
    name: 'Mageblood Potion',
    icon: '/icons/inv_potion_45.jpg',
    duration: 3600,
    effect: { manaRegenBonus: 12 },
    role: 'healer',
  },
  nightfin_soup: {
    id: 'nightfin_soup',
    name: 'Nightfin Soup',
    icon: '/icons/inv_misc_fish_21.jpg',
    duration: 900,
    effect: { manaRegenBonus: 8 },
    role: 'healer',
  },
  brilliant_mana_oil: {
    id: 'brilliant_mana_oil',
    name: 'Brilliant Mana Oil',
    icon: '/icons/inv_potion_100.jpg',
    duration: 1800,
    effect: { manaRegenBonus: 12, healingPower: 25 },
    role: 'healer',
  },
  greater_arcane_elixir: {
    id: 'greater_arcane_elixir',
    name: 'Greater Arcane Elixir',
    icon: '/icons/inv_potion_25.jpg',
    duration: 3600,
    effect: { healingPower: 35 },
    role: 'healer',
  },
  // DPS Consumables
  flask_of_supreme_power: {
    id: 'flask_of_supreme_power',
    name: 'Flask of Supreme Power',
    icon: '/icons/inv_potion_41.jpg',
    duration: 7200,
    effect: { healingPower: 150 }, // +150 Spell Power
    role: 'dps',
  },
  mongoose_elixir: {
    id: 'mongoose_elixir',
    name: 'Elixir of the Mongoose',
    icon: '/icons/inv_potion_32.jpg',
    duration: 3600,
    effect: { spellCritBonus: 2 }, // +25 Agi, +2% Crit simplified
    role: 'dps',
  },
  winterfall_firewater: {
    id: 'winterfall_firewater',
    name: 'Winterfall Firewater',
    icon: '/icons/inv_potion_92.jpg',
    duration: 1200,
    effect: { attackPowerBonus: 35 },
    role: 'dps',
  },
  juju_power: {
    id: 'juju_power',
    name: 'Juju Power',
    icon: '/icons/inv_misc_monsterscales_11.jpg',
    duration: 1800,
    effect: { attackPowerBonus: 30 },
    role: 'dps',
  },
  grilled_squid: {
    id: 'grilled_squid',
    name: 'Grilled Squid',
    icon: '/icons/inv_misc_fish_13.jpg',
    duration: 900,
    effect: { spellCritBonus: 1 }, // +10 Agility simplified
    role: 'dps',
  },
  // Tank Consumables
  flask_of_the_titans: {
    id: 'flask_of_the_titans',
    name: 'Flask of the Titans',
    icon: '/icons/inv_potion_62.jpg',
    duration: 7200,
    effect: { staminaBonus: 120 }, // +1200 HP = ~120 sta
    role: 'tank',
  },
  elixir_of_fortitude: {
    id: 'elixir_of_fortitude',
    name: 'Elixir of Fortitude',
    icon: '/icons/inv_potion_43.jpg',
    duration: 3600,
    effect: { staminaBonus: 12 }, // +120 HP = ~12 sta
    role: 'tank',
  },
  elixir_of_superior_defense: {
    id: 'elixir_of_superior_defense',
    name: 'Elixir of Superior Defense',
    icon: '/icons/inv_potion_86.jpg',
    duration: 3600,
    effect: { armorBonus: 450 },
    role: 'tank',
  },
  rumsey_rum_black_label: {
    id: 'rumsey_rum_black_label',
    name: 'Rumsey Rum Black Label',
    icon: '/icons/inv_drink_04.jpg',
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
    icon: '/icons/spell_holy_mindvision.jpg',
    duration: 7200,
    effect: { allStatsBonus: 15, spellCritBonus: 5 },
    unlockBoss: undefined, // Always available
  },
  dire_maul_tribute: {
    id: 'dire_maul_tribute',
    name: 'Dire Maul Tribute',
    icon: '/icons/spell_holy_lesserheal02.jpg',
    duration: 7200,
    effect: { staminaBonus: 15, spellCritBonus: 3 }, // 15% HP simplified as stamina
    unlockBoss: undefined, // Always available
  },
  // Onyxia World Buff - Unlocks after first Onyxia kill
  rallying_cry_dragonslayer: {
    id: 'rallying_cry_dragonslayer',
    name: 'Rallying Cry of the Dragonslayer',
    icon: '/icons/inv_misc_head_dragon_01.jpg',
    duration: 7200,
    effect: { spellCritBonus: 10, attackPowerBonus: 140 },
    unlockBoss: 'onyxia',  // Requires first kill of Onyxia
    unlockRaid: "Onyxia's Lair",
    // Not comingSoon - this buff unlocks when player kills Onyxia for the first time
  },
  warchiefs_blessing: {
    id: 'warchiefs_blessing',
    name: "Warchief's Blessing",
    icon: '/icons/spell_arcane_teleportorgrimmar.jpg',
    duration: 7200,
    effect: { staminaBonus: 30, manaRegenBonus: 10, attackSpeedBonus: 15 }, // 300 HP = ~30 sta, 15% atk speed, 10 mp5
    unlockBoss: 'nefarian',
    unlockRaid: 'Blackwing Lair',
    // Unlocks when player defeats Nefarian for the first time
  },
  spirit_of_zandalar: {
    id: 'spirit_of_zandalar',
    name: 'Spirit of Zandalar',
    icon: '/icons/ability_creature_poison_05.jpg',
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
  // Optional fields for HoTs/shields that need to sync
  hotData?: {
    id: string;
    spellId: string;
    spellName: string;
    icon: string;
    remainingDuration: number;
    maxDuration: number;
    tickInterval: number;
    healPerTick: number;
  };
  shieldData?: {
    amount: number;
    weakenedSoulDuration: number;
  };
  buffData?: {
    id: string;
    name: string;
    icon: string;
    duration: number;
  };
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
  public onInfernoWarning: ((targetNames: string[]) => void) | null = null;
  public onMindControlWarning: ((mcPlayerName: string, attackingName: string) => void) | null = null;
  public onLavaBombWarning: ((targetName: string) => void) | null = null;
  private isMultiplayerClient: boolean = false; // If true, don't apply heals locally - they'll come from host
  private multiplayerPlayerRaidIds: Set<string> = new Set(); // Raid member IDs controlled by multiplayer players (don't AI heal these)
  private multiplayerClientRaidId: string | null = null; // The raid member ID for this client (e.g., 'mp_abc123')
  private hostSpectating: boolean = false; // If true, host is spectating and their slot is AI controlled

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
      innervateActive: false,
      innervateRemainingDuration: 0,
      innervateTargetId: null,
      divineFavorActive: false,
      // Priest cooldown states
      innerFocusActive: false,
      powerInfusionTargetId: null,
      powerInfusionDuration: 0,
      otherHealersEnabled: true,
      otherHealersHealing: 0,
      // Loot and gear system
      playerEquipment: getPreRaidBisForSpec('holy_paladin'),  // Default to Holy Paladin pre-raid BiS
      playerDKP: { points: 50, earnedThisRaid: 0 },
      pendingLoot: [],
      lootAssignments: {},
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
      // Track the most recently obtained legendary material (for loot screen notification)
      lastObtainedLegendaryMaterial: null,
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
      // Tank swap warning
      tankSwapWarning: null,
      // Bench players - roster of players not in active raid
      benchPlayers: [],
      // Raid Leader Mode - player manages raid instead of healing
      isRaidLeaderMode: false,
      // Weapon slot choice modal - for dual-wield classes when assigning weapons
      pendingWeaponAssignment: null,
      // Downgrade/sidegrade confirmation modal
      pendingDowngradeConfirmation: null,
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

  // Check if player has Lucifron's Curse (doubles mana costs)
  private playerHasManaCostCurse(): boolean {
    const player = this.state.raid.find(m => m.id === PLAYER_ID);
    return player ? player.debuffs.some(d => d.increasesManaCost) : false;
  }

  // Get effective mana cost (doubled if cursed)
  private getEffectiveManaCost(baseCost: number): number {
    return this.playerHasManaCostCurse() ? baseCost * 2 : baseCost;
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
      activeHoTs: [],
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
        activeHoTs: [],
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
        activeHoTs: [],
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
        activeHoTs: [],
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
        activeHoTs: [],
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
  setMultiplayerClientMode(isClient: boolean, clientRaidId?: string): void {
    this.isMultiplayerClient = isClient;
    this.multiplayerClientRaidId = clientRaidId || null;
  }

  // Set which raid member IDs are controlled by multiplayer players (to exclude from AI healing)
  setMultiplayerPlayerRaidIds(raidIds: string[]): void {
    this.multiplayerPlayerRaidIds = new Set(raidIds);
  }

  // Set if host is spectating (watching without playing, their slot becomes AI controlled)
  setHostSpectating(spectating: boolean): void {
    this.hostSpectating = spectating;
  }

  // Check if host is spectating
  isHostSpectating(): boolean {
    return this.hostSpectating;
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

    // Recalculate party auras since class/spec changed
    this.recalculateAuras();

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
      // Only set default name if not in Raid Leader mode (where player has already set their name)
      if (!this.state.isRaidLeaderMode) {
        player.name = this.state.playerClass === 'paladin' ? 'Healadin' : 'Chainheal';
        this.state.playerName = player.name;
      }
    }

    // Switch action bar based on class
    this.loadActionBarForClass(this.state.playerClass);

    // Reset class-specific state
    this.state.divineFavorActive = false;
    this.state.innerFocusActive = false;
    this.state.powerInfusionTargetId = null;
    this.state.powerInfusionDuration = 0;
    this.state.innervateTargetId = null;

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

  // Helper to load the correct action bar for a class
  private loadActionBarForClass(playerClass: PlayerHealerClass): void {
    switch (playerClass) {
      case 'priest':
        this.actionBar = DEFAULT_PRIEST_ACTION_BAR.map(s => ({ ...s }));
        break;
      case 'shaman':
        this.actionBar = DEFAULT_SHAMAN_ACTION_BAR.map(s => ({ ...s }));
        break;
      case 'druid':
        this.actionBar = DEFAULT_DRUID_ACTION_BAR.map(s => ({ ...s }));
        break;
      case 'paladin':
      default:
        this.actionBar = DEFAULT_ACTION_BAR.map(s => ({ ...s }));
        break;
    }
  }

  // Get class display name
  private getClassDisplayName(playerClass: PlayerHealerClass): string {
    switch (playerClass) {
      case 'priest': return 'Holy Priest';
      case 'shaman': return 'Restoration Shaman';
      case 'druid': return 'Restoration Druid';
      case 'paladin': return 'Holy Paladin';
      default: return 'Holy Paladin';
    }
  }

  // Get default player name for class
  private getDefaultPlayerName(playerClass: PlayerHealerClass): string {
    switch (playerClass) {
      case 'priest': return 'Lightwell';
      case 'shaman': return 'Chainheal';
      case 'druid': return 'Treehugger';
      case 'paladin': return 'Healadin';
      default: return 'Healadin';
    }
  }

  // Get player spec for class
  private getPlayerSpec(playerClass: PlayerHealerClass): WoWSpec {
    switch (playerClass) {
      case 'priest': return 'holy_priest';
      case 'shaman': return 'restoration_shaman';
      case 'druid': return 'restoration';
      case 'paladin': return 'holy_paladin';
      default: return 'holy_paladin';
    }
  }

  // Set player class (called after switchFaction to override default)
  setPlayerClass(newClass: PlayerHealerClass): void {
    if (this.state.isRunning) {
      this.addCombatLogEntry({
        message: 'Cannot change class during combat!',
        type: 'system',
      });
      return;
    }

    if (this.state.playerClass === newClass) return;

    const oldClass = this.state.playerClass;
    this.state.playerClass = newClass;

    // Load the correct action bar
    this.loadActionBarForClass(newClass);

    // Reset class-specific state
    this.state.divineFavorActive = false;
    this.state.innerFocusActive = false;
    this.state.powerInfusionTargetId = null;
    this.state.powerInfusionDuration = 0;
    this.state.innervateTargetId = null;
    this.state.naturesSwiftnessActive = false;
    this.state.naturesSwiftnessCooldown = 0;

    // Load appropriate starting gear
    const specKey = newClass === 'priest' ? 'holy_priest' :
                   newClass === 'shaman' ? 'restoration_shaman' :
                   newClass === 'druid' ? 'restoration' : 'holy_paladin';
    this.state.playerEquipment = getPreRaidBisForSpec(specKey);

    // Update player in raid
    const player = this.state.raid.find(m => m.id === PLAYER_ID);
    if (player) {
      player.class = newClass;
      player.spec = this.getPlayerSpec(newClass);
      // Update equipment on the raid member as well
      player.equipment = this.state.playerEquipment;
      player.gearScore = this.calculateGearScore(player.equipment);
      // Only update name if it's still the default for the old class
      if (!this.state.isRaidLeaderMode && player.name === this.getDefaultPlayerName(oldClass)) {
        player.name = this.getDefaultPlayerName(newClass);
        this.state.playerName = player.name;
      }

      // Update aura/totem assignments based on new class
      if (newClass !== 'paladin') {
        // Remove player from paladin aura assignments
        this.state.paladinAuraAssignments = this.state.paladinAuraAssignments.filter(
          a => a.paladinId !== PLAYER_ID
        );
      } else {
        // Player is now a paladin - add default aura assignment if needed
        const existingAssignment = this.state.paladinAuraAssignments.find(a => a.paladinId === PLAYER_ID);
        if (!existingAssignment) {
          this.state.paladinAuraAssignments.push({ paladinId: PLAYER_ID, auraId: 'devotion_aura' });
        }
      }

      if (newClass !== 'shaman') {
        // Remove player from shaman totem assignments
        this.state.shamanTotemAssignments = this.state.shamanTotemAssignments.filter(
          a => a.shamanId !== PLAYER_ID
        );
        // Clear active totems if player was a shaman
        this.state.activeTotems = [];
      }
    }

    // Recalculate auras with new class (only if raid is initialized)
    if (this.state.raid && this.state.raid.length > 0) {
      this.recalculateAuras();
    }

    // Update player stats from new equipment
    const newStats = this.computePlayerStats();
    this.state.spellPower = newStats.totalSpellPower;
    this.state.maxMana = newStats.totalMaxMana;
    this.state.critChance = newStats.totalCritChance;
    this.state.playerMana = this.state.maxMana;

    this.addCombatLogEntry({
      message: `Now playing ${this.getClassDisplayName(newClass)}`,
      type: 'system',
    });

    // Track class selection in PostHog
    posthog.capture('class_selected', {
      class_name: newClass,
      faction: this.state.faction,
      previous_class: oldClass
    });

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

        // TREMOR TOTEM - removes Fear/Charm/Sleep every tick (including Panic from Magmadar)
        if (activeTotem.effect.fearImmunity) {
          alivePartyMembers.forEach(member => {
            const fearDebuff = member.debuffs.find(d =>
              d.id === 'panic' || // Magmadar's Panic
              (d.type === 'magic' && (
                d.name?.toLowerCase().includes('fear') ||
                d.name?.toLowerCase().includes('charm') ||
                d.name?.toLowerCase().includes('sleep') ||
                d.name?.toLowerCase().includes('panic')
              ))
            );
            if (fearDebuff) {
              member.debuffs = member.debuffs.filter(d => d !== fearDebuff);
              this.addCombatLogEntry({
                message: `Tremor Totem removed ${fearDebuff.name} from ${member.name}!`,
                type: 'buff'
              });
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

  startEncounter(encounterId: string, options?: { golemaggTanks?: Boss['golemaggTanks']; majordomoTanks?: Boss['majordomoTanks']; ragnarosTanks?: Boss['ragnarosTanks'] }) {
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
    // Also mark all current raid members as participants for loot eligibility
    this.state.raid.forEach(member => {
      member.currentHealth = member.maxHealth;
      member.isAlive = true;
      member.debuffs = [];
      member.wasInEncounter = true;  // Mark as participant for loot eligibility
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
    this.state.boss = {
      ...encounter,
      currentHealth: encounter.maxHealth,
      ...(options?.golemaggTanks && { golemaggTanks: options.golemaggTanks }),
      ...(options?.majordomoTanks && { majordomoTanks: options.majordomoTanks }),
      ...(options?.ragnarosTanks && { ragnarosTanks: options.ragnarosTanks })
    };
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

    // Clear all debuffs, HoTs, buffs, and shields from raid members when encounter ends
    // Also reset encounter participation flags (no loot on wipes)
    this.state.raid.forEach(member => {
      member.debuffs = [];
      member.activeHoTs = [];
      member.buffs = [];
      member.weakenedSoulDuration = 0;
      member.absorbShield = 0;
      member.absorbShieldMax = 0;
      member.wasInEncounter = false;
    });

    // Clear Power Infusion state
    this.state.powerInfusionTargetId = null;
    this.state.powerInfusionDuration = 0;
    // Clear Innervate state
    this.state.innervateTargetId = null;

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

  // Clear the raid completely for Raid Leader Mode (no members, just empty slots)
  clearRaidForRaidLeader() {
    // In Raid Leader Mode, the player doesn't participate - they just manage
    // So we clear all raid members, leaving empty slots to fill
    this.state.raid = [];
    this.state.selectedTargetId = null;
    this.state.benchPlayers = [];
    this.state.activePaladinBlessings = [];
    this.state.playerBuffs = [];
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

  // =========================================================================
  // BENCH PLAYER SYSTEM
  // =========================================================================

  // Get maximum bench size based on current raid size
  getMaxBenchSize(): number {
    return this.state.raid.length === 40 ? 10 : 5;
  }

  // Get role for a spec
  private getRoleForSpec(spec: WoWSpec): 'tank' | 'healer' | 'dps' {
    for (const specs of Object.values(CLASS_SPECS)) {
      const found = specs.find(s => s.id === spec);
      if (found) return found.role;
    }
    return 'dps';
  }

  // Create a new bench player with specified class and spec
  createBenchPlayer(wowClass: WoWClass, spec: WoWSpec): BenchPlayer | null {
    if (this.state.isRunning) return null; // No changes during combat
    if (this.state.benchPlayers.length >= this.getMaxBenchSize()) return null;

    const role = this.getRoleForSpec(spec);

    // Get random name for the class (avoid duplicates with existing raid and bench)
    const usedNames = new Set<string>([
      ...this.state.raid.map(m => m.name),
      ...this.state.benchPlayers.map(b => b.name)
    ]);
    const names = CLASS_NAMES[wowClass];
    const available = names.filter(n => !usedNames.has(n));
    let name: string;
    if (available.length > 0) {
      name = available[Math.floor(Math.random() * available.length)];
    } else {
      // If class names exhausted, try names from ALL classes
      const allNames = Object.values(CLASS_NAMES).flat();
      const allAvailable = allNames.filter(n => !usedNames.has(n));
      if (allAvailable.length > 0) {
        name = allAvailable[Math.floor(Math.random() * allAvailable.length)];
      } else {
        // Last resort: should never happen with 400+ names
        name = `Adventurer${Date.now() % 1000}`;
      }
    }

    const equipment = getPreRaidBisForSpec(spec);
    const gearScore = this.calculateGearScore(equipment);

    const benchPlayer: BenchPlayer = {
      id: `bench_${wowClass}_${Date.now()}`,
      name,
      class: wowClass,
      spec,
      role,
      equipment,
      gearScore,
    };

    this.state.benchPlayers.push(benchPlayer);
    this.addCombatLogEntry({ message: `${name} (${wowClass}) added to bench.`, type: 'system' });
    this.notify();
    return benchPlayer;
  }

  // Remove a bench player
  removeBenchPlayer(benchPlayerId: string): boolean {
    if (this.state.isRunning) return false; // No changes during combat

    const index = this.state.benchPlayers.findIndex(b => b.id === benchPlayerId);
    if (index === -1) return false;

    const removed = this.state.benchPlayers.splice(index, 1)[0];
    this.addCombatLogEntry({ message: `${removed.name} removed from bench.`, type: 'system' });
    this.notify();
    return true;
  }

  // Kick a raid member (permanent removal with gear loss)
  kickRaidMember(memberId: string): boolean {
    if (this.state.isRunning) return false; // No changes during combat
    if (memberId === PLAYER_ID) return false; // Can't kick the player

    const memberIndex = this.state.raid.findIndex(m => m.id === memberId);
    if (memberIndex === -1) return false;

    const kicked = this.state.raid.splice(memberIndex, 1)[0];
    this.addCombatLogEntry({ message: `${kicked.name} has been kicked from the raid. All their gear is lost.`, type: 'system' });

    // Trigger cloud save since roster changed
    this.state.pendingCloudSave = true;
    this.notify();
    return true;
  }

  // Swap a bench player with an active raid member
  swapWithBench(activeRaiderId: string, benchPlayerId: string): boolean {
    if (this.state.isRunning) return false; // No swaps during combat
    if (activeRaiderId === PLAYER_ID) return false; // Can't bench the player

    const activeIndex = this.state.raid.findIndex(m => m.id === activeRaiderId);
    const benchIndex = this.state.benchPlayers.findIndex(b => b.id === benchPlayerId);

    if (activeIndex === -1 || benchIndex === -1) return false;

    const activePlayer = this.state.raid[activeIndex];
    const benchPlayer = this.state.benchPlayers[benchIndex];

    // Get max health for the bench player coming in
    const healthRange = CLASS_HEALTH[benchPlayer.class];
    const baseHealth = Math.floor((healthRange.min + healthRange.max) / 2);
    const maxHealth = benchPlayer.role === 'tank' ? Math.floor(baseHealth * 1.4) : baseHealth;

    // Get DPS based on spec
    const dps = this.getDpsForSpec(benchPlayer.spec);

    // Convert active player to bench player (preserve their gear)
    const newBenchPlayer: BenchPlayer = {
      id: activePlayer.id,
      name: activePlayer.name,
      class: activePlayer.class,
      spec: activePlayer.spec,
      role: activePlayer.role,
      equipment: activePlayer.equipment,
      gearScore: activePlayer.gearScore,
    };

    // Get position zone for the new raid member
    const positionZone = this.getPositionZone(benchPlayer.class, benchPlayer.spec, benchPlayer.role);

    // Convert bench player to active raid member
    const newRaidMember: RaidMember = {
      id: benchPlayer.id,
      name: benchPlayer.name,
      class: benchPlayer.class,
      spec: benchPlayer.spec,
      role: benchPlayer.role,
      equipment: benchPlayer.equipment,
      gearScore: benchPlayer.gearScore,
      group: activePlayer.group,  // Inherit group slot
      currentHealth: maxHealth,
      maxHealth: maxHealth,
      buffs: [],
      debuffs: [],
      activeHoTs: [],
      isAlive: true,
      dps,
      positionZone,
      wasInEncounter: false,  // They weren't in any boss fights yet
    };

    // Perform the swap
    this.state.raid[activeIndex] = newRaidMember;
    this.state.benchPlayers[benchIndex] = newBenchPlayer;

    this.addCombatLogEntry({
      message: `${benchPlayer.name} swapped in for ${activePlayer.name}.`,
      type: 'system'
    });

    // Trigger cloud save since roster changed
    this.state.pendingCloudSave = true;
    this.notify();
    return true;
  }

  // Move a raid member directly to the bench (without swapping)
  moveRaidMemberToBench(raidMemberId: string): boolean {
    if (this.state.isRunning) return false; // No changes during combat
    if (raidMemberId === PLAYER_ID) return false; // Can't bench the player

    const memberIndex = this.state.raid.findIndex(m => m.id === raidMemberId);
    if (memberIndex === -1) return false;

    // Check if bench has room
    const maxBench = this.getMaxBenchSize();
    if (this.state.benchPlayers.length >= maxBench) return false;

    const member = this.state.raid[memberIndex];

    // Convert to bench player
    const benchPlayer: BenchPlayer = {
      id: member.id,
      name: member.name,
      class: member.class,
      spec: member.spec,
      role: member.role,
      equipment: member.equipment,
      gearScore: member.gearScore,
    };

    // Add to bench
    this.state.benchPlayers.push(benchPlayer);

    // Remove from raid
    this.state.raid.splice(memberIndex, 1);

    this.addCombatLogEntry({
      message: `${member.name} moved to the bench.`,
      type: 'system'
    });

    // Trigger cloud save since roster changed
    this.state.pendingCloudSave = true;
    this.notify();
    return true;
  }

  // Move a bench player directly into the raid (to an empty slot)
  moveBenchPlayerToRaid(benchPlayerId: string, targetGroup: number): boolean {
    if (this.state.isRunning) return false; // No changes during combat

    const benchIndex = this.state.benchPlayers.findIndex(b => b.id === benchPlayerId);
    if (benchIndex === -1) return false;

    const benchPlayer = this.state.benchPlayers[benchIndex];

    // Get max health for the bench player coming in
    const healthRange = CLASS_HEALTH[benchPlayer.class];
    const baseHealth = Math.floor((healthRange.min + healthRange.max) / 2);
    const maxHealth = benchPlayer.role === 'tank' ? Math.floor(baseHealth * 1.4) : baseHealth;

    // Get DPS based on spec
    const dps = this.getDpsForSpec(benchPlayer.spec);

    // Get position zone for the new raid member
    const positionZone = this.getPositionZone(benchPlayer.class, benchPlayer.spec, benchPlayer.role);

    // Convert bench player to active raid member
    const newRaidMember: RaidMember = {
      id: benchPlayer.id,
      name: benchPlayer.name,
      class: benchPlayer.class,
      spec: benchPlayer.spec,
      role: benchPlayer.role,
      equipment: benchPlayer.equipment,
      gearScore: benchPlayer.gearScore,
      group: targetGroup,
      currentHealth: maxHealth,
      maxHealth: maxHealth,
      buffs: [],
      debuffs: [],
      activeHoTs: [],
      isAlive: true,
      dps,
      positionZone,
      wasInEncounter: false,
    };

    // Add to raid
    this.state.raid.push(newRaidMember);

    // Remove from bench
    this.state.benchPlayers.splice(benchIndex, 1);

    this.addCombatLogEntry({
      message: `${benchPlayer.name} joined the raid in group ${targetGroup}.`,
      type: 'system'
    });

    // Trigger cloud save since roster changed
    this.state.pendingCloudSave = true;
    this.notify();
    return true;
  }

  // Helper to get DPS for a spec
  private getDpsForSpec(spec: WoWSpec): number {
    // Base DPS values by role/spec
    const dpsValues: Partial<Record<WoWSpec, number>> = {
      // Tank specs - 0 DPS (they tank, not DPS)
      'protection_warrior': 0,
      'protection_paladin': 0,
      'feral_tank': 0,
      // Healer specs - 0 DPS (they heal)
      'holy_paladin': 0,
      'holy_priest': 0,
      'discipline': 0,
      'restoration_shaman': 0,
      'restoration': 0,
      // DPS specs
      'arms': 450,
      'fury': 500,
      'retribution': 350,
      'beast_mastery': 400,
      'marksmanship': 450,
      'survival': 380,
      'assassination': 480,
      'combat': 520,
      'subtlety': 420,
      'shadow': 400,
      'elemental': 420,
      'enhancement': 450,
      'arcane': 450,
      'fire_mage': 500,
      'frost_mage': 420,
      'affliction': 400,
      'demonology': 380,
      'destruction': 450,
      'balance': 380,
      'feral_dps': 470,
    };
    return dpsValues[spec] ?? 400; // Default DPS
  }

  // Get bench players
  getBenchPlayers(): BenchPlayer[] {
    return this.state.benchPlayers;
  }

  // =========================================================================
  // END BENCH PLAYER SYSTEM
  // =========================================================================

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

  setRaidLeaderMode(enabled: boolean) {
    this.state.isRaidLeaderMode = enabled;
    if (enabled) {
      // In raid leader mode, enable all AI healers
      this.state.otherHealersEnabled = true;
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

    // Update the set of player-controlled raid member IDs to exclude from AI healing
    this.multiplayerPlayerRaidIds = new Set(
      this.state.raid.filter(m => m.id.startsWith('mp_')).map(m => m.id)
    );

    this.notify();
  }

  /**
   * Get all multiplayer player members in the raid
   */
  getMultiplayerMembers(): RaidMember[] {
    return this.state.raid.filter(m => m.id.startsWith('mp_'));
  }

  /**
   * Sync raid composition from multiplayer host
   * This replaces the local raid with the host's raid (names, classes, groups, gear)
   * while preserving runtime state (health, buffs, debuffs)
   */
  syncRaidFromMultiplayer(syncedRaid: Array<{
    id: string;
    name: string;
    class: WoWClass;
    spec: WoWSpec;
    role: 'tank' | 'healer' | 'dps';
    group: number;
    equipment: Equipment;
    gearScore: number;
    positionZone: PositionZone;
  }>) {
    // Update each raid member with the synced data
    // Preserve runtime state but update persistent properties
    this.state.raid = syncedRaid.map((synced, index) => {
      const existing = this.state.raid[index];
      return {
        // Runtime state (preserved from existing if available)
        currentHealth: existing?.maxHealth || 4000,
        maxHealth: existing?.maxHealth || 4000,
        buffs: existing?.buffs || [],
        debuffs: existing?.debuffs || [],
        isAlive: existing?.isAlive ?? true,
        dps: existing?.dps || 100,
        wasInEncounter: existing?.wasInEncounter || false,
        lastCritHealTime: existing?.lastCritHealTime,
        // Persistent properties (from host)
        id: synced.id,
        name: synced.name,
        class: synced.class,
        spec: synced.spec,
        role: synced.role,
        group: synced.group,
        equipment: synced.equipment,
        gearScore: synced.gearScore,
        positionZone: synced.positionZone,
      };
    });

    this.notify();
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

  // Request Innervate from a druid healer
  requestInnervate(): boolean {
    // Find druids in the raid with Innervate off cooldown
    const druidsWithInnervate = this.state.raid
      .filter(m => m.class === 'druid' && m.role === 'healer' && m.isAlive)
      .filter(druid => {
        const stats = this.state.aiHealerStats[druid.id];
        return stats && (!stats.innervateCooldown || stats.innervateCooldown <= 0);
      });

    if (druidsWithInnervate.length === 0) {
      this.addCombatLogEntry({ message: 'No druid has Innervate available!', type: 'system' });
      this.notify();
      return false;
    }

    // Use the first available druid
    const druid = druidsWithInnervate[0];
    const druidStats = this.state.aiHealerStats[druid.id];

    // Apply Innervate buff - 400% mana regen for 20 seconds
    this.state.innervateActive = true;
    this.state.innervateRemainingDuration = 20;

    // Put Innervate on 6 minute cooldown
    druidStats.innervateCooldown = 360;

    // Combat log
    this.addCombatLogEntry({
      message: `${druid.name} casts Innervate on you! (400% mana regen for 20 sec)`,
      type: 'buff',
    });

    this.notify();
    return true;
  }

  // Check if any druid has Innervate available
  hasInnervateAvailable(): boolean {
    return this.state.raid.some(m => {
      if (m.class !== 'druid' || m.role !== 'healer' || !m.isAlive) return false;
      const stats = this.state.aiHealerStats[m.id];
      return stats && (!stats.innervateCooldown || stats.innervateCooldown <= 0);
    });
  }

  // Check if there's a druid healer in the raid
  hasDruidHealer(): boolean {
    return this.state.raid.some(m => m.class === 'druid' && m.role === 'healer' && m.isAlive);
  }

  // Get Innervate cooldown status (returns the shortest cooldown among druids, or 0 if available)
  getInnervateCooldown(): number {
    const druidCooldowns = this.state.raid
      .filter(m => m.class === 'druid' && m.role === 'healer' && m.isAlive)
      .map(druid => {
        const stats = this.state.aiHealerStats[druid.id];
        return stats?.innervateCooldown || 0;
      });

    if (druidCooldowns.length === 0) return -1; // No druids
    return Math.min(...druidCooldowns);
  }

  // Sync Innervate cooldown from host (for multiplayer clients)
  // This allows clients to see the correct Innervate availability
  syncInnervateCooldown(cooldown: number): void {
    // Find the first druid healer and sync their cooldown
    const druid = this.state.raid.find(m => m.class === 'druid' && m.role === 'healer' && m.isAlive);
    if (druid && this.state.aiHealerStats[druid.id]) {
      this.state.aiHealerStats[druid.id].innervateCooldown = cooldown;
    }
  }

  // Apply Innervate buff locally (for multiplayer clients)
  // The cooldown is handled by the host, this just applies the buff effect
  applyInnervateBuffLocally(): void {
    this.state.innervateActive = true;
    this.state.innervateRemainingDuration = 20;
    this.addCombatLogEntry({
      message: 'Innervate! (400% mana regen for 20 sec)',
      type: 'buff',
    });
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
    // Check if host is spectating - can't cast while spectating!
    if (this.hostSpectating) {
      this.addCombatLogEntry({ message: 'You are spectating!', type: 'system' });
      this.notify();
      return;
    }

    // Check if player is dead - can't cast if dead!
    // In multiplayer client mode, use the client's raid member ID (e.g., 'mp_abc123')
    const player = this.isMultiplayerClient && this.multiplayerClientRaidId
      ? this.state.raid.find(m => m.id === this.multiplayerClientRaidId)
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

    // Calculate effective mana cost (doubled if Lucifron's Curse is active)
    let effectiveManaCost = this.getEffectiveManaCost(spell.manaCost);

    // Inner Focus makes the next healing spell free (Priest)
    // Healing spells for Priest: Greater Heal, Flash Heal, Heal, Renew, Prayer of Healing, Power Word: Shield
    const priestHealingSpells = ['greater_heal', 'greater_heal_downrank', 'greater_heal_rank1',
      'flash_heal', 'flash_heal_downrank', 'heal', 'renew', 'prayer_of_healing', 'power_word_shield'];
    const isInnerFocusApplicable = this.state.innerFocusActive && priestHealingSpells.includes(spell.id);
    if (isInnerFocusApplicable) {
      effectiveManaCost = 0;
    }

    // Check mana
    if (this.state.playerMana < effectiveManaCost) {
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
      this.state.playerMana -= effectiveManaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime; // FSR tracking
      if (actionBarSpell) actionBarSpell.currentCooldown = spell.cooldown;
      this.addCombatLogEntry({ message: 'Divine Favor activated - next heal will crit!', type: 'buff' });
      this.notify();
      return;
    }

    // Nature's Swiftness - makes next heal instant (Shaman)
    if (spell.id === 'natures_swiftness') {
      this.state.naturesSwiftnessActive = true;
      this.state.playerMana -= effectiveManaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime; // FSR tracking
      if (actionBarSpell) actionBarSpell.currentCooldown = spell.cooldown;
      this.addCombatLogEntry({ message: "Nature's Swiftness activated - next nature spell is instant!", type: 'buff' });
      this.notify();
      return;
    }

    // Inner Focus - makes next spell free and +25% crit (Priest)
    if (spell.id === 'inner_focus') {
      this.state.innerFocusActive = true;
      if (actionBarSpell) actionBarSpell.currentCooldown = spell.cooldown;
      this.addCombatLogEntry({ message: 'Inner Focus activated - next spell is free and +25% crit!', type: 'buff' });
      this.notify();
      return;
    }

    // Nature's Swiftness - makes next nature spell instant (Druid)
    if (spell.id === 'natures_swiftness_druid') {
      this.state.naturesSwiftnessActive = true;
      this.state.naturesSwiftnessCooldown = spell.cooldown;
      if (actionBarSpell) actionBarSpell.currentCooldown = spell.cooldown;
      this.addCombatLogEntry({ message: "Nature's Swiftness activated - next spell is instant!", type: 'buff' });
      this.notify();
      return;
    }

    // Determine target based on mouseover healing mode
    // When mouseover healing is enabled, use mouseoverTargetId; otherwise use selectedTargetId
    const targetId = this.state.mouseoverHealingEnabled
      ? this.state.mouseoverTargetId
      : this.state.selectedTargetId;

    // Need a target for most spells (except buffs that apply to self)
    const noTargetNeeded = ['divine_favor', 'natures_swiftness_druid'];
    if (!targetId && !noTargetNeeded.includes(spell.id)) {
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
      this.state.playerMana -= effectiveManaCost;
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

      this.state.playerMana -= effectiveManaCost;
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

      this.state.playerMana -= effectiveManaCost;
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

      this.state.playerMana -= effectiveManaCost;
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

      this.state.playerMana -= effectiveManaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime; // FSR tracking
      this.state.globalCooldown = GCD_DURATION;
      if (actionBarSpell) actionBarSpell.currentCooldown = spell.cooldown;

      this.applyHeal(target, spell);
      this.notify();
      return;
    }

    // Power Infusion - buff target's spell damage by 20% for 15s (Priest)
    if (spell.id === 'power_infusion') {
      if (!target.isAlive) {
        this.addCombatLogEntry({ message: 'Cannot buff dead target!', type: 'system' });
        this.notify();
        return;
      }

      // Remove any existing Power Infusion buff from anyone else first
      if (this.state.powerInfusionTargetId) {
        const oldTarget = this.state.raid.find(m => m.id === this.state.powerInfusionTargetId);
        if (oldTarget) {
          oldTarget.buffs = oldTarget.buffs.filter(b => b.id !== 'power_infusion');
        }
      }

      // Apply Power Infusion buff to target
      this.state.powerInfusionTargetId = target.id;
      this.state.powerInfusionDuration = 15;

      // Add the buff to the target's buffs array
      target.buffs = target.buffs.filter(b => b.id !== 'power_infusion'); // Remove existing if any
      target.buffs.push({
        id: 'power_infusion',
        name: 'Power Infusion',
        icon: spell.icon,
        duration: 15,
        maxDuration: 15,
        effect: {
          spellDamageBonus: 0.20, // +20% spell damage
        },
      });

      if (actionBarSpell) actionBarSpell.currentCooldown = spell.cooldown;

      this.addCombatLogEntry({
        message: `Power Infusion cast on ${target.name} - +20% spell damage for 15s!`,
        type: 'buff',
      });
      this.notify();
      return;
    }

    // Renew - instant HoT (Priest)
    if (spell.id === 'renew') {
      if (!target.isAlive) {
        this.addCombatLogEntry({ message: 'Cannot heal dead target!', type: 'system' });
        this.notify();
        return;
      }

      // Handle Inner Focus - free spell
      const actualManaCost = this.state.innerFocusActive ? 0 : effectiveManaCost;
      if (this.state.innerFocusActive) {
        this.state.innerFocusActive = false;
        this.addCombatLogEntry({ message: 'Inner Focus consumed!', type: 'buff' });
      }

      this.state.playerMana -= actualManaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime;
      this.state.globalCooldown = GCD_DURATION;

      // Calculate heal per tick with spell power
      const baseHealPerTick = 194; // Renew R10 base tick
      const spellPowerBonus = Math.floor(this.state.spellPower * 0.20);
      const healPerTick = baseHealPerTick + spellPowerBonus;

      const hotId = `renew_${Date.now()}`;
      const targetIndex = this.state.raid.findIndex(m => m.id === target.id);

      // Call multiplayer callback if set - send HoT data to host
      if (this.onHealApplied) {
        this.onHealApplied({
          targetIndex,
          targetId: target.id,
          healAmount: 0, // No immediate heal
          spellName: spell.name,
          spellId: spell.id,
          playerName: this.state.playerName,
          hotData: {
            id: hotId,
            spellId: 'renew',
            spellName: 'Renew',
            icon: spell.icon,
            remainingDuration: 15,
            maxDuration: 15,
            tickInterval: 3,
            healPerTick: healPerTick,
          },
        });
      }

      // In multiplayer client mode, don't apply locally - host will sync it
      if (this.isMultiplayerClient) {
        this.addCombatLogEntry({ message: `Renew applied to ${target.name} (syncing...)`, type: 'heal' });
        this.notify();
        return;
      }

      // Check if target already has Renew - refresh if so
      if (!target.activeHoTs) target.activeHoTs = [];
      const existingRenew = target.activeHoTs.find(h => h.spellId === 'renew');

      if (existingRenew) {
        // Refresh the HoT
        existingRenew.remainingDuration = 15;
        existingRenew.maxDuration = 15;
        existingRenew.healPerTick = healPerTick;
        existingRenew.timeSinceLastTick = 0;
        this.addCombatLogEntry({ message: `Renew refreshed on ${target.name}`, type: 'heal' });
      } else {
        // Apply new HoT
        target.activeHoTs.push({
          id: hotId,
          spellId: 'renew',
          spellName: 'Renew',
          icon: spell.icon,
          casterId: PLAYER_ID,
          casterName: this.state.playerName,
          remainingDuration: 15,
          maxDuration: 15,
          tickInterval: 3,
          timeSinceLastTick: 0,
          healPerTick: healPerTick,
        });
        this.addCombatLogEntry({ message: `Renew applied to ${target.name}`, type: 'heal' });
      }

      this.notify();
      return;
    }

    // Rejuvenation - instant HoT (Druid)
    if (spell.id === 'rejuvenation' || spell.id === 'rejuvenation_downrank') {
      if (!target.isAlive) {
        this.addCombatLogEntry({ message: 'Cannot heal dead target!', type: 'system' });
        this.notify();
        return;
      }

      this.state.playerMana -= effectiveManaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime;
      this.state.globalCooldown = GCD_DURATION;

      // Calculate heal per tick with spell power
      // Rejuvenation R11: 222 per tick, R7: 126 per tick
      const baseHealPerTick = spell.id === 'rejuvenation' ? 222 : 126;
      const spellPowerBonus = Math.floor(this.state.spellPower * 0.20);
      const healPerTick = baseHealPerTick + spellPowerBonus;

      const hotId = `rejuv_${Date.now()}`;
      const targetIndex = this.state.raid.findIndex(m => m.id === target.id);

      // Call multiplayer callback if set
      if (this.onHealApplied) {
        this.onHealApplied({
          targetIndex,
          targetId: target.id,
          healAmount: 0,
          spellName: spell.name,
          spellId: spell.id,
          playerName: this.state.playerName,
          hotData: {
            id: hotId,
            spellId: spell.id,
            spellName: 'Rejuvenation',
            icon: spell.icon,
            remainingDuration: 12,
            maxDuration: 12,
            tickInterval: 3,
            healPerTick: healPerTick,
          },
        });
      }

      // In multiplayer client mode, don't apply locally - host will sync it
      if (this.isMultiplayerClient) {
        this.addCombatLogEntry({ message: `Rejuvenation applied to ${target.name} (syncing...)`, type: 'heal' });
        this.notify();
        return;
      }

      // Check if target already has Rejuvenation - refresh if so
      if (!target.activeHoTs) target.activeHoTs = [];
      const existingRejuv = target.activeHoTs.find(h => h.spellId === 'rejuvenation' || h.spellId === 'rejuvenation_downrank');

      if (existingRejuv) {
        // Refresh the HoT
        existingRejuv.remainingDuration = 12;
        existingRejuv.maxDuration = 12;
        existingRejuv.healPerTick = healPerTick;
        existingRejuv.timeSinceLastTick = 0;
        existingRejuv.spellId = spell.id; // Update to current rank
        this.addCombatLogEntry({ message: `Rejuvenation refreshed on ${target.name}`, type: 'heal' });
      } else {
        // Apply new HoT
        target.activeHoTs.push({
          id: hotId,
          spellId: spell.id,
          spellName: 'Rejuvenation',
          icon: spell.icon,
          casterId: PLAYER_ID,
          casterName: this.state.playerName,
          remainingDuration: 12,
          maxDuration: 12,
          tickInterval: 3,
          timeSinceLastTick: 0,
          healPerTick: healPerTick,
        });
        this.addCombatLogEntry({ message: `Rejuvenation applied to ${target.name}`, type: 'heal' });
      }

      this.notify();
      return;
    }

    // Swiftmend - consumes HoT for instant heal (Druid)
    if (spell.id === 'swiftmend') {
      if (!target.isAlive) {
        this.addCombatLogEntry({ message: 'Cannot heal dead target!', type: 'system' });
        this.notify();
        return;
      }

      // Check if target has a Rejuvenation or Regrowth HoT
      if (!target.activeHoTs) target.activeHoTs = [];
      const consumableHoT = target.activeHoTs.find(
        h => h.spellId === 'rejuvenation' || h.spellId === 'rejuvenation_downrank' || h.spellId === 'regrowth'
      );

      if (!consumableHoT) {
        this.addCombatLogEntry({
          message: `Cannot cast Swiftmend - ${target.name} has no Rejuvenation or Regrowth!`,
          type: 'system',
        });
        this.notify();
        return;
      }

      this.state.playerMana -= effectiveManaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime;
      this.state.globalCooldown = GCD_DURATION;
      if (actionBarSpell) actionBarSpell.currentCooldown = spell.cooldown;

      // Calculate heal amount based on consumed HoT
      // Swiftmend heals for 12 seconds worth of the HoT (4 ticks of Rejuv or ~4 ticks of Regrowth)
      const ticksConsumed = 4; // 12 seconds / 3 second tick interval
      const baseHealAmount = consumableHoT.healPerTick * ticksConsumed;
      const healAmount = Math.min(baseHealAmount, target.maxHealth - target.currentHealth);

      // Consume the HoT
      const hotName = consumableHoT.spellName;
      target.activeHoTs = target.activeHoTs.filter(h => h.id !== consumableHoT.id);

      // Apply healing
      target.currentHealth = Math.min(target.maxHealth, target.currentHealth + healAmount);
      const targetIndex = this.state.raid.findIndex(m => m.id === target.id);

      // Track healing
      this.state.healingDone += healAmount;
      if (!this.state.spellHealing[spell.id]) this.state.spellHealing[spell.id] = 0;
      this.state.spellHealing[spell.id] += healAmount;

      // Multiplayer callback
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

      this.addCombatLogEntry({
        message: `Swiftmend consumes ${hotName} on ${target.name} for ${healAmount} healing!`,
        type: 'heal',
      });

      this.notify();
      return;
    }

    // Remove Curse (Druid)
    if (spell.id === 'remove_curse') {
      if (!target.isAlive) {
        this.addCombatLogEntry({ message: 'Cannot dispel dead target!', type: 'system' });
        this.notify();
        return;
      }

      // Find a curse debuff on the target
      const curseDebuff = target.debuffs?.find(d => d.type === 'curse');
      if (!curseDebuff) {
        this.addCombatLogEntry({ message: `${target.name} has no curse to remove!`, type: 'system' });
        this.notify();
        return;
      }

      this.state.playerMana -= effectiveManaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime;
      this.state.globalCooldown = GCD_DURATION;

      // Remove the curse
      target.debuffs = target.debuffs?.filter(d => d.id !== curseDebuff.id);

      const targetIndex = this.state.raid.findIndex(m => m.id === target.id);
      if (this.onDispelApplied) {
        this.onDispelApplied({
          targetIndex,
          targetId: target.id,
          debuffId: curseDebuff.id,
          spellName: spell.name,
          playerName: this.state.playerName,
        });
      }

      this.addCombatLogEntry({
        message: `Remove Curse dispels ${curseDebuff.name} from ${target.name}!`,
        type: 'buff',
      });

      this.notify();
      return;
    }

    // Abolish Poison (Druid)
    if (spell.id === 'abolish_poison') {
      if (!target.isAlive) {
        this.addCombatLogEntry({ message: 'Cannot dispel dead target!', type: 'system' });
        this.notify();
        return;
      }

      // Find a poison debuff on the target
      const poisonDebuff = target.debuffs?.find(d => d.type === 'poison');
      if (!poisonDebuff) {
        this.addCombatLogEntry({ message: `${target.name} has no poison to remove!`, type: 'system' });
        this.notify();
        return;
      }

      this.state.playerMana -= effectiveManaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime;
      this.state.globalCooldown = GCD_DURATION;

      // Remove the poison
      target.debuffs = target.debuffs?.filter(d => d.id !== poisonDebuff.id);

      const targetIndex = this.state.raid.findIndex(m => m.id === target.id);
      if (this.onDispelApplied) {
        this.onDispelApplied({
          targetIndex,
          targetId: target.id,
          debuffId: poisonDebuff.id,
          spellName: spell.name,
          playerName: this.state.playerName,
        });
      }

      this.addCombatLogEntry({
        message: `Abolish Poison dispels ${poisonDebuff.name} from ${target.name}!`,
        type: 'buff',
      });

      this.notify();
      return;
    }

    // Innervate (Druid) - 400% mana regen for 20 seconds
    // Self-cast = you get mana regen
    // Cast on healer = AI healer gets mana regen
    // Cast on non-healer = visual only
    if (spell.id === 'innervate') {
      if (!target.isAlive) {
        this.addCombatLogEntry({ message: 'Cannot buff dead target!', type: 'system' });
        this.notify();
        return;
      }

      // Remove any existing Innervate buff from anyone else first
      if (this.state.innervateTargetId) {
        const oldTarget = this.state.raid.find(m => m.id === this.state.innervateTargetId);
        if (oldTarget) {
          oldTarget.buffs = oldTarget.buffs.filter(b => b.id !== 'innervate');
        }
        // Also clear from AI healer if it was an AI healer
        const oldAiHealer = this.state.aiHealerStats[this.state.innervateTargetId];
        if (oldAiHealer) {
          oldAiHealer.innervateActive = false;
          oldAiHealer.innervateRemainingDuration = 0;
        }
      }

      this.state.playerMana -= effectiveManaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime;
      this.state.globalCooldown = GCD_DURATION;
      if (actionBarSpell) actionBarSpell.currentCooldown = spell.cooldown;

      // Check if target is the player themselves (self-cast)
      const isSelfCast = target.id === this.state.playerId;
      // Check if target is an AI healer (role='healer' and has aiHealerStats entry)
      const isAiHealer = target.role === 'healer' && !isSelfCast && this.state.aiHealerStats[target.id];

      const targetIndex = this.state.raid.findIndex(m => m.id === target.id);

      // Call multiplayer callback if set - send buff data to host
      if (this.onHealApplied) {
        this.onHealApplied({
          targetIndex,
          targetId: target.id,
          healAmount: 0,
          spellName: spell.name,
          spellId: spell.id,
          playerName: this.state.playerName,
          buffData: {
            id: 'innervate',
            name: 'Innervate',
            icon: spell.icon,
            duration: 20,
          },
        });
      }

      // In multiplayer client mode, don't apply locally - host will sync it
      if (this.isMultiplayerClient) {
        this.addCombatLogEntry({ message: `Innervate cast on ${target.name} (syncing...)`, type: 'buff' });
        this.notify();
        return;
      }

      // Apply Innervate buff to target (visual on raid frame)
      this.state.innervateTargetId = target.id;
      this.state.innervateRemainingDuration = 20;

      // Apply mana regen based on target type
      if (isSelfCast) {
        // Self-cast: player gets mana regen
        this.state.innervateActive = true;
        this.addCombatLogEntry({
          message: `Innervate cast on yourself - 400% mana regeneration for 20 seconds!`,
          type: 'buff',
        });
      } else if (isAiHealer) {
        // AI healer: they get mana regen
        this.state.innervateActive = false; // Player doesn't get it
        const aiHealer = this.state.aiHealerStats[target.id];
        aiHealer.innervateActive = true;
        aiHealer.innervateRemainingDuration = 20;
        this.addCombatLogEntry({
          message: `Innervate cast on ${target.name} - 400% mana regeneration for 20 seconds!`,
          type: 'buff',
        });
      } else {
        // Non-healer NPC: visual only
        this.state.innervateActive = false;
        this.addCombatLogEntry({
          message: `Innervate cast on ${target.name} - visual only (not a healer)`,
          type: 'buff',
        });
      }

      // Add the buff to the target's buffs array for visual display
      target.buffs = target.buffs.filter(b => b.id !== 'innervate');
      target.buffs.push({
        id: 'innervate',
        name: 'Innervate',
        icon: spell.icon,
        duration: 20,
        maxDuration: 20,
        effect: {
          manaRegenBonus: 4.0, // 400% mana regen
        },
      });

      this.notify();
      return;
    }

    // Power Word: Shield - instant absorb shield (Priest)
    if (spell.id === 'power_word_shield') {
      if (!target.isAlive) {
        this.addCombatLogEntry({ message: 'Cannot shield dead target!', type: 'system' });
        this.notify();
        return;
      }

      // Check Weakened Soul debuff
      if (target.weakenedSoulDuration && target.weakenedSoulDuration > 0) {
        this.addCombatLogEntry({
          message: `Cannot shield ${target.name} - Weakened Soul (${Math.ceil(target.weakenedSoulDuration)}s)`,
          type: 'system',
        });
        this.notify();
        return;
      }

      // Handle Inner Focus - free spell
      const actualManaCost = this.state.innerFocusActive ? 0 : effectiveManaCost;
      if (this.state.innerFocusActive) {
        this.state.innerFocusActive = false;
        this.addCombatLogEntry({ message: 'Inner Focus consumed!', type: 'buff' });
      }

      this.state.playerMana -= actualManaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime;
      this.state.globalCooldown = GCD_DURATION;

      // Calculate shield amount with spell power
      const baseShield = 942; // PW:S R10 base absorb
      const spellPowerBonus = Math.floor(this.state.spellPower * 0.10);
      const shieldAmount = baseShield + spellPowerBonus;

      const targetIndex = this.state.raid.findIndex(m => m.id === target.id);

      // Call multiplayer callback if set - send shield data to host
      if (this.onHealApplied) {
        this.onHealApplied({
          targetIndex,
          targetId: target.id,
          healAmount: 0, // No direct heal
          spellName: spell.name,
          spellId: spell.id,
          playerName: this.state.playerName,
          shieldData: {
            amount: shieldAmount,
            weakenedSoulDuration: 15,
          },
        });
      }

      // In multiplayer client mode, don't apply locally - host will sync it
      if (this.isMultiplayerClient) {
        this.addCombatLogEntry({
          message: `Power Word: Shield on ${target.name} (${shieldAmount} absorb) (syncing...)`,
          type: 'buff',
        });
        this.notify();
        return;
      }

      // Apply shield
      target.absorbShield = shieldAmount;
      target.absorbShieldMax = shieldAmount;
      target.weakenedSoulDuration = 15; // 15 second debuff

      this.addCombatLogEntry({
        message: `Power Word: Shield on ${target.name} (${shieldAmount} absorb)`,
        type: 'buff',
      });
      this.notify();
      return;
    }

    // Dispel Magic - remove a magic debuff only (Priest)
    if (spell.id === 'dispel_magic') {
      const magicDebuff = target.debuffs.find(d => d.type === 'magic' && d.dispellable !== false);

      if (!magicDebuff) {
        this.addCombatLogEntry({ message: 'No magic effect to dispel!', type: 'system' });
        this.notify();
        return;
      }

      this.state.playerMana -= effectiveManaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime;
      this.state.globalCooldown = GCD_DURATION;

      // Find target index for multiplayer sync
      const targetIndex = this.state.raid.findIndex(m => m.id === target.id);

      // Call multiplayer callback if set
      if (this.onDispelApplied) {
        this.onDispelApplied({
          targetIndex,
          targetId: target.id,
          debuffId: magicDebuff.id,
          spellName: spell.name,
          playerName: this.state.playerName,
        });
      }

      // In multiplayer client mode, don't apply locally - host will sync it
      if (!this.isMultiplayerClient) {
        target.debuffs = target.debuffs.filter(d => d.id !== magicDebuff.id);
        this.state.dispelsDone++;
      }
      this.addCombatLogEntry({ message: `Dispelled ${magicDebuff.name} from ${target.name}`, type: 'buff' });
      this.notify();
      return;
    }

    // Abolish Disease - remove a disease debuff (Priest)
    if (spell.id === 'abolish_disease') {
      const disease = target.debuffs.find(d => d.type === 'disease');

      if (!disease) {
        this.addCombatLogEntry({ message: 'No disease to remove!', type: 'system' });
        this.notify();
        return;
      }

      this.state.playerMana -= effectiveManaCost;
      this.state.lastSpellCastTime = this.state.elapsedTime;
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
        this.state.dispelsDone++;
      }
      this.addCombatLogEntry({ message: `Abolished ${disease.name} from ${target.name}`, type: 'buff' });
      this.notify();
      return;
    }

    // Cast time spells (Holy Light, Flash of Light, Healing Wave, Lesser Healing Wave, Chain Heal, Priest heals)
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
        this.state.playerMana -= effectiveManaCost;
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
          // Recalculate effective mana cost when cast completes (curse may have been dispelled)
          let finalManaCost = this.getEffectiveManaCost(spell.manaCost);

          // Inner Focus makes the next healing spell free (Priest)
          const priestHealingSpellIds = ['greater_heal', 'greater_heal_downrank', 'greater_heal_rank1',
            'flash_heal', 'flash_heal_downrank', 'heal', 'renew', 'prayer_of_healing', 'power_word_shield'];
          if (this.state.innerFocusActive && priestHealingSpellIds.includes(spell.id)) {
            finalManaCost = 0;
          }

          // Check if we still have enough mana when cast completes
          if (this.state.playerMana < finalManaCost) {
            this.addCombatLogEntry({ message: 'Not enough mana!', type: 'system' });
            this.state.isCasting = false;
            this.state.castingSpell = null;
            this.state.castProgress = 0;
            this.notify();
            return;
          }

          // Deduct mana when cast completes
          this.state.playerMana -= finalManaCost;
          this.state.lastSpellCastTime = this.state.elapsedTime; // FSR tracking

          // Use the original target from when cast started (stored in targetId closure)
          const currentTarget = this.state.raid.find(m => m.id === targetId);
          if (currentTarget && currentTarget.isAlive) {
            // Check if this is a Prayer of Healing spell (group heal)
            if (spell.id === 'prayer_of_healing') {
              this.applyPrayerOfHealing(currentTarget, spell);
            }
            // Check if this is a Chain Heal spell
            else if (spell.maxBounces && spell.maxBounces > 0) {
              this.applyChainHeal(currentTarget, spell);
            } else {
              this.applyHeal(currentTarget, spell);

              // Regrowth also applies a HoT after the direct heal
              if (spell.id === 'regrowth') {
                this.applyRegrowthHoT(currentTarget, spell);
              }
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

    // Check for healing reduction debuffs (Gehennas' Curse)
    const healingReductionDebuff = target.debuffs.find(d => d.healingReduction && d.healingReduction > 0);
    if (healingReductionDebuff && healingReductionDebuff.healingReduction) {
      totalHeal = Math.floor(totalHeal * (1 - healingReductionDebuff.healingReduction));
    }

    // Check for crit
    let isCrit = Math.random() * 100 < this.state.critChance;

    // Divine Favor guarantees crit (Paladin)
    if (this.state.divineFavorActive) {
      isCrit = true;
      this.state.divineFavorActive = false;
      this.addCombatLogEntry({ message: 'Divine Favor consumed!', type: 'buff' });
    }

    // Inner Focus gives +25% crit chance (Priest)
    if (this.state.innerFocusActive) {
      // 25% bonus crit chance from Inner Focus
      if (!isCrit && Math.random() * 100 < 25) {
        isCrit = true;
      }
      this.state.innerFocusActive = false;
      this.addCombatLogEntry({ message: 'Inner Focus consumed!', type: 'buff' });
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

    const actualHeal = Math.round(Math.min(totalHeal, target.maxHealth - target.currentHealth));
    const overheal = Math.round(totalHeal - actualHeal);

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

  // Apply Regrowth HoT component after the direct heal
  private applyRegrowthHoT(target: RaidMember, spell: Spell) {
    // Regrowth HoT: 1064 total over 21 seconds (7 ticks, ~152 per tick)
    const baseHealPerTick = 152;
    const spellPowerBonus = Math.floor(this.state.spellPower * 0.10); // HoT portion has lower coefficient
    const healPerTick = baseHealPerTick + spellPowerBonus;

    const hotId = `regrowth_${Date.now()}`;
    const targetIndex = this.state.raid.findIndex(m => m.id === target.id);

    // Call multiplayer callback if set
    if (this.onHealApplied) {
      this.onHealApplied({
        targetIndex,
        targetId: target.id,
        healAmount: 0,
        spellName: 'Regrowth HoT',
        spellId: 'regrowth',
        playerName: this.state.playerName,
        hotData: {
          id: hotId,
          spellId: 'regrowth',
          spellName: 'Regrowth',
          icon: spell.icon,
          remainingDuration: 21,
          maxDuration: 21,
          tickInterval: 3,
          healPerTick: healPerTick,
        },
      });
    }

    // In multiplayer client mode, don't apply locally
    if (this.isMultiplayerClient) {
      this.addCombatLogEntry({ message: `Regrowth HoT applied to ${target.name} (syncing...)`, type: 'heal' });
      return;
    }

    // Check if target already has Regrowth HoT - refresh if so
    if (!target.activeHoTs) target.activeHoTs = [];
    const existingRegrowth = target.activeHoTs.find(h => h.spellId === 'regrowth');

    if (existingRegrowth) {
      // Refresh the HoT
      existingRegrowth.remainingDuration = 21;
      existingRegrowth.maxDuration = 21;
      existingRegrowth.healPerTick = healPerTick;
      existingRegrowth.timeSinceLastTick = 0;
      this.addCombatLogEntry({ message: `Regrowth HoT refreshed on ${target.name}`, type: 'heal' });
    } else {
      // Apply new HoT
      target.activeHoTs.push({
        id: hotId,
        spellId: 'regrowth',
        spellName: 'Regrowth',
        icon: spell.icon,
        casterId: PLAYER_ID,
        casterName: this.state.playerName,
        remainingDuration: 21,
        maxDuration: 21,
        tickInterval: 3,
        timeSinceLastTick: 0,
        healPerTick: healPerTick,
      });
      this.addCombatLogEntry({ message: `Regrowth HoT applied to ${target.name}`, type: 'heal' });
    }
  }

  /**
   * Apply damage to a raid member, consuming absorb shield first if present.
   * Returns the actual damage dealt to health (after shield absorption).
   */
  applyDamageWithShield(target: RaidMember, damage: number): number {
    if (damage <= 0) return 0;

    let remainingDamage = damage;

    // Check for absorb shield (Power Word: Shield)
    if (target.absorbShield && target.absorbShield > 0) {
      const absorbed = Math.min(target.absorbShield, remainingDamage);
      target.absorbShield -= absorbed;
      remainingDamage -= absorbed;

      // Clear shield if fully consumed
      if (target.absorbShield <= 0) {
        target.absorbShield = 0;
        target.absorbShieldMax = 0;
      }
    }

    // Apply remaining damage to health
    if (remainingDamage > 0) {
      target.currentHealth = Math.max(0, target.currentHealth - remainingDamage);
      if (target.currentHealth <= 0) {
        target.isAlive = false;
      }
    }

    return remainingDamage;
  }

  // Prayer of Healing - heals all party members in the target's group
  private applyPrayerOfHealing(target: RaidMember, spell: Spell) {
    // Find all alive members in the target's group
    const groupMembers = this.state.raid.filter(
      m => m.group === target.group && m.isAlive
    );

    // Calculate base heal (same for all targets)
    const baseHeal = spell.healAmount.min + Math.random() * (spell.healAmount.max - spell.healAmount.min);
    const spellPowerBonus = this.state.spellPower * spell.spellPowerCoefficient;
    let totalHeal = Math.floor(baseHeal + spellPowerBonus);

    // Check for crit (one roll for all targets)
    let isCrit = Math.random() * 100 < this.state.critChance;

    // Inner Focus gives +25% crit chance (Priest)
    if (this.state.innerFocusActive) {
      if (!isCrit && Math.random() * 100 < 25) {
        isCrit = true;
      }
      this.state.innerFocusActive = false;
      this.addCombatLogEntry({ message: 'Inner Focus consumed!', type: 'buff' });
    }

    if (isCrit) {
      totalHeal = Math.floor(totalHeal * 1.5);
    }

    // Apply heal to each group member
    let totalActualHeal = 0;
    let totalOverheal = 0;

    groupMembers.forEach(member => {
      // Check for healing reduction debuffs on each member
      let memberHeal = totalHeal;
      const healingReductionDebuff = member.debuffs.find(d => d.healingReduction && d.healingReduction > 0);
      if (healingReductionDebuff && healingReductionDebuff.healingReduction) {
        memberHeal = Math.floor(memberHeal * (1 - healingReductionDebuff.healingReduction));
      }

      const actualHeal = Math.round(Math.min(memberHeal, member.maxHealth - member.currentHealth));
      const overheal = Math.round(memberHeal - actualHeal);

      // Apply healing
      if (!this.isMultiplayerClient) {
        member.currentHealth = Math.min(member.maxHealth, member.currentHealth + memberHeal);
      }

      if (isCrit) {
        member.lastCritHealTime = Date.now();
      }

      totalActualHeal += actualHeal;
      totalOverheal += overheal;
    });

    // Track healing stats
    this.state.healingDone += totalActualHeal;
    this.state.overhealing += totalOverheal;
    this.state.spellHealing[spell.id] = (this.state.spellHealing[spell.id] || 0) + totalActualHeal;

    // Combat log
    this.addCombatLogEntry({
      message: `Prayer of Healing ${isCrit ? 'CRITS' : 'heals'} ${groupMembers.length} targets for ${totalActualHeal}${totalOverheal > 0 ? ` (${totalOverheal} overheal)` : ''}`,
      type: 'heal',
      amount: totalActualHeal,
      isCrit,
    });

    // Illumination: Refund 60% of base mana cost on crit (for Priest talent)
    if (isCrit) {
      const illuminationRefund = Math.floor(spell.manaCost * 0.6);
      this.state.playerMana = Math.min(
        this.state.maxMana,
        this.state.playerMana + illuminationRefund
      );
      this.addCombatLogEntry({
        message: `Illumination! Refunded ${illuminationRefund} mana`,
        type: 'buff',
      });
    }
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
    // Check for healing reduction debuffs (Gehennas' Curse)
    const healingReductionDebuff = target.debuffs.find(d => d.healingReduction && d.healingReduction > 0);
    if (healingReductionDebuff && healingReductionDebuff.healingReduction) {
      healAmount = Math.floor(healAmount * (1 - healingReductionDebuff.healingReduction));
    }

    const actualHeal = Math.round(Math.min(healAmount, target.maxHealth - target.currentHealth));
    const overheal = Math.round(healAmount - actualHeal);

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

  // Handle generic debuff explosion (like Impending Doom) - only damages the target
  private handleDebuffExplosion(member: RaidMember, debuff: Debuff): void {
    const damage = debuff.explosionDamage || 0;

    // Apply damage to the target
    member.currentHealth -= damage;
    if (member.currentHealth <= 0) {
      member.currentHealth = 0;
      this.handleMemberDeath(member);
    }

    this.addCombatLogEntry({
      message: `${debuff.name} exploded on ${member.name} for ${damage} damage!`,
      type: 'damage'
    });
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

      // Update Innervate buff duration (player and AI healers)
      if (this.state.innervateTargetId && this.state.innervateRemainingDuration > 0) {
        this.state.innervateRemainingDuration -= delta;

        // Also update the buff duration on the target's buffs array for UI display
        const innervateTarget = this.state.raid.find(m => m.id === this.state.innervateTargetId);
        if (innervateTarget) {
          const innervateBuff = innervateTarget.buffs.find(b => b.id === 'innervate');
          if (innervateBuff) {
            innervateBuff.duration = Math.max(0, this.state.innervateRemainingDuration);
          }
        }

        // Update AI healer Innervate duration if applicable
        const aiHealer = this.state.aiHealerStats[this.state.innervateTargetId];
        if (aiHealer && aiHealer.innervateActive) {
          aiHealer.innervateRemainingDuration = Math.max(0, this.state.innervateRemainingDuration);
        }

        if (this.state.innervateRemainingDuration <= 0) {
          // Remove the buff from the target
          if (innervateTarget) {
            innervateTarget.buffs = innervateTarget.buffs.filter(b => b.id !== 'innervate');
          }
          // Clear AI healer Innervate if applicable
          if (aiHealer) {
            aiHealer.innervateActive = false;
            aiHealer.innervateRemainingDuration = 0;
          }
          this.state.innervateActive = false;
          this.state.innervateRemainingDuration = 0;
          this.state.innervateTargetId = null;
          this.addCombatLogEntry({
            message: 'Innervate fades.',
            type: 'buff',
          });
        }
      }

      // Update Power Infusion buff duration
      if (this.state.powerInfusionTargetId && this.state.powerInfusionDuration > 0) {
        this.state.powerInfusionDuration -= delta;

        // Also update the buff duration on the target's buffs array for UI display
        const piTarget = this.state.raid.find(m => m.id === this.state.powerInfusionTargetId);
        if (piTarget) {
          const piBuff = piTarget.buffs.find(b => b.id === 'power_infusion');
          if (piBuff) {
            piBuff.duration = Math.max(0, this.state.powerInfusionDuration);
          }
        }

        if (this.state.powerInfusionDuration <= 0) {
          // Remove the buff from the target
          if (piTarget) {
            piTarget.buffs = piTarget.buffs.filter(b => b.id !== 'power_infusion');
          }
          this.addCombatLogEntry({
            message: 'Power Infusion fades.',
            type: 'buff',
          });
          this.state.powerInfusionTargetId = null;
          this.state.powerInfusionDuration = 0;
        }
      }

      // Mana regen with Five-Second Rule (FSR)
      // Innervate: 400% mana regen AND allows 100% regen while casting
      const innervateActive = this.state.innervateActive;
      if (!this.state.isCasting || innervateActive) {
        const timeSinceLastCast = this.state.elapsedTime - this.state.lastSpellCastTime;
        const isInFSR = timeSinceLastCast < 5; // Within 5-second rule

        // Get MP5 from gear
        const mp5FromGear = this.computePlayerStats().totalMp5;

        // Innervate multiplier: 400% = 5x total (100% base + 400% bonus)
        const innervateMultiplier = innervateActive ? 5 : 1;

        if (isInFSR && !innervateActive) {
          // Inside FSR (without Innervate): Only MP5 from gear works
          const mp5Regen = (mp5FromGear / 5) * delta;
          this.state.playerMana = Math.min(this.state.maxMana, this.state.playerMana + mp5Regen);
        } else {
          // Outside FSR OR with Innervate active: Full regen (with Innervate bonus)
          const baseRegen = 10; // Base per-second regen
          const spiritRegen = this.getSpiritBasedRegen();
          const mp5Regen = mp5FromGear / 5;
          const totalRegen = (baseRegen + spiritRegen + mp5Regen) * delta * innervateMultiplier;
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

            // Garr: Eruption damage on each Firesworn death (phase transition)
            if (this.state.boss.id === 'garr' && transition.phase <= 9) {
              const eruptionDamage = 500 + Math.floor(Math.random() * 301); // 500-800
              const eruptionEnrageMultiplier = this.state.bossEnraged ? 3.0 : 1.0;
              this.state.raid.forEach(member => {
                if (member.isAlive) {
                  const damage = this.calculateDamageReduction(member, eruptionDamage * eruptionEnrageMultiplier, 'fire');
                  member.currentHealth -= damage;
                  if (member.currentHealth <= 0) {
                    member.currentHealth = 0;
                    this.handleMemberDeath(member);
                  }
                }
              });
              this.addCombatLogEntry({
                message: `Eruption deals ${eruptionDamage} fire damage to the raid!`,
                type: 'damage',
                amount: eruptionDamage
              });

              // When the last Firesworn dies (phase 9), refill Garr's health to 100%
              if (transition.phase === 9) {
                this.state.boss.currentHealth = this.state.boss.maxHealth;
                this.addCombatLogEntry({
                  message: `Garr roars in fury! His health is restored!`,
                  type: 'system'
                });
              }
            }

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
          let damage = Math.floor(event.damage * enrageMultiplier);

          // Apply Inspire multiplier for Sulfuron (priests deal +25% damage)
          if (this.state.boss?.isInspired && this.state.boss.id === 'sulfuron') {
            damage = Math.floor(damage * 1.25);
          }

          // Get damage type for resistance calculations (default to physical)
          const damageType: DamageType = event.damageType || 'physical';

          switch (event.type) {
            case 'tank_damage': {
              const tank = this.state.raid.find(m => m.role === 'tank' && m.isAlive);
              if (tank) {
                // Frenzy increases boss attack speed by 150% - effectively 2.5x damage
                let tankDamage = damage;
                if (this.state.boss?.isFrenzied) {
                  tankDamage *= 2.5;
                }
                const reducedDamage = this.calculateDamageReduction(tank, tankDamage, damageType);
                // Use shield-aware damage application
                this.applyDamageWithShield(tank, reducedDamage);
                if (tank.currentHealth <= 0) {
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
                // Use shield-aware damage application
                this.applyDamageWithShield(member, reducedDamage);
                if (member.currentHealth <= 0) {
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
                // Use shield-aware damage application
                this.applyDamageWithShield(target, reducedDamage);
                if (target.currentHealth <= 0) {
                  this.handleMemberDeath(target);
                }
              }
              break;
            }

            case 'debuff': {
              if (event.debuffId) {
                const template = DEBUFFS[event.debuffId];
                if (template) {
                  let alive = this.state.raid.filter(m => m.isAlive);

                  // Filter by targetZones if specified (e.g., Panic only hits melee/tanks, Magma Spit only melee)
                  if (template.targetZones && template.targetZones.length > 0) {
                    alive = alive.filter(m => template.targetZones!.includes(m.positionZone));
                  }

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
                      // Check for stacking debuffs (like Magma Spit)
                      if (template.maxStacks) {
                        const existingDebuff = target.debuffs.find(d => d.id === template.id);
                        if (existingDebuff) {
                          // Add a stack (up to max)
                          const currentStacks = existingDebuff.stacks || 1;
                          if (currentStacks < template.maxStacks) {
                            existingDebuff.stacks = currentStacks + 1;
                            existingDebuff.duration = template.maxDuration || 30; // Refresh duration
                            this.addCombatLogEntry({
                              message: `${target.name}'s ${template.name} stacks to ${existingDebuff.stacks}!`,
                              type: 'debuff'
                            });
                          }
                          return; // Don't add a new debuff, we stacked it
                        }
                      }

                      const debuff = { ...template, duration: template.maxDuration || 15, stacks: 1 };

                      // Special handling for Dominate Mind - pick an MC target
                      if (template.isMindControl) {
                        // Pick a random raid member (not the MC'd player) to attack
                        const potentialTargets = this.state.raid.filter(m => m.isAlive && m.id !== target.id);
                        if (potentialTargets.length > 0) {
                          const mcTarget = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
                          debuff.mcTargetId = mcTarget.id;

                          // Fire MC warning callback
                          if (this.onMindControlWarning) {
                            this.onMindControlWarning(target.name, mcTarget.name);
                          }

                          this.addCombatLogEntry({
                            message: `${target.name} is MIND CONTROLLED and attacking ${mcTarget.name}!`,
                            type: 'damage'
                          });
                        }
                      }

                      target.debuffs.push(debuff);
                      this.addCombatLogEntry({ message: `${target.name} is afflicted by ${template.name}!`, type: 'debuff' });
                    });
                  }
                }
              }
              break;
            }

            case 'inferno': {
              // Baron Geddon's Inferno - 1-3 melee players "forget" to move and take the Inferno debuff
              // Uses positionZone which is properly set based on class/spec
              const template = DEBUFFS['inferno'];
              if (template) {
                const alive = this.state.raid.filter(m => m.isAlive);

                // Use positionZone to determine melee vs ranged (already set correctly per class/spec)
                // Melee zone includes warriors, rogues, feral druids, enhancement shamans, ret paladins
                // Tank zone is also in melee range
                const meleeMembers = alive.filter(m => m.positionZone === 'melee' || m.positionZone === 'tank');
                const rangedMembers = alive.filter(m => m.positionZone === 'ranged');

                // 90% chance from melee, 10% chance from ranged for each target
                const numTargets = 1 + Math.floor(Math.random() * 3); // 1-3 targets
                const targets: typeof alive = [];

                for (let i = 0; i < numTargets && (meleeMembers.length > 0 || rangedMembers.length > 0); i++) {
                  const pool = Math.random() < 0.9 && meleeMembers.length > 0 ? meleeMembers : rangedMembers;
                  if (pool.length > 0) {
                    const idx = Math.floor(Math.random() * pool.length);
                    const target = pool[idx];
                    // Remove from both pools to avoid duplicates
                    const meleeIdx = meleeMembers.indexOf(target);
                    if (meleeIdx > -1) meleeMembers.splice(meleeIdx, 1);
                    const rangedIdx = rangedMembers.indexOf(target);
                    if (rangedIdx > -1) rangedMembers.splice(rangedIdx, 1);
                    targets.push(target);
                  }
                }

                if (targets.length > 0) {
                  // Fire the inferno warning callback (handled by App.tsx)
                  if (this.onInfernoWarning) {
                    this.onInfernoWarning(targets.map(t => t.name));
                  }

                  // Combat log in red - who forgot to move
                  const names = targets.map(t => t.name).join(', ');
                  this.addCombatLogEntry({
                    message: `INFERNO! ${names} forgot to move!`,
                    type: 'damage'
                  });

                  // Apply inferno debuff to targets
                  targets.forEach(target => {
                    target.debuffs.push({ ...template, duration: template.maxDuration || 8 });
                    this.addCombatLogEntry({
                      message: `${target.name} is being burned by Inferno!`,
                      type: 'debuff'
                    });
                  });
                }
              }
              break;
            }

            case 'frenzy': {
              // Magmadar's Frenzy - boss enrages, increases tank damage
              // Only hunters with Tranquilizing Shot can remove this!
              if (this.state.boss) {
                this.state.boss.isFrenzied = true;

                // Only set end time if there's a living hunter to Tranq Shot
                const hunter = this.state.raid.find(m => m.class === 'hunter' && m.isAlive);
                if (hunter) {
                  this.state.boss.frenzyEndTime = this.state.elapsedTime + 2; // Hunter Tranqs after 2 seconds
                } else {
                  // No hunter - frenzy persists indefinitely!
                  this.state.boss.frenzyEndTime = undefined;
                }

                this.addCombatLogEntry({
                  message: `${this.state.boss.name} goes into a FRENZY!${!hunter ? ' No hunter to Tranq Shot!' : ''}`,
                  type: 'damage'
                });

                // Apply burst damage to tank immediately
                const tank = this.state.raid.find(m => m.role === 'tank' && m.isAlive);
                if (tank) {
                  const frenzyDamage = 1200 * enrageMultiplier;
                  tank.currentHealth -= frenzyDamage;
                  if (tank.currentHealth <= 0) {
                    tank.currentHealth = 0;
                    this.handleMemberDeath(tank);
                  }
                  this.addCombatLogEntry({
                    message: `${tank.name} takes ${Math.round(frenzyDamage)} frenzy damage!`,
                    type: 'damage',
                    amount: Math.round(frenzyDamage)
                  });
                }
              }
              break;
            }

            case 'lava_bomb': {
              // Magmadar's Lava Bomb - undispellable fire DoT
              // Random chance (20%) the target doesn't move and takes full damage
              const template = DEBUFFS['lava_bomb'];
              if (template) {
                const alive = this.state.raid.filter(m => m.isAlive);
                if (alive.length > 0) {
                  const target = alive[Math.floor(Math.random() * alive.length)];

                  // 20% chance player "doesn't move" and gets the full DoT
                  const didntMove = Math.random() < 0.2;

                  if (didntMove) {
                    // Apply the lava bomb debuff
                    target.debuffs.push({
                      ...template,
                      duration: template.maxDuration || 8,
                      damageType: 'fire',
                    });

                    // Fire a warning similar to inferno
                    if (this.onLavaBombWarning) {
                      this.onLavaBombWarning(target.name);
                    }

                    this.addCombatLogEntry({
                      message: `LAVA BOMB! ${target.name} didn't move!`,
                      type: 'damage'
                    });
                  } else {
                    // Player moved - small splash damage
                    const splashDamage = 400 * enrageMultiplier;
                    target.currentHealth -= splashDamage;
                    if (target.currentHealth <= 0) {
                      target.currentHealth = 0;
                      this.handleMemberDeath(target);
                    }
                    this.addCombatLogEntry({
                      message: `${target.name} moved from Lava Bomb (${Math.round(splashDamage)} splash)`,
                      type: 'damage',
                      amount: Math.round(splashDamage)
                    });
                  }
                }
              }
              break;
            }

            case 'rain_of_fire': {
              // Gehennas' Rain of Fire - hits 5 random players with a fire DoT
              // After first tick (2 seconds), some players might "not move" and take full damage
              const template = DEBUFFS['rain_of_fire'];
              if (template) {
                const alive = this.state.raid.filter(m => m.isAlive);
                if (alive.length > 0) {
                  // Target 5 random players
                  const targets = alive.sort(() => Math.random() - 0.5).slice(0, 5);

                  targets.forEach(target => {
                    // First tick always hits (700 damage)
                    const firstTickDamage = this.calculateDamageReduction(target, 700 * enrageMultiplier, 'fire');
                    target.currentHealth -= firstTickDamage;
                    if (target.currentHealth <= 0) {
                      target.currentHealth = 0;
                      this.handleMemberDeath(target);
                    }

                    // Log the initial damage for everyone
                    this.addCombatLogEntry({
                      message: `${target.name} takes ${Math.round(firstTickDamage)} fire damage from Rain of Fire`,
                      type: 'damage',
                      amount: Math.round(firstTickDamage)
                    });

                    // 25% chance player "didn't move" and gets the full DoT
                    const didntMove = Math.random() < 0.25;

                    if (didntMove && target.isAlive) {
                      // Apply the rain of fire debuff for remaining duration (4 more seconds = 2 more ticks)
                      target.debuffs.push({
                        ...template,
                        duration: 4, // 4 seconds remaining (2 more ticks of 700)
                        damageType: 'fire',
                      });

                      this.addCombatLogEntry({
                        message: `${target.name} didn't move from Rain of Fire!`,
                        type: 'damage'
                      });
                    }
                  });
                }
              }
              break;
            }

            case 'antimagic_pulse': {
              // Garr's Antimagic Pulse - removes 1 buff from player and all AI raiders
              // Remove 1 random buff from player (includes world buffs, consumables, blessings)
              if (this.state.playerBuffs.length > 0) {
                const randomIndex = Math.floor(Math.random() * this.state.playerBuffs.length);
                const removedBuff = this.state.playerBuffs[randomIndex];
                this.state.playerBuffs.splice(randomIndex, 1);

                // Also remove from activeWorldBuffs if it was a world buff
                const worldBuffIndex = this.state.activeWorldBuffs.indexOf(removedBuff.id);
                if (worldBuffIndex >= 0) {
                  this.state.activeWorldBuffs.splice(worldBuffIndex, 1);
                }

                // Also remove from activeConsumables if it was a consumable
                const consumableIndex = this.state.activeConsumables.indexOf(removedBuff.id);
                if (consumableIndex >= 0) {
                  this.state.activeConsumables.splice(consumableIndex, 1);
                }

                this.addCombatLogEntry({
                  message: `Antimagic Pulse dispels ${removedBuff.name} from you!`,
                  type: 'debuff'
                });
              }

              // Remove 1 random buff from each AI raider (not auras - they're automatic)
              this.state.raid.forEach(member => {
                if (member.isAlive && member.buffs.length > 0) {
                  // Filter to only removable buffs (not auras which start with 'aura_')
                  const removableBuffs = member.buffs.filter(b => !b.id.startsWith('aura_'));
                  if (removableBuffs.length > 0) {
                    const randomBuff = removableBuffs[Math.floor(Math.random() * removableBuffs.length)];
                    member.buffs = member.buffs.filter(b => b.id !== randomBuff.id);
                  }
                }
              });
              break;
            }

            case 'shazzrah_curse': {
              // Shazzrah's Curse - applies curse to entire raid that doubles magic damage taken for 5 minutes
              // Cast every 10 seconds to everyone - curse type so only mages/druids can dispel
              const curseDebuff = DEBUFFS.shazzrahs_curse;
              const curseDuration = curseDebuff.maxDuration || 300; // 5 minutes default
              this.state.raid.forEach(member => {
                if (!member.isAlive) return;
                // Check if they already have the curse - if so, refresh duration
                const existingCurse = member.debuffs.find(d => d.id === 'shazzrahs_curse');
                if (existingCurse) {
                  existingCurse.duration = curseDuration;
                } else {
                  member.debuffs.push({
                    ...curseDebuff,
                    duration: curseDuration,
                  });
                }
              });
              this.addCombatLogEntry({
                message: `Shazzrah casts Shazzrah's Curse! Magic damage taken doubled!`,
                type: 'damage'
              });
              break;
            }

            case 'shazzrah_blink': {
              // Shazzrah Blinks to a random player and casts Arcane Explosion
              const aliveTargets = this.state.raid.filter(m => m.isAlive);
              if (aliveTargets.length > 0) {
                const blinkTarget = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];

                // Log the blink
                this.addCombatLogEntry({
                  message: `Shazzrah blinks to ${blinkTarget.name}!`,
                  type: 'system'
                });

                // Arcane Explosion hits the ENTIRE RAID - this is the dangerous part!
                const baseArcaneExplosionDamage = event.damage; // 500 arcane damage base

                aliveTargets.forEach(target => {
                  if (!target.isAlive) return;

                  let damage = baseArcaneExplosionDamage * enrageMultiplier;

                  // Check for Shazzrah's Curse - doubles magic damage taken
                  const hasCurse = target.debuffs.some(d => d.increasesMagicDamageTaken);
                  if (hasCurse) {
                    damage *= 2; // Double damage from curse - 1000 damage if cursed!
                  }

                  damage = this.calculateDamageReduction(target, damage, 'arcane');
                  target.currentHealth -= damage;

                  if (target.currentHealth <= 0) {
                    target.currentHealth = 0;
                    this.handleMemberDeath(target);
                  }
                });

                // Count how many had the curse for the log message
                const cursedCount = aliveTargets.filter(t => t.debuffs.some(d => d.increasesMagicDamageTaken)).length;
                const logDamage = cursedCount > 0
                  ? `${Math.round(baseArcaneExplosionDamage * enrageMultiplier)}-${Math.round(baseArcaneExplosionDamage * 2 * enrageMultiplier)}`
                  : `${Math.round(baseArcaneExplosionDamage * enrageMultiplier)}`;

                this.addCombatLogEntry({
                  message: `Shazzrah's Arcane Explosion hits the ENTIRE RAID for ${logDamage} arcane damage!${cursedCount > 0 ? ` (${cursedCount} cursed!)` : ''}`,
                  type: 'damage'
                });
              }
              break;
            }

            case 'deaden_magic': {
              // Shazzrah gains Deaden Magic - reduces magic damage taken by 50% for 30 seconds
              // This acts like Frenzy - makes the raid frame glow red
              // Can be dispelled by Priest or Purged by Shaman
              if (this.state.boss) {
                this.state.boss.hasDeadenMagic = true;
                this.state.boss.deadenMagicEndTime = this.state.elapsedTime + 30;

                this.addCombatLogEntry({
                  message: `Shazzrah gains Deaden Magic! Magic damage reduced by 50%! Dispel or Purge it!`,
                  type: 'system'
                });
              }
              break;
            }

            // ===== SULFURON HARBINGER ABILITIES =====
            case 'hand_of_ragnaros': {
              // Hand of Ragnaros: Hits all tanks and TRUE melee DPS for fire damage + 2 second stun
              // Melee classes: Warriors, Rogues, Feral Druids, Ret Paladins, Enhancement Shamans
              const meleeClasses: WoWClass[] = ['warrior', 'rogue'];
              const meleeSpecs: WoWSpec[] = ['feral_dps', 'feral_tank', 'retribution', 'enhancement', 'arms', 'fury'];

              const meleeTargets = this.state.raid.filter(m => {
                if (!m.isAlive) return false;
                if (m.role === 'tank') return true; // Tanks always get hit
                // Check if this is a melee DPS class/spec
                if (meleeClasses.includes(m.class)) return true;
                if (m.spec && meleeSpecs.includes(m.spec)) return true;
                return false;
              });

              meleeTargets.forEach(target => {
                let damage = event.damage * enrageMultiplier;
                damage = this.calculateDamageReduction(target, damage, 'fire');
                target.currentHealth -= damage;

                // Apply stun debuff (2 seconds)
                target.debuffs.push({
                  ...DEBUFFS.hand_of_ragnaros,
                  duration: 2,
                });

                if (target.currentHealth <= 0) {
                  target.currentHealth = 0;
                  this.handleMemberDeath(target);
                }
              });

              this.addCombatLogEntry({
                message: `Sulfuron casts Hand of Ragnaros! ${meleeTargets.length} melee stunned for ${Math.round(event.damage * enrageMultiplier)} fire damage!`,
                type: 'damage'
              });
              break;
            }

            case 'inspire': {
              // Inspire: Sulfuron buffs the Flamewaker Priests (+25% damage for 10 seconds)
              if (this.state.boss) {
                this.state.boss.isInspired = true;
                this.state.boss.inspireEndTime = this.state.elapsedTime + 10;

                this.addCombatLogEntry({
                  message: `Sulfuron casts Inspire! Flamewaker Priests deal +25% damage!`,
                  type: 'system'
                });
              }
              break;
            }

            case 'dark_mending': {
              // Dark Mending: Priest tries to heal another priest
              // 70% chance AI DPS interrupts, 30% chance heal goes through
              if (!this.state.boss?.adds) break;

              // Find alive priests that aren't at full health
              const alivePriests = this.state.boss.adds.filter(a => a.isAlive);
              const damagedPriests = alivePriests.filter(a => a.currentHealth < a.maxHealth);

              if (damagedPriests.length === 0 || alivePriests.length === 0) break; // No one to heal

              const interrupted = Math.random() < 0.7;

              if (interrupted) {
                // Find an interrupter (rogue, warrior, mage, shaman)
                const interrupters = this.state.raid.filter(m =>
                  m.isAlive && ['rogue', 'warrior', 'mage', 'shaman'].includes(m.class)
                );
                const interrupter = interrupters[Math.floor(Math.random() * interrupters.length)];
                const interruptName = interrupter?.name || 'A DPS';

                // Class-appropriate interrupt ability
                let interruptAbility = 'interrupts';
                if (interrupter?.class === 'rogue') interruptAbility = 'Kicks';
                else if (interrupter?.class === 'warrior') interruptAbility = 'uses Pummel on';
                else if (interrupter?.class === 'mage') interruptAbility = 'Counterspells';
                else if (interrupter?.class === 'shaman') interruptAbility = 'Earth Shocks';

                this.addCombatLogEntry({
                  message: `${interruptName} ${interruptAbility} Dark Mending!`,
                  type: 'buff'
                });
              } else {
                // Heal goes through - pick the most damaged priest
                const targetPriest = damagedPriests.reduce((a, b) =>
                  a.currentHealth < b.currentHealth ? a : b
                );

                const healAmount = targetPriest.maxHealth * 0.15; // 15% heal
                targetPriest.currentHealth = Math.min(
                  targetPriest.maxHealth,
                  targetPriest.currentHealth + healAmount
                );

                this.addCombatLogEntry({
                  message: `Dark Mending heals ${targetPriest.name} for ${Math.round(healAmount)}!`,
                  type: 'heal'
                });
              }
              break;
            }

            case 'sulfuron_immolate': {
              // Immolate: Random target hit for fire damage + fire DoT
              const aliveTargets = this.state.raid.filter(m => m.isAlive);
              if (aliveTargets.length > 0) {
                const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];

                // Instant damage: 750-850
                const burstDamage = 750 + Math.floor(Math.random() * 101);
                let damage = burstDamage * enrageMultiplier;
                damage = this.calculateDamageReduction(target, damage, 'fire');
                target.currentHealth -= damage;

                // Apply DoT: 380-420 over 3 seconds
                const dotDamage = 380 + Math.floor(Math.random() * 41);
                target.debuffs.push({
                  ...DEBUFFS.immolate,
                  duration: 3,
                  damagePerTick: Math.round(dotDamage / 3),
                });

                this.addCombatLogEntry({
                  message: `Immolate hits ${target.name} for ${Math.round(damage)} fire damage!`,
                  type: 'damage'
                });

                if (target.currentHealth <= 0) {
                  target.currentHealth = 0;
                  this.handleMemberDeath(target);
                }
              }
              break;
            }

            // ===== GOLEMAGG THE INCINERATOR ABILITIES =====
            case 'golemagg_magma_splash': {
              // Magma Splash: Stacking fire DoT on current Golemagg tank
              if (!this.state.boss?.golemaggTanks) break;

              const tanks = this.state.boss.golemaggTanks;
              const currentTankId = tanks.currentMainTank === 1 ? tanks.tank1Id : tanks.tank2Id;
              const currentTank = this.state.raid.find(m => m.id === currentTankId);

              if (!currentTank?.isAlive) break;

              // Check if stacks have fallen off on the current tank - if so, reset threshold
              const existingMagmaSplashCheck = currentTank.debuffs.find(d => d.id === 'magma_splash');
              if (!existingMagmaSplashCheck && tanks.nextSwapThreshold > 5) {
                // Stacks fell off, reset threshold back to 5
                tanks.nextSwapThreshold = 5;
                this.addCombatLogEntry({
                  message: `Magma Splash stacks fell off! Tank swap threshold reset.`,
                  type: 'system'
                });
              }

              // Add/increment Magma Splash stack
              const existingMagmaSplash = currentTank.debuffs.find(d => d.id === 'magma_splash');
              if (existingMagmaSplash) {
                existingMagmaSplash.stacks = (existingMagmaSplash.stacks || 1) + 1;
                existingMagmaSplash.duration = 30; // Refresh duration
              } else {
                currentTank.debuffs.push({
                  ...DEBUFFS.magma_splash,
                  duration: 30,
                  stacks: 1,
                });
              }

              // Update tracked stacks
              const currentStacks = (existingMagmaSplash?.stacks || 1);
              if (tanks.currentMainTank === 1) {
                tanks.tank1Stacks = currentStacks;
              } else {
                tanks.tank2Stacks = currentStacks;
              }

              // Calculate threshold for warnings (swap at threshold, late at threshold+2)
              const swapThreshold = tanks.nextSwapThreshold;
              const lateThreshold = swapThreshold + 2;

              // Log when stacks get high and show warning
              if (currentStacks >= swapThreshold - 1) {
                this.addCombatLogEntry({
                  message: `${currentTank.name} has ${currentStacks} stacks of Magma Splash!`,
                  type: 'damage'
                });
                // Show warning when stacks are approaching threshold
                if (currentStacks >= swapThreshold) {
                  this.state.tankSwapWarning = {
                    message: `TANK SWAP NEEDED! ${currentTank.name} at ${currentStacks} stacks!`,
                    type: 'stacks_high'
                  };
                }
              }

              // Check for tank swap (should happen at threshold, but sometimes delayed)
              const timeSinceSwap = this.state.elapsedTime - tanks.lastSwapTime;

              // At threshold: 70% chance to swap on time, 30% chance delayed
              // At lateThreshold: always swap (tanks finally notice)
              if (currentStacks >= swapThreshold && timeSinceSwap > 10) {
                const shouldSwapNow = currentStacks >= lateThreshold || Math.random() < 0.7;

                if (shouldSwapNow) {
                  tanks.currentMainTank = tanks.currentMainTank === 1 ? 2 : 1;
                  tanks.lastSwapTime = this.state.elapsedTime;
                  // Increase threshold for next swap (5 -> 10 -> 15, etc.)
                  tanks.nextSwapThreshold = swapThreshold + 5;

                  const newTank = this.state.raid.find(m =>
                    m.id === (tanks.currentMainTank === 1 ? tanks.tank1Id : tanks.tank2Id)
                  );

                  if (currentStacks >= lateThreshold) {
                    this.addCombatLogEntry({
                      message: `${newTank?.name} finally taunts Golemagg! (Late swap at ${currentStacks} stacks!)`,
                      type: 'system'
                    });
                    // Show LATE swap warning
                    this.state.tankSwapWarning = {
                      message: `LATE SWAP! ${newTank?.name} taunts at ${currentStacks} stacks!`,
                      type: 'late_swap'
                    };
                  } else {
                    this.addCombatLogEntry({
                      message: `${newTank?.name} taunts Golemagg! (Next swap at ${tanks.nextSwapThreshold} stacks)`,
                      type: 'system'
                    });
                    // Show normal swap notification
                    this.state.tankSwapWarning = {
                      message: `TANK SWAP! ${newTank?.name} taunts Golemagg!`,
                      type: 'swap'
                    };
                  }

                  // Clear warning after 3 seconds
                  setTimeout(() => {
                    if (this.state.tankSwapWarning?.type === 'swap' || this.state.tankSwapWarning?.type === 'late_swap') {
                      this.state.tankSwapWarning = null;
                      this.notify();
                    }
                  }, 3000);
                } else {
                  this.addCombatLogEntry({
                    message: `Tank swap delayed! Magma Splash at ${currentStacks} stacks!`,
                    type: 'damage'
                  });
                }
              }
              break;
            }

            case 'golemagg_pyroblast': {
              // Pyroblast: Random raid member hit for fire damage + fire DoT
              const pyroblastTargets = this.state.raid.filter(m => m.isAlive);
              if (pyroblastTargets.length === 0) break;

              const target = pyroblastTargets[Math.floor(Math.random() * pyroblastTargets.length)];

              // Instant damage: 1388-1612
              const instantDamage = 1388 + Math.floor(Math.random() * 225);
              let damage = instantDamage * enrageMultiplier;
              damage = this.calculateDamageReduction(target, damage, 'fire');
              target.currentHealth -= damage;

              // Apply DoT: 200 damage every 3 seconds for 12 seconds
              target.debuffs.push({
                ...DEBUFFS.golemagg_pyroblast,
                duration: 12,
              });

              this.addCombatLogEntry({
                message: `Pyroblast hits ${target.name} for ${Math.round(damage)} fire damage!`,
                type: 'damage'
              });

              if (target.currentHealth <= 0) {
                target.currentHealth = 0;
                this.handleMemberDeath(target);
              }
              break;
            }

            case 'core_rager_mangle': {
              // Mangle: DoT on target (dog tank normally, or loose rager targets)
              if (!this.state.boss?.golemaggTanks) break;

              const tanks = this.state.boss.golemaggTanks;
              const dogTank = this.state.raid.find(m => m.id === tanks.coreRagerTankId);

              // Helper to apply mangle to a target
              const applyMangle = (target: RaidMember) => {
                const existingMangle = target.debuffs.find(d => d.id === 'mangle');
                if (existingMangle) {
                  existingMangle.duration = 20; // Refresh
                } else {
                  target.debuffs.push({
                    ...DEBUFFS.mangle,
                    duration: 20,
                  });
                }
                this.addCombatLogEntry({
                  message: `Core Rager Mangles ${target.name}!`,
                  type: 'damage'
                });
              };

              if (tanks.ragersLoose) {
                // Ragers are loose - apply mangle to their current targets
                const target1 = this.state.raid.find(m => m.id === tanks.ragerTarget1);
                const target2 = this.state.raid.find(m => m.id === tanks.ragerTarget2);

                if (target1?.isAlive) applyMangle(target1);
                if (target2?.isAlive && target2.id !== target1?.id) applyMangle(target2);
              } else if (dogTank?.isAlive) {
                // Normal behavior - mangle the dog tank
                applyMangle(dogTank);
              }
              break;
            }

            case 'core_rager_melee': {
              // Core Rager melee: Two dogs attacking
              if (!this.state.boss?.golemaggTanks) break;

              const tanks = this.state.boss.golemaggTanks;
              const dogTank = this.state.raid.find(m => m.id === tanks.coreRagerTankId);

              // Check if dog tank is alive - if not, ragers go loose!
              if (!dogTank?.isAlive && !tanks.ragersLoose) {
                tanks.ragersLoose = true;
                this.addCombatLogEntry({
                  message: `CORE RAGERS ARE LOOSE! They're attacking the raid!`,
                  type: 'damage'
                });
                // Set raid warning
                this.state.tankSwapWarning = {
                  message: `CORE RAGERS LOOSE! Dog tank is dead!`,
                  type: 'late_swap'
                };
              }

              if (tanks.ragersLoose) {
                // Ragers are loose - each attacks a random DPS/healer
                const availableTargets = this.state.raid.filter(m =>
                  m.isAlive && m.role !== 'tank' // Don't attack tanks, they're busy with Golemagg
                );

                if (availableTargets.length === 0) break;

                // Helper to get or pick a new target for a rager
                const getOrPickTarget = (currentTargetId: string | null): string => {
                  const currentTarget = this.state.raid.find(m => m.id === currentTargetId);
                  if (currentTarget?.isAlive) {
                    return currentTargetId!;
                  }
                  // Pick a new random target
                  const newTarget = availableTargets[Math.floor(Math.random() * availableTargets.length)];
                  return newTarget.id;
                };

                // Rager 1 attacks
                tanks.ragerTarget1 = getOrPickTarget(tanks.ragerTarget1);
                const target1 = this.state.raid.find(m => m.id === tanks.ragerTarget1);
                if (target1?.isAlive) {
                  let damage1 = event.damage * enrageMultiplier;
                  damage1 = this.calculateDamageReduction(target1, damage1, 'physical');
                  target1.currentHealth -= damage1;

                  if (target1.currentHealth <= 0) {
                    target1.currentHealth = 0;
                    this.handleMemberDeath(target1);
                    this.addCombatLogEntry({
                      message: `Core Rager mauls ${target1.name} to death!`,
                      type: 'damage'
                    });
                    tanks.ragerTarget1 = null; // Will pick new target next tick
                  }
                }

                // Rager 2 attacks (different target if possible)
                if (!tanks.ragerTarget2 || !this.state.raid.find(m => m.id === tanks.ragerTarget2)?.isAlive) {
                  const otherTargets = availableTargets.filter(t => t.id !== tanks.ragerTarget1 && t.isAlive);
                  if (otherTargets.length > 0) {
                    tanks.ragerTarget2 = otherTargets[Math.floor(Math.random() * otherTargets.length)].id;
                  } else if (availableTargets.length > 0) {
                    // No other targets, both ragers attack same person
                    tanks.ragerTarget2 = tanks.ragerTarget1;
                  }
                }

                const target2 = this.state.raid.find(m => m.id === tanks.ragerTarget2);
                if (target2?.isAlive) {
                  let damage2 = event.damage * enrageMultiplier;
                  damage2 = this.calculateDamageReduction(target2, damage2, 'physical');
                  target2.currentHealth -= damage2;

                  if (target2.currentHealth <= 0) {
                    target2.currentHealth = 0;
                    this.handleMemberDeath(target2);
                    this.addCombatLogEntry({
                      message: `Core Rager mauls ${target2.name} to death!`,
                      type: 'damage'
                    });
                    tanks.ragerTarget2 = null; // Will pick new target next tick
                  }
                }
              } else {
                // Normal behavior - both dogs on the dog tank
                // Two dogs attacking = double damage
                let damage = event.damage * 2 * enrageMultiplier;
                damage = this.calculateDamageReduction(dogTank!, damage, 'physical');
                dogTank!.currentHealth -= damage;

                if (dogTank!.currentHealth <= 0) {
                  dogTank!.currentHealth = 0;
                  this.handleMemberDeath(dogTank!);
                }
              }
              break;
            }

            case 'golemagg_earthquake': {
              // Earthquake: AoE hitting all melee players (phase 2 only - 10% health)
              const meleeClasses: WoWClass[] = ['warrior', 'rogue'];
              const meleeSpecs: WoWSpec[] = ['feral_dps', 'feral_tank', 'retribution', 'enhancement', 'arms', 'fury'];

              const meleeTargets = this.state.raid.filter(m => {
                if (!m.isAlive) return false;
                if (m.role === 'tank') return true;
                if (meleeClasses.includes(m.class)) return true;
                if (m.spec && meleeSpecs.includes(m.spec)) return true;
                return false;
              });

              meleeTargets.forEach(target => {
                // 1388-1612 damage
                const baseDamage = 1388 + Math.floor(Math.random() * 225);
                let damage = baseDamage * enrageMultiplier;
                damage = this.calculateDamageReduction(target, damage, 'physical');
                target.currentHealth -= damage;

                if (target.currentHealth <= 0) {
                  target.currentHealth = 0;
                  this.handleMemberDeath(target);
                }
              });

              this.addCombatLogEntry({
                message: `Earthquake hits ${meleeTargets.length} melee for massive damage!`,
                type: 'damage'
              });
              break;
            }

            // =========================================================================
            // MAJORDOMO EXECUTUS - 8 adds, Magic Reflection, Teleport, Healer heals
            // =========================================================================

            case 'majordomo_teleport': {
              // Teleport: Majordomo teleports his tank into the fire pit - fire DoT
              if (!this.state.boss?.majordomoTanks) break;

              const majordomoTankMember = this.state.raid.find(m =>
                m.id === this.state.boss!.majordomoTanks!.majordomoTankId
              );

              if (!majordomoTankMember?.isAlive) break;

              // Apply Teleport fire DoT
              const existingTeleport = majordomoTankMember.debuffs.find(d => d.id === 'majordomo_teleport');
              if (!existingTeleport) {
                majordomoTankMember.debuffs.push({
                  ...DEBUFFS.majordomo_teleport,
                  duration: 5,
                });
                this.addCombatLogEntry({
                  message: `Majordomo teleports ${majordomoTankMember.name} into the fire pit!`,
                  type: 'damage'
                });
              }
              break;
            }

            case 'majordomo_elite_melee': {
              // Elite melee: Split damage across add tanks based on alive adds
              // If a tank dies, their adds go LOOSE and attack random raid members
              if (!this.state.boss?.majordomoTanks || !this.state.boss?.adds) break;

              const tanks = this.state.boss.majordomoTanks;
              const addTankIds = [tanks.addTank1Id, tanks.addTank2Id, tanks.addTank3Id, tanks.addTank4Id];
              const looseFlags = ['looseAdds1', 'looseAdds2', 'looseAdds3', 'looseAdds4'] as const;
              const looseTargetKeys = [
                ['looseTarget1a', 'looseTarget1b'],
                ['looseTarget2a', 'looseTarget2b'],
                ['looseTarget3a', 'looseTarget3b'],
                ['looseTarget4a', 'looseTarget4b'],
              ] as const;

              // Helper to get or pick a new target for a loose add
              const getOrPickLooseTarget = (currentTargetId: string | null): string | null => {
                const currentTarget = this.state.raid.find(m => m.id === currentTargetId);
                if (currentTarget?.isAlive) {
                  return currentTargetId;
                }
                // Pick a new random target (prefer non-tanks, but will attack tanks if needed)
                const availableTargets = this.state.raid.filter(m => m.isAlive && m.role !== 'tank');
                if (availableTargets.length === 0) {
                  // Fall back to any alive target
                  const anyTarget = this.state.raid.filter(m => m.isAlive);
                  if (anyTarget.length === 0) return null;
                  return anyTarget[Math.floor(Math.random() * anyTarget.length)].id;
                }
                return availableTargets[Math.floor(Math.random() * availableTargets.length)].id;
              };

              // Each add tank takes damage based on their adds being alive
              // Add pairs: 0-1 -> tank1, 2-3 -> tank2, 4-5 -> tank3, 6-7 -> tank4
              addTankIds.forEach((tankId, index) => {
                const add1Index = index * 2;
                const add2Index = index * 2 + 1;
                const add1 = this.state.boss!.adds![add1Index];
                const add2 = this.state.boss!.adds![add2Index];

                // Count alive adds for this tank pair
                const add1Alive = add1?.isAlive;
                const add2Alive = add2?.isAlive;
                if (!add1Alive && !add2Alive) return; // No adds, no damage

                const tank = this.state.raid.find(m => m.id === tankId);
                const looseFlag = looseFlags[index];
                const [targetKeyA, targetKeyB] = looseTargetKeys[index];

                // Check if tank is dead - if so, adds go loose!
                if (!tank?.isAlive && !tanks[looseFlag]) {
                  tanks[looseFlag] = true;
                  this.addCombatLogEntry({
                    message: `ADDS ARE LOOSE! Tank ${index + 1}'s adds are attacking the raid!`,
                    type: 'damage'
                  });
                  this.state.tankSwapWarning = {
                    message: `LOOSE ADDS! Add tank ${index + 1} is dead!`,
                    type: 'late_swap'
                  };
                }

                if (tanks[looseFlag]) {
                  // Adds are loose - each alive add attacks a random raid member
                  if (add1Alive) {
                    tanks[targetKeyA] = getOrPickLooseTarget(tanks[targetKeyA]);
                    const target = this.state.raid.find(m => m.id === tanks[targetKeyA]);
                    if (target?.isAlive) {
                      let damage = event.damage * enrageMultiplier;
                      damage = this.calculateDamageReduction(target, damage, 'physical');
                      target.currentHealth -= damage;

                      if (target.currentHealth <= 0) {
                        target.currentHealth = 0;
                        this.handleMemberDeath(target);
                        this.addCombatLogEntry({
                          message: `Loose add mauls ${target.name} to death!`,
                          type: 'damage'
                        });
                        tanks[targetKeyA] = null; // Will pick new target next tick
                      }
                    }
                  }

                  if (add2Alive) {
                    tanks[targetKeyB] = getOrPickLooseTarget(tanks[targetKeyB]);
                    const target = this.state.raid.find(m => m.id === tanks[targetKeyB]);
                    if (target?.isAlive) {
                      let damage = event.damage * enrageMultiplier;
                      damage = this.calculateDamageReduction(target, damage, 'physical');
                      target.currentHealth -= damage;

                      if (target.currentHealth <= 0) {
                        target.currentHealth = 0;
                        this.handleMemberDeath(target);
                        this.addCombatLogEntry({
                          message: `Loose add mauls ${target.name} to death!`,
                          type: 'damage'
                        });
                        tanks[targetKeyB] = null; // Will pick new target next tick
                      }
                    }
                  }
                } else {
                  // Normal behavior - damage the tank
                  const aliveCount = (add1Alive ? 1 : 0) + (add2Alive ? 1 : 0);
                  let damage = event.damage * aliveCount * enrageMultiplier;
                  damage = this.calculateDamageReduction(tank!, damage, 'physical');
                  tank!.currentHealth -= damage;

                  if (tank!.currentHealth <= 0) {
                    tank!.currentHealth = 0;
                    this.handleMemberDeath(tank!);
                  }
                }
              });
              break;
            }

            case 'majordomo_fire_blast': {
              // Fire Blast: Instant fire damage on random targets
              if (!this.state.boss?.adds) break;

              // Only happens if elites are alive
              const aliveElites = this.state.boss.adds.filter(a => a.isAlive && a.id.startsWith('elite'));
              if (aliveElites.length === 0) break;

              const aliveTargets = this.state.raid.filter(m => m.isAlive);
              if (aliveTargets.length === 0) break;

              // Hit 2-3 random targets
              const targetCount = 2 + Math.floor(Math.random() * 2);
              const shuffled = [...aliveTargets].sort(() => Math.random() - 0.5);
              const targets = shuffled.slice(0, targetCount);

              targets.forEach(target => {
                let damage = event.damage * enrageMultiplier;
                damage = this.calculateDamageReduction(target, damage, 'fire');
                target.currentHealth -= damage;

                if (target.currentHealth <= 0) {
                  target.currentHealth = 0;
                  this.handleMemberDeath(target);
                }
              });

              this.addCombatLogEntry({
                message: `Fire Blast hits ${targets.length} targets for fire damage!`,
                type: 'damage'
              });
              break;
            }

            case 'majordomo_shadow_shock': {
              // Shadow Shock: Instant shadow damage on random targets
              if (!this.state.boss?.adds) break;

              // Only happens if healers are alive
              const aliveHealers = this.state.boss.adds.filter(a => a.isAlive && a.id.startsWith('healer'));
              if (aliveHealers.length === 0) break;

              const aliveTargets = this.state.raid.filter(m => m.isAlive);
              if (aliveTargets.length === 0) break;

              // Hit 1-2 random targets
              const targetCount = 1 + Math.floor(Math.random() * 2);
              const shuffled = [...aliveTargets].sort(() => Math.random() - 0.5);
              const targets = shuffled.slice(0, targetCount);

              targets.forEach(target => {
                let damage = event.damage * enrageMultiplier;
                damage = this.calculateDamageReduction(target, damage, 'shadow');
                target.currentHealth -= damage;

                if (target.currentHealth <= 0) {
                  target.currentHealth = 0;
                  this.handleMemberDeath(target);
                }
              });

              this.addCombatLogEntry({
                message: `Shadow Shock hits ${targets.length} targets for shadow damage!`,
                type: 'damage'
              });
              break;
            }

            case 'majordomo_shadow_bolt': {
              // Shadow Bolt: Interruptible - 80% chance to be kicked
              if (!this.state.boss?.adds) break;

              const aliveHealers = this.state.boss.adds.filter(a => a.isAlive && a.id.startsWith('healer'));
              if (aliveHealers.length === 0) break;

              const interrupted = Math.random() < 0.80;

              if (interrupted) {
                const interrupters = this.state.raid.filter(m =>
                  m.isAlive && ['rogue', 'warrior', 'mage', 'shaman'].includes(m.class)
                );
                const interrupter = interrupters[Math.floor(Math.random() * interrupters.length)];
                const interruptName = interrupter?.name || 'A DPS';

                let interruptAbility = 'interrupts';
                if (interrupter?.class === 'rogue') interruptAbility = 'Kicks';
                else if (interrupter?.class === 'warrior') interruptAbility = 'uses Pummel on';
                else if (interrupter?.class === 'mage') interruptAbility = 'Counterspells';
                else if (interrupter?.class === 'shaman') interruptAbility = 'Earth Shocks';

                this.addCombatLogEntry({
                  message: `${interruptName} ${interruptAbility} Shadow Bolt!`,
                  type: 'buff'
                });
              } else {
                // Shadow Bolt hits a random target
                const aliveTargets = this.state.raid.filter(m => m.isAlive);
                if (aliveTargets.length > 0) {
                  const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
                  let damage = event.damage * enrageMultiplier;
                  damage = this.calculateDamageReduction(target, damage, 'shadow');
                  target.currentHealth -= damage;

                  this.addCombatLogEntry({
                    message: `Shadow Bolt hits ${target.name} for ${Math.round(damage)} shadow damage!`,
                    type: 'damage'
                  });

                  if (target.currentHealth <= 0) {
                    target.currentHealth = 0;
                    this.handleMemberDeath(target);
                  }
                }
              }
              break;
            }

            case 'majordomo_fireball': {
              // Fireball: Interruptible - 75% chance to be kicked
              if (!this.state.boss?.adds) break;

              const aliveHealers = this.state.boss.adds.filter(a => a.isAlive && a.id.startsWith('healer'));
              if (aliveHealers.length === 0) break;

              const interrupted = Math.random() < 0.75;

              if (interrupted) {
                const interrupters = this.state.raid.filter(m =>
                  m.isAlive && ['rogue', 'warrior', 'mage', 'shaman'].includes(m.class)
                );
                const interrupter = interrupters[Math.floor(Math.random() * interrupters.length)];
                const interruptName = interrupter?.name || 'A DPS';

                let interruptAbility = 'interrupts';
                if (interrupter?.class === 'rogue') interruptAbility = 'Kicks';
                else if (interrupter?.class === 'warrior') interruptAbility = 'uses Pummel on';
                else if (interrupter?.class === 'mage') interruptAbility = 'Counterspells';
                else if (interrupter?.class === 'shaman') interruptAbility = 'Earth Shocks';

                this.addCombatLogEntry({
                  message: `${interruptName} ${interruptAbility} Fireball!`,
                  type: 'buff'
                });
              } else {
                // Fireball hits a random target
                const aliveTargets = this.state.raid.filter(m => m.isAlive);
                if (aliveTargets.length > 0) {
                  const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
                  let damage = event.damage * enrageMultiplier;
                  damage = this.calculateDamageReduction(target, damage, 'fire');
                  target.currentHealth -= damage;

                  this.addCombatLogEntry({
                    message: `Fireball hits ${target.name} for ${Math.round(damage)} fire damage!`,
                    type: 'damage'
                  });

                  if (target.currentHealth <= 0) {
                    target.currentHealth = 0;
                    this.handleMemberDeath(target);
                  }
                }
              }
              break;
            }

            case 'majordomo_dark_mending': {
              // Dark Mending: Flamewaker Healer heals an add
              // 70% chance AI DPS interrupts, 30% chance heal goes through
              if (!this.state.boss?.adds) break;

              // Only happens if healers are alive
              const aliveHealers = this.state.boss.adds.filter(a => a.isAlive && a.id.startsWith('healer'));
              if (aliveHealers.length === 0) break;

              // Find damaged adds that aren't at full health
              const aliveAdds = this.state.boss.adds.filter(a => a.isAlive);
              const damagedAdds = aliveAdds.filter(a => a.currentHealth < a.maxHealth);

              if (damagedAdds.length === 0 || aliveAdds.length === 0) break;

              const interrupted = Math.random() < 0.7;

              if (interrupted) {
                const interrupters = this.state.raid.filter(m =>
                  m.isAlive && ['rogue', 'warrior', 'mage', 'shaman'].includes(m.class)
                );
                const interrupter = interrupters[Math.floor(Math.random() * interrupters.length)];
                const interruptName = interrupter?.name || 'A DPS';

                let interruptAbility = 'interrupts';
                if (interrupter?.class === 'rogue') interruptAbility = 'Kicks';
                else if (interrupter?.class === 'warrior') interruptAbility = 'uses Pummel on';
                else if (interrupter?.class === 'mage') interruptAbility = 'Counterspells';
                else if (interrupter?.class === 'shaman') interruptAbility = 'Earth Shocks';

                this.addCombatLogEntry({
                  message: `${interruptName} ${interruptAbility} Dark Mending!`,
                  type: 'buff'
                });
              } else {
                // Heal goes through - pick the most damaged add
                const targetAdd = damagedAdds.reduce((a, b) =>
                  a.currentHealth < b.currentHealth ? a : b
                );

                const healAmount = targetAdd.maxHealth * 0.15; // 15% heal
                targetAdd.currentHealth = Math.min(
                  targetAdd.maxHealth,
                  targetAdd.currentHealth + healAmount
                );

                this.addCombatLogEntry({
                  message: `Dark Mending heals ${targetAdd.name} for ${Math.round(healAmount)}!`,
                  type: 'heal'
                });
              }
              break;
            }

            case 'majordomo_magic_reflection': {
              // Magic Reflection: All adds gain magic reflection shield (10 seconds)
              // DPS must stop attacking, but 1-2 forget and hurt themselves
              if (!this.state.boss?.majordomoTanks || !this.state.boss?.adds) break;

              const tanks = this.state.boss.majordomoTanks;
              const aliveAdds = this.state.boss.adds.filter(a => a.isAlive);

              if (aliveAdds.length === 0) break;

              // Activate magic reflection
              tanks.magicReflectionActive = true;
              tanks.magicReflectionEndTime = this.state.elapsedTime + 10;
              tanks.dpsStoppedTime = this.state.elapsedTime + 0.5; // DPS takes 0.5s to react

              this.addCombatLogEntry({
                message: `MAGIC REFLECTION! ${aliveAdds.length} adds gain damage shields!`,
                type: 'damage'
              });

              // Set raid warning
              this.state.tankSwapWarning = {
                message: 'MAGIC REFLECTION - STOP DPS!',
                type: 'swap'
              };

              // 1-2 DPS forget to stop and hurt themselves
              const forgetfulCount = 1 + Math.floor(Math.random() * 2);
              const dpsMembers = this.state.raid.filter(m =>
                m.isAlive && m.role === 'dps'
              );

              if (dpsMembers.length > 0) {
                const shuffled = [...dpsMembers].sort(() => Math.random() - 0.5);
                const forgetful = shuffled.slice(0, forgetfulCount);

                forgetful.forEach(dps => {
                  // They deal damage to themselves for a few seconds
                  // 50% of damage dealt reflected back = ~800-1200 damage
                  const reflectedDamage = 800 + Math.floor(Math.random() * 400);
                  dps.currentHealth -= reflectedDamage;

                  this.addCombatLogEntry({
                    message: `${dps.name} didn't stop! Magic Reflection hits them for ${reflectedDamage}!`,
                    type: 'damage'
                  });

                  if (dps.currentHealth <= 0) {
                    dps.currentHealth = 0;
                    this.handleMemberDeath(dps);
                  }
                });
              }
              break;
            }

            // =====================================================
            // RAGNAROS DAMAGE EVENTS
            // =====================================================
            case 'ragnaros_melee': {
              // Massive fire melee on current tank
              if (!this.state.boss?.ragnarosTanks) break;

              const tanks = this.state.boss.ragnarosTanks;
              const currentTankId = tanks.currentMainTank === 1 ? tanks.tank1Id : tanks.tank2Id;
              const tank = this.state.raid.find(m => m.id === currentTankId && m.isAlive);

              if (tank) {
                let damage = event.damage * enrageMultiplier;
                damage = this.calculateDamageReduction(tank, damage, 'fire');
                tank.currentHealth -= damage;

                if (tank.currentHealth <= 0) {
                  tank.currentHealth = 0;
                  this.handleMemberDeath(tank);
                }
              } else {
                // No tank alive - trigger Magma Blast instead (handled separately)
              }
              break;
            }

            case 'ragnaros_elemental_fire': {
              // Apply Elemental Fire DoT to current tank
              if (!this.state.boss?.ragnarosTanks) break;

              const tanks = this.state.boss.ragnarosTanks;
              const currentTankId = tanks.currentMainTank === 1 ? tanks.tank1Id : tanks.tank2Id;
              const tank = this.state.raid.find(m => m.id === currentTankId && m.isAlive);

              if (tank) {
                // Check if already has the debuff
                const hasDebuff = tank.debuffs.some(d => d.id === 'elemental_fire');
                if (!hasDebuff) {
                  const debuffDef = DEBUFFS.elemental_fire;
                  tank.debuffs.push({
                    ...debuffDef,
                    duration: debuffDef.maxDuration || 8,
                    icon: debuffDef.icon || '',
                  });

                  this.addCombatLogEntry({
                    message: `${tank.name} is afflicted by Elemental Fire!`,
                    type: 'debuff'
                  });
                }
              }
              break;
            }

            case 'ragnaros_wrath': {
              // Wrath of Ragnaros - knockback current tank, force swap
              if (!this.state.boss?.ragnarosTanks) break;

              const tanks = this.state.boss.ragnarosTanks;
              const currentTankId = tanks.currentMainTank === 1 ? tanks.tank1Id : tanks.tank2Id;
              const otherTankId = tanks.currentMainTank === 1 ? tanks.tank2Id : tanks.tank1Id;
              const currentTank = this.state.raid.find(m => m.id === currentTankId && m.isAlive);
              const otherTank = this.state.raid.find(m => m.id === otherTankId && m.isAlive);

              if (currentTank) {
                // Deal knockback damage to current tank
                let damage = event.damage * enrageMultiplier;
                damage = this.calculateDamageReduction(currentTank, damage, 'fire');
                currentTank.currentHealth -= damage;

                // Apply Wrath debuff (can't be dispelled)
                const debuffDef = DEBUFFS.wrath_of_ragnaros;
                currentTank.debuffs = currentTank.debuffs.filter(d => d.id !== 'wrath_of_ragnaros');
                currentTank.debuffs.push({
                  ...debuffDef,
                  duration: debuffDef.maxDuration || 10,
                  icon: debuffDef.icon || '',
                });

                this.addCombatLogEntry({
                  message: `Ragnaros casts Wrath of Ragnaros! ${currentTank.name} is knocked back!`,
                  type: 'damage',
                  amount: damage
                });

                if (currentTank.currentHealth <= 0) {
                  currentTank.currentHealth = 0;
                  this.handleMemberDeath(currentTank);
                }

                // Tank swap
                if (otherTank) {
                  tanks.currentMainTank = tanks.currentMainTank === 1 ? 2 : 1;
                  tanks.wrathKnockbackUntil = this.state.elapsedTime + 10; // 10s recovery

                  this.state.tankSwapWarning = {
                    message: `TANK SWAP! ${otherTank.name} now tanking Ragnaros!`,
                    type: 'swap'
                  };

                  // Clear warning after 3 seconds
                  setTimeout(() => {
                    if (this.state.tankSwapWarning?.type === 'swap') {
                      this.state.tankSwapWarning = null;
                      this.notify();
                    }
                  }, 3000);

                  this.addCombatLogEntry({
                    message: `${otherTank.name} taunts Ragnaros!`,
                    type: 'system'
                  });
                } else {
                  // No other tank alive!
                  this.state.tankSwapWarning = {
                    message: 'OFF-TANK DEAD! NO ONE TO SWAP!',
                    type: 'stacks_high'
                  };
                }
              }
              break;
            }

            case 'ragnaros_lava_burst': {
              // Lava Burst - random ranged player + splash to nearby
              const rangedPlayers = this.state.raid.filter(m =>
                m.isAlive && (m.positionZone === 'ranged' || m.role === 'healer')
              );

              if (rangedPlayers.length === 0) break;

              const target = rangedPlayers[Math.floor(Math.random() * rangedPlayers.length)];
              let damage = event.damage * enrageMultiplier;
              damage = this.calculateDamageReduction(target, damage, 'fire');
              target.currentHealth -= damage;

              // Apply Lava Burst DoT
              const debuffDef = DEBUFFS.lava_burst;
              target.debuffs = target.debuffs.filter(d => d.id !== 'lava_burst');
              target.debuffs.push({
                ...debuffDef,
                duration: debuffDef.maxDuration || 6,
                icon: debuffDef.icon || '',
              });

              this.addCombatLogEntry({
                message: `Lava Burst hits ${target.name} for ${Math.round(damage)}!`,
                type: 'damage',
                amount: damage
              });

              if (target.currentHealth <= 0) {
                target.currentHealth = 0;
                this.handleMemberDeath(target);
              }

              // Splash damage to 2-3 nearby players in same group
              const sameGroup = this.state.raid.filter(m =>
                m.isAlive && m.id !== target.id && m.group === target.group
              );
              const splashTargets = sameGroup.slice(0, 2 + Math.floor(Math.random() * 2));

              splashTargets.forEach(splash => {
                let splashDmg = (event.damage * 0.5) * enrageMultiplier; // 50% splash
                splashDmg = this.calculateDamageReduction(splash, splashDmg, 'fire');
                splash.currentHealth -= splashDmg;

                if (splash.currentHealth <= 0) {
                  splash.currentHealth = 0;
                  this.handleMemberDeath(splash);
                }
              });
              break;
            }

            case 'ragnaros_magma_blast': {
              // Magma Blast - only triggers if BOTH tanks are dead
              if (!this.state.boss?.ragnarosTanks) break;

              const tanks = this.state.boss.ragnarosTanks;
              const tank1 = this.state.raid.find(m => m.id === tanks.tank1Id);
              const tank2 = this.state.raid.find(m => m.id === tanks.tank2Id);

              // Only fire if both tanks are dead
              if ((tank1?.isAlive) || (tank2?.isAlive)) break;

              // Massive raid-wide damage - basically a wipe mechanic
              const aliveMembers = this.state.raid.filter(m => m.isAlive);

              this.addCombatLogEntry({
                message: `No tank! Ragnaros casts MAGMA BLAST on the raid!`,
                type: 'damage'
              });

              aliveMembers.forEach(member => {
                let damage = event.damage * enrageMultiplier;
                damage = this.calculateDamageReduction(member, damage, 'fire');
                member.currentHealth -= damage;

                if (member.currentHealth <= 0) {
                  member.currentHealth = 0;
                  this.handleMemberDeath(member);
                }
              });
              break;
            }

            case 'sons_of_flame_melee': {
              // Sons of Flame melee random raid members
              if (this.state.boss?.currentPhase !== 2) break;
              if (!this.state.boss?.adds) break;

              const aliveSons = this.state.boss.adds.filter(a => a.isAlive);
              if (aliveSons.length === 0) break;

              // Each Son attacks a random player
              const aliveRaid = this.state.raid.filter(m => m.isAlive);
              if (aliveRaid.length === 0) break;

              aliveSons.forEach(() => {
                const target = aliveRaid[Math.floor(Math.random() * aliveRaid.length)];
                let damage = event.damage * enrageMultiplier;
                damage = this.calculateDamageReduction(target, damage, 'fire');
                target.currentHealth -= damage;

                if (target.currentHealth <= 0) {
                  target.currentHealth = 0;
                  this.handleMemberDeath(target);
                }
              });
              break;
            }
          }
        }
      });

      // =====================================================
      // RAGNAROS PHASE MANAGEMENT
      // =====================================================
      if (this.state.boss?.id === 'ragnaros' && this.state.boss.ragnarosTanks) {
        const tanks = this.state.boss.ragnarosTanks;

        // Phase 1: Check if it's time to submerge (180 seconds = 3 minutes)
        if (this.state.boss.currentPhase === 1 && !tanks.hasSubmerged) {
          if (this.state.elapsedTime >= tanks.submergeTime) {
            // Trigger submerge!
            this.state.boss.currentPhase = 2;
            tanks.hasSubmerged = true;
            tanks.healthBeforeSubmerge = this.state.boss.currentHealth;
            tanks.sonsTimer = 90; // 90 seconds to kill Sons
            tanks.sonsKilled = 0;

            // Spawn all 8 Sons of Flame
            if (this.state.boss.adds) {
              this.state.boss.adds.forEach(son => {
                son.isAlive = true;
                son.currentHealth = son.maxHealth;
              });
            }

            this.addCombatLogEntry({
              message: 'Ragnaros submerges! Sons of Flame emerge from the lava!',
              type: 'system'
            });

            this.state.tankSwapWarning = {
              message: 'RAGNAROS SUBMERGES! KILL THE SONS!',
              type: 'swap'
            };
          }
        }

        // Phase 2: Sons phase - countdown timer and check for Sons deaths
        if (this.state.boss.currentPhase === 2) {
          // Decrement Sons timer
          tanks.sonsTimer -= delta;

          // Count alive Sons
          const aliveSons = this.state.boss.adds?.filter(a => a.isAlive).length || 0;
          tanks.sonsKilled = 8 - aliveSons;

          // Check if all Sons are dead OR timer expired
          if (aliveSons === 0 || tanks.sonsTimer <= 0) {
            // Ragnaros re-emerges!
            this.state.boss.currentPhase = 3;
            tanks.sonsTimer = -1; // Disable timer

            // Restore Ragnaros health (same as before submerge)
            this.state.boss.currentHealth = tanks.healthBeforeSubmerge;

            if (aliveSons === 0) {
              this.addCombatLogEntry({
                message: 'All Sons of Flame defeated! Ragnaros re-emerges from the lava!',
                type: 'system'
              });
            } else {
              this.addCombatLogEntry({
                message: `Time's up! Ragnaros re-emerges with ${aliveSons} Sons still alive!`,
                type: 'system'
              });

              // Kill remaining Sons (they merge back with Ragnaros)
              this.state.boss.adds?.forEach(son => {
                son.isAlive = false;
              });
            }

            this.state.tankSwapWarning = {
              message: 'RAGNAROS RE-EMERGES! TANKS PICK HIM UP!',
              type: 'swap'
            };
          }
        }

        // Clear tank swap warning after 5 seconds
        if (this.state.tankSwapWarning && this.state.elapsedTime % 5 < delta) {
          // Clear periodically
        }
      }

      // Check for Deaden Magic ending (Priest Dispel or Shaman Purge)
      if (this.state.boss?.hasDeadenMagic && this.state.boss.deadenMagicEndTime) {
        if (this.state.elapsedTime >= this.state.boss.deadenMagicEndTime) {
          // Natural expiry
          this.state.boss.hasDeadenMagic = false;
          this.state.boss.deadenMagicEndTime = undefined;
          this.addCombatLogEntry({
            message: `Deaden Magic fades from Shazzrah.`,
            type: 'buff'
          });
        } else if (this.state.elapsedTime >= (this.state.boss.deadenMagicEndTime - 28)) {
          // Auto-dispel after ~2 seconds by Priest or Shaman
          const dispeller = this.state.raid.find(m => (m.class === 'priest' || m.class === 'shaman') && m.isAlive);
          if (dispeller) {
            this.state.boss.hasDeadenMagic = false;
            this.state.boss.deadenMagicEndTime = undefined;
            const action = dispeller.class === 'shaman' ? 'Purges' : 'Dispels';
            this.addCombatLogEntry({
              message: `${dispeller.name} ${action} Deaden Magic from Shazzrah!`,
              type: 'buff'
            });
          }
        }
      }

      // Check for Frenzy ending (hunters Tranq Shot)
      if (this.state.boss?.isFrenzied && this.state.boss.frenzyEndTime && this.state.elapsedTime >= this.state.boss.frenzyEndTime) {
        this.state.boss.isFrenzied = false;
        this.state.boss.frenzyEndTime = undefined;

        // Find a hunter to credit with the Tranq Shot
        const hunter = this.state.raid.find(m => m.class === 'hunter' && m.isAlive);
        const hunterName = hunter?.name || 'A hunter';

        this.addCombatLogEntry({
          message: `${hunterName} uses Tranquilizing Shot! ${this.state.boss.name}'s Frenzy is removed.`,
          type: 'buff'
        });
      }

      // Check for Inspire ending (Sulfuron Harbinger)
      if (this.state.boss?.isInspired && this.state.boss.inspireEndTime) {
        if (this.state.elapsedTime >= this.state.boss.inspireEndTime) {
          this.state.boss.isInspired = false;
          this.state.boss.inspireEndTime = undefined;
          this.addCombatLogEntry({
            message: `Inspire fades from the Flamewaker Priests.`,
            type: 'buff'
          });
        }
      }

      // Process debuff ticks and durations (also affected by enrage)
      this.state.raid.forEach(member => {
        if (!member.isAlive) return;

        member.debuffs = member.debuffs
          .map(debuff => {
            // Standard DoT damage
            if (debuff.damagePerTick && debuff.tickInterval) {
              // Account for stacks (like Magma Spit)
              const stacks = debuff.stacks || 1;
              let tickDamage = (debuff.damagePerTick * stacks * delta * enrageMultiplier) / debuff.tickInterval;

              // Apply damage reduction for fire damage (Fire Resistance Aura/Totem)
              if (debuff.damageType === 'fire') {
                tickDamage = this.calculateDamageReduction(member, tickDamage, 'fire');
              }

              member.currentHealth -= tickDamage;
              if (member.currentHealth <= 0) {
                member.currentHealth = 0;
                this.handleMemberDeath(member);
              }
            }

            // Mind Control damage - MC'd player attacks their target
            if (debuff.isMindControl && debuff.mcTargetId) {
              const mcTarget = this.state.raid.find(m => m.id === debuff.mcTargetId);
              if (mcTarget && mcTarget.isAlive) {
                // MC'd player deals ~200 damage per second to their target
                const mcDamage = 200 * delta;
                mcTarget.currentHealth -= mcDamage;
                if (mcTarget.currentHealth <= 0) {
                  mcTarget.currentHealth = 0;
                  this.handleMemberDeath(mcTarget);
                }
              }
            }

            return { ...debuff, duration: debuff.duration - delta };
          })
          .filter(debuff => {
            // Check for debuff explosion when it expires
            if (debuff.duration <= 0 && debuff.explodesOnExpiry && debuff.explosionDamage) {
              if (debuff.id === 'living_bomb') {
                // Living Bomb has splash damage
                this.handleLivingBombExplosion(member, debuff.explosionDamage);
              } else {
                // Other explosions (like Impending Doom) only hit the target
                this.handleDebuffExplosion(member, debuff);
              }
            }
            return debuff.duration > 0;
          });

        // Update buff durations
        member.buffs = member.buffs
          .map(b => ({ ...b, duration: b.duration - delta }))
          .filter(b => b.duration > 0);

        // Tick down Weakened Soul duration (prevents PW:S reapplication)
        if (member.weakenedSoulDuration && member.weakenedSoulDuration > 0) {
          member.weakenedSoulDuration -= delta;
          if (member.weakenedSoulDuration <= 0) {
            member.weakenedSoulDuration = 0;
          }
        }

        // Process HoT ticks
        if (member.activeHoTs && member.activeHoTs.length > 0) {
          member.activeHoTs = member.activeHoTs
            .map(hot => {
              // Update time since last tick
              const newTimeSinceLastTick = hot.timeSinceLastTick + delta;

              // Check if a tick should occur
              if (newTimeSinceLastTick >= hot.tickInterval) {
                // Apply HoT healing
                const actualHeal = Math.min(hot.healPerTick, member.maxHealth - member.currentHealth);
                if (actualHeal > 0) {
                  member.currentHealth = Math.min(member.maxHealth, member.currentHealth + hot.healPerTick);

                  // Track HoT healing to the caster's stats
                  const casterStats = this.state.aiHealerStats[hot.casterId];
                  if (casterStats) {
                    casterStats.healingDone += actualHeal;
                  }
                  // Also track as "other healers healing" for total metrics
                  this.state.otherHealersHealing += actualHeal;

                  // Add combat log entry for HoT tick
                  this.state.combatLog.push({
                    timestamp: this.state.elapsedTime,
                    message: `${hot.spellName} heals ${member.name} for ${actualHeal}`,
                    type: 'heal',
                    amount: actualHeal,
                    isCrit: false,
                  });
                }

                // Reset tick timer (keeping remainder for accurate timing)
                return {
                  ...hot,
                  timeSinceLastTick: newTimeSinceLastTick - hot.tickInterval,
                  remainingDuration: hot.remainingDuration - delta,
                };
              }

              return {
                ...hot,
                timeSinceLastTick: newTimeSinceLastTick,
                remainingDuration: hot.remainingDuration - delta,
              };
            })
            .filter(hot => hot.remainingDuration > 0);
        }

        // NPC Shaman Tremor Totem - dispel fear effects (ticks every 4 seconds)
        // Check if member has a Tremor Totem buff from an NPC shaman
        const hasTremorTotem = member.buffs.some(b => b.id.includes('tremor_totem') && b.effect?.fearImmunity);
        if (hasTremorTotem) {
          const fearDebuff = member.debuffs.find(d =>
            d.id === 'panic' || // Magmadar's Panic
            (d.type === 'magic' && (
              d.name?.toLowerCase().includes('fear') ||
              d.name?.toLowerCase().includes('panic')
            ))
          );
          if (fearDebuff) {
            member.debuffs = member.debuffs.filter(d => d !== fearDebuff);
            this.addCombatLogEntry({
              message: `Tremor Totem removed ${fearDebuff.name} from ${member.name}!`,
              type: 'buff'
            });
          }
        }
      });

      // AI Healers - other healers in the raid automatically heal
      // Disable AI healers in multiplayer client mode (host handles all AI healing)
      // Also exclude raid members controlled by multiplayer players
      // Exception: if host is spectating, include the PLAYER_ID slot in AI healing
      if (this.state.otherHealersEnabled && !this.isMultiplayerClient) {
        const aiHealers = this.state.raid.filter(
          m => m.role === 'healer' && m.isAlive && (m.id !== PLAYER_ID || this.hostSpectating) && !this.multiplayerPlayerRaidIds.has(m.id)
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
              // Druid special spell cooldowns
              naturesSwiftnessCooldown: 0,  // 180s cooldown
              swiftmendCooldown: 0,          // 15s cooldown
              innervateCooldown: 0,          // 360s cooldown
              // Priest special spell cooldowns
              innerFocusCooldown: 0,         // 180s cooldown (3 min)
              innerFocusActive: false,       // Next spell is free + 25% crit
            };
          }

          const stats = this.state.aiHealerStats[healer.id];

          // MP5 regeneration (mana per 5 seconds, scaled to delta)
          // Apply 400% (5x) bonus if Innervate is active on this healer
          const manaRegenMultiplier = stats.innervateActive ? 5.0 : 1.0;
          stats.currentMana = Math.min(stats.maxMana, stats.currentMana + (stats.mp5 * delta / 5 * manaRegenMultiplier));

          // Tick down mana potion cooldown
          if (stats.manaPotionCooldown > 0) {
            stats.manaPotionCooldown -= delta;
          }

          // Tick down druid special spell cooldowns
          if (healer.class === 'druid') {
            if (stats.naturesSwiftnessCooldown && stats.naturesSwiftnessCooldown > 0) {
              stats.naturesSwiftnessCooldown -= delta;
            }
            if (stats.swiftmendCooldown && stats.swiftmendCooldown > 0) {
              stats.swiftmendCooldown -= delta;
            }
            if (stats.innervateCooldown && stats.innervateCooldown > 0) {
              stats.innervateCooldown -= delta;
            }
          }

          // Tick down priest special spell cooldowns
          if (healer.class === 'priest') {
            if (stats.innerFocusCooldown && stats.innerFocusCooldown > 0) {
              stats.innerFocusCooldown -= delta;
            }
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
            const healerManaPct = stats.currentMana / stats.maxMana;

            // Build druid context if this is a druid healer
            let druidContext: DruidSpellContext | undefined;
            if (healer.class === 'druid') {
              druidContext = {
                healerId: healer.id,
                targetHoTs: target.activeHoTs || [],
                naturesSwiftnessCooldown: stats.naturesSwiftnessCooldown || 0,
                swiftmendCooldown: stats.swiftmendCooldown || 0,
              };
            }

            // Build priest context if this is a priest healer
            let priestContext: PriestSpellContext | undefined;
            if (healer.class === 'priest') {
              // Calculate group membership (5 members per group, index 0-4 = group 0, etc.)
              const targetIndex = this.state.raid.indexOf(target);
              const targetGroup = Math.floor(targetIndex / 5);

              // Count injured members in the same group (for Prayer of Healing consideration)
              const injuredInGroup = this.state.raid.filter((m, idx) => {
                const memberGroup = Math.floor(idx / 5);
                return memberGroup === targetGroup && m.isAlive && m.currentHealth < m.maxHealth * 0.75;
              }).length;

              priestContext = {
                healerId: healer.id,
                targetHoTs: target.activeHoTs || [],
                injuredInGroup,
                targetHasWeakenedSoul: (target.weakenedSoulDuration || 0) > 0,
                targetHasShield: (target.absorbShield || 0) > 0,
                innerFocusCooldown: stats.innerFocusCooldown || 0,
              };
            }

            // Select appropriate spell based on class, target health, and mana
            const spellChoice = selectAIHealerSpell(
              healer.class,
              targetHealthPct,
              healerManaPct,
              injured.length,
              druidContext,
              priestContext
            );

            if (!spellChoice) {
              // No spell available for this class (shouldn't happen)
              return;
            }

            const { spell, spellName, useNaturesSwiftness, consumeHoT, applyShield, useInnerFocus } = spellChoice;
            let manaCost = spell.manaCost;
            let innerFocusCritBonus = false;  // Track if we should apply Inner Focus crit bonus

            // Handle Nature's Swiftness activation (Druid)
            if (useNaturesSwiftness && healer.class === 'druid') {
              // Add NS combat log
              this.addCombatLogEntry({
                message: `${healer.name} activates Nature's Swiftness!`,
                type: 'buff',
              });
              // Put NS on 3 minute cooldown
              stats.naturesSwiftnessCooldown = 180;
            }

            // Handle Inner Focus activation (Priest)
            // Inner Focus: Next spell is FREE + 25% crit bonus
            if (useInnerFocus && healer.class === 'priest') {
              // Add Inner Focus combat log
              this.addCombatLogEntry({
                message: `${healer.name} activates Inner Focus!`,
                type: 'buff',
              });
              // Put Inner Focus on 3 minute cooldown
              stats.innerFocusCooldown = 180;
              // Make the spell free
              manaCost = 0;
              // Apply 25% crit bonus
              innerFocusCritBonus = true;
            }

            // Handle Swiftmend HoT consumption (Druid)
            if (consumeHoT && healer.class === 'druid') {
              // Find and consume the HoT from this druid
              const hotToConsume = target.activeHoTs.find(
                h => (h.spellId === 'rejuvenation' || h.spellId === 'rejuvenation_downrank' || h.spellId === 'regrowth')
                     && h.casterId === healer.id
              );
              if (hotToConsume) {
                // Remove the consumed HoT
                target.activeHoTs = target.activeHoTs.filter(h => h.id !== hotToConsume.id);
                // Put Swiftmend on 15 second cooldown
                stats.swiftmendCooldown = 15;
              }
            }

            // Lucifron's Curse doubles mana costs!
            const hasCurse = healer.debuffs.some(d => d.increasesManaCost);
            if (hasCurse) {
              manaCost *= 2;
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

            // Special handling for Prayer of Healing (heals entire group)
            if (spell.id === 'prayer_of_healing') {
              const targetIndex = this.state.raid.indexOf(target);
              const targetGroup = Math.floor(targetIndex / 5);
              const groupStartIndex = targetGroup * 5;
              const groupEndIndex = groupStartIndex + 5;

              let totalGroupHeal = 0;
              const groupMembers = this.state.raid.slice(groupStartIndex, groupEndIndex).filter(m => m.isAlive);

              groupMembers.forEach(member => {
                const baseHeal = calculateSpellHeal(spell, healer.gearScore);
                // Base 12% crit + 25% from Inner Focus if active
                const critChance = innerFocusCritBonus ? 0.37 : 0.12;
                const isCrit = Math.random() < critChance;
                const healAmount = Math.floor(isCrit ? baseHeal * 1.5 : baseHeal);
                const actualHeal = Math.min(healAmount, member.maxHealth - member.currentHealth);
                member.currentHealth = Math.min(member.maxHealth, member.currentHealth + healAmount);
                totalGroupHeal += actualHeal;
              });

              this.state.otherHealersHealing += totalGroupHeal;
              stats.healingDone += totalGroupHeal;

              // Combat log for Prayer of Healing
              this.state.combatLog.push({
                timestamp: this.state.elapsedTime,
                message: `${healer.name} casts Prayer of Healing on Group ${targetGroup + 1} for ${totalGroupHeal} (${groupMembers.length} targets)`,
                type: 'heal',
                amount: totalGroupHeal,
              });

              // Set cooldown and return (skip normal healing logic)
              this.aiHealerCooldowns[healer.id] = Math.max(1.5, spell.castTime || 1.5) + (Math.random() * 0.3 - 0.15);
              return;
            }

            // Special handling for Power Word: Shield (applies absorb shield)
            if (applyShield && spell.id === 'power_word_shield') {
              // Calculate shield amount (base + spell power bonus)
              const baseShield = spell.healAmount.min; // ~942 absorb
              const spellPower = healer.gearScore * 0.3;
              const shieldAmount = Math.floor(baseShield + (spellPower * spell.spellPowerCoefficient));

              // Apply the shield
              target.absorbShield = shieldAmount;
              target.absorbShieldMax = shieldAmount;
              // Apply Weakened Soul debuff (15 seconds - prevents reapplication)
              target.weakenedSoulDuration = 15;

              // Combat log
              this.state.combatLog.push({
                timestamp: this.state.elapsedTime,
                message: `${healer.name} casts Power Word: Shield on ${target.name} (${shieldAmount} absorb)`,
                type: 'buff',
              });

              // Set GCD cooldown (instant cast)
              this.aiHealerCooldowns[healer.id] = 1.5 + (Math.random() * 0.3 - 0.15);
              return;
            }

            // Check if this is a HoT spell
            const hotSpell = spell as DruidHoTSpell | PriestHoTSpell;
            const isPureHoT = hotSpell.isHoT && !hotSpell.hasDirectHeal;

            // Only apply direct healing for non-HoT spells or spells with hasDirectHeal (like Regrowth)
            let actualHeal = 0;
            let isCrit = false;
            if (!isPureHoT) {
              // Calculate heal amount using real spell values
              const baseHeal = calculateSpellHeal(spell, healer.gearScore);
              // Base 12% crit + 25% from Inner Focus if active (Priest)
              const critChance = innerFocusCritBonus ? 0.37 : 0.12;
              isCrit = Math.random() < critChance;
              const healAmount = Math.floor(isCrit ? baseHeal * 1.5 : baseHeal);

              actualHeal = Math.min(healAmount, target.maxHealth - target.currentHealth);
              target.currentHealth = Math.min(target.maxHealth, target.currentHealth + healAmount);
              this.state.otherHealersHealing += actualHeal;

              // Track healing done
              stats.healingDone += actualHeal;
            }

            // Add combat log entry showing the actual spell cast
            if (isPureHoT) {
              // Pure HoT - just show application, no heal amount
              this.state.combatLog.push({
                timestamp: this.state.elapsedTime,
                message: `${healer.name} casts ${spellName} on ${target.name}`,
                type: 'buff',
              });
            } else {
              this.state.combatLog.push({
                timestamp: this.state.elapsedTime,
                message: `${healer.name} casts ${spellName} on ${target.name}${isCrit ? ' (Critical)' : ''} for ${actualHeal}`,
                type: 'heal',
                amount: actualHeal,
                isCrit,
              });
            }

            // Apply HoT if the spell has HoT properties
            if (hotSpell.isHoT && hotSpell.hotDuration && hotSpell.hotTickInterval) {
              // Check if target already has this HoT type (Renew/Rejuv don't stack from different casters in Classic)
              // For Renew specifically - only one can be active at a time (any caster)
              const existingHotIndex = spell.id === 'renew'
                ? target.activeHoTs.findIndex(h => h.spellId === 'renew')
                : target.activeHoTs.findIndex(h => h.spellId === spell.id && h.casterId === healer.id);

              // Calculate heal per tick (base + spell power contribution)
              const spellPower = healer.gearScore * 0.3;
              const perTickBonus = spellPower * (hotSpell.spellPowerCoefficient || 0.2);
              let healPerTick: number;

              if (hotSpell.hasDirectHeal) {
                // Regrowth: HoT portion is separate from direct heal
                healPerTick = Math.floor((hotSpell.hotTotalHealing || 0) / (hotSpell.hotDuration / hotSpell.hotTickInterval) + perTickBonus);
              } else {
                // Pure HoT (Rejuvenation, Renew): healAmount is per tick
                healPerTick = Math.floor(spell.healAmount.min + perTickBonus);
              }

              const newHoT: ActiveHoT = {
                id: `hot_${healer.id}_${target.id}_${spell.id}_${Date.now()}`,
                spellId: spell.id,
                spellName: spell.name,
                icon: spell.icon,
                casterId: healer.id,
                casterName: healer.name,
                remainingDuration: hotSpell.hotDuration,
                maxDuration: hotSpell.hotDuration,
                tickInterval: hotSpell.hotTickInterval,
                timeSinceLastTick: 0,
                healPerTick,
              };

              if (existingHotIndex >= 0) {
                // Refresh existing HoT (reset duration)
                target.activeHoTs[existingHotIndex] = newHoT;
              } else {
                // Apply new HoT
                target.activeHoTs.push(newHoT);
              }
            }

            // Set cooldown based on spell cast time (with some variance)
            // Nature's Swiftness makes the spell instant (GCD only)
            const castTime = useNaturesSwiftness ? 0 : (spell.castTime || 1.5);
            this.aiHealerCooldowns[healer.id] = Math.max(1.5, castTime) + (Math.random() * 0.3 - 0.15);
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

        // AI Druid Innervate - druids use Innervate on low mana healers
        const druidHealers = aiHealers.filter(h => h.class === 'druid');
        druidHealers.forEach(druid => {
          const druidStats = this.state.aiHealerStats[druid.id];
          if (!druidStats || (druidStats.innervateCooldown && druidStats.innervateCooldown > 0)) return;

          // Find healers who need mana (below 25%)
          const lowManaHealers = aiHealers
            .filter(h => {
              const stats = this.state.aiHealerStats[h.id];
              return stats && (stats.currentMana / stats.maxMana) < 0.25;
            })
            .sort((a, b) => {
              const statsA = this.state.aiHealerStats[a.id];
              const statsB = this.state.aiHealerStats[b.id];
              // Prioritize self, then lowest mana %
              if (a.id === druid.id) return -1;
              if (b.id === druid.id) return 1;
              return (statsA.currentMana / statsA.maxMana) - (statsB.currentMana / statsB.maxMana);
            });

          if (lowManaHealers.length > 0) {
            const innervateTarget = lowManaHealers[0];
            const targetStats = this.state.aiHealerStats[innervateTarget.id];

            // Apply Innervate - 400% mana regen for 20 seconds
            // For AI healers, we simplify to ~3000 mana restored (equivalent to 20s of boosted regen)
            const manaRestored = 3000;
            targetStats.currentMana = Math.min(targetStats.maxMana, targetStats.currentMana + manaRestored);

            // Put Innervate on 6 minute cooldown
            druidStats.innervateCooldown = 360;

            // Combat log
            const targetName = innervateTarget.id === druid.id ? 'self' : innervateTarget.name;
            this.addCombatLogEntry({
              message: `${druid.name} casts Innervate on ${targetName}! (400% mana regen)`,
              type: 'buff',
            });
          }
        });
      }

      // Boss takes damage from raid DPS (base DPS + gear scaling + buff bonuses)
      const totalDps = this.state.raid
        .filter(m => m.isAlive)
        .reduce((sum, m) => {
          // Check if this member is stunned (e.g., by Hand of Ragnaros)
          const isStunned = m.debuffs.some(d => d.id === 'hand_of_ragnaros');
          if (isStunned) {
            return sum; // Stunned players do 0 DPS
          }

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

          // Check if this is a caster class affected by Deaden Magic
          const isCaster = ['mage', 'warlock', 'priest', 'druid'].includes(m.class);
          let memberDps = (m.dps + gearDpsBonus + buffDpsBonus) * attackSpeedMultiplier;

          // Deaden Magic reduces magic (caster) damage by 50%
          if (isCaster && this.state.boss?.hasDeadenMagic) {
            memberDps *= 0.5;
          }

          // Power Infusion: +20% spell damage for casters
          if (isCaster && m.buffs.some(b => b.id === 'power_infusion')) {
            memberDps *= 1.2;
          }

          return sum + memberDps;
        }, 0);

      // Handle Sulfuron's adds - DPS is distributed to adds first, then Sulfuron
      if (this.state.boss.id === 'sulfuron' && this.state.boss.adds && this.state.boss.currentPhase === 1) {
        const alivePriests = this.state.boss.adds.filter(a => a.isAlive);

        if (alivePriests.length > 0) {
          // Distribute DPS across all living priests (cleave damage)
          const dpsPerPriest = totalDps / alivePriests.length;

          alivePriests.forEach(priest => {
            priest.currentHealth -= dpsPerPriest * delta;

            if (priest.currentHealth <= 0) {
              priest.currentHealth = 0;
              priest.isAlive = false;
              this.addCombatLogEntry({
                message: `${priest.name} has been slain!`,
                type: 'system'
              });
            }
          });

          // Check if all priests are dead -> transition to phase 2
          const allPriestsDead = this.state.boss.adds.every(a => !a.isAlive);
          if (allPriestsDead) {
            this.state.boss.currentPhase = 2;
            this.state.boss.isInspired = false; // Inspire ends when priests die
            this.state.boss.inspireEndTime = undefined;
            this.addCombatLogEntry({
              message: `All Flamewaker Priests are dead! Sulfuron Harbinger is now vulnerable!`,
              type: 'system'
            });
          }
        }
        // Don't damage Sulfuron while priests are alive
      } else if (this.state.boss.id === 'ragnaros' && this.state.boss.adds && this.state.boss.currentPhase === 2) {
        // RAGNAROS PHASE 2: DPS goes to Sons of Flame, NOT Ragnaros (he's submerged)
        const aliveSons = this.state.boss.adds.filter(a => a.isAlive);

        if (aliveSons.length > 0) {
          // Distribute DPS across all living Sons
          const dpsPerSon = totalDps / aliveSons.length;

          aliveSons.forEach(son => {
            son.currentHealth -= dpsPerSon * delta;

            if (son.currentHealth <= 0) {
              son.currentHealth = 0;
              son.isAlive = false;
              this.addCombatLogEntry({
                message: `${son.name} has been slain!`,
                type: 'system'
              });
            }
          });
        }
        // Ragnaros himself is NOT damaged during phase 2 - he's submerged
        // Re-emergence is handled in the Ragnaros-specific phase handling above
      } else if (this.state.boss.id === 'majordomo' && this.state.boss.adds && this.state.boss.currentPhase === 1) {
        // MAJORDOMO: DPS goes to adds, NOT Majordomo (he's immune)
        const aliveAdds = this.state.boss.adds.filter(a => a.isAlive);
        const tanks = this.state.boss.majordomoTanks;

        if (aliveAdds.length > 0) {
          // During Magic Reflection, DPS stops (no damage to adds)
          if (tanks?.magicReflectionActive && this.state.elapsedTime < tanks.magicReflectionEndTime) {
            // DPS has stopped - no damage during magic reflection (after initial forgetful DPS damage)
          } else {
            // Clear magic reflection if it's expired
            if (tanks?.magicReflectionActive && this.state.elapsedTime >= tanks.magicReflectionEndTime) {
              tanks.magicReflectionActive = false;
              this.addCombatLogEntry({
                message: `Magic Reflection fades from the adds.`,
                type: 'buff'
              });
              // Clear the warning
              if (this.state.tankSwapWarning?.message.includes('MAGIC REFLECTION')) {
                this.state.tankSwapWarning = null;
              }
            }

            // Distribute DPS across all living adds
            const dpsPerAdd = totalDps / aliveAdds.length;

            aliveAdds.forEach(add => {
              add.currentHealth -= dpsPerAdd * delta;

              if (add.currentHealth <= 0) {
                add.currentHealth = 0;
                add.isAlive = false;
                this.addCombatLogEntry({
                  message: `${add.name} has been slain!`,
                  type: 'system'
                });
              }
            });
          }

          // Check if all adds are dead -> VICTORY!
          const allAddsDead = this.state.boss.adds.every(a => !a.isAlive);
          if (allAddsDead) {
            this.state.boss.currentPhase = 2;
            this.addCombatLogEntry({
              message: `All adds are dead! Majordomo Executus submits!`,
              type: 'system'
            });
            this.addCombatLogEntry({
              message: `VICTORY! Majordomo Executus yields to your power!`,
              type: 'system'
            });
            this.handleBossVictory(this.state.boss.id);
            return;
          }
        }
        // Majordomo himself is NEVER damaged - his health stays at 100%
        // Victory is checked above when all adds die
      } else {
        // Standard boss damage
        this.state.boss.currentHealth = Math.max(0, this.state.boss.currentHealth - totalDps * delta);
      }

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

    // Clear all debuffs, HoTs, buffs, and shields from raid members after boss kill
    // Note: wasInEncounter is preserved until loot is distributed, then cleared in closeLootModal
    this.state.raid.forEach(member => {
      member.debuffs = [];
      member.activeHoTs = [];
      member.buffs = [];
      member.weakenedSoulDuration = 0;
      member.absorbShield = 0;
      member.absorbShieldMax = 0;
    });

    // Clear Power Infusion state
    this.state.powerInfusionTargetId = null;
    this.state.powerInfusionDuration = 0;
    // Clear Innervate state
    this.state.innervateTargetId = null;

    // Clear tank swap warning
    this.state.tankSwapWarning = null;

    // Clear boss frenzy state
    if (this.state.boss) {
      this.state.boss.isFrenzied = false;
      this.state.boss.frenzyEndTime = undefined;
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
        this.state.lastObtainedLegendaryMaterial = legendaryMaterial.id;
        this.addCombatLogEntry({
          message: `LEGENDARY DROP: ${legendaryMaterial.name}!`,
          type: 'system',
        });
        // Trigger the epic special alert!
        this.triggerSpecialAlert(`LEGENDARY! ${legendaryMaterial.name} has dropped!`);
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
      this.state.lootAssignments = {}; // Reset assignments for new loot
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
  // Armor type restrictions:
  // - Plate wearers (warrior, paladin): plate, mail, leather, cloth
  // - Mail wearers (hunter, shaman): mail, leather, cloth
  // - Leather wearers (rogue, druid): leather, cloth
  // - Cloth wearers (mage, warlock, priest): cloth only
  canEquip(wowClass: WoWClass, item: GearItem): boolean {
    // Direct class match or 'all' items always work
    if (item.classes.includes('all') || item.classes.includes(wowClass as WearableClass)) {
      return true;
    }

    // Tier set items (have setId) are CLASS-LOCKED - only the specified classes can equip
    // Do NOT allow armor type flexibility for tier items
    if (item.setId) {
      return false; // Class not in the item's class list, and it's a tier item
    }

    // For non-tier items with an armor type, check if the class can wear that armor type
    if (item.armorType && item.armorType !== 'none') {
      const proficiency = CLASS_ARMOR_PROFICIENCY[wowClass];
      if (!proficiency || !proficiency.includes(item.armorType)) {
        return false; // Class cannot wear this armor type
      }
      // Class CAN wear this armor type, so allow it
      return true;
    }

    // No armor type specified, fall back to class list only
    return false;
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

    // Auto-close loot modal if no items left
    if (this.state.pendingLoot.length === 0) {
      this.state.showLootModal = false;
      this.state.boss = null;
      this.state.raid.forEach(member => { member.wasInEncounter = false; });
      this.requestCloudSave();
    }
    this.notify();
  }

  // Player passes on loot - AI claims it if upgrade, otherwise goes to player bag
  passLoot(itemId: string) {
    const itemIndex = this.state.pendingLoot.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = this.state.pendingLoot[itemIndex];

    // Find eligible raid members (excluding player) who can use AND benefit from this item
    // Spec-aware: caster weapons won't go to warriors, melee weapons won't go to mages, etc.
    // IMPORTANT: Only members who participated in the encounter can receive loot (bench protection)
    const eligibleMembers = this.state.raid.filter(m =>
      m.id !== 'player' && // Don't include player in pass distribution
      m.isAlive &&
      m.wasInEncounter && // Must have participated in the boss fight (not benched)
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
      // No AI players need this
      // In Raid Leader Mode: automatically disenchant into Nexus Crystal
      // In normal mode: send to player's bag for offspec/disenchant/later use
      if (this.state.isRaidLeaderMode) {
        // Raid Leader Mode - auto-disenchant
        if (item.isPreRaidBis) {
          // Pre-raid BiS items get destroyed, not disenchanted
          this.addCombatLogEntry({ message: `Destroyed ${item.name} (pre-raid BiS, cannot disenchant)`, type: 'debuff' });
        } else {
          // Disenchant into Nexus Crystal
          this.state.materialsBag.nexus_crystal++;
          this.addCombatLogEntry({ message: `Disenchanted ${item.name} into a Nexus Crystal`, type: 'buff' });
        }
      } else {
        // Normal mode - send to bag
        this.state.playerBag.push(item);
        this.addCombatLogEntry({ message: `${item.name} sent to your bag (no upgrades needed)`, type: 'system' });
      }
    }

    this.state.pendingLoot.splice(itemIndex, 1);

    // Auto-close loot modal if no items left
    if (this.state.pendingLoot.length === 0) {
      this.state.showLootModal = false;
      this.state.boss = null;
      this.state.raid.forEach(member => { member.wasInEncounter = false; });
      this.requestCloudSave();
    }
    this.notify();
  }

  // Raid Leader Mode: Directly disenchant an item from the loot screen
  disenchantLoot(itemId: string) {
    const itemIndex = this.state.pendingLoot.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = this.state.pendingLoot[itemIndex];

    // Pre-raid BiS items cannot be disenchanted, only destroyed
    if (item.isPreRaidBis) {
      this.addCombatLogEntry({ message: `Destroyed ${item.name} (pre-raid BiS, cannot disenchant)`, type: 'debuff' });
    } else {
      // Disenchant into Nexus Crystal
      this.state.materialsBag.nexus_crystal++;
      this.addCombatLogEntry({ message: `Disenchanted ${item.name} into a Nexus Crystal`, type: 'buff' });
    }

    this.state.pendingLoot.splice(itemIndex, 1);

    // Auto-close loot modal if no items left
    if (this.state.pendingLoot.length === 0) {
      this.state.showLootModal = false;
      this.state.boss = null;
      this.state.raid.forEach(member => { member.wasInEncounter = false; });
    }
    this.requestCloudSave();
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
    // Reset encounter participation flags (after loot is distributed)
    this.state.raid.forEach(member => {
      member.wasInEncounter = false;
    });
    // Request cloud save after loot distribution (items were won/passed)
    this.requestCloudSave();
    this.notify();
  }

  // Get DKP cost for an item
  getItemDKPCost(item: GearItem): number {
    return calculateDKPCost(item);
  }

  // Raid Leader Mode: Award loot directly to a raid member (Master Looter)
  awardLootToMember(itemId: string, memberId: string) {
    const itemIndex = this.state.pendingLoot.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    const item = this.state.pendingLoot[itemIndex];
    const member = this.state.raid.find(m => m.id === memberId);

    if (!member) {
      this.addCombatLogEntry({ message: `Cannot find raid member`, type: 'system' });
      this.notify();
      return;
    }

    // Check if member can equip (no DKP check in Master Looter mode)
    if (!this.canEquip(member.class, item)) {
      this.addCombatLogEntry({ message: `${member.name} cannot equip ${item.name}`, type: 'system' });
      this.notify();
      return;
    }

    // Check if this is a one-hand weapon and member can dual-wield
    // Dual-wield classes: warrior, rogue, enhancement shaman (fury warriors, rogues always can)
    const canDualWield = member.class === 'warrior' || member.class === 'rogue' ||
      (member.class === 'shaman' && member.spec === 'enhancement');
    const isOneHandWeapon = item.slot === 'weapon' && item.weaponType === 'one_hand';

    // If dual-wielder getting a 1H weapon and has weapons in both slots, show choice modal
    if (canDualWield && isOneHandWeapon && member.equipment.weapon && member.equipment.offhand) {
      this.state.pendingWeaponAssignment = {
        item,
        memberId: member.id,
        memberName: member.name,
        mainHandItem: member.equipment.weapon,
        offHandItem: member.equipment.offhand,
      };
      this.notify();
      return; // Don't equip yet - wait for slot choice
    }

    // Check if member already has an item in this slot that's equal or better
    const currentItem = member.equipment[item.slot];
    if (currentItem && currentItem.itemLevel >= item.itemLevel) {
      // Show confirmation modal for downgrade/sidegrade
      this.state.pendingDowngradeConfirmation = {
        item,
        memberId: member.id,
        memberName: member.name,
        currentItem,
        slot: item.slot,
      };
      this.notify();
      return; // Don't equip yet - wait for confirmation
    }

    // Track the assignment so clients can see who got the loot
    this.state.lootAssignments[item.id] = member.name;

    // Equip the item on the member
    this.equipItemOnMember(member, item);
    this.addCombatLogEntry({ message: `Raid Leader awarded ${item.name} to ${member.name}`, type: 'buff' });
    this.notify();

    // Delay removing from pendingLoot so clients see "Assigned to: X" before item disappears
    setTimeout(() => {
      const idx = this.state.pendingLoot.findIndex(i => i.id === itemId);
      if (idx !== -1) {
        this.state.pendingLoot.splice(idx, 1);
        // Auto-close loot modal if no items left
        if (this.state.pendingLoot.length === 0) {
          this.state.showLootModal = false;
          this.state.boss = null;
          this.state.raid.forEach(m => { m.wasInEncounter = false; });
          this.requestCloudSave();
        }
        this.notify();
      }
    }, 1500); // Show assignment for 1.5 seconds
  }

  // Complete a pending weapon assignment after slot choice
  completeWeaponAssignment(slot: 'weapon' | 'offhand') {
    const pending = this.state.pendingWeaponAssignment;
    if (!pending) return;

    const member = this.state.raid.find(m => m.id === pending.memberId);
    if (!member) {
      this.state.pendingWeaponAssignment = null;
      this.notify();
      return;
    }

    // Track the assignment so clients can see who got the loot
    this.state.lootAssignments[pending.item.id] = pending.memberName;

    const itemId = pending.item.id;

    // Equip in the chosen slot
    member.equipment[slot] = pending.item;
    member.gearScore = this.calculateGearScore(member.equipment);

    this.addCombatLogEntry({
      message: `Raid Leader awarded ${pending.item.name} to ${pending.memberName} (${slot === 'weapon' ? 'Main Hand' : 'Off Hand'})`,
      type: 'buff'
    });

    this.state.pendingWeaponAssignment = null;
    this.notify();

    // Delay removing from pendingLoot so clients see "Assigned to: X" before item disappears
    setTimeout(() => {
      const idx = this.state.pendingLoot.findIndex(i => i.id === itemId);
      if (idx !== -1) {
        this.state.pendingLoot.splice(idx, 1);
        // Auto-close loot modal if no items left
        if (this.state.pendingLoot.length === 0) {
          this.state.showLootModal = false;
          this.state.boss = null;
          this.state.raid.forEach(m => { m.wasInEncounter = false; });
          this.requestCloudSave();
        }
        this.notify();
      }
    }, 1500); // Show assignment for 1.5 seconds
  }

  // Cancel a pending weapon assignment
  cancelWeaponAssignment() {
    this.state.pendingWeaponAssignment = null;
    this.notify();
  }

  // Confirm and complete a pending downgrade - user chose to replace better gear
  confirmDowngradeAssignment() {
    const pending = this.state.pendingDowngradeConfirmation;
    if (!pending) return;

    const member = this.state.raid.find(m => m.id === pending.memberId);
    if (!member) {
      this.state.pendingDowngradeConfirmation = null;
      this.notify();
      return;
    }

    // Remove from pending loot
    const itemIndex = this.state.pendingLoot.findIndex(i => i.id === pending.item.id);
    if (itemIndex !== -1) {
      this.state.pendingLoot.splice(itemIndex, 1);
      // Auto-close loot modal if no items left
      if (this.state.pendingLoot.length === 0) {
        this.state.showLootModal = false;
        this.state.boss = null;
        this.state.raid.forEach(m => { m.wasInEncounter = false; });
        this.requestCloudSave();
      }
    }

    // Force equip the item (replacing the better one)
    member.equipment[pending.slot] = pending.item;
    member.gearScore = this.calculateGearScore(member.equipment);

    this.addCombatLogEntry({
      message: `Raid Leader awarded ${pending.item.name} to ${pending.memberName} (replaced ${pending.currentItem.name})`,
      type: 'buff'
    });

    this.state.pendingDowngradeConfirmation = null;
    this.notify();
  }

  // Cancel a pending downgrade confirmation
  cancelDowngradeConfirmation() {
    this.state.pendingDowngradeConfirmation = null;
    this.notify();
  }

  // Get eligible raid members for an item (for Master Looter UI)
  getEligibleMembersForItem(item: GearItem): { id: string; name: string; class: string; isUpgrade: boolean }[] {
    return this.state.raid
      .filter(m =>
        m.isAlive &&
        m.wasInEncounter && // Must have participated
        this.canEquip(m.class, item) &&
        this.canBenefitFrom(m, item)
      )
      .map(m => ({
        id: m.id,
        name: m.name,
        class: m.class,
        isUpgrade: !m.equipment[item.slot] || m.equipment[item.slot]!.itemLevel < item.itemLevel
      }))
      .sort((a, b) => {
        // Sort by upgrade status first (upgrades on top), then alphabetically
        if (a.isUpgrade !== b.isUpgrade) return a.isUpgrade ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
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
    // In Raid Leader Mode, player doesn't have their own gear to enchant
    if (this.state.isRaidLeaderMode) {
      this.addCombatLogEntry({ message: 'Cannot enchant your own gear in Raid Leader Mode', type: 'system' });
      return false;
    }

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
          activeHoTs: [],
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
      version: 9,  // Bumped for isRaidLeaderMode support
      timestamp: Date.now(),
      // Top-level faction and class for character selection screen
      faction: this.state.faction,
      playerClass: this.state.playerClass,
      gearScore: this.getPlayerMember()?.gearScore || 0,
      isRaidLeaderMode: this.state.isRaidLeaderMode,
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
      benchPlayers: this.state.benchPlayers.map(b => ({
        id: b.id,
        name: b.name,
        class: b.class,
        spec: b.spec,
        role: b.role,
        equipment: b.equipment,
        gearScore: b.gearScore,
      })),
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
          activeHoTs: [],
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

      // Restore bench players
      if (saveData.benchPlayers && Array.isArray(saveData.benchPlayers)) {
        this.state.benchPlayers = saveData.benchPlayers.map((saved: {
          id: string;
          name: string;
          class: WoWClass;
          spec: WoWSpec;
          role: 'tank' | 'healer' | 'dps';
          equipment: Equipment;
          gearScore: number;
        }) => ({
          id: saved.id,
          name: saved.name,
          class: saved.class,
          spec: saved.spec,
          role: saved.role,
          equipment: this.migrateEquipment(saved.equipment),
          gearScore: saved.gearScore || 0,
        }));
      } else {
        this.state.benchPlayers = [];
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

  // Admin: Simulate a legendary drop (for testing the UI)
  adminTestLegendaryDrop(materialId: LegendaryMaterialId): void {
    const material = LEGENDARY_MATERIALS[materialId];
    if (!material) return;

    // Set the lastObtainedLegendaryMaterial to trigger the loot screen display
    this.state.lastObtainedLegendaryMaterial = materialId;

    // Add some sample loot items so the loot window looks realistic
    const sampleItems = ['lawbringer_helm', 'crimson_shocker', 'ring_of_spell_power'];
    this.state.pendingLoot = sampleItems
      .map(id => ALL_ITEMS[id])
      .filter(item => item !== undefined);

    // Show the loot modal
    this.state.showLootModal = true;
    this.state.lootAssignments = {}; // Reset assignments for new loot

    // Trigger the special alert
    this.triggerSpecialAlert(`LEGENDARY! ${material.name} has dropped!`);

    this.addCombatLogEntry({
      message: `[Admin] Testing legendary drop: ${material.name}`,
      type: 'system',
    });

    this.notify();
  }

  // Clear the lastObtainedLegendaryMaterial (when user clicks "Send to Bag")
  clearLastObtainedLegendaryMaterial(): void {
    this.state.lastObtainedLegendaryMaterial = null;
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

    // Update spec to match new class (use same role if possible, otherwise default to dps)
    const newSpec = this.getDefaultSpecForClassRole(newClass, member.role);
    member.spec = newSpec;

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

    // Recalculate party auras since class/spec changed
    this.recalculateAuras();

    this.addCombatLogEntry({
      message: `[Admin] Changed ${member.name} from ${oldClass} to ${newClass} (${newSpec})${removedCount > 0 ? `, removed ${removedCount} incompatible items` : ''}`,
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
      activeHoTs: [],
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
