import type { QuestDifficulty, VerificationType } from '../core';
import type { QuestAvailability } from '../quests/types';
import type { ActivityType, Verdict } from '../activity/types';
import type { Title } from '../identity/model';

export function questStatusPl(status: QuestAvailability) {
  return ({
    AVAILABLE: 'DOSTĘPNA',
    ACTIVE: 'AKTYWNA',
    COMPLETED: 'UKOŃCZONA',
    LOCKED: 'ZABLOKOWANA',
  } as const)[status];
}

export function difficultyPl(value: QuestDifficulty) {
  return ({
    EASY: 'ŁATWA',
    NORMAL: 'NORMALNA',
    HARD: 'TRUDNA',
    EXTREME: 'EKSTREMALNA',
  } as const)[value];
}

export function verificationPl(value: VerificationType) {
  return ({
    NONE: 'BRAK',
    TIMER: 'CZAS',
    GPS_DISTANCE: 'DYSTANS GPS',
    GPS_LOCATION: 'LOKALIZACJA',
    STEPS: 'KROKI',
    PHOTO: 'ZDJĘCIE',
    PHOTO_BEFORE_AFTER: 'ZDJĘCIE PRZED/PO',
    QR: 'KOD QR',
    NFC: 'NFC',
    HEALTH: 'DANE ZDROWOTNE',
    PARENT_APPROVAL: 'ZGODA OPIEKUNA',
    MULTI: 'WIELE ŹRÓDEŁ',
  } as const)[value] ?? value;
}

export function activityTypePl(value?: ActivityType) {
  if (!value) return 'BRAK';
  return ({
    WALK: 'MARSZ',
    RUN: 'BIEG',
    BIKE: 'ROWER',
    VEHICLE: 'POJAZD',
    STATIONARY: 'BRAK RUCHU',
    UNKNOWN: 'NIEROZPOZNANA',
  } as const)[value];
}

export function verdictPl(value?: Verdict) {
  if (!value) return 'POTWIERDZONE';
  return ({
    VERIFIED: 'POTWIERDZONE',
    SUSPICIOUS: 'WYMAGA UWAGI',
    REJECTED: 'ODRZUCONE',
  } as const)[value];
}

export function titlePl(value?: Title | string) {
  if (!value) return 'BEZ TYTUŁU';
  return ({
    UNAWAKENED: 'NIEPRZEBUDZONY',
    AWAKENED: 'PRZEBUDZONY',
    'SIGNAL HUNTER': 'ŁOWCA SYGNAŁÓW',
    PATHFINDER: 'ODKRYWCA',
    WALLBREAKER: 'POGROMCA MURU',
  } as Record<string, string>)[value] ?? value;
}

export function storyEventTypePl(value: string) {
  const known: Record<string, string> = {
    AWAKENING_COMPLETE: 'PRZEBUDZENIE UKOŃCZONE',
    WORLD_LINK_COMPLETE: 'POŁĄCZENIE ZE ŚWIATEM UKOŃCZONE',
    BOSS_STARTED: 'BOSS ROZPOCZĘTY',
    BOSS_COMPLETE: 'BOSS POKONANY',
    SIDE_QUEST_COMPLETE: 'MISJA POBOCZNA UKOŃCZONA',
    HIDDEN_QUEST_COMPLETE: 'UKRYTA MISJA UKOŃCZONA',
  };
  return known[value] ?? value.replaceAll('_', ' ');
}

export function syncStatusPl(value: string) {
  return ({
    RECEIVED: 'ODEBRANE',
    PROCESSING: 'PRZETWARZANE',
    PROCESSED: 'PRZETWORZONE',
    REJECTED: 'ODRZUCONE',
  } as Record<string, string>)[value] ?? value;
}
