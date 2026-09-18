import type { PlayerProfile, VerifiedEvent } from '../core/types';
import type { QuestEvidence, RunnableQuest } from '../quests/types';
import type { QuestAccess } from '../quests/availability';

export type CompletionOperation = {
  kind: 'QUEST_COMPLETION'; key: string; playerId: string; questId: string; eventId: string;
};
export type AppliedOperation = CompletionOperation & { state: 'APPLIED'; appliedAt: string };

// Canonical identity, not a random request ID: retries/new devices must derive the same key.
// Existing single-profile databases scope quest_completions to their local player.
export function completionOperation(playerId: string, questId: string): CompletionOperation {
  if (!playerId || !questId) throw new Error('Missing completion identity.');
  return { kind: 'QUEST_COMPLETION', key: 'quest-completion:' + encodeURIComponent(playerId) + ':' + encodeURIComponent(questId),
    playerId, questId, eventId: 'quest_' + questId };
}
export interface PlayerRepository {
  get(): Promise<PlayerProfile>;
  save(player: PlayerProfile): Promise<void>;
}
export interface QuestRepository {
  get(id: string): Promise<RunnableQuest | undefined>;
  availability(id: string): Promise<QuestAccess>;
  // Must be atomic and unique inside the same transaction as player/event writes.
  claimCompletion(id: string, completedAt: string): Promise<boolean>;
}
export interface EventRepository {
  has(eventId: string): Promise<boolean>;
  append(event: VerifiedEvent): Promise<void>;
}
export interface IdempotencyRepository {
  find(operation: CompletionOperation): Promise<AppliedOperation | null>;
}
// Existing Story/World/Boss/Daily rules remain transaction participants, not a second engine.
export interface CompletionEffects<T> {
  apply(player: PlayerProfile, quest: RunnableQuest, evidence: QuestEvidence, now: string): Promise<PlayerProfile>;
  result(awarded: boolean, before: PlayerProfile, event?: VerifiedEvent): Promise<T>;
}
export type CompletionTransaction<T> = {
  players: PlayerRepository; quests: QuestRepository; events: EventRepository;
  idempotency: IdempotencyRepository; effects: CompletionEffects<T>;
};
export interface CompletionUnitOfWork<T> {
  // Resolve only after commit. Roll back every participant on any error.
  run<R>(work: (transaction: CompletionTransaction<T>) => Promise<R>): Promise<R>;
}
