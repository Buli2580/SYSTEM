import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useSystem } from '../state/SystemProvider';
import {
  DEFAULT_HERO_ID,
  HERO_CARDS,
  getHeroCard,
  getUnlockedHeroIds,
  type HeroCardDefinition,
  type HeroProgressSnapshot,
} from './catalog';
import { PresentationEventPresets, presentationEventBus } from '../presentation/PresentationEvents';

const ACTIVE_KEY = 'system2.hero.active.v1';
const SEEN_KEY = 'system2.hero.seen.v1';

export type HeroCardsSnapshot = {
  activeHero: HeroCardDefinition;
  activeHeroId: string;
  unlockedIds: string[];
  cards: readonly HeroCardDefinition[];
  ready: boolean;
  equipHero: (id: string) => Promise<boolean>;
};

let runtimeSnapshot: HeroCardsSnapshot = {
  activeHero: getHeroCard(DEFAULT_HERO_ID),
  activeHeroId: DEFAULT_HERO_ID,
  unlockedIds: [DEFAULT_HERO_ID],
  cards: HERO_CARDS,
  ready: false,
  equipHero: async () => false,
};

const listeners = new Set<() => void>();

function publish(next: HeroCardsSnapshot) {
  runtimeSnapshot = next;
  for (const listener of listeners) listener();
}

export function getHeroCardsSnapshot() {
  return runtimeSnapshot;
}

export function subscribeHeroCards(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useHeroCards(): HeroCardsSnapshot {
  const [snapshot, setSnapshot] = useState(() => getHeroCardsSnapshot());
  useEffect(() => subscribeHeroCards(() => setSnapshot(getHeroCardsSnapshot())), []);
  return snapshot;
}

export function HeroCardsProvider({ children }: { children: ReactNode }) {
  const system = useSystem();
  const [storedActive, setStoredActive] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const seenRef = useRef<Set<string> | null>(null);

  const progress = useMemo<HeroProgressSnapshot>(() => ({
    level: system.player.realLevel,
    streak: system.player.streak,
    verifiedQuestCount: system.player.verifiedQuestCount,
    skillLevels: {
      STR: system.player.stats.STR.level,
      VIT: system.player.stats.VIT.level,
      INT: system.player.stats.INT.level,
      WIL: system.player.stats.WIL.level,
      CHA: system.player.stats.CHA.level,
      CRE: system.player.stats.CRE.level,
      RES: system.player.stats.RES.level,
    },
    bossDefeated: Boolean(system.story?.bossComplete),
    worldLinkComplete: Boolean(system.story?.worldLinkComplete),
    achievements: Object.fromEntries(
      Object.entries(system.achievementState.achievements).map(([id, item]) => [id, item.state]),
    ),
  }), [
    system.player.realLevel,
    system.player.streak,
    system.player.verifiedQuestCount,
    system.player.stats,
    system.story?.bossComplete,
    system.story?.worldLinkComplete,
    system.achievementState.achievements,
  ]);

  const unlockedIds = useMemo(() => getUnlockedHeroIds(progress), [progress]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [stored, seen] = await Promise.all([
          SecureStore.getItemAsync(ACTIVE_KEY),
          SecureStore.getItemAsync(SEEN_KEY),
        ]);
        if (!active) return;
        setStoredActive(stored);
        seenRef.current = new Set((seen ? seen.split(',') : []).filter(Boolean));
      } catch {
        if (!active) return;
        seenRef.current = new Set();
      } finally {
        if (active) setStorageReady(true);
      }
    })();
    return () => { active = false; };
  }, []);

  const activeHeroId = unlockedIds.includes(storedActive ?? '') ? storedActive! : DEFAULT_HERO_ID;

  const equipHero = useCallback(async (id: string) => {
    if (!unlockedIds.includes(id)) return false;
    setStoredActive(id);
    try { await SecureStore.setItemAsync(ACTIVE_KEY, id); } catch { /* cosmetic preference */ }
    const card = getHeroCard(id);
    presentationEventBus.emit(PresentationEventPresets.heroCardEquipped(card.id, card.name, card.rarity));
    return true;
  }, [unlockedIds]);

  useEffect(() => {
    publish({
      activeHero: getHeroCard(activeHeroId),
      activeHeroId,
      unlockedIds,
      cards: HERO_CARDS,
      ready: storageReady,
      equipHero,
    });
  }, [activeHeroId, equipHero, storageReady, unlockedIds]);

  useEffect(() => {
    if (!storageReady || !seenRef.current) return;
    const seen = seenRef.current;
    const newIds = unlockedIds.filter(id => id !== DEFAULT_HERO_ID && !seen.has(id));
    if (!newIds.length) return;

    for (const id of newIds) {
      seen.add(id);
      const card = getHeroCard(id);
      presentationEventBus.emit(PresentationEventPresets.heroCardUnlocked(card.id, card.name, card.rarity));
    }
    try {
      void SecureStore.setItemAsync(SEEN_KEY, [...seen].join(','));
    } catch {
      // Cosmetic unlock notifications can safely repeat after storage failure.
    }
  }, [storageReady, unlockedIds]);

  return children;
}
