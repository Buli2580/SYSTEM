import { getQuest, AWAKENING_CHAPTER_ID } from '../quests/catalog';
import { SIGNAL_ID } from '../world/signals';
import type { VerifiedEvent } from '../core';
export function activityName(id: string) {
  if (id.startsWith('daily_clear:')) return 'DZIEŃ UKOŃCZONY';
  if (id.startsWith('weekly_complete:')) return 'TYDZIEŃ UKOŃCZONY';
  if (id === AWAKENING_CHAPTER_ID) return 'PRZEBUDZENIE — ROZDZIAŁ 01';
  if (id === SIGNAL_ID) return 'NIEZNANY SYGNAŁ';
  return getQuest(id)?.title ?? 'ZDARZENIE SYSTEMU';
}
export function parseEvent(payload: string): VerifiedEvent {
  const event = JSON.parse(payload) as VerifiedEvent;
  if (!event || typeof event.id !== 'string' || typeof event.questId !== 'string' ||
    !Number.isFinite(Date.parse(event.createdAt)) || !Number.isFinite(event.realXpAwarded) || !event.skillXpAwarded) throw new Error('Nieprawidłowy wpis historii SYSTEMU.');
  return event;
}
