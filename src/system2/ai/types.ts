export type AIQuestCategory =
  | 'fitness'
  | 'health'
  | 'productivity'
  | 'learning'
  | 'exploration'
  | 'social'
  | 'recovery';

export type AIQuestDifficulty = 'easy' | 'medium' | 'hard';
export type AIQuestVerification = 'manual' | 'timer' | 'gps';

export interface AIQuestProposal {
  key: string;
  title: string;
  description: string;
  category: AIQuestCategory;
  difficulty: AIQuestDifficulty;
  verification: AIQuestVerification;
  estimatedMinutes: number;
  templateHint?: string;
  target?: {
    kind: 'minutes' | 'meters' | 'count';
    value: number;
  };
  reason: string;
  expiresInHours: number;
  tags: string[];
}

export interface RecentQuestSummary {
  title: string;
  description?: string;
  category?: string;
  difficulty?: string;
  completed?: boolean;
  failed?: boolean;
  createdAt?: string;
}

export interface PlayerGoalSummary {
  id: string;
  title: string;
  description?: string;
  progress?: number;
}

export interface AIGameMasterContext {
  player: {
    level: number;
    rank: string;
    streak: number;
    completionRate7d: number;
    systemDebt: 0 | 1 | 2 | 3;
    locale?: string;
    timezone?: string;
  };
  goals: PlayerGoalSummary[];
  recentQuests: RecentQuestSummary[];
  nowIso?: string;
}

export interface AIDirectorDecision {
  mode: 'normal' | 'recovery' | 'challenge';
  difficultyBias: -1 | 0 | 1;
  headline: string;
  message: string;
}

export interface AIGameMasterResponse {
  quests: AIQuestProposal[];
  director: AIDirectorDecision;
  briefing: string;
  source: 'ai' | 'fallback';
  model?: string;
}
