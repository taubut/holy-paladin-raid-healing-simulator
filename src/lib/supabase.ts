import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zeasujgpconxxuwknyeg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplYXN1amdwY29ueHh1d2tueWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjY5NDEsImV4cCI6MjA3OTk0Mjk0MX0.3JNe-YXR-mrXqBr8AeytR63tMB20i_zut_rYcpU94XI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  };
  created_at: string;
  updated_at: string;
}

export interface SessionPlayer {
  id: string;
  session_id: string;
  player_name: string;
  player_class: 'paladin' | 'shaman' | 'priest' | 'druid';
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
export async function createGameSession(hostName: string, hostClass: SessionPlayer['player_class']) {
  const roomCode = generateRoomCode();

  // Create the session first
  const { data: session, error: sessionError } = await supabase
    .from('game_sessions')
    .insert({
      room_code: roomCode,
      status: 'lobby',
      settings: { raidSize: 20 }
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

  return { session, player };
}

export async function joinGameSession(roomCode: string, playerName: string, playerClass: SessionPlayer['player_class']) {
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
