import { awaitWithTimeout } from '../storage/awaitWithTimeout';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { reminderPlan } from './planner';
import type { Settings } from '../identity/model';
const PREFIX = 'system2-daily-';
let queue: Promise<unknown> = Promise.resolve();
export async function requestReminderPermission() {
 if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('system2-daily', { name: 'Daily Protocol', importance: Notifications.AndroidImportance.DEFAULT });
 return (await Notifications.requestPermissionsAsync()).granted;
}
export function syncReminders(settings: Settings, complete: boolean, unlocked: boolean) {
 const task = async () => {
   const scheduled = await awaitWithTimeout(Notifications.getAllScheduledNotificationsAsync());
   for (const n of scheduled) if (n.identifier.startsWith(PREFIX)) await awaitWithTimeout(Notifications.cancelScheduledNotificationAsync(n.identifier));
   if (!settings.dailyReminder || !unlocked) return;
   const permission = await awaitWithTimeout(Notifications.getPermissionsAsync());
   for (const date of reminderPlan(true, settings.reminderTime ?? '19:00', permission.granted, complete)) {
     await Notifications.scheduleNotificationAsync({ identifier: PREFIX + date,
       content: { title: 'SYSTEM // PROTOKÓŁ DZIENNY', body: 'Twoje dzisiejsze misje nadal czekają.' },
       trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(date), channelId: 'system2-daily' } });
   }
 };
 const result = queue.then(task); queue = result.catch(() => undefined); return result;
}
