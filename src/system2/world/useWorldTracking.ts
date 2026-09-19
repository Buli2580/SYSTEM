import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from '../identity/feedback';
import * as storage from '../storage/world';
import { useSystem } from '../state/SystemProvider';
import { WorldTracking, type WorldTrackingState } from './tracking';

export function useWorldTracking() {
  const system = useSystem();
  const current = useRef(system); current.current = system;
  const focused = useRef(false);
  const [state, setState] = useState<WorldTrackingState | null>(null);
  const ref = useRef<WorldTracking | null>(null);
  if (!ref.current) ref.current = new WorldTracking({
    location: Location, storage, accuracy: Location.Accuracy.High,
    foreground: () => focused.current && AppState.currentState === 'active',
    unlocked: () => focused.current && current.current.ready && current.current.worldUnlocked,
    changed: value => { if (focused.current) setState(value); },
    rewarded: receipt => { if (receipt) current.current.presentReward(receipt); void current.current.refreshPlayer(); },
    feedback: () => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined); },
  });
  const controller = ref.current;
  useFocusEffect(useCallback(() => {
    focused.current = true;
    const listener = AppState.addEventListener('change', next => controller.onAppState(next));
    void controller.hydrate();
    return () => { focused.current = false; listener.remove(); controller.stop(); };
  }, [controller]));
  return { ...(state ?? controller.state), start: () => controller.start(), pause: () => controller.stop(), scan: (relocate = false) => controller.scan(relocate) };
}
