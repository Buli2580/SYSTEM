import { awaitWithTimeout } from '../storage/awaitWithTimeout';
import {
  createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { createNewPlayer, type PlayerProfile } from '../core';
import {
  completeVerifiedQuest as persistVerifiedQuest, loadOrCreatePlayer,
  type CompleteQuestInput, type CompleteQuestResult,
} from '../storage/database';

type SystemContextValue = {
  player: PlayerProfile;
  ready: boolean;
  error: string | null;
  completeVerifiedQuest: (input: CompleteQuestInput) => Promise<CompleteQuestResult>;
  refreshPlayer: () => Promise<void>;
};
const SystemContext = createContext<SystemContextValue | null>(null);

export function SystemProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState(() => createNewPlayer('GRACZ'));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshRef = useRef<Promise<void> | null>(null);

  const refreshPlayer = useCallback((): Promise<void> => {
    if (refreshRef.current) return refreshRef.current;
    setError(null);
    const operation = (async () => {
      try {
        setPlayer(await awaitWithTimeout(loadOrCreatePlayer()));
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
    setPlayer(result.player);
    return result;
  }, []);

  return (
    <SystemContext.Provider value={{ player, ready, error, completeVerifiedQuest, refreshPlayer }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (!context) throw new Error('useSystem musi działać wewnątrz SystemProvider.');
  return context;
}
