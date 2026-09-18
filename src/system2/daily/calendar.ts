export const DAILY_RULES = { slots: 3, clearXp: 75, clearEnergy: 10, weeklyTarget: 5, weeklyXp: 150, weeklyEnergy: 15, clockToleranceMs: 300000 } as const;
export function dayKey(now = Date.now()) { const d = new Date(now); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export function dayOrdinal(day: string) { const [y,m,d] = day.split('-').map(Number); return Math.floor(Date.UTC(y,m-1,d) / 86400000); }
export function weekKey(day: string) {
 const d = new Date(dayOrdinal(day) * 86400000); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
 const year = d.getUTCFullYear(), start = Date.UTC(year, 0, 1);
 return `${year}-W${String(Math.ceil(((d.getTime() - start) / 86400000 + 1) / 7)).padStart(2, '0')}`;
}
export function nextStreak(previousDay: string | undefined, currentDay: string, count: number) {
 if (previousDay === currentDay) return count;
 return previousDay && dayOrdinal(currentDay) - dayOrdinal(previousDay) === 1 ? count + 1 : 1;
}
export function deterministicPick<T>(values: readonly T[], seed: string, count: number): T[] {
 let state = 2166136261; for (const c of seed) state = Math.imul(state ^ c.charCodeAt(0), 16777619) >>> 0;
 const pool = [...values];
 for (let i = pool.length - 1; i > 0; i--) { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; const j = state % (i + 1); [pool[i],pool[j]] = [pool[j],pool[i]]; }
 return pool.slice(0, count);
}
