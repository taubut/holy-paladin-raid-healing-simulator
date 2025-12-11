import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import posthog from 'posthog-js';

const supabaseUrl = 'https://zeasujgpconxxuwknyeg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYXN1amdwY29ueHh1d2tueWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjY5NDEsImV4cCI6MjA3OTk0Mjk0MX0.3JNe-YXR-mrXqBr8AeytR63tMB20i_zut_rYcpU94XI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// AUTH FUNCTIONS
// ============================================

export interface PlayerSave {
  id: string;
  user_id: string;
  slot_name: string;
  save_data: unknown;
  created_at: string;
  updated_at: string;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  return { data, error };
}

export async function signInWithApple() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: window.location.origin
    }
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Subscribe to auth state changes
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
}

// ============================================
// CLOUD SAVE FUNCTIONS
// ============================================

export async function saveToCloud(slotName: string, saveData: unknown): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    console.log('No user logged in, skipping cloud save');
    return false;
  }

  const { error } = await supabase
    .from('player_saves')
    .upsert({
      user_id: user.id,
      slot_name: slotName,
      save_data: saveData,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,slot_name'
    });

  if (error) {
    console.error('Failed to save to cloud:', error);
    return false;
  }

  console.log('Saved to cloud:', slotName);
  return true;
}

export async function loadFromCloud(slotName: string): Promise<unknown | null> {
  const user = await getCurrentUser();
  if (!user) {
    console.log('No user logged in, skipping cloud load');
    return null;
  }

  const { data, error } = await supabase
    .from('player_saves')
    .select('save_data')
    .eq('user_id', user.id)
    .eq('slot_name', slotName)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No save found - not an error
      console.log('No cloud save found for slot:', slotName);
      return null;
    }
    console.error('Failed to load from cloud:', error);
    return null;
  }

  console.log('Loaded from cloud:', slotName);
  return data?.save_data ?? null;
}

export async function listCloudSaves(): Promise<PlayerSave[]> {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from('player_saves')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to list cloud saves:', error);
    return [];
  }

  return data || [];
}

export async function deleteCloudSave(slotName: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) {
    return false;
  }

  const { error } = await supabase
    .from('player_saves')
    .delete()
    .eq('user_id', user.id)
    .eq('slot_name', slotName);

  if (error) {
    console.error('Failed to delete cloud save:', error);
    return false;
  }

  return true;
}

// Types for our database tables
export interface GameSession {
  id: string;
  room_code: string;
  host_player_id: string | null;
  status: 'lobby' | 'playing' | 'ended';
  settings: {
    raidSize?: 20 | 40;
    selectedRaid?: string;
    selectedBoss?: string;
    faction?: 'alliance' | 'horde';
  };
  created_at: string;
  updated_at: string;
}

export interface SessionPlayer {
  id: string;
  session_id: string;
  player_name: string;
  player_class: 'paladin' | 'shaman' | 'priest' | 'druid' | 'mage';
  is_host: boolean;
  is_ready: boolean;
  equipment: Record<string, unknown>;
  gear_score: number;
  joined_at: string;
}

// Generate a 6-character room code (no confusing chars like 0/O, 1/I)
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Session management functions
export async function createGameSession(hostName: string, hostClass: SessionPlayer['player_class'], faction: 'alliance' | 'horde' = 'alliance') {
  const roomCode = generateRoomCode();

  // Create the session first
  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .insert({
      room_code: roomCode,
      status: 'lobby',
      settings: { raidSize: 20, faction }
    })
    .select()
    .single();

  if (sessionError || !session) {
    console.error('Failed to create session:', sessionError);
    return null;
  }

  // Create the host player
  const { data: player, error: playerError } = await supabase
    .from('session_players')
    .insert({
      session_id: session.id,
      player_name: hostName,
      player_class: hostClass,
      is_host: true,
      is_ready: true, // Host is always ready
    })
    .select()
    .single();

  if (playerError || !player) {
    console.error('Failed to create host player:', playerError);
    // Clean up the session
    await supabase.from('game_sessions').delete().eq('id', session.id);
    return null;
  }

  // Update session with host_player_id
  await supabase
    .from('game_sessions')
    .update({ host_player_id: player.id })
    .eq('id', session.id);

  // Track room creation in PostHog
  posthog.capture('room_created', {
    room_code: roomCode,
    host_class: hostClass
  });

  return { session, player };
}

export async function joinGameSession(roomCode: string, playerName: string, playerClass: SessionPlayer['player_class'], playerFaction: 'alliance' | 'horde' = 'alliance') {
  // Find the session
  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .select()
    .eq('room_code', roomCode.toUpperCase())
    .single();

  if (sessionError || !session) {
    console.error('Session not found:', sessionError);
    return { error: 'Room not found. Check your code and try again.' };
  }

  if (session.status !== 'lobby') {
    return { error: 'Game already in progress. Cannot join.' };
  }

  // Check faction matches
  const sessionFaction = session.settings?.faction || 'alliance';
  if (playerFaction !== sessionFaction) {
    const hostFactionName = sessionFaction.charAt(0).toUpperCase() + sessionFaction.slice(1);
    const playerFactionName = playerFaction.charAt(0).toUpperCase() + playerFaction.slice(1);
    return { error: `Cannot join: Host is ${hostFactionName} but you are ${playerFactionName}. You must be the same faction to play together.` };
  }

  // Check player count (max 4 for now)
  const { count } = await supabase
    .from('session_players')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', session.id);

  if (count && count >= 4) {
    return { error: 'Room is full (max 4 players).' };
  }

  // Create the player
  const { data: player, error: playerError } = await supabase
    .from('session_players')
    .insert({
      session_id: session.id,
      player_name: playerName,
      player_class: playerClass,
      is_host: false,
      is_ready: false,
    })
    .select()
    .single();

  if (playerError || !player) {
    console.error('Failed to join session:', playerError);
    return { error: 'Failed to join room. Try again.' };
  }

  // Track room join in PostHog
  posthog.capture('room_joined', {
    room_code: roomCode.toUpperCase(),
    player_class: playerClass,
    player_count: (count || 0) + 1 // Including the new player
  });

  return { session, player };
}

export async function getSessionPlayers(sessionId: string): Promise<SessionPlayer[]> {
  const { data, error } = await supabase
    .from('session_players')
    .select()
    .eq('session_id', sessionId)
    .order('joined_at', { ascending: true });

  if (error) {
    console.error('Failed to get players:', error);
    return [];
  }

  return data || [];
}

export async function updatePlayerReady(playerId: string, isReady: boolean) {
  const { error } = await supabase
    .from('session_players')
    .update({ is_ready: isReady })
    .eq('id', playerId);

  return !error;
}

export async function updateSessionStatus(sessionId: string, status: GameSession['status']) {
  const { error } = await supabase
    .from('game_sessions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  return !error;
}

export async function updatePlayerEquipment(playerId: string, equipment: Record<string, unknown>, gearScore: number) {
  const { error } = await supabase
    .from('session_players')
    .update({ equipment, gear_score: gearScore })
    .eq('id', playerId);

  return !error;
}

export async function leaveSession(playerId: string) {
  const { error } = await supabase
    .from('session_players')
    .delete()
    .eq('id', playerId);

  return !error;
}

export async function deleteSession(sessionId: string) {
  const { error } = await supabase
    .from('game_sessions')
    .delete()
    .eq('id', sessionId);

  return !error;
}
