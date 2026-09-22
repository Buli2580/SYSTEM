import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { createActivityWindow, mergeActivityFeatures } from '../activity/features';
import { classifyActivity } from '../activity/classifier';
import {
  clearBackgroundQuestSession,
  clearQuestCheckpoint,
  completeVerifiedQuest,
  getQuestAccess,
  loadBackgroundQuestSession,
  loadQuestCheckpoint,
  saveQuestCheckpoint,
  updateBackgroundQuestSession,
  type QuestCheckpoint,
  type StoredLocationPoint,
} from '../storage/database';
import { getQuest } from '../quests/catalog';
import { buildEvidence } from '../verification/evidence';
import { distanceBetween, verificationScoreForAccuracy, verifiedSegment } from '../verification/gps';
import {
  SYSTEM_BACKGROUND_LOCATION_TASK,
  locationFromStored,
  storedLocationPoint,
} from './locationService';

type LocationTaskData = { locations?: Location.LocationObject[] };

let taskQueue: Promise<void> = Promise.resolve();

async function stopOrphanedLocationTask() {
  if (await Location.hasStartedLocationUpdatesAsync(SYSTEM_BACKGROUND_LOCATION_TASK).catch(() => false)) {
    await Location.stopLocationUpdatesAsync(SYSTEM_BACKGROUND_LOCATION_TASK).catch(() => undefined);
  }
}

function usableBackgroundLocation(location: Location.LocationObject) {
  const point = storedLocationPoint(location);
  return point ? location : null;
}

function nextCheckpoint(
  questId: string,
  current: QuestCheckpoint | null,
  extendedGoal: boolean,
): QuestCheckpoint {
  return current ?? {
    questId,
    distanceMeters: 0,
    durationSeconds: 0,
    verificationScore: 100,
    extendedGoal,
    updatedAt: new Date().toISOString(),
  };
}

async function completeInBackground(
  session: NonNullable<Awaited<ReturnType<typeof loadBackgroundQuestSession>>>,
  evidence: Parameters<typeof completeVerifiedQuest>[0],
) {
  const result = await completeVerifiedQuest({ ...evidence, attemptId: session.attemptId });
  if (result.awarded || result.completedQuestIds.includes(session.questId)) {
    await clearQuestCheckpoint(session.questId).catch(() => undefined);
    await clearBackgroundQuestSession(session.questId).catch(() => undefined);
    if (await Location.hasStartedLocationUpdatesAsync(SYSTEM_BACKGROUND_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(SYSTEM_BACKGROUND_LOCATION_TASK).catch(() => undefined);
    }
  }
}

async function processLocations(rawLocations: Location.LocationObject[]) {
  const session = await loadBackgroundQuestSession();
  if (!session) {
    await stopOrphanedLocationTask();
    return;
  }
  if (rawLocations.length === 0) return;

  const locations = rawLocations
    .filter(location => Boolean(usableBackgroundLocation(location)))
    .sort((a, b) => a.timestamp - b.timestamp);
  if (locations.length === 0) return;

  const latest = storedLocationPoint(locations[locations.length - 1])!;

  if (session.mode !== 'BACKGROUND') {
    await updateBackgroundQuestSession(session.questId, {
      lastPoint: latest,
      lastObservedTimestamp: latest.timestamp,
    });
    return;
  }

  const quest = getQuest(session.questId);
  if (!quest || quest.verification.type === 'TIMER') {
    await clearBackgroundQuestSession(session.questId);
    await stopOrphanedLocationTask();
    return;
  }

  const access = await getQuestAccess(session.questId).catch(() => null);
  if (access === 'LOCKED' || access === 'COMPLETED') {
    await clearQuestCheckpoint(session.questId).catch(() => undefined);
    await clearBackgroundQuestSession(session.questId).catch(() => undefined);
    await stopOrphanedLocationTask();
    return;
  }

  const checkpoint = nextCheckpoint(
    session.questId,
    await loadQuestCheckpoint(session.questId),
    session.extendedGoal,
  );
  const targetDistance = quest.verification.minimumDistanceMeters * (session.extendedGoal ? 1.25 : 1);
  const anchor = session.lastPoint ? locationFromStored(session.lastPoint) : null;

  if (quest.activityType) {
    const window = createActivityWindow();
    // Background providers may deliver a valid batch late. Validate each native
    // fix against its own recorded timestamp; segment rules still reject gaps,
    // teleports, mocks and impossible speed.
    if (anchor) window.seed(anchor, anchor.timestamp);
    for (const location of locations) {
      window.add(location, location.timestamp);
    }
    const features = mergeActivityFeatures(checkpoint.activityFeatures, window.features());
    const activity = classifyActivity(quest.activityType, features);
    const next: QuestCheckpoint = {
      ...checkpoint,
      distanceMeters: activity.features.distanceMeters,
      durationSeconds: activity.features.durationSeconds,
      verificationScore: activity.verificationScore,
      activityFeatures: activity.features,
      updatedAt: new Date().toISOString(),
    };
    if (next.distanceMeters > 0) await saveQuestCheckpoint(next);
    await updateBackgroundQuestSession(session.questId, {
      lastPoint: latest,
      lastObservedTimestamp: latest.timestamp,
    });

    if (next.distanceMeters >= targetDistance && activity.verdict === 'VERIFIED') {
      await completeInBackground(session, {
        questId: quest.id,
        verificationType: quest.verification.type,
        distanceMeters: next.distanceMeters,
        durationSeconds: next.durationSeconds,
        verificationScore: next.verificationScore,
        activity,
      });
    }
    return;
  }

  let lastAnchor = anchor;
  let lastObserved = session.lastObservedTimestamp;
  let distance = checkpoint.distanceMeters;
  let duration = checkpoint.durationSeconds;
  let score = checkpoint.verificationScore;

  for (const location of locations) {
    // Native background delivery can repeat an older fix in a later batch.
    // Never move the observation clock backwards or count the same segment twice.
    if (lastObserved !== undefined && location.timestamp <= lastObserved) continue;
    if (lastObserved !== undefined) {
      duration += Math.min(15, Math.max(0, (location.timestamp - lastObserved) / 1000));
    }
    lastObserved = location.timestamp;

    if (!lastAnchor) {
      lastAnchor = location;
      continue;
    }
    if (location.timestamp <= lastAnchor.timestamp) continue;

    const seconds = (location.timestamp - lastAnchor.timestamp) / 1000;
    const meters = distanceBetween(lastAnchor, location);
    const segment = verifiedSegment(lastAnchor, location);
    if (segment > 0) {
      distance += segment;
      score = Math.min(
        score,
        verificationScoreForAccuracy(lastAnchor.coords.accuracy),
        verificationScoreForAccuracy(location.coords.accuracy),
      );
      lastAnchor = location;
    } else if (seconds > 15 || meters > 100 || (seconds > 0 && meters / seconds > 8.5)) {
      lastAnchor = location;
    }
  }

  const point: StoredLocationPoint = storedLocationPoint(lastAnchor ?? locations[locations.length - 1]) ?? latest;
  const next: QuestCheckpoint = {
    ...checkpoint,
    distanceMeters: distance,
    durationSeconds: duration,
    verificationScore: score,
    updatedAt: new Date().toISOString(),
  };
  if (next.distanceMeters > 0) await saveQuestCheckpoint(next);
  await updateBackgroundQuestSession(session.questId, {
    lastPoint: point,
    lastObservedTimestamp: lastObserved ?? latest.timestamp,
  });

  if (next.distanceMeters >= targetDistance) {
    const evidence = buildEvidence(quest, next.distanceMeters, next.durationSeconds, next.verificationScore);
    if (evidence) await completeInBackground(session, evidence);
  }
}

if (!TaskManager.isTaskDefined(SYSTEM_BACKGROUND_LOCATION_TASK)) {
  TaskManager.defineTask<LocationTaskData>(SYSTEM_BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error || !data?.locations?.length) return;
    const locations = data.locations;
    taskQueue = taskQueue
      .then(() => processLocations(locations))
      .catch(() => undefined);
    await taskQueue;
  });
}
