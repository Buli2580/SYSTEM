/**
 * Isolated presentation models for GRA / MISJE / BOHATER / MIASTO / AKCJA.
 * Not wired into EX12 screens — Codex selective integration only.
 */
import { SYSTEM_VOICE, BASE_COPY, FIRST_ORDER_COPY } from '../content/dialogs.pl.ts';
import type { SlicePersisted } from '../state/sliceStore.ts';
import type { FirstOrderDefinition } from '../content/firstOrder.ts';

export type SliceHudModel = {
  surface: 'GRA';
  orderTitle: string;
  orderBody: string;
  progressLabel: string;
  singleObjective: string;
};

export type SliceJournalModel = {
  surface: 'MISJE';
  entries: Array<{ title: string; status: string; prose: string }>;
};

export type SliceHeroModel = {
  surface: 'BOHATER';
  rank: string;
  levelLabel: string;
  stats: Array<{ key: string; label: string; value: number }>;
  starterItem: string | null;
};

export type SliceCityModel = {
  surface: 'MIASTO';
  discoveries: string[];
  note: string;
};

export type SliceActionModel = {
  surface: 'AKCJA';
  label: string;
  enabled: boolean;
  intent: 'START_ORDER' | 'CONTINUE' | 'OPEN_BASE' | 'CLAIM_DAILY' | 'NONE';
};

export function buildHud(state: SlicePersisted, def?: FirstOrderDefinition): SliceHudModel {
  return {
    surface: 'GRA',
    orderTitle: SYSTEM_VOICE.firstOrderHeadline,
    orderBody: def?.instruction ?? FIRST_ORDER_COPY.instructionGps,
    progressLabel: `${state.firstOrder.progress}/${state.firstOrder.progressTarget}`,
    singleObjective: FIRST_ORDER_COPY.objectiveShort,
  };
}

export function buildJournal(state: SlicePersisted): SliceJournalModel {
  return {
    surface: 'MISJE',
    entries: [
      {
        title: FIRST_ORDER_COPY.title,
        status: state.firstOrder.phase,
        prose: 'Dziennik RPG — bez kodów technicznych na pierwszym planie.',
      },
    ],
  };
}

export function buildHero(state: SlicePersisted): SliceHeroModel {
  return {
    surface: 'BOHATER',
    rank: SYSTEM_VOICE.rankETitle,
    levelLabel: 'POZIOM 1 (Equal origin)',
    stats: [
      { key: 'VIT', label: 'Wytrzymałość', value: 1 },
      { key: 'WIL', label: 'Wola', value: 1 },
      { key: 'INT', label: 'Intelekt', value: 1 },
      { key: 'STR', label: 'Siła', value: 1 },
    ],
    starterItem: state.itemGranted ? 'Znacznik Przebudzonego' : null,
  };
}

export function buildCity(): SliceCityModel {
  return {
    surface: 'MIASTO',
    discoveries: ['Twoja okolica (lokalny start)', 'Lębork — miasto pilotażowe (opcjonalny marker)'],
    note: 'Nie mapuj fikcyjnych sklepów na prawdziwe współrzędne bez uzasadnienia.',
  };
}

export function buildAction(state: SlicePersisted): SliceActionModel {
  if (!state.awakeningConfirmed) {
    return { surface: 'AKCJA', label: 'Oczekiwanie na Przebudzenie', enabled: false, intent: 'NONE' };
  }
  if (state.firstOrder.phase === 'ISSUED') {
    return { surface: 'AKCJA', label: 'Przyjmij rozkaz', enabled: true, intent: 'START_ORDER' };
  }
  if (state.firstOrder.phase === 'ACTIVE') {
    return { surface: 'AKCJA', label: 'Kontynuuj misję', enabled: true, intent: 'CONTINUE' };
  }
  if (state.baseUnlocked && state.phase === 'BASE_UNLOCKED') {
    return { surface: 'AKCJA', label: 'Wejdź do Bazy', enabled: true, intent: 'OPEN_BASE' };
  }
  if (state.phase === 'DAILY_LOOP' && state.daily.orderId) {
    return { surface: 'AKCJA', label: 'Odbierz rozkaz dnia', enabled: true, intent: 'CLAIM_DAILY' };
  }
  return { surface: 'AKCJA', label: '—', enabled: false, intent: 'NONE' };
}

export function buildBaseScreen(state: SlicePersisted) {
  if (!state.baseUnlocked) {
    return { locked: true as const, title: BASE_COPY.title, body: BASE_COPY.locked };
  }
  return {
    locked: false as const,
    title: BASE_COPY.unlockedTitle,
    body: BASE_COPY.unlockedBody,
    nextGoal: BASE_COPY.nextGoal,
    item: state.itemGranted ? 'Znacznik Przebudzonego' : null,
    developmentPoints: state.developmentPoints,
  };
}
