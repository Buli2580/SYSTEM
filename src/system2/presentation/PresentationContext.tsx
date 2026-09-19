import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { AppState } from 'react-native';
import { SYSTEM_COLORS as C } from '../core';
import type { PresentationEventData, PresentationEventType } from './PresentationEvents';
import { presentationEventBus, PresentationEventPresets } from './PresentationEvents';
import type { PresentationEventHandler } from './PresentationEvents';

export { PresentationEventPresets } from './PresentationEvents';
type PresentationContextValue = {
  registerHandler: (handler: PresentationEventHandler) => () => void;
  triggerEvent: (event: PresentationEventData) => void;
  triggerPreset: (preset: keyof typeof PresentationEventPresets, ...args: unknown[]) => void;
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error', duration?: number) => void;
  queueEvent: (event: PresentationEventData) => void;
};

const PresentationContext = createContext<PresentationContextValue | null>(null);

export function PresentationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: 'info' | 'success' | 'warning' | 'error'; duration: number }>>([]);
  const toastIdRef = useRef(0);
  const handlersRef = useRef<PresentationEventHandler[]>([]);

  // Register presentation event handlers
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    // Subscribe to all presentation events and forward to handlers
    const unsubAny = presentationEventBus.onAny((event) => {
      handlersRef.current.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Presentation handler error:`, error);
        }
      });
    });
    unsubscribers.push(unsubAny);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const registerHandler = useCallback((handler: PresentationEventHandler) => {
    handlersRef.current.push(handler);
    return () => {
      handlersRef.current = handlersRef.current.filter(h => h !== handler);
    };
  }, []);

  const triggerEvent = useCallback((event: PresentationEventData) => {
    presentationEventBus.emit(event);
  }, []);

  const triggerPreset = useCallback((preset: keyof typeof PresentationEventPresets, ...args: unknown[]) => {
    const presetFn = PresentationEventPresets[preset];
    if (presetFn) {
      const event = Reflect.apply(presetFn, undefined, args) as PresentationEventData;
      presentationEventBus.emit(event);
    }
  }, []);

  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== Date.now()));
    }, duration);
  }, []);

  const queueEvent = useCallback((event: PresentationEventData) => {
    // For now, just emit immediately. Could be extended with a queue.
    presentationEventBus.emit(event);
  }, []);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // App came to foreground - could trigger SYSTEM_READY
      } else if (state === 'background') {
        // App went to background - pause any ongoing presentations
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <PresentationContext.Provider value={{
      triggerEvent,
      triggerPreset,
      showToast,
      queueEvent,
      registerHandler,
    }}>
      {children}
    </PresentationContext.Provider>
  );
}

export function usePresentation() {
  const context = useContext(PresentationContext);
  if (!context) {
    throw new Error('usePresentation must be used within a PresentationProvider');
  }
  return context;
}

// Hook for components to listen to presentation events
export function usePresentationEvent(
  type: PresentationEventType | '*',
  handler: (event: { type: PresentationEventType; payload?: Record<string, unknown>; priority: string; timestamp: number }) => void
) {
  useEffect(() => {
    const unsub = presentationEventBus.subscribe(type, handler);
    return unsub;
  }, [type, handler]);
}

export function useToast() {
  const { showToast } = usePresentation();
  return showToast;
}