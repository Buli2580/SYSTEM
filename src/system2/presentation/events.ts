import type { RewardReceipt } from '../core/rewards';

export type PresentationEventKind = 'QUEST_COMPLETE' | 'LEVEL_UP' | 'RANK_UP' | 'SKILL_UP' | 'TITLE_UNLOCKED' | 'WORLD_UNLOCKED';
export type PresentationEvent = {
  id: string;
  kind: PresentationEventKind;
  eyebrow: string;
  title: string;
  detail?: string;
  accent: 'CYAN' | 'GOLD' | 'VIOLET';
  priority: number;
};

export function presentationEventsFromReceipt(receipt: RewardReceipt): PresentationEvent[] {
  const events: PresentationEvent[] = [{
    id: receipt.id + ':quest',
    kind: 'QUEST_COMPLETE',
    eyebrow: 'QUEST COMPLETE',
    title: `+${receipt.realXp} REAL XP`,
    detail: `+${receipt.energy} ENERGY`,
    accent: 'CYAN',
    priority: 10,
  }];
  if (receipt.afterLevel > receipt.beforeLevel) events.push({
    id: receipt.id + ':level',
    kind: 'LEVEL_UP',
    eyebrow: 'LEVEL UP',
    title: `LV. ${receipt.afterLevel}`,
    detail: `REAL LEVEL ${receipt.beforeLevel} → ${receipt.afterLevel}`,
    accent: 'GOLD',
    priority: 40,
  });
  if (receipt.afterRank !== receipt.beforeRank) events.push({
    id: receipt.id + ':rank',
    kind: 'RANK_UP',
    eyebrow: 'RANK PROMOTION',
    title: `${receipt.beforeRank} → ${receipt.afterRank}`,
    accent: 'VIOLET',
    priority: 50,
  });
  for (const skill of receipt.skillLevels) events.push({
    id: receipt.id + ':skill:' + skill.key,
    kind: 'SKILL_UP',
    eyebrow: 'SKILL LEVEL UP',
    title: `${skill.key} LV.${skill.after}`,
    detail: `LV.${skill.before} → LV.${skill.after}`,
    accent: 'CYAN',
    priority: 30,
  });
  for (const title of receipt.newTitles) events.push({
    id: receipt.id + ':title:' + title,
    kind: 'TITLE_UNLOCKED',
    eyebrow: 'TITLE UNLOCKED',
    title,
    detail: 'Nowy tytuł został dodany do profilu postaci.',
    accent: 'VIOLET',
    priority: 42,
  });
  if (receipt.worldUnlocked) events.push({
    id: receipt.id + ':world',
    kind: 'WORLD_UNLOCKED',
    eyebrow: 'SYSTEM EXPANSION',
    title: 'WORLD UNLOCKED',
    detail: 'Nowy obszar SYSTEMU jest dostępny.',
    accent: 'GOLD',
    priority: 45,
  });
  return events.sort((a,b)=>a.priority-b.priority);
}
