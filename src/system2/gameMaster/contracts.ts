export type GoalDomain = 'fitness' | 'learning' | 'career' | 'finance' | 'wellbeing' | 'custom';

export interface PlayerGoal {
  id: string;
  title: string;
  domain: GoalDomain;
  target?: string;
  deadline?: string;
  constraints: string[];
}

export interface GeneratedQuest {
  id: string;
  title: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedMinutes: number;
  verification: 'self' | 'health' | 'location' | 'photo';
  xp: number;
}

export interface CampaignPlan {
  id: string;
  goalId: string;
  title: string;
  summary: string;
  quests: GeneratedQuest[];
  generatedAt: string;
  modelVersion: string;
}

export interface GameMasterContext {
  level: number;
  streakDays: number;
  recentCompletionRate: number;
  locale: string;
}

export interface GameMasterPort {
  createCampaign(goal: PlayerGoal, context: GameMasterContext): Promise<CampaignPlan>;
  adaptCampaign(plan: CampaignPlan, context: GameMasterContext): Promise<CampaignPlan>;
}
