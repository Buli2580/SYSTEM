export type PresentationEventType =
  | 'SYSTEM_BOOT'
  | 'SYSTEM_READY'
  | 'QUEST_DISCOVERED'
  | 'QUEST_ACCEPTED'
  | 'QUEST_STARTED'
  | 'QUEST_COMPLETE'
  | 'QUEST_FAILED'
  | 'XP_GAIN'
  | 'LEVEL_UP'
  | 'REWARD_RECEIVED'
  | 'STREAK_UPDATED'
  | 'STREAK_MILESTONE'
  | 'SECTOR_DISCOVERED'
  | 'WARNING'
  | 'BOSS_APPEARED'
  | 'BOSS_PHASE_CHANGED'
  | 'BOSS_DAMAGE'
  | 'BOSS_DEFEATED'
  | 'DAILY_COMPLETED'
  | 'WEEKLY_COMPLETED'
  | 'SECTOR_DISCOVERED'
  | 'SYSTEM_WARNING'
  | 'SYSTEM_ERROR';

export interface PresentationEventData {
  type: PresentationEventType;
  payload?: Record<string, unknown>;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timestamp: number;
}

export type PresentationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface PresentationEventHandler {
  (event: PresentationEventData): void;
}

export interface PresentationQueueItem {
  event: PresentationEventData;
  resolve: () => void;
}

export interface PresentationQueue {
  enqueue(item: PresentationQueueItem): void;
  dequeue(): PresentationQueueItem | undefined;
  peek(): PresentationQueueItem | undefined;
  size(): number;
  clear(): void;
}

function createPriorityQueue(): PresentationQueue {
  const queue: PresentationQueueItem[] = [];

  return {
    enqueue(item: PresentationQueueItem) {
      queue.push(item);
      queue.sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        return priorityOrder[a.event.priority] - priorityOrder[b.event.priority];
      });
    },
    dequeue() {
      return queue.shift();
    },
    peek() {
      return queue[0];
    },
    size() {
      return queue.length;
    },
    clear() {
      queue.length = 0;
    },
  };
}

export const presentationQueue = createPriorityQueue();

export const presentationEventBus = {
  handlers: new Map<PresentationEventType | '*', PresentationEventHandler[]>(),
  
  subscribe(type: PresentationEventType | '*', handler: PresentationEventHandler) {
    const handlers = this.handlers.get(type) || [];
    handlers.push(handler);
    this.handlers.set(type, handlers);
    return () => this.unsubscribe(type, handler);
  },
  
  unsubscribe(type: PresentationEventType | '*', handler: PresentationEventHandler) {
    const handlers = this.handlers.get(type) || [];
    const index = handlers.indexOf(handler);
    if (index !== -1) handlers.splice(index, 1);
  },
  
  emit(event: PresentationEventData) {
    const handlers = this.handlers.get(event.type) || [];
    for (const handler of handlers) {
      try {
        handler(event);
      } catch (error) {
        console.error(`Presentation event handler error for ${event.type}:`, error);
      }
    }
    const wildcardHandlers = this.handlers.get('*') || [];
    for (const handler of wildcardHandlers) {
      try {
        handler(event);
      } catch (error) {
        console.error(`Wildcard presentation event handler error:`, error);
      }
    }
  },
  
  onAny(handler: PresentationEventHandler) {
    return this.subscribe('*', handler);
  },
};

export function createPresentationEvent(
  type: PresentationEventType,
  payload?: Record<string, unknown>,
  priority: PresentationPriority = 'normal'
): PresentationEventData {
  return {
    type,
    payload,
    priority,
    timestamp: Date.now(),
  };
}

export const PresentationEventPresets = {
  systemBoot: () => createPresentationEvent('SYSTEM_BOOT', undefined, 'critical'),
  systemReady: () => createPresentationEvent('SYSTEM_READY', undefined, 'high'),
  
  questDiscovered: (questId: string, questTitle: string) => 
    createPresentationEvent('QUEST_DISCOVERED', { questId, questTitle }, 'high'),
  questAccepted: (questId: string, questTitle: string) => 
    createPresentationEvent('QUEST_ACCEPTED', { questId, questTitle }, 'high'),
  questStarted: (questId: string, questTitle: string) => 
    createPresentationEvent('QUEST_STARTED', { questId, questTitle }, 'high'),
  questComplete: (questId: string, questTitle: string, reward: unknown) => 
    createPresentationEvent('QUEST_COMPLETE', { questId, questTitle, reward }, 'critical'),
  questFailed: (questId: string, reason: string) => 
    createPresentationEvent('QUEST_FAILED', { questId, reason }, 'high'),
  
  xpGain: (amount: number, source: string) => 
    createPresentationEvent('XP_GAIN', { amount, source }, 'normal'),
  levelUp: (oldLevel: number, newLevel: number, rank: string) => 
    createPresentationEvent('LEVEL_UP', { oldLevel, newLevel, rank }, 'critical'),
  rewardReceived: (reward: unknown) => 
    createPresentationEvent('REWARD_RECEIVED', { reward }, 'high'),
  
  streakUpdated: (currentStreak: number) => 
    createPresentationEvent('STREAK_UPDATED', { currentStreak }, 'normal'),
  streakMilestone: (milestone: number) => 
    createPresentationEvent('STREAK_MILESTONE', { milestone }, 'high'),
  
  sectorDiscovered: (sectorId: string) => 
    createPresentationEvent('SECTOR_DISCOVERED', { sectorId }, 'normal'),
  warning: (message: string, code?: string) => 
    createPresentationEvent('WARNING', { message, code }, 'high'),
  
  bossAppeared: (bossId: string, bossName: string) => 
    createPresentationEvent('BOSS_APPEARED', { bossId, bossName }, 'critical'),
  bossPhaseChanged: (bossId: string, phase: number, phaseName: string) => 
    createPresentationEvent('BOSS_PHASE_CHANGED', { bossId, phase, phaseName }, 'high'),
  bossDamage: (bossId: string, damage: number, remainingHp: number) => 
    createPresentationEvent('BOSS_DAMAGE', { bossId, damage, remainingHp }, 'normal'),
  bossDefeated: (bossId: string, bossName: string, reward: unknown) => 
    createPresentationEvent('BOSS_DEFEATED', { bossId, bossName, reward }, 'critical'),
  
  dailyCompleted: (dayStreak: number) => 
    createPresentationEvent('DAILY_COMPLETED', { dayStreak }, 'high'),
  weeklyCompleted: (weekStreak: number) => 
    createPresentationEvent('WEEKLY_COMPLETED', { weekStreak }, 'high'),
  
  systemWarning: (message: string, code?: string) => 
    createPresentationEvent('SYSTEM_WARNING', { message, code }, 'high'),
  systemError: (message: string, code?: string) => 
    createPresentationEvent('SYSTEM_ERROR', { message, code }, 'critical'),
};