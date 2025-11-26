// Raid Registry - defines all available raids in the game
import type { Boss } from './types';
import { ENCOUNTERS, ONYXIA_ENCOUNTERS } from './encounters';

export interface Raid {
  id: string;
  name: string;
  shortName: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  available: boolean;  // false = greyed out "Coming Soon"
  encounters: Boss[];
  worldBuffUnlock?: string;  // Boss ID that unlocks a world buff when killed
}

export const RAIDS: Raid[] = [
  {
    id: 'molten_core',
    name: 'Molten Core',
    shortName: 'MC',
    description: '10 bosses - Level 60 entry raid',
    minPlayers: 20,
    maxPlayers: 40,
    available: true,
    encounters: ENCOUNTERS,
  },
  {
    id: 'onyxia',
    name: "Onyxia's Lair",
    shortName: 'Ony',
    description: '1 boss - Dragon raid',
    minPlayers: 20,
    maxPlayers: 40,
    available: true,
    encounters: ONYXIA_ENCOUNTERS,
    worldBuffUnlock: 'onyxia',  // Killing Onyxia unlocks Rallying Cry of the Dragonslayer
  },
  {
    id: 'blackwing_lair',
    name: 'Blackwing Lair',
    shortName: 'BWL',
    description: '8 bosses - Coming Soon',
    minPlayers: 40,
    maxPlayers: 40,
    available: false,  // Greyed out
    encounters: [],
  },
];

// Helper to get a raid by ID
export function getRaidById(raidId: string): Raid | undefined {
  return RAIDS.find(r => r.id === raidId);
}

// Helper to get encounters for a specific raid
export function getRaidEncounters(raidId: string): Boss[] {
  const raid = getRaidById(raidId);
  return raid?.encounters || [];
}

// Default raid ID
export const DEFAULT_RAID_ID = 'molten_core';
