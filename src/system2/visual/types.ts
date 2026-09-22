export type WorldSceneId = 'CITY'|'FOREST'|'INDUSTRIAL'|'RUINS'|'BOSS_ZONE'|'PORTAL'|'WORLD';
export type WorldTime = 'DAY'|'DUSK'|'NIGHT';
export type WorldWeather = 'CLEAR'|'RAIN'|'FOG'|'STORM'|'SNOW';
export type ThreatLevel = 0|1|2|3;
export type ScreenMood = 'HOME'|'QUESTS'|'CHARACTER'|'WORLD'|'BOSS'|'LAUNCH';

export type WorldSceneContext = {
  screen: ScreenMood;
  level?: number;
  rank?: string;
  time?: WorldTime;
  weather?: WorldWeather;
  threat?: ThreatLevel;
  scene?: WorldSceneId;
  cityHint?: string | null;
};

export type WorldScene = {
  id: WorldSceneId;
  label: string;
  accent: string;
  secondary: string;
  particle: 'embers'|'mist'|'rain'|'runes'|'dust'|'shards';
  silhouettes: 'city'|'trees'|'factory'|'ruins'|'boss'|'portal'|'world';
};
