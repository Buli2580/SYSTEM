import * as Haptics from 'expo-haptics';
let enabled = true;
export function configureHaptics(value: boolean) { enabled = value; }
export function impactAsync(style = Haptics.ImpactFeedbackStyle.Light) {
  return enabled ? Haptics.impactAsync(style).catch(() => undefined) : Promise.resolve();
}
export function notificationAsync(type = Haptics.NotificationFeedbackType.Success) {
  return enabled ? Haptics.notificationAsync(type).catch(() => undefined) : Promise.resolve();
}
export const ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = Haptics.NotificationFeedbackType;
