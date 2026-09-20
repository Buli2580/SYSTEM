import type {
  AIGameMasterContext,
  AIGameMasterResponse,
  AIQuestProposal,
} from './types';
import { difficultyBias } from './difficulty';
import { isTooSimilar } from './repetition';

const TEMPLATES: Omit<AIQuestProposal, 'key'>[] = [
  {
    title: 'Quick Movement Protocol',
    description: 'Wykonaj 15 minut szybkiego marszu.',
    category: 'fitness',
    difficulty: 'easy',
    verification: 'timer',
    estimatedMinutes: 15,
    target: { kind: 'minutes', value: 15 },
    reason: 'Krótka aktywność, którą łatwo wykonać nawet w zajęty dzień.',
    expiresInHours: 18,
    tags: ['movement', 'daily'],
  },
  {
    title: 'Focus Sprint',
    description: 'Przez 20 minut pracuj nad jednym ważnym zadaniem bez rozpraszaczy.',
    category: 'productivity',
    difficulty: 'easy',
    verification: 'timer',
    estimatedMinutes: 20,
    target: { kind: 'minutes', value: 20 },
    reason: 'Buduje regularność i skupienie.',
    expiresInHours: 18,
    tags: ['focus', 'daily'],
  },
  {
    title: 'Learning Burst',
    description: 'Poświęć 15 minut na naukę rzeczy związanej z jednym z Twoich celów.',
    category: 'learning',
    difficulty: 'easy',
    verification: 'timer',
    estimatedMinutes: 15,
    target: { kind: 'minutes', value: 15 },
    reason: 'Mały, regularny krok w kierunku celu.',
    expiresInHours: 18,
    tags: ['learning', 'goal'],
  },
  {
    title: 'Explore Nearby',
    description: 'Przejdź co najmniej 1200 metrów trasą, której ostatnio nie wybierałeś.',
    category: 'exploration',
    difficulty: 'medium',
    verification: 'gps',
    estimatedMinutes: 20,
    target: { kind: 'meters', value: 1200 },
    reason: 'Łączy ruch z eksploracją.',
    expiresInHours: 18,
    tags: ['gps', 'exploration'],
  },
  {
    title: 'Reset Protocol',
    description: 'Wykonaj 10 minut spokojnego spaceru i zakończ jedno małe zaległe zadanie.',
    category: 'recovery',
    difficulty: 'easy',
    verification: 'manual',
    estimatedMinutes: 20,
    reason: 'Pomaga wrócić do rytmu po słabszym dniu.',
    expiresInHours: 24,
    tags: ['recovery', 'return'],
  },
];

export function buildFallback(
  context: AIGameMasterContext,
  count = 4
): AIGameMasterResponse {
  const recentTitles = context.recentQuests.map(q => q.title);
  const candidates = TEMPLATES.filter(
    q => !isTooSimilar(`${q.title} ${q.description}`, recentTitles)
  );

  const selected = (candidates.length ? candidates : TEMPLATES)
    .slice(0, count)
    .map((q, i) => ({
      ...q,
      key: `fallback-${Date.now()}-${i}`,
    }));

  const bias = difficultyBias(context);
  const recovery = context.player.systemDebt > 0;

  return {
    quests: selected,
    director: {
      mode: recovery ? 'recovery' : bias > 0 ? 'challenge' : 'normal',
      difficultyBias: bias,
      headline: recovery ? 'RECOVERY PROTOCOL' : 'DAILY DIRECTIVE',
      message: recovery
        ? 'Najpierw usuń SYSTEM DEBT. Priorytetem jest powrót do rytmu.'
        : 'SYSTEM przygotował dzisiejszy zestaw misji.',
    },
    briefing: `Streak ${context.player.streak}. Completion 7d: ${Math.round(
      context.player.completionRate7d * 100
    )}%.`,
    source: 'fallback',
  };
}
