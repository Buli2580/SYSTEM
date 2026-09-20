import { generatedQuest } from '../generation/templates';
import type { RunnableQuest } from '../quests/types';
import type { SkillKey } from '../core';
import { deterministicPick } from './calendar';
export type ActivityPreferences = { walking: boolean; running: boolean; cycling: boolean };
export const DEFAULT_ACTIVITIES: ActivityPreferences = { walking: true, running: false, cycling: false };
function template(id: string, title: string, skill: SkillKey, target: number, xp: number, skillXp: number, energy: number, activity?: 'WALK' | 'RUN' | 'BIKE'): RunnableQuest {
 return { id, title, primarySkill: skill, secondarySkills: [], category: 'DAILY', difficulty: 'NORMAL', order: 0,
 description: activity ? `Potwierdź ${target} m aktywności ${activity}. Pomiar GPS działa także przy wygaszonym ekranie i podczas pracy aplikacji w tle.` : `Aktywna sesja ${target / 60} minut. Timer potwierdza czas w SYSTEMIE, nie jakość pracy ani zdobytą wiedzę.`,
 verification: activity ? { type: 'GPS_DISTANCE', minimumDistanceMeters: target, verificationScoreRequired: 70 } : { type: 'TIMER', minimumDurationSeconds: target, verificationScoreRequired: 100 },
 activityType: activity, verificationStrength: 'STANDARD', rewards: { realXp: xp, skillXp: { [skill]: skillXp }, gameEnergy: energy },
 progress: 0, progressTarget: target, createdAt: '2026-09-18T00:00:00.000Z', arc: 'DAILY' };
}
export const DAILY_TEMPLATES = [
 template('walk_protocol_1','PROTOKÓŁ MARSZU I','VIT',1500,80,70,8,'WALK'),
 template('run_protocol_1','PROTOKÓŁ BIEGU I','VIT',1000,100,90,10,'RUN'),
 template('ride_protocol_1','PROTOKÓŁ ROWEROWY I','VIT',3000,100,80,10,'BIKE'),
 template('focus_session','SESJA SKUPIENIA','WIL',900,60,60,5),
 template('learn_something','NAUCZ SIĘ CZEGOŚ','INT',1200,60,60,5),
 template('create','TWÓRZ','CRE',1200,50,50,5),
 template('organize','UPORZĄDKUJ','RES',900,50,50,5),
];
export function dailyQuest(id: string): RunnableQuest | undefined {
  const generated = generatedQuest(id); if (generated) return generated;
 const match = /^daily:(\d{4}-\d{2}-\d{2}):([a-z0-9_]+)$/.exec(id);
 const t = match && DAILY_TEMPLATES.find(q => q.id === match[2]);
 return t ? { ...t, id, templateId: t.id, dayKey: match![1] } : undefined;
}
export function generateDaily(playerId: string, day: string, prefs: ActivityPreferences) {
 const movement = DAILY_TEMPLATES.filter(q => q.activityType && ({ WALK: prefs.walking, RUN: prefs.running, BIKE: prefs.cycling })[q.activityType as 'WALK' | 'RUN' | 'BIKE']);
 const selected = [...deterministicPick(movement, playerId + day, 1), ...deterministicPick(DAILY_TEMPLATES.filter(q => !q.activityType), day + playerId, movement.length ? 2 : 3)];
 return selected.map(q => dailyQuest(`daily:${day}:${q.id}`)!);
}
