import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useSystem } from '../state/SystemProvider';
import {
  DEFAULT_HERO_ID,
  HERO_CARDS,
  getHeroCard,
  getUnlockedHeroIds,
  type HeroProgressSnapshot,
} from './catalog';
import { publishHeroCards } from './store';
import { PresentationEventPresets, presentationEventBus } from '../presentation/PresentationEvents';

const ACTIVE_KEY = 'system2.hero.active.v1';
const SEEN_KEY = 'system2.hero.seen.v1';

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
    publishHeroCards({
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
    void SecureStore.setItemAsync(SEEN_KEY, [...seen].join(',')).catch(() => undefined);
  }, [storageReady, unlockedIds]);

  return children;
}
