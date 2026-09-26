import type { PlayerProfile, Quest, QuestReward, SkillKey, VerifiedEvent } from './types';
import { addRealXp, addSkillXp, assertXpAmount, SKILL_KEYS } from './progression';
import type { QuestEvidence } from '../quests/types';
import { validateQuestEvidence } from '../quests/catalog';

/** Pure reward arithmetic. Callers own eligibility, unique claims and persistence. */
export function applyQuestRewards(player: PlayerProfile, reward: QuestReward, completedAt: string): PlayerProfile {
  if (!Number.isFinite(Date.parse(completedAt))) throw new Error('Invalid completion date.');
  assertXpAmount(reward.realXp);
  assertXpAmount(reward.gameEnergy ?? 0);
  // Reserved model fields have no inventory implementation; never silently discard a reward.
  if (reward.coins !== undefined || reward.chest !== undefined) throw new Error('Unsupported reward type.');
  for (const [key, xp] of Object.entries(reward.skillXp ?? {})) {
    if (!SKILL_KEYS.includes(key as SkillKey)) throw new Error('Unknown skill.');
    assertXpAmount(xp);
  }
  const energy = player.gameEnergy + (reward.gameEnergy ?? 0);
  assertXpAmount(energy);
  let next = addRealXp(player, reward.realXp, completedAt);
  for (const [key, xp] of Object.entries(reward.skillXp ?? {})) next = addSkillXp(next, key as SkillKey, xp, completedAt);
  return { ...next, gameEnergy: energy, updatedAt: completedAt };
}

export type QuestCompletion = { player: PlayerProfile; quest: Quest; event: VerifiedEvent };

/**
 * Deterministic completion from verified evidence, never a manual completion command.
 * The adapter must resolve access inside its transaction and hold a unique completion claim.
 * Persist the returned profile/event/completion together. Streak changes only on Daily Clear.
 */
export function completeQuest(player: PlayerProfile, input: QuestEvidence, status: Quest['status'], completedAt: string, bossDifficulty = 2): QuestCompletion {
  if (status !== 'ACTIVE' && status !== 'AVAILABLE') throw new Error('Quest cannot be completed in its current state.');
  // The existing validator normalizes activity evidence; keep caller-owned data immutable.
  const evidence: QuestEvidence = { ...input };
  const definition = validateQuestEvidence(evidence, bossDifficulty);
  const rewarded = applyQuestRewards(player, definition.rewards, completedAt);
  const distance = evidence.verificationType === 'TIMER' ? 0 : evidence.distanceMeters;
  const totalDistanceMeters = player.totalDistanceMeters + distance;
  if (!Number.isFinite(totalDistanceMeters) || totalDistanceMeters < 0) throw new Error('Invalid distance.');
  assertXpAmount(player.verifiedQuestCount + 1);
  const next = { ...rewarded, verifiedQuestCount: player.verifiedQuestCount + 1, totalDistanceMeters };
  return {
    player: next,
    quest: { ...definition, status: 'COMPLETED', completedAt, progress: definition.progressTarget },
    event: {
      levelBefore: player.realLevel, levelAfter: next.realLevel,
      activity: definition.activityType ? evidence.activity : undefined,
      id: 'quest_' + definition.id, playerId: player.id, questId: definition.id, createdAt: completedAt,
      verificationType: evidence.verificationType, verificationScore: evidence.verificationScore, verified: true,
      realXpAwarded: definition.rewards.realXp, skillXpAwarded: { ...definition.rewards.skillXp },
      gameEnergyAwarded: definition.rewards.gameEnergy ?? 0,
      distanceMeters: evidence.distanceMeters, durationSeconds: evidence.durationSeconds,
    },
  };
}
