import type { RunnableQuest } from '../quests/types';
import type { SkillKey } from '../core';
import { deterministicPick } from './calendar';
export type ActivityPreferences = { walking: boolean; running: boolean; cycling: boolean };
export const DEFAULT_ACTIVITIES: ActivityPreferences = { walking: true, running: false, cycling: false };
function template(id: string, title: string, skill: SkillKey, target: number, xp: number, skillXp: number, energy: number, activity?: 'WALK' | 'RUN' | 'BIKE'): RunnableQuest {
 return { id, title, primarySkill: skill, secondarySkills: [], category: 'DAILY', difficulty: 'NORMAL', order: 0,
 description: activity ? `Potwierdź ${target} m aktywności ${activity}. Pomiar GPS działa tylko na pierwszym planie.` : `Aktywna sesja ${target / 60} minut. Timer potwierdza czas w SYSTEMIE, nie jakość pracy ani zdobytą wiedzę.`,
 verification: activity ? { type: 'GPS_DISTANCE', minimumDistanceMeters: target, verificationScoreRequired: 70 } : { type: 'TIMER', minimumDurationSeconds: target, verificationScoreRequired: 100 },
 activityType: activity, verificationStrength: 'STANDARD', rewards: { realXp: xp, skillXp: { [skill]: skillXp }, gameEnergy: energy },
 progress: 0, progressTarget: target, createdAt: '2026-09-18T00:00:00.000Z', arc: 'DAILY' };
}
export const DAILY_TEMPLATES = [
 template('walk_protocol_1','WALK PROTOCOL I','VIT',1500,80,70,8,'WALK'),
 template('run_protocol_1','RUN PROTOCOL I','VIT',1000,100,90,10,'RUN'),
 template('ride_protocol_1','RIDE PROTOCOL I','VIT',3000,100,80,10,'BIKE'),
 template('focus_session','FOCUS SESSION','WIL',900,60,60,5),
 template('learn_something','LEARN SOMETHING','INT',1200,60,60,5),
 template('create','CREATE','CRE',1200,50,50,5),
 template('organize','ORGANIZE','RES',900,50,50,5),
];
export function dailyQuest(id: string): RunnableQuest | undefined {
 const match = /^daily:(\d{4}-\d{2}-\d{2}):([a-z0-9_]+)$/.exec(id);
 const t = match && DAILY_TEMPLATES.find(q => q.id === match[2]);
 return t ? { ...t, id, templateId: t.id, dayKey: match![1] } : undefined;
}
export function generateDaily(playerId: string, day: string, prefs: ActivityPreferences, count = 3, preferredTypes: readonly string[] = []) {
 const movement = DAILY_TEMPLATES.filter(q => q.activityType && ({ WALK: prefs.walking, RUN: prefs.running, BIKE: prefs.cycling })[q.activityType as 'WALK' | 'RUN' | 'BIKE']);
 const slots = Math.max(1, Math.min(5, Math.floor(count)));
 const movementCount = movement.length ? 1 : 0;
 const ordered = (quests: RunnableQuest[]) => [...quests].sort((a,b) => {
  const ai=preferredTypes.indexOf(a.id), bi=preferredTypes.indexOf(b.id);
  return (ai<0?Number.MAX_SAFE_INTEGER:ai)-(bi<0?Number.MAX_SAFE_INTEGER:bi);
 });
 const selected = [...deterministicPick(ordered(movement), playerId + day, movementCount), ...deterministicPick(ordered(DAILY_TEMPLATES.filter(q => !q.activityType)), day + playerId, slots - movementCount)];
 return selected.map(q => dailyQuest(`daily:${day}:${q.id}`)!);
}
