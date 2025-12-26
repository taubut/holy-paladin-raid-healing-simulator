// Franchise Mode Types for Guild Management System
// Transforms Raid Leader mode into a full "Madden Franchise Mode" for WoW raiding

import type { BenchPlayer, Equipment } from './types';

// ============================================================================
// PERSONALITY TRAITS (18 total)
// ============================================================================

// Positive: loyal, chill, team_player, mentor, clutch, social_butterfly, reliable
// Negative: greedy, drama_queen, ambitious, prima_donna, jealous, impatient, casual
// Neutral: lone_wolf, mercenary, competitive, veteran

export type PersonalityTraitId =
  // Positive traits
  | 'loyal'           // Committed to guild, low drama/leave
  | 'chill'           // Nothing phases them, zero drama
  | 'team_player'     // No drama on loot loss
  | 'mentor'          // Helps new players, boosts others' morale
  | 'clutch'          // Performs better under pressure
  | 'social_butterfly' // Many relationships, spreads morale (good and bad)
  | 'reliable'        // Always shows up, 0% no-show (rare trait)
  // Negative traits
  | 'greedy'          // Upset when losing loot
  | 'drama_queen'     // 25% drama on ANY negative event
  | 'ambitious'       // Unhappy when benched, wants progression
  | 'prima_donna'     // Demands special treatment
  | 'jealous'         // Upset when others get loot
  | 'impatient'       // Frustrated by wipes
  | 'casual'          // May forget raid night, +10% no-show
  // Neutral traits
  | 'lone_wolf'       // Unaffected by others, few relationships
  | 'mercenary'       // Here for gear, may leave for better offer
  | 'competitive'     // Wants to top meters, rivalry prone
  | 'veteran';        // Experienced, stable morale

export interface PersonalityTrait {
  id: PersonalityTraitId;
  name: string;
  icon: string;               // Icon path for display
  description: string;
  category: 'positive' | 'negative' | 'neutral';
  dramaModifier: number;      // 1.4 = +40% drama chance, 0 = no drama
  leaveModifier: number;      // 0.5 = -50% leave risk
  noShowModifier: number;     // 0.1 = +10% no-show chance, -0.05 = -5%
  moraleDecayRate: number;    // Multiplier for morale decay
  moraleGainRate: number;     // Multiplier for morale gain
  isRare?: boolean;           // Rare traits appear less frequently
  isHidden?: boolean;         // Hidden until recruited (for LFG)
}

// ============================================================================
// MORALE SYSTEM
// ============================================================================

export type MoraleTrend = 'rising' | 'falling' | 'stable';

export interface MoraleState {
  current: number;            // 0-100 scale
  baseline: number;           // Natural settling point (50 + trait mods)
  trend: MoraleTrend;
  lastChangeReason: string;
  lastChangeAmount: number;
  lastChangeTimestamp: number;
}

// Events that affect morale
export type MoraleEventType =
  | 'loot_received'           // +15 to +25
  | 'loot_lost'               // -8 to -15 (wanted it)
  | 'boss_kill'               // +5 to +10
  | 'wipe'                    // -3 to -8
  | 'benched'                 // -10 to -18
  | 'friend_left'             // -15 to -25
  | 'friend_joined'           // +5 to +10
  | 'promoted_to_raid'        // +10 to +15
  | 'drama_resolved_positive' // +5 to +15
  | 'drama_resolved_negative' // -10 to -20
  | 'guild_achievement'       // +5 to +10
  | 'weekly_decay'            // Gradual return to baseline
  | 'innervate_received'      // +2 (flavor)
  | 'no_show_warning';        // -5

// Morale effects on performance
export interface MoraleEffect {
  minMorale: number;
  maxMorale: number;
  performanceModifier: number;  // -0.15 to +0.10
  dramaRisk: 'none' | 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  leaveRiskPerWeek: number;     // 0 to 0.30
  label: string;
}

// ============================================================================
// RELATIONSHIPS
// ============================================================================

export type RelationshipType = 'friend' | 'close_friend' | 'rival' | 'neutral';

export interface Relationship {
  player1Id: string;
  player2Id: string;
  type: RelationshipType;
  strength: number;           // 0-100, affects cascade effects
  formedAt: number;           // Timestamp
  lastInteraction: number;    // Timestamp
}

// ============================================================================
// CLIQUES (3-5 friends who stick together)
// ============================================================================

export interface Clique {
  id: string;
  name?: string;              // Optional clique name ("The Tank Squad")
  memberIds: string[];        // 3-5 members
  leaderId: string;           // If leader leaves, others may follow
  cohesion: number;           // 0-100, affects cascade leaving
  formedAt: number;
}

// ============================================================================
// LFG RECRUITMENT
// ============================================================================

export interface LFGRecruit extends BenchPlayer {
  personality: PersonalityTraitId[];
  visibleTraits: PersonalityTraitId[];  // Traits visible before recruiting
  hiddenTraits: PersonalityTraitId[];   // Revealed after recruiting
  morale: MoraleState;
  availableUntil: number;     // Timestamp - gets "taken" after
  weeksUntilGone: number;     // 1-5 weeks
  minReputationRequired: number;  // Guild reputation needed to see this recruit in pool
  renownCost: number;         // Renown currency cost to recruit (5-100 based on gear)
  gearTier?: string;          // Display name of gear tier ('Undergeared', 'Pre-Raid BiS', 'MC Geared', etc.)
  isEmergencyFill?: boolean;  // Temporary recruit for one raid
  previousGuild?: string;     // Flavor text
  recruitReason?: string;     // "Looking for new guild", "Guild disbanded", etc.
}

// ============================================================================
// DRAMA SYSTEM
// ============================================================================

export type DramaType =
  | 'loot_dispute'        // Someone upset about loot assignment
  | 'bench_complaint'     // Upset about being benched
  | 'performance_issue'   // Complaints about another player
  | 'clique_conflict'     // Clique drama
  | 'attendance_warning'  // Chronic no-shows
  | 'jealousy'            // Jealous of another player's loot
  | 'leadership_dispute'; // Questioning guild decisions

export type DramaSeverity = 'minor' | 'moderate' | 'major' | 'crisis';

export interface DramaEvent {
  id: string;
  type: DramaType;
  severity: DramaSeverity;
  instigatorId: string;
  instigatorName: string;
  targetId?: string;          // Player they're upset with (if any)
  targetName?: string;
  itemId?: string;            // Item in question (if loot dispute)
  itemName?: string;
  itemIcon?: string;          // Item icon path
  quote: string;              // What the player says ("I can't believe you gave MY ring to...")
  timestamp: number;
  options: DramaOption[];
  resolved: boolean;
  resolutionOptionId?: string;
}

export interface DramaOption {
  id: string;
  label: string;              // "Give them the item instead"
  icon: string;               // Icon for the button
  description: string;        // Brief explanation
  outcomes: DramaOutcome[];
  reputationChange: number;   // Guild reputation effect
  escalationChance?: number;  // Chance this makes things worse
}

export interface DramaOutcome {
  playerId: string;
  playerName: string;
  moraleChange: number;
  leaveRiskChange: number;    // Direct modifier to leave risk
  relationshipChange?: {
    targetId: string;
    change: number;           // Positive = friendship, negative = rivalry
  };
}

// ============================================================================
// GUILD REPUTATION
// ============================================================================

export type ReputationTier = 'unknown' | 'rising' | 'established' | 'famous' | 'legendary';

export interface GuildReputation {
  current: number;            // 0-100
  rank: number;               // Server ranking (for flavor)
  tier: ReputationTier;
  weeklyDecay: number;        // How much rep decays per week without activity
  lastBossKill: number;       // Timestamp
}

// Reputation effects on LFG quality
export interface ReputationEffect {
  minRep: number;
  maxRep: number;
  tier: ReputationTier;
  maxRecruitGearScore: number;  // Cap on recruit quality
  description: string;
}

// ============================================================================
// ATTENDANCE SYSTEM
// ============================================================================

export type AttendanceStatus = 'present' | 'no_show' | 'excused' | 'benched';

export interface AttendanceRecord {
  playerId: string;
  playerName: string;
  status: AttendanceStatus;
  excuse?: string;            // "Internet issues", "Mom aggro", etc.
  roleStress: 'critical' | 'high' | 'medium' | 'low';
}

export interface AttendanceCheck {
  raidWeek: number;
  timestamp: number;
  records: AttendanceRecord[];
  tanksMissing: number;
  healersMissing: number;
  dpsMissing: number;
  canStartRaid: boolean;
  emergencyFillsNeeded: string[];  // Role types needed
}

// ============================================================================
// LEAVE WARNING SYSTEM
// ============================================================================

export interface LeaveWarning {
  playerId: string;
  playerName: string;
  warningNumber: number;      // 1, 2, or 3
  reason: string;
  timestamp: number;
  morale: number;
  leaveRisk: number;
}

export interface PlayerDeparture {
  playerId: string;
  playerName: string;
  playerClass: string;
  reason: string;
  equipmentLost: Equipment;   // Gear they took with them
  gearScoreLost: number;
  timestamp: number;
  friendsAffected: string[];  // IDs of friends who lost morale
  cliqueCollapsed?: boolean;  // Did their clique fall apart?
}

// ============================================================================
// FRANCHISE PLAYER (Extended BenchPlayer)
// ============================================================================

export interface FranchiseBenchPlayer extends BenchPlayer {
  personality: PersonalityTraitId[];
  morale: MoraleState;
  relationships: string[];    // Related player IDs
  cliqueId?: string;
  joinedAt: number;           // When they joined the guild
  lootReceived: string[];     // Item IDs they've received
  benchedCount: number;       // Times benched
  leaveRisk: number;          // 0-1 calculated risk
  leaveWarnings: number;      // 0-3, player gets warnings before leaving
  attendanceHistory: AttendanceStatus[];  // Last 4 weeks
  noShowCount: number;        // Total no-shows
}

// ============================================================================
// WEEKLY SUMMARY
// ============================================================================

export interface WeeklySummary {
  week: number;
  timestamp: number;
  bossesKilled: string[];
  lootDistributed: { itemId: string; itemName: string; recipientName: string }[];
  moraleChanges: { playerName: string; change: number; newMorale: number }[];
  dramaEvents: number;
  dramaResolved: number;
  playersJoined: string[];
  playersLeft: PlayerDeparture[];
  reputationChange: number;
  newReputation: number;
  attendanceIssues: number;
}

// ============================================================================
// FRANCHISE MODE STATE (additions to GameState)
// ============================================================================

export interface FranchiseModeState {
  enabled: boolean;
  guildName: string;
  guildReputation: GuildReputation;
  lfgPool: LFGRecruit[];
  lfgLastRefresh: number;
  relationships: Relationship[];
  cliques: Clique[];
  activeDrama: DramaEvent | null;
  dramaHistory: DramaEvent[];
  franchiseRoster: FranchiseBenchPlayer[];
  currentWeek: number;
  weeklySummaries: WeeklySummary[];
  lastAttendanceCheck: AttendanceCheck | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// No-show excuses (flavor text)
export const NO_SHOW_EXCUSES = [
  'Real life came up',
  'Forgot it was raid night',
  'Internet issues',
  'Had to work late',
  'Computer problems',
  'Girlfriend aggro',
  'Mom aggro',
  'Dog ate their power cable',
  'Stuck in traffic',
  'Emergency at work',
  'Fell asleep',
  'Double-booked with another guild',
  'Power outage',
  'ISP maintenance',
  'Family dinner they forgot about',
];

// Recruit reasons (flavor text for LFG)
export const RECRUIT_REASONS = [
  'Looking for a new home',
  'Guild disbanded',
  'Server transferred',
  'Coming back from break',
  'Looking for better progression',
  'Old guild was too casual',
  'Old guild was too hardcore',
  'Drama in previous guild',
  'Friends quit, looking for new group',
  'Rerolled, seeking raid spot',
];

// Base icon path
const ICON_BASE = '/icons';

// Personality trait definitions with all modifiers
export const PERSONALITY_TRAITS: Record<PersonalityTraitId, PersonalityTrait> = {
  // ===== POSITIVE TRAITS =====
  loyal: {
    id: 'loyal',
    name: 'Loyal',
    icon: `${ICON_BASE}/spell_holy_prayerofhealing.jpg`,
    description: 'Committed to the guild through thick and thin',
    category: 'positive',
    dramaModifier: 0.5,      // 50% less drama
    leaveModifier: 0.5,      // 50% less likely to leave
    noShowModifier: -0.05,   // 5% less no-shows
    moraleDecayRate: 0.8,    // Slower morale decay
    moraleGainRate: 1.0,
  },
  chill: {
    id: 'chill',
    name: 'Chill',
    icon: `${ICON_BASE}/spell_frost_wizardmark.jpg`,
    description: 'Nothing phases them - drama just rolls off',
    category: 'positive',
    dramaModifier: 0,        // Zero drama
    leaveModifier: 0.7,
    noShowModifier: 0.05,    // Slightly more no-shows (relaxed)
    moraleDecayRate: 0.6,    // Very slow morale decay
    moraleGainRate: 0.8,     // Also slower morale gain
  },
  team_player: {
    id: 'team_player',
    name: 'Team Player',
    icon: `${ICON_BASE}/spell_holy_blessingofprotection.jpg`,
    description: 'Puts the guild first, never drama over loot',
    category: 'positive',
    dramaModifier: 0,        // No loot drama
    leaveModifier: 0.8,
    noShowModifier: 0,
    moraleDecayRate: 1.0,
    moraleGainRate: 1.2,     // More morale from team success
  },
  mentor: {
    id: 'mentor',
    name: 'Mentor',
    icon: `${ICON_BASE}/spell_holy_surgeoflight.jpg`,
    description: 'Helps new players improve, boosts guild morale',
    category: 'positive',
    dramaModifier: 0.6,
    leaveModifier: 0.7,
    noShowModifier: -0.03,
    moraleDecayRate: 0.9,
    moraleGainRate: 1.1,
  },
  clutch: {
    id: 'clutch',
    name: 'Clutch',
    icon: `${ICON_BASE}/spell_holy_divineillumination.jpg`,
    description: 'Performs better under pressure, thrives in progression',
    category: 'positive',
    dramaModifier: 0.8,
    leaveModifier: 0.9,
    noShowModifier: -0.05,   // Very reliable on big nights
    moraleDecayRate: 1.0,
    moraleGainRate: 1.3,     // Big morale boost from kills
  },
  social_butterfly: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    icon: `${ICON_BASE}/spell_holy_divinespirit.jpg`,
    description: 'Many friends in the guild, spreads morale effects',
    category: 'positive',
    dramaModifier: 0.7,
    leaveModifier: 0.6,      // Many friends = hard to leave
    noShowModifier: 0,
    moraleDecayRate: 1.2,    // More affected by others
    moraleGainRate: 1.3,     // Also more boosted by others
  },
  reliable: {
    id: 'reliable',
    name: 'Reliable',
    icon: `${ICON_BASE}/spell_holy_greaterblessingoflight.jpg`,
    description: 'Always shows up for raid, never misses',
    category: 'positive',
    dramaModifier: 0.8,
    leaveModifier: 0.7,
    noShowModifier: -1.0,    // 0% no-show chance (cancels all no-show)
    moraleDecayRate: 1.0,
    moraleGainRate: 1.0,
    isRare: true,            // Only 10% of recruits
  },

  // ===== NEGATIVE TRAITS =====
  greedy: {
    id: 'greedy',
    name: 'Greedy',
    icon: `${ICON_BASE}/inv_misc_coin_01.jpg`,
    description: 'Gets upset when they lose loot to others',
    category: 'negative',
    dramaModifier: 1.4,      // 40% more drama
    leaveModifier: 1.0,
    noShowModifier: 0,
    moraleDecayRate: 1.2,
    moraleGainRate: 1.4,     // Big morale from getting loot
  },
  drama_queen: {
    id: 'drama_queen',
    name: 'Drama Queen',
    icon: `${ICON_BASE}/spell_shadow_shadowworddominate.jpg`,
    description: 'Creates drama over any negative event',
    category: 'negative',
    dramaModifier: 1.5,      // 50% more drama, triggers on anything
    leaveModifier: 1.0,
    noShowModifier: 0,
    moraleDecayRate: 1.4,    // Fast morale swings
    moraleGainRate: 1.3,
  },
  ambitious: {
    id: 'ambitious',
    name: 'Ambitious',
    icon: `${ICON_BASE}/spell_holy_crusade.jpg`,
    description: 'Wants progression, unhappy when benched',
    category: 'negative',
    dramaModifier: 1.0,
    leaveModifier: 1.3,      // More likely to leave for better guild
    noShowModifier: -0.05,   // Always shows to prove worth
    moraleDecayRate: 1.3,    // Morale drops when benched
    moraleGainRate: 1.0,
  },
  prima_donna: {
    id: 'prima_donna',
    name: 'Prima Donna',
    icon: `${ICON_BASE}/inv_crown_01.jpg`,
    description: 'Demands special treatment and attention',
    category: 'negative',
    dramaModifier: 1.3,
    leaveModifier: 1.2,
    noShowModifier: 0.05,    // Might not show if upset
    moraleDecayRate: 1.5,
    moraleGainRate: 0.8,     // Hard to please
  },
  jealous: {
    id: 'jealous',
    name: 'Jealous',
    icon: `${ICON_BASE}/spell_shadow_mindsteal.jpg`,
    description: 'Gets upset when others get loot, even for different class',
    category: 'negative',
    dramaModifier: 1.2,
    leaveModifier: 1.1,
    noShowModifier: 0,
    moraleDecayRate: 1.3,
    moraleGainRate: 0.9,
  },
  impatient: {
    id: 'impatient',
    name: 'Impatient',
    icon: `${ICON_BASE}/spell_nature_bloodlust.jpg`,
    description: 'Gets frustrated by wipes, wants fast kills',
    category: 'negative',
    dramaModifier: 1.1,
    leaveModifier: 1.2,
    noShowModifier: 0.03,
    moraleDecayRate: 1.5,    // Big morale hit from wipes
    moraleGainRate: 1.2,
  },
  casual: {
    id: 'casual',
    name: 'Casual',
    icon: `${ICON_BASE}/inv_misc_food_14.jpg`,
    description: 'Not fully committed, may forget raid night',
    category: 'negative',
    dramaModifier: 0.7,      // Less drama (doesn\'t care)
    leaveModifier: 1.2,
    noShowModifier: 0.10,    // 10% more no-shows
    moraleDecayRate: 0.8,
    moraleGainRate: 0.8,
  },

  // ===== NEUTRAL TRAITS =====
  lone_wolf: {
    id: 'lone_wolf',
    name: 'Lone Wolf',
    icon: `${ICON_BASE}/ability_druid_prowl.jpg`,
    description: 'Unaffected by guild drama, few relationships',
    category: 'neutral',
    dramaModifier: 0.3,      // Rarely involved in drama
    leaveModifier: 0.5,      // Independent but not leaving
    noShowModifier: 0,
    moraleDecayRate: 0.5,    // Very stable morale
    moraleGainRate: 0.5,     // But also doesn\'t rise much
  },
  mercenary: {
    id: 'mercenary',
    name: 'Mercenary',
    icon: `${ICON_BASE}/inv_sword_04.jpg`,
    description: 'Here for the gear, may leave for better offer',
    category: 'neutral',
    dramaModifier: 0.8,
    leaveModifier: 1.5,      // High leave risk
    noShowModifier: 0.15,    // Might no-show for better opportunity
    moraleDecayRate: 1.0,
    moraleGainRate: 1.5,     // Big morale from loot
  },
  competitive: {
    id: 'competitive',
    name: 'Competitive',
    icon: `${ICON_BASE}/spell_fire_fireball.jpg`,
    description: 'Wants to top the meters, rivalry prone',
    category: 'neutral',
    dramaModifier: 1.1,      // Some rivalry drama
    leaveModifier: 1.0,
    noShowModifier: -0.05,   // Always shows to compete
    moraleDecayRate: 1.2,
    moraleGainRate: 1.3,
  },
  veteran: {
    id: 'veteran',
    name: 'Veteran',
    icon: `${ICON_BASE}/inv_shield_06.jpg`,
    description: 'Experienced raider, stable and predictable',
    category: 'neutral',
    dramaModifier: 0.7,
    leaveModifier: 0.8,
    noShowModifier: 0,
    moraleDecayRate: 0.7,    // Very stable morale
    moraleGainRate: 0.7,
  },
};

// Helper to get random traits for a new player (2-3 traits)
export function getRandomTraits(count: 2 | 3 = 2): PersonalityTraitId[] {
  const allTraits = Object.keys(PERSONALITY_TRAITS) as PersonalityTraitId[];

  // Separate rare traits
  const rareTraits = allTraits.filter(t => PERSONALITY_TRAITS[t].isRare);
  const commonTraits = allTraits.filter(t => !PERSONALITY_TRAITS[t].isRare);

  const selected: PersonalityTraitId[] = [];

  // 10% chance to get a rare trait as first trait
  if (Math.random() < 0.1 && rareTraits.length > 0) {
    const rareIndex = Math.floor(Math.random() * rareTraits.length);
    selected.push(rareTraits[rareIndex]);
  }

  // Fill remaining slots from common traits
  while (selected.length < count) {
    const randomIndex = Math.floor(Math.random() * commonTraits.length);
    const trait = commonTraits[randomIndex];

    // Avoid duplicates and conflicting traits
    if (!selected.includes(trait) && !hasConflictingTrait(selected, trait)) {
      selected.push(trait);
    }
  }

  return selected;
}

// Check for conflicting traits that shouldn't be together
function hasConflictingTrait(existing: PersonalityTraitId[], newTrait: PersonalityTraitId): boolean {
  const conflicts: Record<PersonalityTraitId, PersonalityTraitId[]> = {
    loyal: ['mercenary'],
    chill: ['drama_queen', 'impatient'],
    team_player: ['greedy', 'jealous'],
    greedy: ['team_player', 'chill'],
    drama_queen: ['chill', 'lone_wolf'],
    casual: ['ambitious', 'reliable', 'competitive'],
    lone_wolf: ['social_butterfly', 'drama_queen'],
    mercenary: ['loyal'],
    reliable: ['casual'],
    ambitious: ['casual', 'chill'],
    social_butterfly: ['lone_wolf'],
    jealous: ['team_player'],
    impatient: ['chill'],
    competitive: ['casual'],
    mentor: [],
    clutch: [],
    prima_donna: [],
    veteran: [],
  };

  for (const existingTrait of existing) {
    if (conflicts[existingTrait]?.includes(newTrait)) {
      return true;
    }
    if (conflicts[newTrait]?.includes(existingTrait)) {
      return true;
    }
  }

  return false;
}

// Reroll a single trait, keeping other traits intact
// Returns a new trait that doesn't conflict with remaining traits
export function rerollSingleTrait(
  currentTraits: PersonalityTraitId[],
  traitToReplace: PersonalityTraitId
): PersonalityTraitId {
  const allTraits = Object.keys(PERSONALITY_TRAITS) as PersonalityTraitId[];
  const rareTraits = allTraits.filter(t => PERSONALITY_TRAITS[t].isRare);
  const commonTraits = allTraits.filter(t => !PERSONALITY_TRAITS[t].isRare);

  // Keep all traits except the one being replaced
  const remainingTraits = currentTraits.filter(t => t !== traitToReplace);

  // Small chance (15%) to get a rare trait on reroll
  let availableTraits = Math.random() < 0.15 ? [...commonTraits, ...rareTraits] : commonTraits;

  // Filter out current traits and conflicting traits
  availableTraits = availableTraits.filter(t =>
    !currentTraits.includes(t) && !hasConflictingTrait(remainingTraits, t)
  );

  // If somehow no traits available, just return a random common one
  if (availableTraits.length === 0) {
    availableTraits = commonTraits.filter(t => !currentTraits.includes(t));
  }

  const randomIndex = Math.floor(Math.random() * availableTraits.length);
  return availableTraits[randomIndex];
}

// Cost to reroll a trait (in reputation points)
export const TRAIT_REROLL_COST = 5;

// Default franchise state
export const DEFAULT_FRANCHISE_STATE: FranchiseModeState = {
  enabled: false,
  guildName: 'My Guild',
  guildReputation: {
    current: 25,
    rank: 50,
    tier: 'unknown',
    weeklyDecay: 3,
    lastBossKill: 0,
  },
  lfgPool: [],
  lfgLastRefresh: 0,
  relationships: [],
  cliques: [],
  activeDrama: null,
  dramaHistory: [],
  franchiseRoster: [],
  currentWeek: 1,
  weeklySummaries: [],
  lastAttendanceCheck: null,
};
