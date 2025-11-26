import type { RaidMember, WoWClass } from '../types/game';

// Classic WoW style names
const WARRIOR_NAMES = ['Thunderfury', 'Shieldwall', 'Ironfoe', 'Grommash', 'Lothar'];
const PALADIN_NAMES = ['Uther', 'Tirion', 'Bolvar', 'Turalyon', 'Mograine'];
const HUNTER_NAMES = ['Rexxar', 'Alleria', 'Hemet', 'Nathanos', 'Sylvanas'];
const ROGUE_NAMES = ['Garona', 'Mathias', 'Valeera', 'Edwin', 'Ravenholdt'];
const PRIEST_NAMES = ['Benedictus', 'Moira', 'Anduin', 'Velen', 'Whitemane'];
const MAGE_NAMES = ['Jaina', 'Khadgar', 'Antonidas', 'Rhonin', 'Medivh'];
const WARLOCK_NAMES = ['Guldan', 'Wilfred', 'Kanrethad', 'Helcular', 'Dreadmist'];
const DRUID_NAMES = ['Malfurion', 'Hamuul', 'Cenarius', 'Staghelm', 'Remulos'];

const CLASS_NAMES: Record<WoWClass, string[]> = {
  warrior: WARRIOR_NAMES,
  paladin: PALADIN_NAMES,
  hunter: HUNTER_NAMES,
  rogue: ROGUE_NAMES,
  priest: PRIEST_NAMES,
  mage: MAGE_NAMES,
  warlock: WARLOCK_NAMES,
  druid: DRUID_NAMES,
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
  if (available.length === 0) {
    // Generate a random suffix if all names are used
    const baseName = names[Math.floor(Math.random() * names.length)];
    return `${baseName}${Math.floor(Math.random() * 99)}`;
  }
  return available[Math.floor(Math.random() * available.length)];
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
