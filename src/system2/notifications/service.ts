import { awaitWithTimeout } from '../storage/awaitWithTimeout';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { reminderPlan } from './planner';
import type { Settings } from '../identity/model';
import { smartReminderCopy, type SmartReminderContext } from './smart';

const PREFIX = 'system2-daily-';
const CHANNEL_ID = 'system2-daily';
let queue: Promise<unknown> = Promise.resolve();

async function ensureReminderChannel() {
  if (Platform.OS !== 'android') return;
  await awaitWithTimeout(Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Daily Protocol',
    importance: Notifications.AndroidImportance.DEFAULT,
  }));
}

export async function requestReminderPermission() {
  await ensureReminderChannel();
  return (await awaitWithTimeout(Notifications.requestPermissionsAsync())).granted;
}

export function syncReminders(settings: Settings, complete: boolean, unlocked: boolean, context: SmartReminderContext = { streak: 0 }) {
  const task = async () => {
    const scheduled = await awaitWithTimeout(Notifications.getAllScheduledNotificationsAsync());
    for (const n of scheduled) {
      if (n.identifier.startsWith(PREFIX)) {
        await awaitWithTimeout(Notifications.cancelScheduledNotificationAsync(n.identifier));
      }
    }
    if (!settings.dailyReminder || !unlocked) return;
    await ensureReminderChannel();
    const permission = await awaitWithTimeout(Notifications.getPermissionsAsync());
    for (const date of reminderPlan(true, settings.reminderTime ?? '19:00', permission.granted, complete)) {
      const copy=smartReminderCopy(context,new Date(date).getTime());
      await awaitWithTimeout(Notifications.scheduleNotificationAsync({
        identifier: PREFIX + date,
        content: copy,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(date),
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
        },
      }));
    }
  };
  const result = queue.then(task);
  queue = result.catch(() => undefined);
  return result;
}
