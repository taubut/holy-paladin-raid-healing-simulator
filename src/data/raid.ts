import type { RaidMember, WoWClass } from '../types/game';

// Classic WoW style names - extensive lists to avoid duplicates
// Note: This file uses the limited WoWClass type from types/game.ts (no shaman)
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
      role: 'tank',
      currentHealth: maxHealth,
      maxHealth,
      buffs: [],
      debuffs: [],
      isAlive: true,
      dps: 150, // Tanks do low DPS
      group: Math.floor(i / 5) + 1,
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
      role: 'healer',
      currentHealth: maxHealth,
      maxHealth,
      buffs: [],
      debuffs: [],
      isAlive: true,
      dps: 0, // Healers do no DPS
      group: Math.floor((composition.tanks + i) / 5) + 1,
    });
  }

  // Add DPS (mixed classes)
  const dpsClasses: WoWClass[] = ['rogue', 'mage', 'warlock', 'hunter', 'warrior'];
  for (let i = 0; i < composition.dps; i++) {
    const wowClass = dpsClasses[i % dpsClasses.length];
    const name = getRandomName(wowClass, usedNames);
    usedNames.add(name);
    const maxHealth = getRandomHealth(wowClass, false);
    raid.push({
      id: `member_${id++}`,
      name,
      class: wowClass,
      role: 'dps',
      currentHealth: maxHealth,
      maxHealth,
      buffs: [],
      debuffs: [],
      isAlive: true,
      dps: 400 + Math.floor(Math.random() * 200), // DPS do 400-600 DPS
      group: Math.floor((composition.tanks + composition.healers + i) / 5) + 1,
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
};
