import { validateQuestEvidence } from '../quests/catalog';
import type { QuestEvidence } from '../quests/types';
import type { VerificationProvider } from './contracts';

export const localQuestVerification: VerificationProvider<QuestEvidence> = {
  id: 'local-gps-timer-v1',
  canHandle: request => ['GPS_DISTANCE', 'TIMER', 'MULTI'].includes(request.method),
  async verify(request) {
    const base = { providerId: this.id, checkedAt: request.requestedAt };
    if (!this.canHandle(request)) return { ...base, status: 'UNAVAILABLE', code: 'UNSUPPORTED_METHOD', reason: 'Brak dostawcy weryfikacji.' };
    try {
      if (request.questId !== request.evidence.questId || request.method !== request.evidence.verificationType) throw new Error('Niezgodna tożsamość dowodu.');
      const evidence = { ...request.evidence };
      validateQuestEvidence(evidence, 1);
      return { ...base, status: 'VERIFIED', code: 'LOCAL_EVIDENCE_VALID', evidence };
    } catch (cause) {
      return { ...base, status: 'REJECTED', code: 'INVALID_EVIDENCE', reason: cause instanceof Error ? cause.message : 'Nieprawidłowy dowód.' };
    }
  },
};
