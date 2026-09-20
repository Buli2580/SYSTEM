import type { GoalInput, GoalCategory, PlayerGoal } from '../goals/model';
import type { GoalCampaign } from './planner';

const CATEGORY_MAP: Record<GoalCampaign['category'], GoalCategory> = {
  FITNESS: 'FITNESS',
  LEARNING: 'LEARNING',
  CAREER: 'PRODUCTIVITY',
  MONEY: 'PRODUCTIVITY',
  LIFE: 'GENERAL',
};

function normalize(text: string) {
  return text.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function campaignGoalToInput(campaign: GoalCampaign): GoalInput {
  const title = campaign.goal.trim().replace(/\s+/g, ' ').slice(0, 80);
  return {
    category: CATEGORY_MAP[campaign.category],
    title,
    description: 'Cel utworzony z podglądu AI Game Master. ' + campaign.title.slice(0, 300),
    priority: 2,
    target: undefined,
    targetDate: undefined,
  };
}

export function campaignGoalAlreadyExists(
  campaign: GoalCampaign,
  goals: readonly PlayerGoal[],
) {
  const title = normalize(campaignGoalToInput(campaign).title);
  return goals.some(goal => goal.status !== 'COMPLETED' && normalize(goal.title) === title);
}
