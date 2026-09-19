import * as Location from 'expo-location';
import { useEffect, useRef, useState, useCallback, createContext, useContext, type ReactNode } from 'react';

export type LocationSubscriber = (location: Location.LocationObject) => void;

interface LocationServiceState {
  location: Location.LocationObject | null;
  error: string | null;
  status: 'IDLE' | 'STARTING' | 'ACTIVE' | 'PAUSED' | 'ERROR' | 'DENIED';
  subscribers: number;
}

type LocationServiceContextValue = {
  state: LocationServiceState;
  subscribe: (callback: LocationSubscriber) => () => void;
  start: () => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
};

const LocationServiceContext = createContext<LocationServiceContextValue | null>(null);

export function LocationServiceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LocationServiceState>({
    location: null,
    error: null,
    status: 'IDLE',
    subscribers: 0,
  });

  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const subscribersRef = useRef<Set<LocationSubscriber>>(new Set());
  const epochRef = useRef(0);
  const previousLocationRef = useRef<Location.LocationObject | null>(null);

  const notifySubscribers = useCallback((location: Location.LocationObject) => {
    subscribersRef.current.forEach(callback => {
      try {
        callback(location);
      } catch (e) {
        console.warn('Location subscriber error:', e);
      }
    });
  }, []);

  const updateState = useCallback((patch: Partial<LocationServiceState>) => {
    setState(prev => ({ ...prev, ...patch }));
  }, []);

  const start = useCallback(async () => {
    const currentEpoch = ++epochRef.current;
    
    if (state.status === 'STARTING' || state.status === 'ACTIVE') return;
    
    updateState({ status: 'STARTING', error: null });
    
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        if (currentEpoch === epochRef.current) {
          updateState({ status: 'DENIED', error: 'Location permission denied' });
        }
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        if (currentEpoch === epochRef.current) {
          updateState({ status: 'ERROR', error: 'Location services disabled' });
        }
        return;
      }

      if (currentEpoch !== epochRef.current) return;

      const initialLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      if (currentEpoch !== epochRef.current) return;

      previousLocationRef.current = initialLocation;
      updateState({ location: initialLocation, status: 'ACTIVE', error: null });

      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 0,
        },
        (location) => {
          if (currentEpoch !== epochRef.current) return;
          
          // Throttle: skip updates too close in time
          const prev = previousLocationRef.current;
          if (prev && location.timestamp - prev.timestamp < 1000) return;
          
          previousLocationRef.current = location;
          updateState({ location });
          notifySubscribers(location);
        },
        (error) => {
          if (currentEpoch === epochRef.current) {
            updateState({ status: 'ERROR', error: String(error) });
          }
        }
      );

      if (currentEpoch !== epochRef.current) {
        watcher.remove();
        return;
      }

      watcherRef.current = watcher;
      updateState({ status: 'ACTIVE' });
    } catch (error) {
      if (currentEpoch === epochRef.current) {
        updateState({ status: 'ERROR', error: String(error) });
      }
    }
  }, [state.status]);

  const stop = useCallback(() => {
    epochRef.current++;
    const watcher = watcherRef.current;
    watcherRef.current = null;
    previousLocationRef.current = null;
    
    try { watcher?.remove(); } catch {}
    
    updateState({ status: 'PAUSED', location: null, error: null });
  }, []);

  const pause = useCallback(() => {
    const watcher = watcherRef.current;
    watcherRef.current = null;
    try { watcher?.remove(); } catch {}
    updateState({ status: 'PAUSED' });
  }, []);

  const resume = useCallback(async () => {
    if (state.status === 'ACTIVE') return;
    await start();
  }, []);

  const subscribe = useCallback((callback: LocationSubscriber) => {
    subscribersRef.current.add(callback);
    setState(prev => ({ ...prev, subscribers: prev.subscribers + 1 }));
    
    // If we have a current location, notify the new subscriber immediately
    if (state.location) {
      try { callback(state.location); } catch {}
    }
    
    return () => {
      subscribersRef.current.delete(callback);
      setState(prev => ({ ...prev, subscribers: prev.subscribers - 1 }));
    };
  }, [state.location]);

  const value = {
    state,
    subscribe,
    start,
    stop,
    pause,
    resume,
  };

  return (
    <LocationServiceContext.Provider value={value}>
      {children}
    </LocationServiceContext.Provider>
  );
}

export function useLocationService() {
  const context = useContext(LocationServiceContext);
  if (!context) throw new Error('useLocationService must be used within LocationServiceProvider');
  return context;
}

export function useLocationSubscription(callback: (location: Location.LocationObject) => void) {
  const { subscribe, state, start, stop, pause, resume } = useLocationService();
  
  useEffect(() => {
    if (state.status !== 'ACTIVE') {
      start().catch(console.error);
    }
    
    const unsubscribe = subscribe(callback);
    return unsubscribe;
  }, [callback, state.status, subscribe, start]);
}