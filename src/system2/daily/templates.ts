import { scaledQuestXp } from '../core/rewards';
import type { RunnableQuest } from '../quests/types';
import type { SkillKey } from '../core';
import { deterministicPick } from './calendar';
export type ActivityPreferences = { walking: boolean; running: boolean; cycling: boolean };
export const DEFAULT_ACTIVITIES: ActivityPreferences = { walking: true, running: false, cycling: false };
function template(id: string, title: string, skill: SkillKey, target: number, xp: number, skillXp: number, energy: number, activity?: 'WALK' | 'RUN' | 'BIKE'): RunnableQuest {
 return { id, title, primarySkill: skill, secondarySkills: [], category: 'DAILY', difficulty: 'NORMAL', order: 0,
 description: activity ? `Potwierdź ${target} m aktywności ${activity}. Pomiar GPS działa także przy wygaszonym ekranie i podczas pracy aplikacji w tle.` : `Wykonaj zadanie opisane w tytule przez ${target / 60} minut. Odłóż telefon, wróć po wykonaniu i nazwij konkretny rezultat. Timer mierzy tylko czas, nie potwierdza wykonania.`,
 verification: activity ? { type: 'GPS_DISTANCE', minimumDistanceMeters: target, verificationScoreRequired: 70 } : { type: 'TIMER', minimumDurationSeconds: target, verificationScoreRequired: 100 },
 activityType: activity, verificationStrength: 'STANDARD', rewards: { realXp: xp, skillXp: { [skill]: skillXp }, gameEnergy: energy },
 progress: 0, progressTarget: target, createdAt: '2026-09-18T00:00:00.000Z', arc: 'DAILY' };
}
export const DAILY_TEMPLATES = [
 template('walk_protocol_1','PROTOKÓŁ MARSZU I','VIT',1500,80,70,8,'WALK'),
 template('run_protocol_1','PROTOKÓŁ BIEGU I','VIT',1000,100,90,10,'RUN'),
 template('ride_protocol_1','PROTOKÓŁ ROWEROWY I','VIT',3000,100,80,10,'BIKE'),
 template('focus_session','JEDEN KONKRETNY KROK','WIL',900,60,60,5),
 template('learn_something','PRZECZYTAJ I ZAPISZ JEDNĄ MYŚL','INT',1200,60,60,5),
 template('create','STWÓRZ SZKIC LUB 5 ZDAŃ','CRE',1200,50,50,5),
 template('organize','UPORZĄDKUJ JEDNO MIEJSCE','RES',900,50,50,5),
];
export function dailyQuest(id: string): RunnableQuest | undefined {
 const match = /^daily:(\d{4}-\d{2}-\d{2}):([a-z0-9_]+)(?::a[12]:([1-5]):([1-9]\d{0,4}))?$/.exec(id);
 const t = match && DAILY_TEMPLATES.find(q => q.id === match[2]);
 if (!t) return undefined;
 const quest = { ...t, id, templateId: t.id, dayKey: match![1] };
 if (!match![3]) return quest;
 const difficulty = Number(match![3]), target = Number(match![4]);
 const baseTarget = t.verification.type === 'TIMER' ? t.verification.minimumDurationSeconds : t.progressTarget;
 if (target > baseTarget * 1.75) return undefined;
 return { ...quest, adaptiveDifficulty: difficulty, difficulty: difficulty === 1 ? 'EASY' : difficulty === 2 ? 'NORMAL' : difficulty === 3 ? 'HARD' : 'EXTREME',
  progressTarget: target,
  rewards: id.includes(':a2:') ? {...t.rewards,realXp:scaledQuestXp(t.rewards.realXp,target,baseTarget),skillXp:Object.fromEntries(Object.entries(t.rewards.skillXp??{}).map(([key,xp])=>[key,scaledQuestXp(xp!,target,baseTarget)]))} : t.rewards,
  description: t.activityType ? `Potwierdź ${target} m aktywności ${t.activityType}. Pomiar GPS działa także przy wygaszonym ekranie i podczas pracy aplikacji w tle.` : `Aktywna sesja ${target / 60} minut. Timer potwierdza czas w SYSTEMIE, nie jakość pracy ani zdobytą wiedzę.`,
  verification: t.verification.type === 'TIMER' ? { ...t.verification, minimumDurationSeconds: target } : { ...t.verification, minimumDistanceMeters: target } };
}
export function generateDaily(playerId: string, day: string, prefs: ActivityPreferences, count = 3, preferredTypes: readonly string[] = [], adaptive?: { difficulty: number; availableMinutes: number }) {
 const movement = DAILY_TEMPLATES.filter(q => q.activityType && ({ WALK: prefs.walking, RUN: prefs.running, BIKE: prefs.cycling })[q.activityType as 'WALK' | 'RUN' | 'BIKE']);
 const slots = Math.max(1, Math.min(5, Math.floor(count)));
 const movementCount = movement.length ? 1 : 0;
 const pick = (quests: RunnableQuest[], seed: string, amount: number) => {
  const shuffled = deterministicPick(quests, seed, quests.length);
  const favored = [...new Set(preferredTypes)].flatMap(id => shuffled.filter(q => q.id === id));
  return [...favored, ...shuffled.filter(q => !preferredTypes.includes(q.id))].slice(0,amount);
 };
 const selected = [...pick(movement, playerId + day, movementCount), ...pick(DAILY_TEMPLATES.filter(q => !q.activityType), day + playerId, slots - movementCount)];
 return selected.map(q => {
  if (!adaptive) return dailyQuest(`daily:${day}:${q.id}`)!;
  const difficulty = Math.max(1, Math.min(5, Math.round(adaptive.difficulty)));
  const factor = [0.5, 1, 1.25, 1.5, 1.75][difficulty - 1];
  // Movement duration is an estimate; GPS still verifies the assigned distance.
  const speed = q.activityType === 'BIKE' ? 4 : q.activityType === 'RUN' ? 2.5 : 1.25;
  const secondsPerQuest = Math.floor(adaptive.availableMinutes * 60 / selected.length);
  const budgetTarget = q.verification.type === 'TIMER' ? secondsPerQuest : secondsPerQuest * speed;
  const target = Math.max(1, Math.floor(Math.min(q.progressTarget * factor, budgetTarget)));
  return dailyQuest(`daily:${day}:${q.id}:a2:${difficulty}:${target}`)!;
 });
}
