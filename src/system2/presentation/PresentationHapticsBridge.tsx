import { useEffect } from 'react';
import {
  ImpactFeedbackStyle,
  NotificationFeedbackType,
  impactAsync,
  notificationAsync,
} from '../identity/feedback';
import { presentationEventBus } from '../presentation/PresentationEvents';

export default function PresentationHapticsBridge() {
  useEffect(() => {
    const unsubscribe = presentationEventBus.onAny(event => {
      switch (event.type) {
        case 'UI_CLICK':
        case 'UI_CONFIRM':
        case 'UI_CANCEL':
        case 'UI_NAVIGATE':
        case 'UI_TOGGLE':
        case 'QUEST_ACCEPTED':
        case 'QUEST_STARTED':
        case 'STREAK_UPDATED':
          void impactAsync(ImpactFeedbackStyle.Light);
          break;
        case 'QUEST_COMPLETE':
          void notificationAsync(NotificationFeedbackType.Success);
          break;
        case 'ACHIEVEMENT_UNLOCKED':
        case 'STREAK_MILESTONE':
        case 'LEVEL_UP':
          void impactAsync(ImpactFeedbackStyle.Heavy);
          setTimeout(() => void notificationAsync(NotificationFeedbackType.Success), 120);
          break;
        case 'BOSS_APPEARED':
          void impactAsync(ImpactFeedbackStyle.Heavy);
          setTimeout(() => void impactAsync(ImpactFeedbackStyle.Heavy), 160);
          break;
        case 'BOSS_DAMAGE':
        case 'SECTOR_DISCOVERED':
          void impactAsync(ImpactFeedbackStyle.Medium);
          break;
        case 'BOSS_PHASE_CHANGED':
          void impactAsync(ImpactFeedbackStyle.Heavy);
          break;
        case 'BOSS_DEFEATED':
          void impactAsync(ImpactFeedbackStyle.Heavy);
          setTimeout(() => void notificationAsync(NotificationFeedbackType.Success), 140);
          break;
        case 'QUEST_FAILED':
        case 'WARNING':
        case 'SYSTEM_WARNING':
          void notificationAsync(NotificationFeedbackType.Warning);
          break;
        case 'SYSTEM_ERROR':
          void notificationAsync(NotificationFeedbackType.Error);
          break;
        default:
          break;
      }
    });

    return unsubscribe;
  }, []);

  return null;
}
