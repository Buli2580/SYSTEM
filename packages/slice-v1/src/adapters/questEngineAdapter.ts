/**
 * Boundary to authoritative Quest Engine.
 * Slice never writes XP directly — only proposes evidence and accepts RewardReceipt-like results.
 */
export type QeEvidenceSubmission = {
  questId: string;
  verificationType: 'GPS_DISTANCE' | 'TIMER' | 'MULTI' | 'DEV_SIMULATED_PATH';
  distanceMeters?: number;
  durationSeconds?: number;
  verificationScore: number;
  /** When true, host must refuse to treat as physical proof */
  syntheticDevPath?: boolean;
};

export type QeRewardResult =
  | {
      ok: true;
      claimId: string;
      realXp: number;
      skillXp: Record<string, number>;
      energy: number;
      beforeLevel: number;
      afterLevel: number;
      worldUnlocked: boolean;
    }
  | { ok: false; reason: string };

export type QuestEnginePort = {
  validateAndReward(evidence: QeEvidenceSubmission): Promise<QeRewardResult>;
};

/** In-process harness for isolated tests — mirrors QE rules without SQLite host. */
export function createHarnessQuestEngine(opts?: {
  xpForQuest?: Record<string, number>;
  level1Threshold?: number;
}): QuestEnginePort {
  const threshold = opts?.level1Threshold ?? 147;
  const xpMap = opts?.xpForQuest ?? {
    first_movement_v1: 100,
    safe_awakening_focus_v1: 50,
    awakening_chapter_1: 300,
  };
  let totalXp = 0;
  const claimed = new Set<string>();

  return {
    async validateAndReward(evidence) {
      if (evidence.syntheticDevPath || evidence.verificationType === 'DEV_SIMULATED_PATH') {
        return { ok: false, reason: 'DEV_PATH_NOT_REAL_PROOF' };
      }
      if (evidence.verificationScore > 100 || evidence.verificationScore < 80) {
        return { ok: false, reason: 'SCORE_REJECTED' };
      }
      if (evidence.verificationType === 'GPS_DISTANCE') {
        if ((evidence.distanceMeters ?? 0) < 500) return { ok: false, reason: 'DISTANCE_SHORT' };
      }
      if (evidence.verificationType === 'TIMER') {
        if ((evidence.durationSeconds ?? 0) < 300) return { ok: false, reason: 'DURATION_SHORT' };
      }
      const claimId = `qe:${evidence.questId}:${evidence.verificationType}`;
      if (claimed.has(claimId)) return { ok: false, reason: 'REPLAY_REWARD' };
      const xp = xpMap[evidence.questId] ?? 0;
      if (xp <= 0) return { ok: false, reason: 'UNKNOWN_QUEST' };
      claimed.add(claimId);
      const beforeLevel = totalXp >= threshold ? 2 : 1;
      totalXp += xp;
      const afterLevel = totalXp >= threshold ? 2 : 1;
      return {
        ok: true,
        claimId,
        realXp: xp,
        skillXp: { VIT: Math.floor(xp * 0.8) },
        energy: 10,
        beforeLevel,
        afterLevel,
        worldUnlocked: false,
      };
    },
  };
}
