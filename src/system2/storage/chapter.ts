import { applyQuestRewards } from '../core/questEngine';
import type { SQLiteDatabase } from 'expo-sqlite';
import { type PlayerProfile, type VerifiedEvent } from '../core';
import { AWAKENING_CHAPTER_ID, AWAKENING_REWARD_XP, getAwakeningProgress } from '../quests/catalog';

// Only called inside the same exclusive transaction as quest/profile writes.
export async function awardAwakeningIfEligible(db: SQLiteDatabase, player: PlayerProfile, ids: string[]) {
  const progress = getAwakeningProgress(ids);
  if (progress.completed !== progress.total || progress.total === 0) {
    return { player, awakeningCompleted: false, awakeningAwarded: false };
  }
  const now = new Date().toISOString();
  const claim = await db.runAsync(
    'INSERT INTO chapter_completions (chapter_id, completed_at) VALUES (?, ?) ON CONFLICT(chapter_id) DO NOTHING',
    AWAKENING_CHAPTER_ID, now
  );
  if (claim.changes === 0) return { player, awakeningCompleted: true, awakeningAwarded: false };
  const next = applyQuestRewards(player, { realXp: AWAKENING_REWARD_XP }, now);
  const event: VerifiedEvent = {
    id: 'chapter_' + AWAKENING_CHAPTER_ID, questId: AWAKENING_CHAPTER_ID, playerId: player.id,
    createdAt: now, verificationType: 'MULTI', verificationScore: 100, verified: true,
    realXpAwarded: AWAKENING_REWARD_XP, skillXpAwarded: {}, gameEnergyAwarded: 0,
  };
  await db.runAsync('UPDATE app_state SET value = ? WHERE key = ?', JSON.stringify(next), 'player');
  await db.runAsync(
    'INSERT INTO verified_events (id, quest_id, payload, created_at) VALUES (?, ?, ?, ?)',
    event.id, event.questId, JSON.stringify(event), now
  );
  return { player: next, awakeningCompleted: true, awakeningAwarded: true };
}
