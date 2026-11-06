import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialSliceState,
  confirmAwakening,
  issueFirstOrder,
  startFirstOrder,
  updateFirstOrderProgress,
  markFirstOrderVerified,
  applyFirstOrderReward,
  rejectFirstOrder,
  rollDaily,
  claimDailyReward,
  endSession,
  serialize,
  deserialize,
  resumeSafe,
} from '../src/state/sliceStore.ts';
import { createHarnessQuestEngine } from '../src/adapters/questEngineAdapter.ts';
import { selectVariant, defineFirstOrder } from '../src/content/firstOrder.ts';
import { dayKeyInTimeZone, resolveClock } from '../src/state/clock.ts';
import { buildAction, buildBaseScreen, buildHud } from '../src/presentation/shell.ts';
import { AWAKENING_HANDOFF } from '../src/contracts/awakeningHandoff.ts';
import { SLICE_REWARD_PROPOSAL } from '../src/content/rewards.ts';

/** Mirrors src/system2/core/progression.ts xpNeededForRealLevel(1) — avoid host ESM graph in isolated tests. */
function xpNeededForRealLevel(level: number): number {
  const safeLevel = Math.max(1, level);
  return Math.round(100 + safeLevel * 35 + Math.pow(safeLevel, 1.65) * 12);
}

describe('Slice V1 — authoritative XP honesty', () => {
  it('L1→L2 threshold is 147; first order proposal 100 cannot alone level-up', () => {
    assert.equal(xpNeededForRealLevel(1), 147);
    assert.equal(SLICE_REWARD_PROPOSAL.firstOrder.realXp, 100);
    assert.equal(SLICE_REWARD_PROPOSAL.firstOrder.levelUpTo2, false);
  });
});

describe('Slice V1 — first 10 min flow (contract boundary)', () => {
  it('NEW → AWAKENING CONFIRMED → FIRST ORDER → VERIFIED → REWARD → BASE', async () => {
    let s = createInitialSliceState('UTC', Date.parse('2026-11-06T12:00:00Z'));
    assert.equal(s.phase, 'NEW_PROFILE');
    s = confirmAwakening(s);
    assert.equal(s.awakeningConfirmed, true);
    const issued = issueFirstOrder(s, 'GPS_LOCAL');
    s = issued.state;
    s = startFirstOrder(s);
    s = updateFirstOrderProgress(s, 500);
    const qe = createHarnessQuestEngine();
    const reward = await qe.validateAndReward({
      questId: issued.def.qeQuestId,
      verificationType: 'GPS_DISTANCE',
      distanceMeters: 500,
      verificationScore: 90,
    });
    assert.equal(reward.ok, true);
    if (!reward.ok) return;
    s = markFirstOrderVerified(s, reward.claimId);
    s = applyFirstOrderReward(s, reward.claimId);
    assert.equal(s.baseUnlocked, true);
    assert.equal(s.itemGranted, true);
    assert.equal(s.developmentPoints, 1);
    assert.equal(s.phase, 'BASE_UNLOCKED');
    assert.equal(reward.afterLevel, 1); // 100 XP < 147
    const base = buildBaseScreen(s);
    assert.equal(base.locked, false);
  });

  it('full flow marked NOT INTEGRATED without host Awakening wiring', () => {
    assert.equal(AWAKENING_HANDOFF.doNotImplementInHostByCursor, true);
    assert.ok(AWAKENING_HANDOFF.consumeExistingCompletion.chapterId === 'awakening_chapter_1');
  });

  it('rejects DEV path as real proof', async () => {
    const qe = createHarnessQuestEngine();
    const r = await qe.validateAndReward({
      questId: 'first_movement_v1',
      verificationType: 'DEV_SIMULATED_PATH',
      verificationScore: 100,
      syntheticDevPath: true,
    });
    assert.equal(r.ok, false);
  });

  it('rejects short distance / bad evidence', async () => {
    const qe = createHarnessQuestEngine();
    const r = await qe.validateAndReward({
      questId: 'first_movement_v1',
      verificationType: 'GPS_DISTANCE',
      distanceMeters: 50,
      verificationScore: 90,
    });
    assert.equal(r.ok, false);
  });

  it('reward replay rejected', async () => {
    const qe = createHarnessQuestEngine();
    const a = await qe.validateAndReward({
      questId: 'first_movement_v1',
      verificationType: 'GPS_DISTANCE',
      distanceMeters: 500,
      verificationScore: 90,
    });
    const b = await qe.validateAndReward({
      questId: 'first_movement_v1',
      verificationType: 'GPS_DISTANCE',
      distanceMeters: 500,
      verificationScore: 90,
    });
    assert.equal(a.ok, true);
    assert.equal(b.ok, false);
  });

  it('persist + resume', () => {
    let s = confirmAwakening(createInitialSliceState('America/New_York'));
    s = startFirstOrder(issueFirstOrder(s, 'TIMER_FLEX').state);
    const raw = serialize(s);
    const again = resumeSafe(deserialize(raw));
    assert.equal(again.firstOrder.phase, 'ACTIVE');
  });

  it('reject path does not unlock base', () => {
    let s = confirmAwakening(createInitialSliceState());
    s = rejectFirstOrder(startFirstOrder(issueFirstOrder(s, 'GPS_LOCAL').state));
    assert.equal(s.baseUnlocked, false);
    assert.equal(s.firstOrder.phase, 'REJECTED');
  });

  it('daily claim idempotent; no reward without base', () => {
    let s = createInitialSliceState('Asia/Tokyo', Date.parse('2026-11-06T01:00:00Z'));
    const blocked = claimDailyReward(s, 'x');
    assert.equal(blocked.ok, false);
    s = applyFirstOrderReward(
      markFirstOrderVerified(confirmAwakening(s), 'claim-1'),
      'claim-1',
    );
    const rolled = rollDaily(s, Date.parse('2026-11-06T01:00:00Z'), 'Asia/Tokyo');
    s = rolled.state;
    const key = `${s.daily.dayKey}:${s.daily.orderId}`;
    const c1 = claimDailyReward(s, key);
    assert.equal(c1.ok, true);
    const c2 = claimDailyReward(c1.state, key);
    assert.equal(c2.ok, false);
    assert.equal(c2.reason, 'ALREADY_CLAIMED');
  });

  it('timezone dayKey differs Warsaw vs New York without hardcoding reward TZ', () => {
    const ms = Date.parse('2026-11-06T02:30:00Z');
    const w = dayKeyInTimeZone(ms, 'Europe/Warsaw');
    const n = dayKeyInTimeZone(ms, 'America/New_York');
    assert.notEqual(w, n);
    const skew = resolveClock({
      nowMs: ms,
      timeZone: 'UTC',
      lastTrustedMs: ms + 48 * 3600_000,
    });
    assert.equal(skew.clockAnomaly, true);
  });

  it('variant selection + presentation action', () => {
    assert.equal(selectVariant({ hasGps: false }), 'TIMER_FLEX');
    assert.equal(selectVariant({ hasGps: true, nearLeborkPilot: true }), 'LEBORK_PILOT');
    assert.equal(defineFirstOrder('LEBORK_PILOT').verification.producesRealWorldProof, true);
    assert.equal(defineFirstOrder('DEV_HARNESS').verification.producesRealWorldProof, false);
    const s = confirmAwakening(createInitialSliceState());
    assert.equal(buildAction(s).intent, 'START_ORDER');
    assert.ok(buildHud(s).singleObjective.length > 10);
  });

  it('session end teaser', () => {
    const s = endSession(createInitialSliceState());
    assert.equal(s.sessionEndTeaserShown, true);
  });

  it('level-up harness after enough QE XP (not first order alone)', async () => {
    const qe = createHarnessQuestEngine({
      xpForQuest: { first_movement_v1: 100, focus_protocol_v1: 80 },
    });
    await qe.validateAndReward({
      questId: 'first_movement_v1',
      verificationType: 'GPS_DISTANCE',
      distanceMeters: 500,
      verificationScore: 90,
    });
    const second = await qe.validateAndReward({
      questId: 'focus_protocol_v1',
      verificationType: 'TIMER',
      durationSeconds: 300,
      verificationScore: 100,
    });
    assert.equal(second.ok, true);
    if (second.ok) assert.equal(second.afterLevel, 2);
  });
});
