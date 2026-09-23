import { DEFAULT_ACTIVITIES, type ActivityPreferences } from '../daily/templates';
import type { PlayerProfile, SkillKey } from '../core/types';
import { SKILL_KEYS } from '../core/progression';
export type Title = 'UNAWAKENED' | 'AWAKENED' | 'SIGNAL HUNTER' | 'PATHFINDER' | 'WALLBREAKER';
export type AvatarStyle = 'DARK' | 'CYBER' | 'WARLORD';
export type Settings = { haptics: boolean; audio: boolean; avatarStyle?: AvatarStyle; musicVolume?: number; ambientVolume?: number; sfxVolume?: number; activities?: ActivityPreferences; dailyReminder?: boolean; reminderTime?: string };
export type SettingsPatch = Omit<Partial<Settings>, 'activities'> & { activities?: Partial<ActivityPreferences> };
export const DEFAULT_SETTINGS: Settings = { haptics: true, audio: true, avatarStyle: 'CYBER', musicVolume: 0.8, ambientVolume: 0.55, sfxVolume: 0.9 };
export function earnedTitles(awakening: boolean, signal: boolean, worldLink = false, boss = false): Title[] {
  return ['UNAWAKENED', ...(awakening ? ['AWAKENED' as const] : []), ...(awakening && signal ? ['SIGNAL HUNTER' as const] : []), ...(worldLink ? ['PATHFINDER' as const] : []), ...(boss ? ['WALLBREAKER' as const] : [])];
}
export function dominantSkill(player: PlayerProfile): SkillKey | 'BALANCED ORIGIN' | 'MIXED BUILD' {
  const totals = SKILL_KEYS.map(key => player.stats[key].totalXp);
  if (totals.every(xp => xp === totals[0])) return 'BALANCED ORIGIN';
  const top = Math.max(...totals);
  const keys = SKILL_KEYS.filter(key => player.stats[key].totalXp === top);
  return keys.length === 1 ? keys[0] : 'MIXED BUILD';
}
export function systemName(value: string): string {
  const name = value.trim();
  if (name.length < 2 || name.length > 24 || /[\u0000-\u001f\u007f]/.test(name)) throw new Error('SYSTEM NAME: wpisz od 2 do 24 znaków.');
  return name;
}
export function parseSettings(value?: string): Settings {
  if (!value) return { ...DEFAULT_SETTINGS };
  const settings = JSON.parse(value);
  if (typeof settings?.haptics !== 'boolean' || typeof settings?.audio !== 'boolean') throw new Error('Nieprawidłowy zapis ustawień.');
  if (settings.activities && ['walking','running','cycling'].some(key => typeof settings.activities[key] !== 'boolean')) throw new Error('Nieprawidłowe preferencje aktywności.');
  if (settings.reminderTime !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.reminderTime)) throw new Error('Wpisz godzinę HH:MM.');
  if (settings.dailyReminder !== undefined && typeof settings.dailyReminder !== 'boolean') throw new Error('Nieprawidłowe ustawienie przypomnienia.');
  const clamp = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
  const avatarStyle: AvatarStyle = ['DARK','CYBER','WARLORD'].includes(settings.avatarStyle) ? settings.avatarStyle : 'CYBER';
  return { haptics: settings.haptics, audio: settings.audio, avatarStyle,
    musicVolume: clamp(settings.musicVolume, DEFAULT_SETTINGS.musicVolume ?? 0.8),
    ambientVolume: clamp(settings.ambientVolume, DEFAULT_SETTINGS.ambientVolume ?? 0.55),
    sfxVolume: clamp(settings.sfxVolume, DEFAULT_SETTINGS.sfxVolume ?? 0.9),
    ...(settings.activities ? { activities: { ...DEFAULT_ACTIVITIES, ...settings.activities } } : {}),
    ...(settings.dailyReminder !== undefined ? { dailyReminder: settings.dailyReminder } : {}),
    ...(settings.reminderTime !== undefined ? { reminderTime: settings.reminderTime } : {}) };
}

export function mergeSettings(current: Settings, patch: SettingsPatch): Settings {
  const { activities, ...rest } = patch;
  const next: Settings = {
    ...current,
    ...rest,
    ...(activities
      ? { activities: { ...DEFAULT_ACTIVITIES, ...(current.activities ?? {}), ...activities } }
      : current.activities ? { activities: current.activities } : {}),
  };
  return parseSettings(JSON.stringify(next));
}
