import { useEffect, useRef } from 'react';
import { useSystem } from '../state/SystemProvider';
import { useAudio, type MusicState, type SFXEvent } from './AudioEngine';
import { presentationEventBus, type PresentationEventData } from '../presentation/PresentationEvents';
import type { RewardReceipt } from '../core/rewards';

function rewardFrom(event: PresentationEventData): RewardReceipt | null {
  const value = event.payload?.reward;
  if (!value || typeof value !== 'object') return null;
  const reward = value as Partial<RewardReceipt>;
  if (typeof reward.beforeLevel !== 'number' || typeof reward.afterLevel !== 'number') return null;
  return value as RewardReceipt;
}

function sfxFor(event: PresentationEventData): SFXEvent | null {
  switch (event.type) {
    case 'QUEST_COMPLETE': return 'QUEST_COMPLETE';
    case 'QUEST_FAILED': return 'QUEST_FAIL';
    case 'STREAK_MILESTONE': return 'STREAK_MILESTONE';
    case 'BOSS_DEFEATED': return 'BOSS_DEFEATED';
    case 'BOSS_DAMAGE': return 'BOSS_HIT';
    case 'BOSS_PHASE_CHANGED': return 'BOSS_PHASE';
    case 'BOSS_APPEARED': return 'BOSS_APPEAR';
    case 'WARNING':
    case 'SYSTEM_WARNING':
    case 'SYSTEM_ERROR': return 'WARNING';
    case 'REWARD_RECEIVED': {
      const reward = rewardFrom(event);
      if (reward && (reward.afterLevel > reward.beforeLevel || reward.skillLevels.length > 0)) return 'LEVEL_UP';
      return 'REWARD';
    }
    default: return null;
  }
}

function musicFor(event: PresentationEventData): MusicState | null {
  switch (event.type) {
    case 'SYSTEM_BOOT': return 'BOOT';
    case 'SYSTEM_READY': return 'HOME';
    case 'QUEST_STARTED': return 'QUEST';
    case 'QUEST_COMPLETE': return 'HOME';
    case 'WARNING':
    case 'SYSTEM_WARNING':
    case 'SYSTEM_ERROR': return 'WARNING';
    case 'BOSS_APPEARED':
    case 'BOSS_PHASE_CHANGED':
    case 'BOSS_DAMAGE': return 'BOSS';
    case 'BOSS_DEFEATED': return 'VICTORY';
    default: return null;
  }
}

export default function PresentationAudioBridge() {
  const { settings } = useSystem();
  const { playSFX, setMusicState, stopAll } = useAudio();
  const enabledRef = useRef(settings.audio);
  const restoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    enabledRef.current = settings.audio;
    if (!settings.audio) {
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
      restoreTimerRef.current = null;
      void stopAll();
    }
  }, [settings.audio, stopAll]);

  useEffect(() => {
    const unsubscribe = presentationEventBus.onAny(event => {
      if (!enabledRef.current) return;

      const sfx = sfxFor(event);
      if (sfx) void playSFX(sfx);

      const music = musicFor(event);
      if (music) void setMusicState(music);

      if (restoreTimerRef.current) {
        clearTimeout(restoreTimerRef.current);
        restoreTimerRef.current = null;
      }

      if (event.type === 'BOSS_DEFEATED') {
        restoreTimerRef.current = setTimeout(() => {
          if (enabledRef.current) void setMusicState('HOME');
        }, 4200);
      } else if (event.type === 'WARNING' || event.type === 'SYSTEM_WARNING' || event.type === 'SYSTEM_ERROR') {
        restoreTimerRef.current = setTimeout(() => {
          if (enabledRef.current) void setMusicState('HOME');
        }, 2800);
      }
    });

    return () => {
      unsubscribe();
      if (restoreTimerRef.current) clearTimeout(restoreTimerRef.current);
    };
  }, [playSFX, setMusicState]);

  return null;
}
