import type { RunnableQuest } from '../quests/types';

export type AIQuestPresentation = {
  title: string;
  description: string;
};

const presentations = new Map<string, AIQuestPresentation>();

export function replaceAIQuestPresentations(
  rows: readonly { id: string; title: string; description: string }[],
) {
  presentations.clear();
  for (const row of rows) {
    if (!row.id || !row.title.trim() || !row.description.trim()) continue;
    presentations.set(row.id, {
      title: row.title.trim().slice(0, 80),
      description: row.description.trim().slice(0, 380),
    });
  }
}

export function applyAIQuestPresentation<T extends RunnableQuest>(quest: T): T {
  const presentation = presentations.get(quest.id);
  return presentation ? { ...quest, ...presentation } : quest;
}

export function clearAIQuestPresentations() {
  presentations.clear();
}
