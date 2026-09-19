// SYSTEM 2.0 — GAME MASTER ENGINE
// Local deterministic recommendation engine

import type { GameMasterContext, QuestDifficulty, Goal, GoalType } from './types';
import type { RunnableQuest } from '../quests/types';
import { getQuest, QUESTS, AWAKENING_QUESTS, getQuestStatus } from '../quests/catalog';
import { DAILY_TEMPLATES, generateDaily } from '../daily/templates';

export interface RecommendationResult {
  recommendedAction: string;
  reason: string;
  priority: number;
  goalAssociation: string | null;
  suggestedDifficulty: QuestDifficulty;
  questId?: string;
  estimatedTimeMinutes: number;
}

function mapGoalDifficultyToQuest(goalDifficulty: string): QuestDifficulty {
  switch (goalDifficulty) {
    case 'EASY': return 'EASY';
    case 'NORMAL': return 'NORMAL';
    case 'HARD': return 'HARD';
    case 'EXTREME': return 'EXTREME';
    default: return 'NORMAL';
  }
}

function getAvailableQuests(context: GameMasterContext): RunnableQuest[] {
  const available: RunnableQuest[] = [];
  
  for (const quest of QUESTS) {
    if (quest.category === 'DAILY') continue;
    if (quest.category === 'BOSS') continue;
    const status = getQuestStatus(quest.id, context.completedQuestIds);
    if (status === 'AVAILABLE' || status === 'ACTIVE') {
      available.push(quest);
    }
  }

  if (context.daily) {
    for (const questId of context.daily.questIds) {
      if (!context.completedQuestIds.includes(questId)) {
        const quest = getQuest(questId);
        if (quest) available.push(quest);
      }
    }
  }

  return available;
}

function findQuestsForGoalType(goalType: GoalType, availableQuests: RunnableQuest[], playerLevel: number): RunnableQuest[] {
  const taggedQuests: Record<GoalType, string[]> = {
    FITNESS: ['first_movement_v1', 'walk_protocol_1', 'run_protocol_1', 'ride_protocol_1', 'field_test_walk_500m', 'field_test_walk_1km', 'field_test_multi_500m_5min'],
    WEIGHT_LOSS: ['first_movement_v1', 'walk_protocol_1', 'run_protocol_1', 'ride_protocol_1', 'field_test_walk_500m', 'field_test_walk_1km', 'field_test_multi_500m_5min'],
    WALK_MORE: ['first_movement_v1', 'walk_protocol_1', 'field_test_walk_500m', 'field_test_walk_1km'],
    RUNNING: ['run_protocol_1', 'field_test_walk_1km', 'field_test_multi_500m_5min'],
    STRENGTH: ['first_movement_v1', 'focus_protocol_v1', 'final_trial_v1'],
    DISCIPLINE: ['focus_protocol_v1', 'focus_session', 'final_trial_v1', 'field_test_timer_10min'],
    FOCUS: ['focus_protocol_v1', 'focus_session', 'field_test_timer_10min'],
    LEARNING: ['learn_something', 'final_trial_v1'],
    STUDY: ['learn_something', 'focus_session'],
    PRODUCTIVITY: ['create', 'organize', 'focus_session', 'final_trial_v1'],
    SAVING_MONEY: ['organize', 'learn_something'],
    HABIT: ['focus_session', 'learn_something', 'create', 'organize', 'walk_protocol_1'],
    CUSTOM: ['focus_session', 'learn_something', 'walk_protocol_1', 'create', 'organize'],
  };

  const questIds = taggedQuests[goalType] ?? taggedQuests.CUSTOM;
  const matched = questIds
    .map(id => availableQuests.find(q => q.id === id))
    .filter((q): q is RunnableQuest => q !== undefined);

  return matched.length > 0 ? matched : availableQuests.filter(q => q.difficulty === 'EASY' || q.difficulty === 'NORMAL');
}

function scoreQuestForGoal(quest: RunnableQuest, goal: Goal, context: GameMasterContext): number {
  let score = 0;

  if (quest.primarySkill === 'VIT' && ['FITNESS', 'WEIGHT_LOSS', 'WALK_MORE', 'RUNNING', 'STRENGTH'].includes(goal.type)) score += 30;
  if (quest.primarySkill === 'WIL' && ['DISCIPLINE', 'FOCUS', 'PRODUCTIVITY', 'HABIT'].includes(goal.type)) score += 30;
  if (quest.primarySkill === 'INT' && ['LEARNING', 'STUDY'].includes(goal.type)) score += 30;
  if (quest.primarySkill === 'CRE' && ['PRODUCTIVITY', 'HABIT'].includes(goal.type)) score += 20;
  if (quest.primarySkill === 'RES' && ['PRODUCTIVITY', 'SAVING_MONEY', 'HABIT'].includes(goal.type)) score += 20;

  const difficultyMatch = mapGoalDifficultyToQuest(goal.difficulty);
  if (quest.difficulty === difficultyMatch) score += 20;
  else if (Math.abs(['EASY', 'NORMAL', 'HARD', 'EXTREME'].indexOf(quest.difficulty) - ['EASY', 'NORMAL', 'HARD', 'EXTREME'].indexOf(difficultyMatch)) === 1) score += 10;

  if (context.completedQuestIds.includes(quest.id)) score -= 50;

  if (quest.category === 'DAILY') score += 15;

  if (quest.verification.type === 'TIMER' && goal.preferredTimeCommitment > 0) {
    const questDuration = quest.verification.minimumDurationSeconds / 60;
    if (questDuration <= goal.preferredTimeCommitment + 5) score += 10;
  }

  if (goal.linkedQuestIds.includes(quest.id)) score += 25;

  const recentCompletions = context.recentQuestHistory.filter(h => h.questId === quest.id).length;
  if (recentCompletions > 2) score -= 10;

  return score;
}

export function recommendNextAction(context: GameMasterContext): RecommendationResult {
  const primaryGoal = context.primaryGoal;
  const playerLevel = context.player.realLevel;

  if (!primaryGoal) {
    const availableQuests = getAvailableQuests(context);
    const easyQuests = availableQuests.filter(q => q.difficulty === 'EASY');
    const fallbackQuest = easyQuests[0] ?? availableQuests[0];
    
    if (fallbackQuest) {
      return {
        recommendedAction: `Start "${fallbackQuest.title}"`,
        reason: 'No primary goal set. Begin with an accessible quest to build momentum.',
        priority: 50,
        goalAssociation: null,
        suggestedDifficulty: 'EASY',
        questId: fallbackQuest.id,
        estimatedTimeMinutes: fallbackQuest.verification.type === 'TIMER' 
          ? Math.ceil(fallbackQuest.verification.minimumDurationSeconds / 60)
          : Math.ceil((fallbackQuest.verification.minimumDistanceMeters ?? 0) / 100),
      };
    }

    return {
      recommendedAction: 'Complete Awakening chapter',
      reason: 'No quests available. Progress through the Awakening chapter to unlock more content.',
      priority: 40,
      goalAssociation: null,
      suggestedDifficulty: 'EASY',
      estimatedTimeMinutes: 10,
    };
  }

  const availableQuests = getAvailableQuests(context);
  const goalQuests = findQuestsForGoalType(primaryGoal.type as GoalType, availableQuests, playerLevel);

  if (goalQuests.length === 0) {
    const fallbackQuest = availableQuests.find(q => q.difficulty === 'EASY') ?? availableQuests[0];
    if (fallbackQuest) {
      return {
        recommendedAction: `Start "${fallbackQuest.title}"`,
        reason: `No specific quests matched ${primaryGoal.type}. Trying a compatible alternative.`,
        priority: 40,
        goalAssociation: primaryGoal.id,
        suggestedDifficulty: mapGoalDifficultyToQuest(primaryGoal.difficulty),
        questId: fallbackQuest.id,
        estimatedTimeMinutes: fallbackQuest.verification.type === 'TIMER' 
          ? Math.ceil(fallbackQuest.verification.minimumDurationSeconds / 60)
          : Math.ceil((fallbackQuest.verification.minimumDistanceMeters ?? 0) / 100),
      };
    }
  }

  const scoredQuests = goalQuests.map(q => ({
    quest: q,
    score: scoreQuestForGoal(q, primaryGoal, context),
  })).sort((a, b) => b.score - a.score);

  const best = scoredQuests[0];
  if (!best) {
    return {
      recommendedAction: 'Review available quests',
      reason: 'No suitable quest found for current goal.',
      priority: 30,
      goalAssociation: primaryGoal.id,
      suggestedDifficulty: mapGoalDifficultyToQuest(primaryGoal.difficulty),
      estimatedTimeMinutes: 10,
    };
  }

  const { quest, score } = best;
  const actionName = `Start "${quest.title}"`;
  const timeEstimate = quest.verification.type === 'TIMER' 
    ? Math.ceil(quest.verification.minimumDurationSeconds / 60)
    : Math.ceil((quest.verification.minimumDistanceMeters ?? 0) / 100);

  let reason = '';
  switch (primaryGoal.type) {
    case 'FITNESS':
    case 'WEIGHT_LOSS':
    case 'WALK_MORE':
    case 'RUNNING':
    case 'STRENGTH':
      reason = `Movement quest aligned with ${primaryGoal.type.toLowerCase()} goal. ${quest.description}`;
      break;
    case 'DISCIPLINE':
    case 'FOCUS':
      reason = `Focus session supports ${primaryGoal.type.toLowerCase()} goal. ${quest.description}`;
      break;
    case 'LEARNING':
    case 'STUDY':
      reason = `Learning activity supports ${primaryGoal.type.toLowerCase()} goal. ${quest.description}`;
      break;
    case 'PRODUCTIVITY':
      reason = `Productivity quest aligned with ${primaryGoal.type.toLowerCase()} goal. ${quest.description}`;
      break;
    case 'SAVING_MONEY':
      reason = `Organization/learning quest supports financial discipline. ${quest.description}`;
      break;
    case 'HABIT':
      reason = `Habit-building quest for ${primaryGoal.type.toLowerCase()} goal. ${quest.description}`;
      break;
    case 'CUSTOM':
      reason = `Generic progression action for custom goal. ${quest.description}`;
      break;
    default:
      reason = `Recommended quest for ${primaryGoal.title}. ${quest.description}`;
  }

  const priority = Math.min(100, Math.max(10, 50 + Math.floor(score / 5)));

  return {
    recommendedAction: actionName,
    reason,
    priority,
    goalAssociation: primaryGoal.id,
    suggestedDifficulty: mapGoalDifficultyToQuest(primaryGoal.difficulty),
    questId: quest.id,
    estimatedTimeMinutes: timeEstimate,
  };
}

export function getGoalSpecificRecommendations(goal: Goal, context: GameMasterContext): RunnableQuest[] {
  const availableQuests = getAvailableQuests(context);
  return findQuestsForGoalType(goal.type as GoalType, availableQuests, context.player.realLevel);
}

export function recommendQuestForGoal(goal: Goal, context: GameMasterContext): RunnableQuest | null {
  const availableQuests = getAvailableQuests(context);
  const goalQuests = findQuestsForGoalType(goal.type as GoalType, availableQuests, context.player.realLevel);
  
  if (goalQuests.length === 0) return null;

  const scored = goalQuests.map(q => ({
    quest: q,
    score: scoreQuestForGoal(q, goal, context),
  })).sort((a, b) => b.score - a.score);

  return scored[0]?.quest ?? null;
}