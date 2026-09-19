import { GPSQuestTracker } from './gpsTracker';
import type {
  FieldQuestSession,
  FieldQuestStatus,
  FieldQuestProgress,
  FieldQuestEvidence,
  FieldQuestVerificationMode,
  FieldQuestRequirement,
  FieldQuestResult,
  FieldQuestRestoreData,
  FieldQuestPermissions,
  DeviceReadiness,
} from './types';
import { verifyFieldQuest, buildFieldQuestEvidence } from './verification';
import { classifyActivity, verdictMessage } from '../activity/classifier';
import type { ActivityEvidence } from '../activity/types';
import type { RunnableQuest } from '../quests/types';
import { completeVerifiedQuest, getQuestAccess } from '../storage/database';
import { awaitWithTimeout } from '../storage/awaitWithTimeout';
import * as Haptics from '../identity/feedback';
import { distanceBetween, isUsableLocation, verifiedSegment, verificationScoreForAccuracy } from '../verification/gps';
import { createFocusTimer } from '../verification/timer';

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const VALID_STATUSES: FieldQuestStatus[] = ['READY', 'STARTING', 'ACTIVE', 'PAUSED', 'VERIFYING', 'COMPLETED', 'FAILED', 'CANCELLED'];

export class FieldQuestSessionManager {
  private session: FieldQuestSession | null = null;
  private gpsTracker: GPSQuestTracker;
  private quest: RunnableQuest | null = null;
  private focusedRef = { current: false };
  private statusRef: { current: FieldQuestStatus } = { current: 'READY' };
  private sessionRef = { current: 0 };

  private setStatus(status: FieldQuestStatus): void {
    if (!VALID_STATUSES.includes(status)) {
      console.warn(`Invalid status: ${status}`);
      return;
    }
    this.statusRef.current = status;
  }
  private verificationInterval: ReturnType<typeof setInterval> | null = null;
  private activityWindow: ReturnType<typeof import('../activity/features').createActivityWindow> | null = null;
  private timerRef: ReturnType<typeof createFocusTimer> | null = null;
  private startTimeRef: number | null = null;
  private lastPointRef: { current: any } = { current: null };
  private lastFixTimeRef: number = 0;
  private distanceRef: number = 0;
  private scoreRef: number = 100;
  private extendedRef: boolean = false;
  private pendingEnd: any = null;
  private endWrite: Promise<void> | null = null;
  private onStatusChange: ((status: FieldQuestStatus) => void) | null = null;
  private onProgressChange: ((progress: FieldQuestProgress) => void) | null = null;
  private onComplete: ((result: FieldQuestResult) => void) | null = null;

  constructor(
    onStatusChange?: (status: FieldQuestStatus) => void,
    onProgressChange?: (progress: FieldQuestProgress) => void,
    onComplete?: (result: FieldQuestResult) => void
  ) {
    this.onStatusChange = onStatusChange ?? null;
    this.onProgressChange = onProgressChange ?? null;
    this.onComplete = onComplete ?? null;

    this.gpsTracker = new GPSQuestTracker((state) => {
      if (this.onProgressChange) {
        this.onProgressChange({
          distanceMeters: state.accumulatedDistance,
          durationSeconds: state.elapsedTime,
          sampleCount: state.sampleCount,
          currentAccuracy: state.accuracy,
          lastUpdate: Date.now(),
        });
      }
    });
  }

  async start(quest: RunnableQuest): Promise<{ success: boolean; error?: string }> {
    if (this.session) return { success: false, error: 'Session already active' };
    if (this.statusRef.current !== 'READY') return { success: false, error: 'Invalid state' };

    this.quest = quest;
    this.setStatus('STARTING');
    this.sessionRef.current++;
    this.focusedRef.current = true;

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = Date.now();

    this.session = {
      id: sessionId,
      questId: quest.id,
      questTitle: quest.title,
      verificationMode: this.mapVerificationMode(quest.verification.type),
      requirements: this.mapRequirements(quest),
      status: 'STARTING',
      progress: {
        distanceMeters: 0,
        durationSeconds: 0,
        sampleCount: 0,
        currentAccuracy: null,
        lastUpdate: now,
      },
      startedAt: now,
      pausedAt: null,
      completedAt: null,
      pausedDuration: 0,
      rewardClaimed: false,
    };

    this.emitStatusChange();
    this.emitProgressChange();

    const gpsStarted = await this.gpsTracker.start();
    if (!gpsStarted) {
      const error = this.gpsTracker.getState().lastError ?? 'Failed to start GPS';
      await this.fail(error);
      return { success: false, error };
    }

    this.setStatus('ACTIVE');
    this.session!.status = 'ACTIVE';
    this.emitStatusChange();
    this.startVerificationLoop();

    return { success: true };
  }

  private mapVerificationMode(type: string): FieldQuestVerificationMode {
    switch (type) {
      case 'GPS_DISTANCE': return 'GPS_DISTANCE';
      case 'TIMER': return 'TIMER';
      case 'MULTI': return 'GPS_AND_TIMER';
      default: return 'MANUAL';
    }
  }

  private mapRequirements(quest: RunnableQuest): FieldQuestRequirement {
    const v = quest.verification;
    const req: FieldQuestRequirement = {
      type: this.mapVerificationMode(v.type),
      minimumVerificationScore: v.verificationScoreRequired,
    };
    if ('activityType' in v && v.activityType) {
      req.activityType = v.activityType as 'WALK' | 'RUN' | 'BIKE';
    }
    if (v.type !== 'TIMER') {
      req.minimumDistanceMeters = v.minimumDistanceMeters;
    }
    if (v.type !== 'GPS_DISTANCE') {
      req.minimumDurationSeconds = v.minimumDurationSeconds;
    }
    return req;
  }

  private emitStatusChange() {
    if (this.onStatusChange && this.session) {
      this.onStatusChange(this.session.status);
    }
  }

  private emitProgressChange() {
    if (this.onProgressChange && this.session) {
      this.onProgressChange(this.session.progress);
    }
  }

  pause() {
    if (!this.session || this.statusRef.current !== 'ACTIVE') return;
    this.gpsTracker.pause();
    this.setStatus('PAUSED');
    this.session!.status = 'PAUSED';
    this.session!.pausedAt = Date.now();
    this.stopVerificationLoop();
    this.emitStatusChange();
  }

  resume() {
    if (!this.session || this.statusRef.current !== 'PAUSED') return;
    this.gpsTracker.resume();
    this.setStatus('ACTIVE');
    this.session!.status = 'ACTIVE';
    this.session!.pausedDuration += Date.now() - (this.session.pausedAt ?? Date.now());
    this.session!.pausedAt = null;
    this.emitStatusChange();
    this.startVerificationLoop();
  }

  cancel() {
    if (!this.session) return;
    this.gpsTracker.stop();
    this.stopVerificationLoop();
    this.setStatus('CANCELLED');
    this.session!.status = 'CANCELLED';
    this.session!.completedAt = Date.now();
    this.emitStatusChange();
    this.cleanup();
  }

  private startVerificationLoop() {
    if (this.verificationInterval) return;
    this.verificationInterval = setInterval(() => {
      if (!this.focusedRef.current || this.statusRef.current !== 'ACTIVE') return;
      this.checkProgress();
    }, 1000);
  }

  private stopVerificationLoop() {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
      this.verificationInterval = null;
    }
  }

  private async checkProgress() {
    if (!this.quest || !this.session) return;

    const gpsProgress = this.gpsTracker.getProgress();
    this.distanceRef = gpsProgress.distanceMeters;
    const duration = gpsProgress.elapsedTime;

    this.session!.progress = {
      distanceMeters: gpsProgress.distanceMeters,
      durationSeconds: duration,
      sampleCount: gpsProgress.sampleCount,
      currentAccuracy: gpsProgress.currentAccuracy,
      lastUpdate: Date.now(),
    };
    this.emitProgressChange();

    // Build evidence for verification
    const evidence = buildFieldQuestEvidence(
      this.quest.id,
      this.session.id,
      this.distanceRef,
      duration,
      gpsProgress.sampleCount,
      this.scoreRef,
      this.session.verificationMode,
      [], // GPS samples would need to be collected from tracker
      undefined // activity evidence
    );

    const verificationResult = verifyFieldQuest(evidence, {
      minimumDistanceMeters: this.session.requirements.minimumDistanceMeters,
      minimumDurationSeconds: this.session.requirements.minimumDurationSeconds,
      minimumVerificationScore: this.session.requirements.minimumVerificationScore,
      activityType: this.session.requirements.activityType,
    });

    if (verificationResult.verdict === 'VERIFIED') {
      await this.verifyAndComplete(evidence, verificationResult as { verdict: 'VERIFIED'; score: number; evidence: FieldQuestEvidence });
    } else if (verificationResult.verdict === 'REJECTED') {
      await this.fail('Verification failed: ' + verificationResult.reasonCodes.join(', '));
    }
    // For SUSPICIOUS or INSUFFICIENT_DATA, continue tracking
  }

  private async verifyAndComplete(evidence: FieldQuestEvidence, verificationResult: { verdict: 'VERIFIED'; score: number; evidence: FieldQuestEvidence }) {
    if (!this.quest || !this.session) return;

    this.setStatus('VERIFYING');
    this.session!.status = 'VERIFYING';
    this.emitStatusChange();

    try {
      const access = await awaitWithTimeout(getQuestAccess(this.quest.id));
      if (access !== 'AVAILABLE') {
        await this.fail('Quest no longer available');
        return;
      }

      const result = await awaitWithTimeout(
        completeVerifiedQuest(
          this.quest.verification.type === 'TIMER'
            ? {
                questId: this.quest.id,
                verificationType: 'TIMER' as const,
                durationSeconds: evidence.durationSeconds,
                verificationScore: verificationResult.score,
              }
            : {
                questId: this.quest.id,
                verificationType: this.quest.verification.type as 'GPS_DISTANCE' | 'MULTI',
                distanceMeters: evidence.distanceMeters,
                durationSeconds: evidence.durationSeconds,
                verificationScore: verificationResult.score,
              }
        )
      );

      if (!this.focusedRef.current) return;

      if (result.awarded) {
        const fieldResult: FieldQuestResult = {
          success: true,
          evidence: {
            ...verificationResult.evidence,
            sessionId: this.session.id,
            questId: this.quest.id,
            sampleCount: this.gpsTracker.getSampleCount(),
            verificationScore: verificationResult.score,
            verdict: verificationResult.verdict as 'VERIFIED' | 'SUSPICIOUS' | 'REJECTED' | 'INSUFFICIENT_DATA',
          },
          reward: {
            realXp: result.receipt?.realXp ?? 0,
            skillXp: result.receipt?.skillXp ?? {},
            energy: result.receipt?.energy ?? 0,
          },
        };

        this.session!.status = 'COMPLETED';
        this.session!.completedAt = Date.now();
        this.session!.rewardClaimed = true;
        this.session!.evidence = fieldResult.evidence;
        this.setStatus('COMPLETED');
        this.emitStatusChange();

        if (this.onComplete) this.onComplete(fieldResult);
      } else {
        await this.fail('Quest already completed');
      }
    } catch (error) {
      await this.fail(error instanceof Error ? error.message : 'Verification failed');
    }
  }

  private async fail(message: string) {
    if (!this.session) return;
    this.gpsTracker.stop();
    this.stopVerificationLoop();
    this.setStatus('FAILED');
    this.session!.status = 'FAILED';
    this.session!.completedAt = Date.now();
    this.emitStatusChange();

    if (this.onComplete) {
      this.onComplete({ success: false, error: message });
    }
  }

  private cleanup() {
    this.gpsTracker.stop();
    this.stopVerificationLoop();
    this.session = null;
    this.quest = null;
    this.activityWindow = null;
    if (this.timerRef) {
      this.timerRef.cancel();
      this.timerRef = null;
    }
  }

  getSession(): FieldQuestSession | null {
    return this.session ? { ...this.session } : null;
  }

  getProgress(): FieldQuestProgress | null {
    if (!this.session) return null;
    return { ...this.session.progress };
  }

  getStatus(): FieldQuestStatus {
    return this.statusRef.current;
  }

  restore(data: FieldQuestRestoreData): boolean {
    if (this.session) return false; // Already have active session

    // Restore basic session state
    this.session = {
      id: data.sessionId,
      questId: data.questId,
      questTitle: '', // Will be populated when quest is loaded
      verificationMode: 'GPS_DISTANCE',
      requirements: {
        type: 'GPS_DISTANCE',
        minimumDistanceMeters: data.progress.distanceMeters > 0 ? data.progress.distanceMeters : undefined,
        minimumDurationSeconds: data.progress.durationSeconds > 0 ? data.progress.durationSeconds : undefined,
        minimumVerificationScore: 70,
      },
      status: data.status,
      progress: data.progress,
      evidence: data.evidence,
      startedAt: data.startedAt,
      pausedAt: data.pausedAt,
      completedAt: null,
      pausedDuration: data.pausedDuration,
      rewardClaimed: false,
    };

    // If session was active or paused, restore GPS tracking
    if (data.status === 'ACTIVE' || data.status === 'PAUSED') {
      // The GPS tracker will be started by the screen when it restores
      this.setStatus(data.status);
    } else if (data.status === 'COMPLETED' || data.status === 'FAILED' || data.status === 'CANCELLED') {
      this.setStatus(data.status);
    }

    this.emitStatusChange();
    this.emitProgressChange();
    return true;
  }

  onStatusChangeCallback(cb: (status: FieldQuestStatus) => void) {
    this.onStatusChange = cb;
  }

  onProgressChangeCallback(cb: (progress: FieldQuestProgress) => void) {
    this.onProgressChange = cb;
  }

  onCompleteCallback(cb: (result: FieldQuestResult) => void) {
    this.onComplete = cb;
  }
}