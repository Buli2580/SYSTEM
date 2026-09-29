import type {
  AIGameMasterContext,
  AIGameMasterResponse,
  AIQuestProposal,
} from './types';
import { difficultyBias } from './difficulty';
import { isTooSimilar } from './repetition';

const TEMPLATES: Omit<AIQuestProposal, 'key'>[] = [
  {
    title: 'Focus Sprint',
    description: 'Pracuj nad jednym ważnym zadaniem bez przełączania się między aplikacjami.',
    category: 'productivity',
    difficulty: 'easy',
    verification: 'timer',
    estimatedMinutes: 20,
    templateHint: 'focus_priority',
    target: { kind: 'minutes', value: 20 },
    reason: 'Krótki blok skupienia pomaga utrzymać regularność.',
    expiresInHours: 18,
    tags: ['focus', 'daily'],
  },
  {
    title: 'Next Step',
    description: 'Rozpisz i wykonaj pierwszy konkretny krok w najważniejszym projekcie.',
    category: 'productivity',
    difficulty: 'medium',
    verification: 'timer',
    estimatedMinutes: 25,
    templateHint: 'focus_plan',
    target: { kind: 'minutes', value: 25 },
    reason: 'Zmienia duży cel w wykonalne działanie.',
    expiresInHours: 18,
    tags: ['planning', 'goal'],
  },
  {
    title: 'Learning Burst',
    description: 'Przerób jeden konkretny fragment materiału i zapisz najważniejszy wniosek.',
    category: 'learning',
    difficulty: 'easy',
    verification: 'timer',
    estimatedMinutes: 15,
    templateHint: 'learn_read',
    target: { kind: 'minutes', value: 15 },
    reason: 'Mały blok nauki łatwiej utrzymać przez wiele dni.',
    expiresInHours: 18,
    tags: ['learning', 'daily'],
  },
  {
    title: 'Active Recall',
    description: 'Bez zaglądania do materiałów odtwórz z pamięci najważniejsze informacje z ostatniej nauki.',
    category: 'learning',
    difficulty: 'medium',
    verification: 'timer',
    estimatedMinutes: 15,
    templateHint: 'learn_recall',
    target: { kind: 'minutes', value: 15 },
    reason: 'Aktywne przypominanie wzmacnia zapamiętywanie.',
    expiresInHours: 18,
    tags: ['learning', 'recall'],
  },
  {
    title: 'Reset Walk',
    description: 'Przejdź spokojną, bezpieczną i znaną trasę w równym tempie.',
    category: 'fitness',
    difficulty: 'easy',
    verification: 'gps',
    estimatedMinutes: 15,
    templateHint: 'walk_reset',
    target: { kind: 'meters', value: 600 },
    reason: 'Dodaje ruch bez potrzeby mocnego treningu.',
    expiresInHours: 18,
    tags: ['movement', 'walk'],
  },
  {
    title: 'Fresh Air Route',
    description: 'Wyjdź na bezpieczny spacer i przejdź trasę inną niż ostatnio.',
    category: 'exploration',
    difficulty: 'medium',
    verification: 'gps',
    estimatedMinutes: 20,
    templateHint: 'walk_fresh',
    target: { kind: 'meters', value: 900 },
    reason: 'Łączy ruch ze zmianą otoczenia.',
    expiresInHours: 18,
    tags: ['gps', 'exploration'],
  },
  {
    title: 'Digital Order',
    description: 'Uporządkuj niewielką grupę własnych notatek, zdjęć lub plików.',
    category: 'health',
    difficulty: 'easy',
    verification: 'timer',
    estimatedMinutes: 15,
    templateHint: 'organize_files',
    target: { kind: 'minutes', value: 15 },
    reason: 'Zmniejsza drobny chaos, który zabiera uwagę.',
    expiresInHours: 18,
    tags: ['order', 'routine'],
  },
  {
    title: 'Ready for Tomorrow',
    description: 'Przygotuj najważniejsze rzeczy i pierwszy krok na kolejny dzień.',
    category: 'health',
    difficulty: 'easy',
    verification: 'timer',
    estimatedMinutes: 10,
    templateHint: 'organize_tomorrow',
    target: { kind: 'minutes', value: 10 },
    reason: 'Ułatwia rozpoczęcie kolejnego dnia bez zbędnego tarcia.',
    expiresInHours: 18,
    tags: ['routine', 'tomorrow'],
  },
  {
    title: 'Reconnect',
    description: 'Przygotuj krótką, życzliwą wiadomość do znanej Ci osoby; wysłanie pozostaje dobrowolne.',
    category: 'social',
    difficulty: 'easy',
    verification: 'timer',
    estimatedMinutes: 10,
    templateHint: 'focus_social_message',
    target: { kind: 'minutes', value: 10 },
    reason: 'Buduje regularność w relacjach bez presji.',
    expiresInHours: 18,
    tags: ['social', 'connection'],
  },
  {
    title: 'Conversation Plan',
    description: 'Przygotuj jedno dobre pytanie i jeden temat do spokojnej rozmowy.',
    category: 'social',
    difficulty: 'easy',
    verification: 'timer',
    estimatedMinutes: 10,
    templateHint: 'focus_social_plan',
    target: { kind: 'minutes', value: 10 },
    reason: 'Ułatwia rozpoczęcie naturalnej rozmowy.',
    expiresInHours: 18,
    tags: ['social', 'plan'],
  },
  {
    title: 'Small Creation',
    description: 'Rozwiń jeden pomysł w krótkim szkicu, notatce albo roboczej wersji.',
    category: 'productivity',
    difficulty: 'medium',
    verification: 'timer',
    estimatedMinutes: 20,
    templateHint: 'create_sketch',
    target: { kind: 'minutes', value: 20 },
    reason: 'Zamienia pomysł w pierwszy widoczny rezultat.',
    expiresInHours: 18,
    tags: ['create', 'progress'],
  },
  {
    title: 'Reflection',
    description: 'Zapisz, co ostatnio pomogło Ci działać i co warto powtórzyć jutro.',
    category: 'health',
    difficulty: 'easy',
    verification: 'timer',
    estimatedMinutes: 10,
    templateHint: 'focus_reflect',
    target: { kind: 'minutes', value: 10 },
    reason: 'Pomaga zauważyć działające zachowania bez karania za słabszy dzień.',
    expiresInHours: 18,
    tags: ['reflection', 'routine'],
  },
];

const RECOVERY: Omit<AIQuestProposal, 'key'> = {
  title: 'Recovery Protocol',
  description: 'Wróć do SYSTEMU jednym małym, wykonalnym krokiem bez nadrabiania zaległości.',
  category: 'recovery',
  difficulty: 'easy',
  verification: 'timer',
  estimatedMinutes: 10,
  templateHint: 'focus_return',
  target: { kind: 'minutes', value: 10 },
  reason: 'Priorytetem jest odzyskanie regularności, nie zwiększanie presji.',
  expiresInHours: 24,
  tags: ['recovery', 'return'],
};

function goalText(context: AIGameMasterContext) {
  return context.goals.map(goal => `${goal.title} ${goal.description ?? ''}`).join(' ').toLowerCase();
}

function preferredCategories(context: AIGameMasterContext): string[] {
  const goal = goalText(context);
  const completed = context.recentQuests.filter(q => q.completed).map(q => q.category).filter(Boolean) as string[];
  const failed = new Set(context.recentQuests.filter(q => q.failed).map(q => q.category).filter(Boolean) as string[]);
  const inferred: string[] = [];
  if (/naucz|język|kurs|książ|egzamin|wied|certyf|programow|kod|learn|study/.test(goal)) inferred.push('learning');
  if (/prac|projekt|firma|biznes|klient|sprzeda|marketing|aplikac|produkt|startup|career/.test(goal)) inferred.push('productivity');
  if (/bieg|spacer|rower|trening|ruch|fitness|kondyc|sił|run|walk|bike/.test(goal)) inferred.push('fitness');
  if (/poznaj|miejsce|zwiedz|odkry|explor/.test(goal)) inferred.push('exploration');
  if (/relac|rozmow|kontakt|znajom|social/.test(goal)) inferred.push('social');
  const result = [...inferred, ...completed.filter(x => !failed.has(x))];
  return [...new Set(result)];
}

function goalAwareScore(quest: Omit<AIQuestProposal, 'key'>, context: AIGameMasterContext) {
  const preferred = preferredCategories(context);
  const goal = goalText(context);
  let score = preferred.indexOf(quest.category) >= 0 ? 80 - preferred.indexOf(quest.category) * 8 : 0;
  if (quest.category === 'fitness') {
    if (quest.templateHint?.startsWith('run_') && context.player.activities?.running === false) score -= 500;
    if (quest.templateHint?.startsWith('ride_') && context.player.activities?.cycling === false) score -= 500;
    if (quest.templateHint?.startsWith('walk_') && context.player.activities?.walking === false) score -= 500;
  }
  if (/naucz|learn|study|język|kurs/.test(goal) && quest.tags.includes('learning')) score += 35;
  if (/projekt|biznes|aplikac|produkt|prac/.test(goal) && (quest.tags.includes('goal') || quest.tags.includes('focus'))) score += 35;
  return score;
}

function personalizeFallbackQuest(quest: Omit<AIQuestProposal, 'key'>, context: AIGameMasterContext) {
  const goal = context.goals[0]?.title?.trim();
  if (!goal || quest.category === 'recovery' || quest.category === 'fitness') return quest;
  if (quest.category === 'productivity') return {
    ...quest,
    title: `Krok do celu: ${goal}`.slice(0, 80),
    description: `Wybierz jeden konkretny, mierzalny krok związany z celem „${goal}” i pracuj wyłącznie nad nim przez ten blok.`.slice(0, 280),
    reason: `Ta misja wynika bezpośrednio z aktywnego celu „${goal}”.`.slice(0, 180),
    tags: [...new Set([...quest.tags, 'personalized', 'goal'])].slice(0, 8),
  };
  if (quest.category === 'learning') return {
    ...quest,
    title: `Research: ${goal}`.slice(0, 80),
    description: `Przeanalizuj jeden wiarygodny materiał związany z celem „${goal}” i zapisz jeden wniosek, który wykorzystasz w następnym działaniu.`.slice(0, 280),
    reason: `Buduje wiedzę potrzebną do realizacji celu „${goal}”.`.slice(0, 180),
    tags: [...new Set([...quest.tags, 'personalized', 'goal'])].slice(0, 8),
  };
  return quest;
}

function hash(text: string) {
  let value = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    value ^= text.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function rotate<T>(rows: readonly T[], offset: number): T[] {
  if (!rows.length) return [];
  const start = offset % rows.length;
  return [...rows.slice(start), ...rows.slice(0, start)];
}

function diversified(rows: readonly Omit<AIQuestProposal, 'key'>[], count: number) {
  const result: Omit<AIQuestProposal, 'key'>[] = [];
  const categories = new Set<string>();
  for (const row of rows) {
    if (result.length >= count) break;
    if (categories.has(row.category)) continue;
    result.push(row);
    categories.add(row.category);
  }
  for (const row of rows) {
    if (result.length >= count) break;
    if (result.includes(row)) continue;
    result.push(row);
  }
  return result;
}

export function buildFallback(
  context: AIGameMasterContext,
  count = 4,
): AIGameMasterResponse {
  const protectedAge=context.player.ageMode!=='ADULT';
  const safeCount = Math.max(1, Math.min(6, Math.floor(count)));
  const recent = context.recentQuests.map(q => `${q.title} ${q.description ?? ''}`);
  const templates=protectedAge?TEMPLATES.filter(q=>q.verification==='timer'&&q.category!=='social'&&q.category!=='fitness'):TEMPLATES;
  const fresh = templates.filter(
    q => !isTooSimilar(`${q.title} ${q.description}`, recent),
  );
  const pool = fresh.length >= Math.min(safeCount, 3) ? fresh : templates;
  const day = (context.nowIso ?? new Date().toISOString()).slice(0, 10);
  const seed = [
    day,
    context.player.level,
    context.player.rank,
    context.player.streak,
    ...context.goals.map(goal => goal.title),
  ].join('|');
  const ordered = rotate(pool, hash(seed))
    .filter(quest => goalAwareScore(quest, context) > -400)
    .sort((a, b) => goalAwareScore(b, context) - goalAwareScore(a, context));
  const recovery = context.player.systemDebt > 0;
  const normalCount = recovery ? Math.max(0, safeCount - 1) : safeCount;
  const chosen = diversified(ordered.length ? ordered : pool, normalCount);
  const selected = recovery ? [RECOVERY, ...chosen] : chosen;
  const quests = selected.slice(0, safeCount).map((raw, index) => {
    const quest = protectedAge ? {...raw,difficulty:'easy' as const,estimatedMinutes:5,target:{kind:'minutes' as const,value:5}} : personalizeFallbackQuest(raw, context);
    return {
      ...quest,
      key: `fallback-${day}-${index}-${quest.templateHint ?? quest.category}`,
    };
  });

  const bias = protectedAge ? -1 : difficultyBias(context);
  return {
    quests,
    director: {
      mode: recovery ? 'recovery' : bias > 0 ? 'challenge' : 'normal',
      difficultyBias: recovery ? -1 : bias,
      headline: recovery ? 'RECOVERY PROTOCOL' : 'DAILY DIRECTIVE',
      message: recovery
        ? 'SYSTEM obniżył presję. Najpierw odzyskaj rytm jednym małym krokiem.'
        : !protectedAge && context.goals[0]?.title
          ? `SYSTEM przygotował lokalny zestaw pod cel: ${context.goals[0].title}. Research WWW jest niedostępny w trybie fallback.`
          : 'SYSTEM przygotował zróżnicowany zestaw bez połączenia z AI.',
    },
    briefing: `Streak ${context.player.streak}. Skuteczność 7 dni: ${Math.round(
      context.player.completionRate7d * 100,
    )}%.`,
    source: 'fallback',
  };
}
