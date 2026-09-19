import { getSupabaseClient } from './supabaseClient';
import { getCurrentUser } from './auth';
import type {
  CloudConnectionState,
  CloudProfile,
  CloudSkillProgress,
  CloudQuestCompletion,
  CloudStoryProgress,
  CloudSyncStatus,
  CloudState,
  ConnectionStateListener,
} from './cloudTypes';

const connectionStateListeners = new Set<ConnectionStateListener>();
let currentConnectionState: CloudConnectionState = 'OFFLINE';
let currentCloudState: CloudState = {
  mode: 'GUEST',
  connectionState: 'OFFLINE',
  user: null,
  profile: null,
  skills: [],
  questCompletions: [],
  storyProgress: [],
  syncStatus: {
    lastSyncAt: null,
    pendingChanges: 0,
    conflictCount: 0,
    error: null,
  },
};

function notifyConnectionListeners(): void {
  for (const listener of connectionStateListeners) {
    try {
      listener(currentConnectionState);
    } catch {
      // Ignore listener errors
    }
  }
}

function setConnectionState(state: CloudConnectionState): void {
  if (currentConnectionState !== state) {
    currentConnectionState = state;
    currentCloudState = { ...currentCloudState, connectionState: state };
    notifyConnectionListeners();
  }
}

function updateCloudState(partial: Partial<CloudState>): void {
  currentCloudState = { ...currentCloudState, ...partial };
}

export function onConnectionStateChange(listener: ConnectionStateListener): () => void {
  connectionStateListeners.add(listener);
  listener(currentConnectionState);
  return () => { connectionStateListeners.delete(listener); };
}

export function getConnectionState(): CloudConnectionState {
  return currentConnectionState;
}

export function getCloudState(): CloudState {
  return { ...currentCloudState };
}

export async function fetchCloudData(): Promise<{ success: boolean; error: string | null }> {
  const user = getCurrentUser();
  if (!user) {
    setConnectionState('OFFLINE');
    return { success: false, error: 'Not authenticated' };
  }

  const client = getSupabaseClient();
  if (!client) {
    setConnectionState('ERROR');
    return { success: false, error: 'Supabase not configured' };
  }

  setConnectionState('CONNECTING');

  try {
    const [profileRes, skillsRes, questsRes, storyRes] = await Promise.all([
      client.from('player_progress').select('*').eq('user_id', user.id).single(),
      client.from('skill_progress').select('*').eq('user_id', user.id),
      client.from('quest_completions').select('*').eq('user_id', user.id),
      client.from('story_progress').select('*').eq('user_id', user.id),
    ]);

    if (profileRes.error && profileRes.error.code !== 'PGRST116') {
      throw profileRes.error;
    }

    if (skillsRes.error) throw skillsRes.error;
    if (questsRes.error) throw questsRes.error;
    if (storyRes.error) throw storyRes.error;

    const profile: CloudProfile | null = profileRes.data ?? null;
    const skills: CloudSkillProgress[] = skillsRes.data ?? [];
    const questCompletions: CloudQuestCompletion[] = questsRes.data ?? [];
    const storyProgress: CloudStoryProgress[] = storyRes.data ?? [];

    updateCloudState({
      profile,
      skills,
      questCompletions,
      storyProgress,
      syncStatus: {
        lastSyncAt: new Date().toISOString(),
        pendingChanges: 0,
        conflictCount: 0,
        error: null,
      },
    });

    setConnectionState('ONLINE');
    return { success: true, error: null };
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : 'Failed to fetch cloud data';
    updateCloudState({
      syncStatus: { ...currentCloudState.syncStatus, error },
    });
    setConnectionState('ERROR');
    return { success: false, error };
  }
}

export async function pushLocalToCloud(
  localProfile: any,
  localSkills: any[],
  localQuestCompletions: string[],
  localStoryProgress: string[]
): Promise<{ success: boolean; error: string | null }> {
  const user = getCurrentUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Supabase not configured' };

  setConnectionState('CONNECTING');

  try {
    const profileUpsert = {
      user_id: user.id,
      display_name: localProfile.displayName,
      real_level: localProfile.realLevel,
      real_xp: localProfile.realXp,
      total_real_xp: localProfile.totalRealXp,
      rank: localProfile.rank,
      game_energy: localProfile.gameEnergy,
      total_distance_meters: localProfile.totalDistanceMeters,
      discovered_sectors: localProfile.discoveredSectors,
      verified_quest_count: localProfile.verifiedQuestCount,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await client
      .from('player_progress')
      .upsert(profileUpsert, { onConflict: 'user_id' });
    if (profileError) throw profileError;

    const skillUpserts = localSkills.map(s => ({
      user_id: user.id,
      skill_key: s.key,
      level: s.level,
      xp: s.xp,
      xp_to_next_level: s.xpToNextLevel,
      total_xp: s.totalXp,
    }));
    if (skillUpserts.length > 0) {
      const { error: skillsError } = await client
        .from('skill_progress')
        .upsert(skillUpserts, { onConflict: 'user_id,skill_key' });
      if (skillsError) throw skillsError;
    }

    const questUpserts = localQuestCompletions.map(qid => ({
      user_id: user.id,
      quest_id: qid,
      completed_at: new Date().toISOString(),
      verification_type: 'LOCAL_SYNC',
      verification_score: 100,
      distance_meters: null,
      duration_seconds: null,
    }));
    if (questUpserts.length > 0) {
      const { error: questsError } = await client
        .from('quest_completions')
        .upsert(questUpserts, { onConflict: 'user_id,quest_id' });
      if (questsError) throw questsError;
    }

    const storyUpserts = localStoryProgress.map(chapterId => ({
      user_id: user.id,
      chapter_id: chapterId,
      completed_at: new Date().toISOString(),
    }));
    if (storyUpserts.length > 0) {
      const { error: storyError } = await client
        .from('story_progress')
        .upsert(storyUpserts, { onConflict: 'user_id,chapter_id' });
      if (storyError) throw storyError;
    }

    updateCloudState({
      syncStatus: {
        lastSyncAt: new Date().toISOString(),
        pendingChanges: 0,
        conflictCount: 0,
        error: null,
      },
    });

    setConnectionState('ONLINE');
    return { success: true, error: null };
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : 'Failed to push to cloud';
    updateCloudState({
      syncStatus: { ...currentCloudState.syncStatus, error },
    });
    setConnectionState('ERROR');
    return { success: false, error };
  }
}

export function mapCloudToLocalDTO(cloudState: CloudState) {
  return {
    profile: cloudState.profile ? {
      displayName: cloudState.profile.display_name,
      realLevel: cloudState.profile.real_level,
      realXp: cloudState.profile.real_xp,
      totalRealXp: cloudState.profile.total_real_xp,
      rank: cloudState.profile.rank,
      gameEnergy: cloudState.profile.game_energy,
      totalDistanceMeters: cloudState.profile.total_distance_meters,
      discoveredSectors: cloudState.profile.discovered_sectors,
      verifiedQuestCount: cloudState.profile.verified_quest_count,
      updatedAt: cloudState.profile.updated_at,
    } : null,
    skills: cloudState.skills.map(s => ({
      key: s.skill_key,
      level: s.level,
      xp: s.xp,
      xpToNextLevel: s.xp_to_next_level,
      totalXp: s.total_xp,
    })),
    questCompletionIds: cloudState.questCompletions.map(q => q.quest_id),
    storyProgressIds: cloudState.storyProgress.map(s => s.chapter_id),
  };
}

export function shouldSyncWithCloud(): boolean {
  return currentConnectionState === 'ONLINE' && currentCloudState.mode === 'AUTHENTICATED';
}