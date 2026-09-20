import type {
  CampaignPlan,
  GameMasterContext,
  GameMasterPort,
  PlayerGoal,
} from './contracts';

function stableId(prefix: string, seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  return `${prefix}-${Math.abs(hash)}`;
}

export class LocalFallbackGameMaster implements GameMasterPort {
  async createCampaign(goal: PlayerGoal, context: GameMasterContext): Promise<CampaignPlan> {
    const base = Math.max(1, Math.min(5, Math.ceil(context.level / 10)));
    return {
      id: stableId('campaign', goal.id),
      goalId: goal.id,
      title: goal.title,
      summary: `Campaign for: ${goal.title}`,
      generatedAt: new Date().toISOString(),
      modelVersion: 'local-fallback-v1',
      quests: [
        {
          id: stableId('quest', `${goal.id}:start`),
          title: 'Start the mission',
          description: `Take one concrete step toward ${goal.title}.`,
          difficulty: base as 1 | 2 | 3 | 4 | 5,
          estimatedMinutes: 20,
          verification: 'self',
          xp: 50 + base * 10,
        },
      ],
    };
  }

  async adaptCampaign(plan: CampaignPlan): Promise<CampaignPlan> {
    return { ...plan, generatedAt: new Date().toISOString() };
  }
}
