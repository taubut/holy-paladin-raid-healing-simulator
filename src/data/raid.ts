import type { RaidMember, WoWClass, WoWSpec, Equipment, PositionZone } from '../game/types';

// Empty equipment for default raid members
const EMPTY_EQUIPMENT: Equipment = {
  head: null, neck: null, shoulders: null, back: null, chest: null,
  wrist: null, hands: null, waist: null, legs: null, feet: null,
  ring1: null, ring2: null, trinket1: null, trinket2: null,
  weapon: null, offhand: null, ranged: null,
};

// Pre-Raid BiS DPS values by spec (based on warcrafttavern MC BiS scaled down ~80%)
// MC BiS reference: Fury 625, Rogue 610, Hunter 459, Mage 420, Lock 402, SPriest 393, Ele 383, Feral 357, Enh 348, Ret 314
const SPEC_DPS: Record<WoWSpec, number> = {
  // DPS specs - Pre-raid BiS values
  fury: 500,              // Fury Warrior - scales hard with gear
  fury_prot: 480,         // Fury/Prot hybrid - nearly as much DPS as pure Fury
  combat: 490,            // Combat Rogue - consistent melee
  assassination: 470,     // Assassination Rogue
  subtlety: 350,          // Subtlety Rogue - PvP spec
  marksmanship: 370,      // Marksmanship Hunter - strong pre-raid
  beast_mastery: 340,     // Beast Mastery Hunter
  survival: 350,          // Survival Hunter
  frost_mage: 335,        // Frost Mage - AoE king
  fire_mage: 380,         // Fire Mage (when it works)
  arcane: 300,            // Arcane Mage
  affliction: 320,        // Affliction Warlock
  demonology: 310,        // Demonology Warlock
  destruction: 320,       // Destruction Warlock
  shadow: 315,            // Shadow Priest - mana issues
  elemental: 305,         // Elemental Shaman - mana limited
  enhancement: 280,       // Enhancement Shaman - Windfury procs
  feral_dps: 285,         // Feral DPS Druid - hard to gear
  balance: 220,           // Balance Druid - Oomkin
  retribution: 250,       // Retribution Paladin - meme spec pre-raid
  arms: 450,              // Arms Warrior - slightly less than Fury
  // Tank specs - low DPS, focused on threat/survival
  protection_warrior: 150,
  protection_paladin: 120,
  feral_tank: 130,
  // Healer specs - no DPS
  holy_paladin: 0,
  holy_priest: 0,
  discipline: 0,
  restoration: 0,         // Resto Druid
  restoration_shaman: 0,  // Resto Shaman
};

// Get DPS for a spec with some variance (+/- 10%)
export const getSpecDps = (spec: WoWSpec): number => {
  const baseDps = SPEC_DPS[spec] || 300;
  const variance = baseDps * 0.1; // 10% variance
  return Math.round(baseDps + (Math.random() * variance * 2 - variance));
};

// Map class/role to spec
const getSpec = (wowClass: WoWClass, role: 'tank' | 'healer' | 'dps'): WoWSpec => {
  if (role === 'tank') return 'protection_warrior';
  if (role === 'healer') {
    if (wowClass === 'priest') return 'holy_priest';
    if (wowClass === 'paladin') return 'holy_paladin';
    if (wowClass === 'druid') return 'restoration';
    return 'restoration_shaman';
  }
  // DPS specs
  const dpsSpecs: Record<WoWClass, WoWSpec> = {
    warrior: 'fury',
    rogue: 'combat',
    hunter: 'marksmanship',
    mage: 'frost_mage',
    warlock: 'affliction',
    priest: 'shadow',
    paladin: 'retribution',
    druid: 'feral_dps',
    shaman: 'elemental',
  };
  return dpsSpecs[wowClass] || 'fury';
};

// Map role to position zone
const getPositionZone = (role: 'tank' | 'healer' | 'dps', wowClass: WoWClass): PositionZone => {
  if (role === 'tank') return 'tank';
  if (role === 'healer') return 'ranged';
  // DPS - melee or ranged based on class
  const meleeClasses: WoWClass[] = ['warrior', 'rogue'];
  return meleeClasses.includes(wowClass) ? 'melee' : 'ranged';
};

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
    'Shiv', 'Gouge', 'Sinister', 'Deadly', 'Mutilate', 'Envenom', 'Rupture', 'Garrote', 'Cheapshot',
    'Kidney', 'Blind', 'Sprint', 'Evasion', 'Blade', 'Flurry', 'Thistle', 'Defias', 'Syndicate'
  ],
  priest: [
    'Benedictus', 'Moira', 'Anduin', 'Velen', 'Whitemane', 'Tyrande', 'Alonsus', 'Faol', 'Calia',
    'Menethil', 'Natalie', 'Seline', 'Zabra', 'Hexx', 'Rohan', 'Talanji', 'Zolani', 'Zul',
    'Shadowmend', 'Holyfire', 'Lightwell', 'Renew', 'Serenity', 'Sanctuary', 'Prayer', 'Penance',
    'Absolution', 'Discipline', 'Devout', 'Vestment', 'Transcendence', 'Avatar', 'Confessor',
    'Inquisitor', 'Bishop', 'Archbishop', 'Cardinal', 'Pontiff', 'Oracle', 'Prophet', 'Seer',
    'Absolver', 'Penitent', 'Faithful', 'Devoted', 'Pious', 'Sacred', 'Divine', 'Holy', 'Radiant'
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
  shaman: [
    'Thrall', 'Drektar', 'Nobundo', 'Rehgar', 'Muln', 'Earthfury', 'Farseer', 'Spiritwalker',
    'Stormcaller', 'Thunderhorn', 'Earthshaker', 'Tidecaller', 'Windspeaker', 'Flamekeeper',
    'Chainlightning', 'Chainheal', 'Earthshock', 'Flameshock', 'Frostshock', 'Purge', 'Hex',
    'Totemic', 'Ancestral', 'Elemental', 'Restoration', 'Enhancement', 'Bloodlust', 'Heroism',
    'Maelstrom', 'Lavaburster', 'Stormstrike', 'Windfury', 'Grounding', 'Earthbind', 'Manaspring'
  ],
};

// Health pools based on Classic WoW (pre-AQ gear)
const CLASS_HEALTH: Record<WoWClass, { min: number; max: number }> = {
  warrior: { min: 5500, max: 7000 }, // Tanks have more
  paladin: { min: 4000, max: 5000 },
  hunter: { min: 3500, max: 4200 },
  rogue: { min: 3200, max: 4000 },
  priest: { min: 3000, max: 3800 },
  mage: { min: 2800, max: 3500 },
  warlock: { min: 3200, max: 4000 },
  druid: { min: 3800, max: 4800 },
  shaman: { min: 3600, max: 4500 },
};

function getRandomName(wowClass: WoWClass, usedNames: Set<string>): string {
  const names = CLASS_NAMES[wowClass];
  const available = names.filter(n => !usedNames.has(n));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  // If class names exhausted, try names from ALL classes
  const allNames = Object.values(CLASS_NAMES).flat();
  const allAvailable = allNames.filter(n => !usedNames.has(n));
  if (allAvailable.length > 0) {
    return allAvailable[Math.floor(Math.random() * allAvailable.length)];
  }
  // Last resort: should never happen with 400+ names
  return `Adventurer${Date.now() % 1000}`;
}

function getRandomHealth(wowClass: WoWClass, isTank: boolean): number {
  const range = CLASS_HEALTH[wowClass];
  const base = Math.floor(Math.random() * (range.max - range.min) + range.min);
  return isTank ? Math.floor(base * 1.4) : base; // Tanks get 40% more HP
}

// Generate a 40-man raid (or 20-man for easier mode)
export function generateRaid(size: 20 | 40 = 40): RaidMember[] {
  const raid: RaidMember[] = [];
  const usedNames = new Set<string>();

  // Raid composition for 40-man
  // 4 tanks, 10 healers, 26 DPS
  const composition = size === 40
    ? { tanks: 4, healers: 10, dps: 26 }
    : { tanks: 2, healers: 5, dps: 13 };

  let id = 0;

  // Add tanks (Warriors)
  for (let i = 0; i < composition.tanks; i++) {
    const name = getRandomName('warrior', usedNames);
    usedNames.add(name);
    const maxHealth = getRandomHealth('warrior', true);
    raid.push({
      id: `member_${id++}`,
      name,
      class: 'warrior',
      spec: getSpec('warrior', 'tank'),
      role: 'tank',
      currentHealth: maxHealth,
      maxHealth,
      buffs: [],
      debuffs: [],
      activeHoTs: [],
      isAlive: true,
      dps: getSpecDps('protection_warrior'),
      group: Math.floor(i / 5) + 1,
      equipment: { ...EMPTY_EQUIPMENT },
      gearScore: 0,
      positionZone: getPositionZone('tank', 'warrior'),
    });
  }

  // Add healers (Priests, Paladins, Druids)
  const healerClasses: WoWClass[] = ['priest', 'paladin', 'druid'];
  for (let i = 0; i < composition.healers; i++) {
    const wowClass = healerClasses[i % healerClasses.length];
    const name = getRandomName(wowClass, usedNames);
    usedNames.add(name);
    const maxHealth = getRandomHealth(wowClass, false);
    raid.push({
      id: `member_${id++}`,
      name,
      class: wowClass,
      spec: getSpec(wowClass, 'healer'),
      role: 'healer',
      currentHealth: maxHealth,
      maxHealth,
      buffs: [],
      debuffs: [],
      activeHoTs: [],
      isAlive: true,
      dps: 0, // Healers do no DPS
      group: Math.floor((composition.tanks + i) / 5) + 1,
      equipment: { ...EMPTY_EQUIPMENT },
      gearScore: 0,
      positionZone: getPositionZone('healer', wowClass),
    });
  }

  // Add DPS with realistic Classic 40-man composition (faction-aware)
  // Typical MC raid: ~8-10 fury warriors, 4-6 rogues, 3-4 mages, 3-4 warlocks, 2-3 hunters, 1-2 shadow priests
  // Plus faction melee: Ret Paladin (Alliance) or Enh Shaman (Horde)
  const dpsDistribution40: WoWClass[] = [
    // Fury Warriors (the kings of Classic DPS) - 8
    'warrior', 'warrior', 'warrior', 'warrior', 'warrior', 'warrior', 'warrior', 'warrior',
    // Rogues - 5
    'rogue', 'rogue', 'rogue', 'rogue', 'rogue',
    // Mages (for AoE and intellect buff) - 4
    'mage', 'mage', 'mage', 'mage',
    // Warlocks (curses, healthstones, soulstones) - 4
    'warlock', 'warlock', 'warlock', 'warlock',
    // Hunters (tranq shot, pulls, buffs) - 3
    'hunter', 'hunter', 'hunter',
    // Shadow Priest (shadow weaving debuff) - 1
    'priest',
    // Note: Faction melee (Ret Pally/Enh Shaman) handled by GameEngine.ts
  ];

  // 20-man version - scaled down proportionally
  const dpsDistribution20: WoWClass[] = [
    // Fury Warriors - 4
    'warrior', 'warrior', 'warrior', 'warrior',
    // Rogues - 2
    'rogue', 'rogue',
    // Mages - 2
    'mage', 'mage',
    // Warlocks - 2
    'warlock', 'warlock',
    // Hunters - 2
    'hunter', 'hunter',
    // Shadow Priest - 1
    'priest',
  ];

  const dpsDistribution = size === 40 ? dpsDistribution40 : dpsDistribution20;

  // Shuffle the DPS distribution for variety
  const shuffledDps = [...dpsDistribution].sort(() => Math.random() - 0.5);

  for (let i = 0; i < composition.dps; i++) {
    // Use shuffled distribution, fallback to cycling if we need more
    const wowClass: WoWClass = i < shuffledDps.length
      ? shuffledDps[i]
      : (['warrior', 'rogue', 'mage', 'warlock', 'hunter'] as WoWClass[])[i % 5];
    const name = getRandomName(wowClass, usedNames);
    usedNames.add(name);
    const maxHealth = getRandomHealth(wowClass, false);
    raid.push({
      id: `member_${id++}`,
      name,
      class: wowClass,
      spec: getSpec(wowClass, 'dps'),
      role: 'dps',
      currentHealth: maxHealth,
      maxHealth,
      buffs: [],
      debuffs: [],
      activeHoTs: [],
      isAlive: true,
      dps: getSpecDps(getSpec(wowClass, 'dps')),
      group: Math.floor((composition.tanks + composition.healers + i) / 5) + 1,
      equipment: { ...EMPTY_EQUIPMENT },
      gearScore: 0,
      positionZone: getPositionZone('dps', wowClass),
    });
  }

  return raid;
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
  shaman: '#0070DE',
};
