export type BossStatus = 'LOCKED' | 'AVAILABLE' | 'ACTIVE' | 'DEFEATED';

export type BossDifficulty = 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';

export type Boss = {
  id: string;
  name: string;
  description: string;
  difficulty: BossDifficulty;
  maxHp: number;
  currentHp: number;
  rewardXp: number;
  rewardEnergy: number;
  unlockCondition: string | null;
  status: BossStatus;
  progress: number;
  startedAt: string | null;
  defeatedAt: string | null;
};

export type BossProgressModel = {
  boss: Boss;
  hpPercent: number;
  isActive: boolean;
  isDefeated: boolean;
  damageDealt: number;
};

export function createBoss(boss: Omit<Boss, 'currentHp' | 'status' | 'progress' | 'startedAt' | 'defeatedAt'>): Boss {
  return {
    ...boss,
    currentHp: boss.maxHp,
    status: 'LOCKED',
    progress: 0,
    startedAt: null,
    defeatedAt: null,
  };
}

export function buildBossProgressModel(boss: Boss): BossProgressModel {
  const hpPercent = boss.maxHp > 0 ? Math.max(0, Math.min(100, (boss.currentHp / boss.maxHp) * 100)) : 0;
  const damageDealt = boss.maxHp - boss.currentHp;

  return {
    boss,
    hpPercent,
    isActive: boss.status === 'ACTIVE',
    isDefeated: boss.status === 'DEFEATED',
    damageDealt,
  };
}

export function calculateBossDamage(
  boss: Boss,
  eventType: 'QUEST_COMPLETE' | 'DAILY_COMPLETE' | 'WEEKLY_COMPLETE' | 'VERIFIED_ACTIVITY',
  value: number = 1
): number {
  const baseDamage = {
    QUEST_COMPLETE: 15,
    DAILY_COMPLETE: 10,
    WEEKLY_COMPLETE: 25,
    VERIFIED_ACTIVITY: 5,
  }[eventType];

  const difficultyMultiplier = {
    TIER_1: 1.0,
    TIER_2: 0.7,
    TIER_3: 0.5,
    TIER_4: 0.3,
  }[boss.difficulty];

  return Math.round(baseDamage * difficultyMultiplier * value);
}

export function applyBossDamage(boss: Boss, damage: number): Boss {
  const newHp = Math.max(0, boss.currentHp - damage);
  const newProgress = Math.min(100, Math.round(((boss.maxHp - newHp) / boss.maxHp) * 100));
  const newStatus = newHp === 0 ? 'DEFEATED' : boss.status;

  return {
    ...boss,
    currentHp: newHp,
    progress: newProgress,
    status: newStatus,
    defeatedAt: newHp === 0 ? new Date().toISOString() : boss.defeatedAt,
  };
}

export function startBoss(boss: Boss): Boss {
  return {
    ...boss,
    status: 'ACTIVE',
    startedAt: new Date().toISOString(),
  };
}

export function canUnlockBoss(boss: Boss, playerState: {
  awakeningCompleted: boolean;
  worldLinkComplete: boolean;
  dailyClear: boolean;
  dailyClockAnomaly: boolean;
}): boolean {
  if (boss.unlockCondition === 'AWAKENING_COMPLETE') {
    return playerState.awakeningCompleted;
  }
  if (boss.unlockCondition === 'WORLD_LINK_COMPLETE') {
    return playerState.worldLinkComplete && !playerState.dailyClockAnomaly;
  }
  if (boss.unlockCondition === 'DAILY_CLEAR') {
    return playerState.dailyClear;
  }
  return false;
}