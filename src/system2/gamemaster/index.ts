// SYSTEM 2.0 — GAME MASTER
// Local deterministic Game Master engine

export * from './types';
export * from './context';
export * from './engine';
export * from './adaptation';

import { buildGameMasterContext } from './context';
import { recommendNextAction, type RecommendationResult } from './engine';
import type { GameMasterContext } from './types';

export async function getNextActionRecommendation(): Promise<RecommendationResult> {
  const context = await buildGameMasterContext();
  return recommendNextAction(context);
}

export async function getContext(): Promise<GameMasterContext> {
  return buildGameMasterContext();
}