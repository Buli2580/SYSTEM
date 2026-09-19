import { Share } from 'react-native';
import type { PlayerProfile } from '../core';

export interface DailySharePayload {
  system: 'SYSTEM';
  reportType: 'DAILY_REPORT';
  timestamp: string;
  data: {
    completedQuests: number;
    maxQuests: number;
    level: number;
    xpEarnedToday: number;
    distanceKm: number;
    sectorsDiscovered: number;
    discoveries: number;
    milestones: number[];
    streak: number;
  };
}

export function buildDailySharePayload(
  profile: PlayerProfile,
  dailyData: {
    completedCount: number;
    maxCompletions: number;
    xpEarnedToday: number;
    distanceMeters: number;
    sectorsDiscovered: number;
    discoveries: number;
    milestones: number[];
  }
): DailySharePayload {
  return {
    system: 'SYSTEM',
    reportType: 'DAILY_REPORT',
    timestamp: new Date().toISOString(),
    data: {
      completedQuests: dailyData.completedCount,
      maxQuests: dailyData.maxCompletions,
      level: profile.realLevel,
      xpEarnedToday: dailyData.xpEarnedToday,
      distanceKm: Math.round(dailyData.distanceMeters / 1000 * 10) / 10,
      sectorsDiscovered: dailyData.sectorsDiscovered,
      discoveries: dailyData.discoveries,
      milestones: dailyData.milestones,
      streak: profile.streak,
    },
  };
}

export function formatDailyShareText(payload: DailySharePayload): string {
  const { data } = payload;
  return [
    'SYSTEM // DAILY REPORT',
    '',
    `${data.completedQuests}/${data.maxQuests} quests completed.`,
    `Level ${data.level}.`,
    `${data.xpEarnedToday} XP earned today.`,
    `${data.distanceKm} km explored.`,
    `${data.sectorsDiscovered} sectors discovered.`,
    '',
    `Can you beat my result?`,
    '#SYSTEM',
  ].join('\n');
}

export async function shareDailyProgress(payload: DailySharePayload): Promise<boolean> {
  const text = formatDailyShareText(payload);
  try {
    const result = await Share.share({
      message: text,
      title: 'SYSTEM Daily Report',
    });
    return result.action === Share.sharedAction;
  } catch {
    return false;
  }
}

export function sanitizeSharePayload(payload: DailySharePayload): DailySharePayload {
  // Ensure no precise GPS coordinates or private data
  return {
    ...payload,
    data: {
      ...payload.data,
      // No lat/lon, no exact coordinates
    },
  };
}