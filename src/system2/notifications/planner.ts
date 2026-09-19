export function reminderPlan(enabled: boolean, time: string, granted: boolean, dailyComplete: boolean, now = Date.now()): number[] {
 if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Wpisz godzinę HH:MM.');
 if (!enabled || !granted) return [];
 const [h,m] = time.split(':').map(Number), dates: number[] = [];
 // One-shot reminders: completing today cancels only today. Refresh on foreground.
 for (let offset = 0; offset < 7; offset++) {
   const date = new Date(now); date.setDate(date.getDate() + offset); date.setHours(h,m,0,0);
   if (date.getTime() > now && !(offset === 0 && dailyComplete)) dates.push(date.getTime());
 }
 return dates;
}
