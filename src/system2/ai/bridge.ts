import { dayOrdinal } from '../daily/calendar';
import { moveAgeMode } from '../move/age';
import { adaptiveDifficulty, generateLoadout, adaptCandidates, type Candidate, type GenerationInput } from '../generation/engine';
import {
  DIFFICULTY,
  QUEST_TEMPLATES,
  generatedQuest,
  type GeneratedDifficulty,
  type QuestTemplate,
  type QuestTheme,
} from '../generation/templates';
import type { AIGameMasterResponse, AIQuestCategory, AIQuestProposal } from './types';

const THEMES: Record<AIQuestCategory, readonly QuestTheme[]> = {
  fitness: ['FITNESS'],
  health: ['LIFESTYLE', 'FITNESS'],
  productivity: ['PRODUCTIVITY', 'DISCIPLINE'],
  learning: ['LEARNING'],
  exploration: ['FITNESS', 'GENERAL'],
  social: ['SOCIAL'],
  recovery: ['DISCIPLINE', 'GENERAL'],
};

const ORDER: Record<GeneratedDifficulty, number> = { EASY: 0, NORMAL: 1, HARD: 2 };

function enabled(template: QuestTemplate, input: GenerationInput) {
  if (!template.activity) return true;
  return {
    WALK: input.prefs?.walking,
    RUN: input.prefs?.running,
    BIKE: input.prefs?.cycling,
  }[template.activity] === true;
}

function offCooldown(template: QuestTemplate, input: GenerationInput) {
  return !input.history.some(item =>
    item.templateId === template.id &&
    dayOrdinal(input.day) - dayOrdinal(item.day) >= 0 &&
    dayOrdinal(input.day) - dayOrdinal(item.day) < template.cooldownDays
  );
}

function requestedDifficulty(proposal: AIQuestProposal): GeneratedDifficulty {
  return proposal.difficulty === 'hard' ? 'HARD' :
    proposal.difficulty === 'medium' ? 'NORMAL' : 'EASY';
}

function canonicalDifficulty(input: GenerationInput, proposal: AIQuestProposal): GeneratedDifficulty {
  const requested = requestedDifficulty(proposal);
  const localPolicy = adaptiveDifficulty(input).difficulty;
  let result = ORDER[requested] <= ORDER[localPolicy] ? requested : localPolicy;
  if (input.maximumDifficulty && ORDER[result] > ORDER[input.maximumDifficulty]) {
    result = input.maximumDifficulty;
  }
  while (input.player.realLevel < DIFFICULTY[result].minLevel) {
    result = result === 'HARD' ? 'NORMAL' : 'EASY';
    if (result === 'EASY') break;
  }
  return result;
}

function verificationScore(template: QuestTemplate, proposal: AIQuestProposal) {
  if (proposal.verification === 'gps') return template.verification === 'GPS_DISTANCE' ? 120 : -120;
  if (proposal.verification === 'timer') return template.verification === 'TIMER' ? 80 : -80;
  return template.verification === 'TIMER' ? 30 : 0;
}

function chooseTemplate(
  input: GenerationInput,
  proposal: AIQuestProposal,
  used: Set<string>,
  forceRecovery: boolean,
) {
  const themes = THEMES[proposal.category];
  const hinted = QUEST_TEMPLATES.find(template => template.id === proposal.templateHint);
  if (hinted && !enabled(hinted, input)) return undefined;
  const candidates = QUEST_TEMPLATES
    .filter(template => !used.has(template.id))
    .filter(template => !input.exclude?.includes(template.id))
    .filter(template => enabled(template, input))
    .filter(template => proposal.verification !== 'gps' || template.verification === 'GPS_DISTANCE')
    .filter(template => proposal.verification !== 'timer' || template.verification === 'TIMER')
    .filter(template => offCooldown(template, input))
    .filter(template => input.player.realLevel >= template.minimumLevel)
    .filter(template => forceRecovery
      ? template.id === 'focus_return'
      : proposal.category === 'recovery'
        ? template.id === 'focus_return' || themes.includes(template.category)
        : template.id !== 'focus_return');

  candidates.sort((a, b) => {
    const score = (template: QuestTemplate) =>
      (template.id === proposal.templateHint ? 1000 : 0) +
      (themes.includes(template.category) ? 200 : 0) +
      verificationScore(template, proposal) +
      (proposal.category === 'recovery' && template.id === 'focus_return' ? 500 : 0) -
      input.history.slice(0, 12).filter(item => item.category === template.category).length * 8;
    return score(b) - score(a) || a.id.localeCompare(b.id);
  });
  return candidates[0];
}

function safeText(text: string, max: number) {
  return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

function verificationCopy(quest: NonNullable<ReturnType<typeof generatedQuest>>) {
  return quest.verification.type === 'GPS_DISTANCE'
    ? `GPS potwierdza minimum ${Math.round(quest.verification.minimumDistanceMeters)} m.`
    : `Timer SYSTEMU potwierdza minimum ${Math.round(quest.verification.minimumDurationSeconds / 60)} min sesji.`;
}

export function candidatesFromAI(
  input: GenerationInput,
  response: AIGameMasterResponse,
  count = 3,
): Candidate[] {
  // Never display or persist unreviewed model prose for a protected age mode.
  if (moveAgeMode(input.player.birthDate,new Date(input.day+'T12:00:00')) !== 'ADULT') return generateLoadout(input,count);
  const picked: Candidate[] = [];
  const narratives = new Map<string, AIQuestProposal>();
  const used = new Set<string>();
  const recoveryMode = (input.systemDebt ?? 0) > 0 || response.director.mode === 'recovery';

  const proposals = response.quests.slice().sort((a, b) => {
    if (recoveryMode) {
      if (a.category === 'recovery' && b.category !== 'recovery') return -1;
      if (b.category === 'recovery' && a.category !== 'recovery') return 1;
    }
    return 0;
  });

  for (const proposal of proposals) {
    if (picked.length >= count) break;
    const forceRecovery = recoveryMode && picked.length === 0;
    const template = chooseTemplate(input, proposal, used, forceRecovery);
    if (!template) continue;
    const difficulty = forceRecovery || proposal.category === 'recovery'
      ? 'EASY'
      : canonicalDifficulty(input, proposal);
    const baseQuest = generatedQuest(
      `daily:${input.day}:g1_${template.id}_${difficulty.toLowerCase()}`,
    );
    if (!baseQuest) continue;

    const mayPersonalize = !forceRecovery || proposal.category === 'recovery';
    if (mayPersonalize) narratives.set(template.id, proposal);
    const quest = mayPersonalize ? {
      ...baseQuest,
      title: safeText(proposal.title, 72) || baseQuest.title,
      description: `${safeText(proposal.description, 230)} ${verificationCopy(baseQuest)}`.slice(0, 380),
    } : baseQuest;

    used.add(template.id);
    picked.push({
      quest,
      reason: `AI GAME MASTER · ${safeText(proposal.reason, 180)}`,
      templateId: template.id,
      category: template.category,
      recovery: forceRecovery || proposal.category === 'recovery',
    });
  }

  const local = generateLoadout(
    { ...input, exclude: [...(input.exclude ?? []), ...used] },
    count,
  );
  for (const candidate of local) {
    if (picked.length >= count) break;
    if (used.has(candidate.templateId)) continue;
    used.add(candidate.templateId);
    picked.push(candidate);
  }

  return adaptCandidates(input, picked.slice(0, count)).map(candidate => {
    const proposal = narratives.get(candidate.templateId);
    if (!proposal) return candidate;
    return { ...candidate, quest: { ...candidate.quest,
      description: `${safeText(proposal.description, 230)} ${verificationCopy(candidate.quest)} ${candidate.quest.verification.type === 'TIMER' ? 'Timer potwierdza czas na pierwszym planie, nie wykonanie zadania ani jego jakość.' : ''}`.trim(),
    } };
  });
}
