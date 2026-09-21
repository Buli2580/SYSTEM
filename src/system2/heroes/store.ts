import { useEffect, useState } from 'react';
import { DEFAULT_HERO_ID, HERO_CARDS, getHeroCard, type HeroCardDefinition } from './catalog';

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

export function publishHeroCards(next: HeroCardsSnapshot) {
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
