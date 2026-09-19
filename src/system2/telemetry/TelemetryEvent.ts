export type TelemetryEvent =
  | 'quest_started'
  | 'quest_completed'
  | 'quest_failed'
  | 'daily_progress_updated'
  | 'daily_completed'
  | 'weekly_completed'
  | 'level_up'
  | 'skill_level_up'
  | 'verification_started'
  | 'verification_completed'
  | 'verification_failed'
  | 'world_sector_discovered'
  | 'world_signal_located'
  | 'awakening_completed'
  | 'boss_started'
  | 'boss_stage_completed'
  | 'boss_defeated'
  | 'rematch_started'
  | 'rematch_completed'
  | 'achievement_unlocked'
  | 'achievement_progressed'
  | 'title_unlocked';

export type TelemetryProperties = Record<string, string | number | boolean | undefined>;

export interface TelemetryEventData {
  event: TelemetryEvent;
  properties: TelemetryProperties;
  timestamp: number;
}