export type GoalDomain = 'fitness' | 'learning' | 'career' | 'finance' | 'social' | 'wellbeing' | 'custom';

export interface PlayerGoal {
  id: string;
  title: string;
  description?: string;
  domain: GoalDomain;
}

export interface GeneratedQuest {
  id: string;
  title: string;
  description: string;
  domain: GoalDomain;
  difficulty: number;
  xpReward: number;
  verification: 'none' | 'self' | 'activity';
}

export interface CampaignPlan {
  id: string;
  goalId: string;
  title: string;
  generatedAt: string;
  modelVersion: string;
  quests: GeneratedQuest[];
}

export interface GameMasterContext {
  playerLevel: number;
  locale?: string;
  recentQuestIds?: string[];
}

export interface GameMasterPort {
  generateCampaign(goal: PlayerGoal, context: GameMasterContext): Promise<CampaignPlan>;
}
