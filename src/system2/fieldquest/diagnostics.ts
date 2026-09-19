import type { FieldQuestSession, FieldQuestProgress, GPSQuestTrackerState, DeviceReadiness } from './types';

export type FieldDiagnosticsData = {
  session: {
    id: string | null;
    questId: string | null;
    questTitle: string | null;
    status: string | null;
    verificationMode: string | null;
    startedAt: number | null;
    duration: number | null;
  } | null;
  progress: {
    distanceMeters: number;
    distanceKm: number;
    durationSeconds: number;
    durationFormatted: string;
    sampleCount: number;
    currentAccuracy: number | null;
    lastUpdate: number | null;
  } | null;
  gps: {
    trackingStatus: string;
    startingLocation: { lat: number; lon: number } | null;
    latestLocation: { lat: number; lon: number } | null;
    accumulatedDistance: number;
    accumulatedDistanceKm: number;
    elapsedTime: number;
    sampleCount: number;
    accuracy: number | null;
    lastError: string | null;
  } | null;
  verification: {
    evidence: {
      distanceMeters: number;
      durationSeconds: number;
      sampleCount: number;
      verificationScore: number;
      verdict: string;
      reasonCodes: string[];
    } | null;
  } | null;
  device: {
    permissions: {
      location: string;
    };
    gpsAvailable: boolean;
    ready: boolean;
    blockingIssues: string[];
  } | null;
  persistence: {
    hasActiveSession: boolean;
    sessionRestored: boolean;
    pendingOfflineEvents: number;
  } | null;
};

export function buildDiagnosticsData(
  session: FieldQuestSession | null,
  progress: { distanceMeters: number; durationSeconds: number; sampleCount: number; currentAccuracy: number | null; lastUpdate: number } | null,
  gpsState: GPSQuestTrackerState | null,
  readiness: DeviceReadiness | null,
  hasActiveSession: boolean,
  sessionRestored: boolean,
  pendingOfflineEvents: number = 0
): FieldDiagnosticsData {
  const now = Date.now();

  return {
    session: session ? {
      id: session.id,
      questId: session.questId,
      questTitle: session.questTitle,
      status: session.status,
      verificationMode: session.verificationMode,
      startedAt: session.startedAt,
      duration: session.startedAt ? now - session.startedAt : null,
    } : null,
    progress: progress ? {
      distanceMeters: Math.round(progress.distanceMeters),
      distanceKm: Math.round(progress.distanceMeters / 1000 * 100) / 100,
      durationSeconds: progress.durationSeconds,
      durationFormatted: formatDuration(progress.durationSeconds),
      sampleCount: progress.sampleCount,
      currentAccuracy: progress.currentAccuracy,
      lastUpdate: progress.lastUpdate,
    } : null,
    gps: gpsState ? {
      trackingStatus: gpsState.trackingStatus,
      startingLocation: gpsState.startingLocation ? {
        lat: Math.round(gpsState.startingLocation.coords.latitude * 1000000) / 1000000,
        lon: Math.round(gpsState.startingLocation.coords.longitude * 1000000) / 1000000,
      } : null,
      latestLocation: gpsState.latestLocation ? {
        lat: Math.round(gpsState.latestLocation.coords.latitude * 1000000) / 1000000,
        lon: Math.round(gpsState.latestLocation.coords.longitude * 1000000) / 1000000,
      } : null,
      accumulatedDistance: Math.round(gpsState.accumulatedDistance),
      accumulatedDistanceKm: Math.round(gpsState.accumulatedDistance / 1000 * 100) / 100,
      elapsedTime: gpsState.elapsedTime,
      sampleCount: gpsState.sampleCount,
      accuracy: gpsState.accuracy,
      lastError: gpsState.lastError,
    } : null,
    verification: null,
    device: readiness ? {
      permissions: { location: readiness.permissions.location },
      gpsAvailable: readiness.gpsAvailable,
      ready: readiness.ready,
      blockingIssues: readiness.blockingIssues,
    } : null,
    persistence: {
      hasActiveSession,
      sessionRestored,
      pendingOfflineEvents,
    },
  };
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function formatDiagnosticsForConsole(data: FieldDiagnosticsData): string {
  const lines: string[] = [];
  lines.push('=== FIELD QUEST DIAGNOSTICS ===');
  
  if (data.session) {
    lines.push('\n--- SESSION ---');
    lines.push(`ID: ${data.session.id}`);
    lines.push(`Quest: ${data.session.questTitle} (${data.session.questId})`);
    lines.push(`Status: ${data.session.status}`);
    lines.push(`Mode: ${data.session.verificationMode}`);
    lines.push(`Started: ${data.session.startedAt ? new Date(data.session.startedAt).toISOString() : 'N/A'}`);
    lines.push(`Duration: ${data.session.duration ? Math.round(data.session.duration / 1000) + 's' : 'N/A'}`);
  }

  if (data.progress) {
    lines.push('\n--- PROGRESS ---');
    lines.push(`Distance: ${data.progress.distanceKm} km (${data.progress.distanceMeters}m)`);
    lines.push(`Duration: ${data.progress.durationFormatted}`);
    lines.push(`Samples: ${data.progress.sampleCount}`);
    lines.push(`Accuracy: ${data.progress.currentAccuracy !== null ? data.progress.currentAccuracy.toFixed(1) + 'm' : 'N/A'}`);
  }

  if (data.gps) {
    lines.push('\n--- GPS ---');
    lines.push(`Status: ${data.gps.trackingStatus}`);
    lines.push(`Start: ${data.gps.startingLocation ? `${data.gps.startingLocation.lat}, ${data.gps.startingLocation.lon}` : 'N/A'}`);
    lines.push(`Current: ${data.gps.latestLocation ? `${data.gps.latestLocation.lat}, ${data.gps.latestLocation.lon}` : 'N/A'}`);
    lines.push(`Distance: ${data.gps.accumulatedDistanceKm} km`);
    lines.push(`Elapsed: ${data.gps.elapsedTime}s`);
    lines.push(`Samples: ${data.gps.sampleCount}`);
    lines.push(`Accuracy: ${data.gps.accuracy !== null ? data.gps.accuracy.toFixed(1) + 'm' : 'N/A'}`);
    if (data.gps.lastError) lines.push(`Error: ${data.gps.lastError}`);
  }

  if (data.device) {
    lines.push('\n--- DEVICE ---');
    lines.push(`Location: ${data.device.permissions.location}`);
    lines.push(`GPS Available: ${data.device.gpsAvailable ? 'YES' : 'NO'}`);
    lines.push(`Ready: ${data.device.ready ? 'YES' : 'NO'}`);
    if (data.device.blockingIssues.length > 0) {
      lines.push(`Issues: ${data.device.blockingIssues.join(', ')}`);
    }
  }

  if (data.persistence) {
    lines.push('\n--- PERSISTENCE ---');
    lines.push(`Active Session: ${data.persistence.hasActiveSession ? 'YES' : 'NO'}`);
    lines.push(`Restored: ${data.persistence.sessionRestored ? 'YES' : 'NO'}`);
    lines.push(`Pending Events: ${data.persistence.pendingOfflineEvents}`);
  }

  lines.push('\n=== END ===');
  return lines.join('\n');
}