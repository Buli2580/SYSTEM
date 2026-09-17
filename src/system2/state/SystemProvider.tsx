import { awaitWithTimeout } from '../storage/awaitWithTimeout';
import {
  createContext, type ReactNode, type Dispatch, type SetStateAction, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { createNewPlayer, type PlayerProfile } from '../core';
import {
  completeVerifiedQuest as persistVerifiedQuest, loadSystemState,
  acknowledgeAwakening as persistAwakeningSeen,
  type CompleteQuestInput, type CompleteQuestResult, type SystemSnapshot,
} from '../storage/database';

type SystemContextValue = {
  player: PlayerProfile;
  ready: boolean;
  completedQuestIds: string[];
  awakeningCompleted: boolean;
  awakeningPending: boolean;
  worldUnlocked: boolean;
  activeQuestId: string | null;
  setActiveQuestId: Dispatch<SetStateAction<string | null>>;
  acknowledgeAwakening: () => Promise<void>;
  error: string | null;
  completeVerifiedQuest: (input: CompleteQuestInput) => Promise<CompleteQuestResult>;
  refreshPlayer: () => Promise<void>;
};
const SystemContext = createContext<SystemContextValue | null>(null);

export function SystemProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<SystemSnapshot>(() => ({
    player: createNewPlayer('GRACZ'), completedQuestIds: [],
    awakeningCompleted: false, worldUnlocked: false, awakeningPending: false,
  }));
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshRef = useRef<Promise<void> | null>(null);

  const refreshPlayer = useCallback((): Promise<void> => {
    if (refreshRef.current) return refreshRef.current;
    setError(null);
    const operation = (async () => {
      try {
        const snapshot = await awaitWithTimeout(loadSystemState());
        setSnapshot(snapshot);
        setReady(true);
      } catch {
        setReady(false);
        setError('Nie można odczytać profilu z bazy SYSTEMU. Spróbuj ponownie. Dane nie zostały zresetowane.');
      } finally {
        refreshRef.current = null;
      }
    })();
    refreshRef.current = operation;
    return operation;
  }, []);

  useEffect(() => { void refreshPlayer(); }, [refreshPlayer]);

  const completeVerifiedQuest = useCallback(async (input: CompleteQuestInput) => {
    const result = await persistVerifiedQuest(input);
    setSnapshot(result);
    return result;
  }, []);

  const acknowledgeAwakening = useCallback(async () => {
    await awaitWithTimeout(persistAwakeningSeen());
    setSnapshot(current => ({ ...current, awakeningPending: false }));
  }, []);

  return (
    <SystemContext.Provider value={{ ...snapshot, ready, error, activeQuestId, setActiveQuestId,
      completeVerifiedQuest, refreshPlayer, acknowledgeAwakening }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystem musi działać wewnątrz SystemProvider.');
  return context;
}
