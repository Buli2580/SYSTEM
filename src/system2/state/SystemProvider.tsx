import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

import {
    addRealXp,
    addSkillXp,
    createNewPlayer,
    PlayerProfile,
    SkillKey,
    VerificationType,
    VerifiedEvent,
} from '../core';

import {
    isQuestCompleted,
    loadOrCreatePlayer,
    recordVerifiedEvent,
    savePlayer,
} from '../storage/database';

type CompleteQuestInput = {
  questId: string;

  realXp: number;

  skillXp: Partial<Record<SkillKey, number>>;

  gameEnergy: number;

  verificationType: VerificationType;
  verificationScore: number;

  distanceMeters?: number;
  durationSeconds?: number;
  steps?: number;
};

type CompleteQuestResult = {
  awarded: boolean;
  player: PlayerProfile;
};

type SystemContextValue = {
  player: PlayerProfile;
  ready: boolean;

  completeVerifiedQuest: (
    input: CompleteQuestInput
  ) => Promise<CompleteQuestResult>;

  refreshPlayer: () => Promise<void>;
};

const SystemContext =
  createContext<SystemContextValue | null>(null);

export function SystemProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [player, setPlayer] = useState<PlayerProfile>(
    createNewPlayer('GRACZ')
  );

  const [ready, setReady] = useState(false);

  const refreshPlayer = useCallback(async () => {
    const storedPlayer = await loadOrCreatePlayer();

    setPlayer(storedPlayer);
    setReady(true);
  }, []);

  useEffect(() => {
    refreshPlayer();
  }, [refreshPlayer]);

  const completeVerifiedQuest = useCallback(
    async (
      input: CompleteQuestInput
    ): Promise<CompleteQuestResult> => {
      const completed = await isQuestCompleted(
        input.questId
      );

      if (completed) {
        const currentPlayer =
          await loadOrCreatePlayer();

        setPlayer(currentPlayer);

        return {
          awarded: false,
          player: currentPlayer,
        };
      }

      let nextPlayer = addRealXp(
        player,
        input.realXp
      );

      const skillEntries = Object.entries(
        input.skillXp
      ) as [SkillKey, number][];

      for (const [skillKey, xp] of skillEntries) {
        if (xp > 0) {
          nextPlayer = addSkillXp(
            nextPlayer,
            skillKey,
            xp
          );
        }
      }

      nextPlayer = {
        ...nextPlayer,

        verifiedQuestCount:
          nextPlayer.verifiedQuestCount + 1,

        gameEnergy:
          nextPlayer.gameEnergy +
          input.gameEnergy,

        updatedAt: new Date().toISOString(),
      };

      const now = new Date().toISOString();

      const event: VerifiedEvent = {
        id: `event_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`,

        playerId: nextPlayer.id,

        questId: input.questId,

        createdAt: now,

        verificationType:
          input.verificationType,

        verificationScore:
          input.verificationScore,

        verified: true,

        realXpAwarded: input.realXp,

        skillXpAwarded:
          input.skillXp,

        gameEnergyAwarded:
          input.gameEnergy,

        distanceMeters:
          input.distanceMeters,

        durationSeconds:
          input.durationSeconds,

        steps:
          input.steps,
      };

      await savePlayer(nextPlayer);
      await recordVerifiedEvent(event);

      setPlayer(nextPlayer);

      return {
        awarded: true,
        player: nextPlayer,
      };
    },
    [player]
  );

  return (
    <SystemContext.Provider
      value={{
        player,
        ready,
        completeVerifiedQuest,
        refreshPlayer,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);

  if (!context) {
    throw new Error(
      'useSystem musi działać wewnątrz SystemProvider.'
    );
  }

  return context;
}