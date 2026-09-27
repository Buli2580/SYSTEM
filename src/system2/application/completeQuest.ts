import { completeQuest } from '../core/questEngine';
import { completionOperation, type CompletionOperation, type CompletionUnitOfWork } from '../repositories/contracts';
import type { QuestEvidence } from '../quests/types';
import type { VerificationProvider } from '../verification/contracts';

export type CompletionRequest = { evidence: QuestEvidence; operationKey?: string };
export type CompletionOutcome<T> =
  | { status: 'APPLIED' | 'DUPLICATE'; operation: CompletionOperation; value: T }
  | { status: 'LOCKED' | 'FAILED' | 'REJECTED' | 'PENDING' | 'UNAVAILABLE'; code: string; reason: string };

export function createQuestCompletion<T>(unit: CompletionUnitOfWork<T>, provider: VerificationProvider<QuestEvidence>, now: () => string) {
  return async (input: CompletionRequest): Promise<CompletionOutcome<T>> => {
    // Snapshot before awaiting provider/queue; rewards always come from the trusted catalog.
    const evidence: QuestEvidence = JSON.parse(JSON.stringify(input.evidence));
    const operationKey = input.operationKey;
    const request = { questId: evidence.questId, method: evidence.verificationType, evidence, requestedAt: now() };
    if (!provider.canHandle(request)) return { status: 'UNAVAILABLE', code: 'UNSUPPORTED_METHOD', reason: 'Brak dostawcy weryfikacji.' };
    // Verification is outside the write lock. Access is resolved again inside the transaction.
    const verified = await provider.verify(request);
    if (verified.status !== 'VERIFIED') return { status: verified.status, code: verified.code, reason: verified.reason };
    if (verified.evidence.questId !== evidence.questId || verified.evidence.verificationType !== evidence.verificationType) throw new Error('Verification identity mismatch.');
    return unit.run(async tx => {
      let player = await tx.players.get();
      const operation = completionOperation(player.id, evidence.questId);
      if (operationKey !== undefined && operationKey !== operation.key) throw new Error('Idempotency key does not match player/quest.');
      // A replay remains a replay even after the Daily period or Boss stage has changed.
      if (await tx.idempotency.find(operation)) return { status: 'DUPLICATE', operation, value: await tx.effects.result(false, player) };
      const quest = await tx.quests.get(evidence.questId);
      if (!quest) return { status: 'UNAVAILABLE', code: 'UNKNOWN_QUEST', reason: 'Nieznana misja.' };
      const access = await tx.quests.availability(quest.id);
      if (!access.canComplete) return { status: access.status === 'FAILED' ? 'FAILED' : 'LOCKED', code: access.code, reason: 'Ta misja jest zablokowana lub niedostępna.' };
      // Availability may reconcile existing chapter rewards. Never overwrite that fresh profile.
      player = await tx.players.get();
      const completedAt = now();
      const completion = completeQuest(player, verified.evidence, access.status, completedAt, quest.adaptiveDifficulty);
      if (!await tx.quests.claimCompletion(quest.id, completedAt)) return { status: 'DUPLICATE', operation, value: await tx.effects.result(false, player) };
      const next = await tx.effects.apply(completion.player, quest, verified.evidence, completedAt);
      await tx.players.save(next);
      await tx.events.append(completion.event);
      return { status: 'APPLIED', operation, value: await tx.effects.result(true, player, completion.event) };
    });
  };
}
