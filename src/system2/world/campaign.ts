// SYSTEM 2.0 — MAIN QUEST / CAMPAIGN ENGINE
// Long-term campaign architecture with chapters

import type { Quest, QuestReward, QuestDifficulty, QuestCategory, SkillKey, QuestVerification } from '../core/types';
import type { QuestChain } from './questChain';

export type CampaignStatus = 'LOCKED' | 'ACTIVE' | 'COMPLETED' | 'FAILED';

export type ChapterStatus = 'LOCKED' | 'AVAILABLE' | 'ACTIVE' | 'COMPLETED';

export type MissionStatus = 'LOCKED' | 'AVAILABLE' | 'ACTIVE' | 'COMPLETED' | 'FAILED';

export type ObjectiveStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED';

export interface CampaignObjective {
  objectiveId: string;
  missionId: string;
  title: string;
  description: string;
  type: 'QUEST_COMPLETE' | 'SECTOR_DISCOVER' | 'LANDMARK_VISIT' | 'DISTANCE_WALK' | 'CACHE_FIND' | 'ANOMALY_INVESTIGATE' | 'BOSS_DEFEAT' | 'CHAIN_COMPLETE' | 'EXPEDITION_COMPLETE' | 'RANK_REACH' | 'AREA_COMPLETE';
  target: string | number;
  progress: number;
  status: ObjectiveStatus;
  requiredForCompletion: boolean;
  reward?: ObjectiveReward;
}

export interface ObjectiveReward {
  realXp: number;
  skillXp: Partial<Record<SkillKey, number>>;
  gameEnergy: number;
}

export interface CampaignMission {
  missionId: string;
  chapterId: string;
  order: number;
  title: string;
  description: string;
  objectives: CampaignObjective[];
  status: MissionStatus;
  unlockConditions: MissionUnlockCondition[];
  rewards: MissionReward[];
  chainId?: string;
  startedAt?: string;
  completedAt?: string;
}

export type MissionUnlockCondition =
  | { type: 'PREVIOUS_MISSION_COMPLETE' }
  | { type: 'CHAPTER_STARTED' }
  | { type: 'PLAYER_LEVEL'; minLevel: number }
  | { type: 'EXPLORER_RANK'; minRank: number }
  | { type: 'QUEST_CHAIN_COMPLETE'; chainId: string }
  | { type: 'SECTORS_DISCOVERED'; count: number }
  | { type: 'AREAS_COMPLETED'; count: number };

export interface MissionReward {
  rewardId: string;
  type: 'REAL_XP' | 'SKILL_XP' | 'GAME_ENERGY' | 'ITEM' | 'TITLE' | 'UNLOCK_CHAPTER' | 'UNLOCK_CHAIN' | 'UNLOCK_FEATURE';
  value: number | string;
  skillKey?: SkillKey;
  chapterId?: string;
  chainId?: string;
  claimed: boolean;
  claimedAt?: string;
}

export interface CampaignChapter {
  chapterId: string;
  campaignId: string;
  number: number;
  title: string;
  description: string;
  missions: CampaignMission[];
  status: ChapterStatus;
  unlockConditions: ChapterUnlockCondition[];
  rewards: ChapterReward[];
  startedAt?: string;
  completedAt?: string;
}

export type ChapterUnlockCondition =
  | { type: 'PREVIOUS_CHAPTER_COMPLETE' }
  | { type: 'PLAYER_LEVEL'; minLevel: number }
  | { type: 'EXPLORER_RANK'; minRank: number }
  | { type: 'MISSIONS_COMPLETED'; count: number }
  | { type: 'CHAINS_COMPLETED'; chainIds: string[] };

export interface ChapterReward {
  rewardId: string;
  type: 'REAL_XP' | 'SKILL_XP' | 'GAME_ENERGY' | 'TITLE' | 'UNLOCK_FEATURE' | 'UNLOCK_CHAIN';
  value: number | string;
  skillKey?: SkillKey;
  featureId?: string;
  chainId?: string;
  claimed: boolean;
  claimedAt?: string;
}

export interface Campaign {
  campaignId: string;
  name: string;
  description: string;
  chapters: CampaignChapter[];
  currentChapter: number;
  currentMission?: string;
  status: CampaignStatus;
  startedAt?: string;
  completedAt?: string;
  totalProgress: number;
  rewards: CampaignReward[];
  claimedRewards: string[];
  metadata: CampaignMetadata;
}

export interface CampaignReward {
  rewardId: string;
  type: 'REAL_XP' | 'SKILL_XP' | 'GAME_ENERGY' | 'TITLE' | 'UNLOCK_FEATURE';
  value: number | string;
  skillKey?: SkillKey;
  featureId?: string;
  claimed: boolean;
  claimedAt?: string;
}

export interface CampaignMetadata {
  difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'ELITE';
  estimatedDurationHours: number;
  minPlayerLevel: number;
  minExplorerRank: number;
  isMainCampaign: boolean;
}

export interface CampaignState {
  campaigns: Map<string, Campaign>;
  activeCampaignId?: string;
  completedCampaigns: string[];
  lastUpdatedAt: string;
}

export function createCampaignState(): CampaignState {
  return {
    campaigns: new Map(),
    completedCampaigns: [],
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function addCampaign(state: CampaignState, campaign: Campaign): CampaignState {
  const newState = { ...state, campaigns: new Map(state.campaigns) };
  newState.campaigns.set(campaign.campaignId, campaign);
  newState.lastUpdatedAt = new Date().toISOString();
  return newState;
}

export function getCampaign(state: CampaignState, campaignId: string): Campaign | undefined {
  return state.campaigns.get(campaignId);
}

export function getActiveCampaign(state: CampaignState): Campaign | undefined {
  if (!state.activeCampaignId) return undefined;
  return state.campaigns.get(state.activeCampaignId);
}

export function startCampaign(state: CampaignState, campaignId: string): CampaignState {
  const campaign = state.campaigns.get(campaignId);
  if (!campaign || campaign.status !== 'LOCKED') return state;

  const firstChapter = campaign.chapters.find(c => c.number === 0) || campaign.chapters[0];
  if (!firstChapter) return state;

  const newCampaign = {
    ...campaign,
    status: 'ACTIVE' as CampaignStatus,
    startedAt: new Date().toISOString(),
    currentChapter: firstChapter.number,
    currentMission: firstChapter.missions[0]?.missionId,
    chapters: campaign.chapters.map(c => ({
      ...c,
      status: c.number === firstChapter.number ? 'ACTIVE' as ChapterStatus : 'LOCKED' as ChapterStatus,
      missions: c.missions.map(m => ({
        ...m,
        status: m.order === 0 && c.number === firstChapter.number ? 'AVAILABLE' as MissionStatus : 'LOCKED' as MissionStatus,
      })),
    })),
  };

  const newState = { ...state, campaigns: new Map(state.campaigns), activeCampaignId: campaignId };
  newState.campaigns.set(campaignId, newCampaign);
  newState.lastUpdatedAt = new Date().toISOString();
  return newState;
}

export function advanceMission(state: CampaignState, campaignId: string, missionId: string): CampaignState {
  const campaign = state.campaigns.get(campaignId);
  if (!campaign || campaign.status !== 'ACTIVE') return state;

  const chapter = campaign.chapters.find(c => c.missions.some(m => m.missionId === missionId));
  if (!chapter) return state;

  const missionIndex = chapter.missions.findIndex(m => m.missionId === missionId);
  if (missionIndex === -1) return state;

  const mission = chapter.missions[missionIndex];
  if (mission.status !== 'COMPLETED') return state;

  const nextMissionIndex = missionIndex + 1;
  let newChapter = chapter;
  let newCurrentChapter = campaign.currentChapter;
  let newCurrentMission: string | undefined;

  if (nextMissionIndex >= chapter.missions.length) {
    const chapterIndex = campaign.chapters.findIndex(c => c.chapterId === chapter.chapterId);
    const nextChapterIndex = chapterIndex + 1;
    if (nextChapterIndex >= campaign.chapters.length) {
      return completeCampaign(state, campaignId);
    }
    const nextChapter = campaign.chapters[nextChapterIndex];
    newCurrentChapter = nextChapter.number;
    newCurrentMission = nextChapter.missions[0]?.missionId;
    newChapter = {
      ...chapter,
      status: 'COMPLETED' as ChapterStatus,
      completedAt: new Date().toISOString(),
      missions: chapter.missions.map(m => ({ ...m, status: 'COMPLETED' as MissionStatus })),
    };
  } else {
    newCurrentMission = chapter.missions[nextMissionIndex].missionId;
    newChapter = {
      ...chapter,
      missions: chapter.missions.map((m, i) => {
        if (i === missionIndex) return { ...m, status: 'COMPLETED' as MissionStatus, completedAt: new Date().toISOString() };
        if (i === nextMissionIndex) return { ...m, status: 'AVAILABLE' as MissionStatus };
        return m;
      }),
    };
  }

  const newCampaign = {
    ...campaign,
    currentChapter: newCurrentChapter,
    currentMission: newCurrentMission,
    chapters: campaign.chapters.map(c => c.chapterId === chapter.chapterId ? newChapter : c),
    totalProgress: calculateCampaignProgress(campaign.chapters.map(c => c.chapterId === chapter.chapterId ? newChapter : c)),
  };

  const newState = { ...state, campaigns: new Map(state.campaigns) };
  newState.campaigns.set(campaignId, newCampaign);
  newState.lastUpdatedAt = new Date().toISOString();
  return newState;
}

export function updateObjectiveProgress(
  state: CampaignState,
  campaignId: string,
  missionId: string,
  objectiveId: string,
  progress: number
): CampaignState {
  const campaign = state.campaigns.get(campaignId);
  if (!campaign) return state;

  const chapter = campaign.chapters.find(c => c.missions.some(m => m.missionId === missionId));
  if (!chapter) return state;

  const mission = chapter.missions.find(m => m.missionId === missionId);
  if (!mission) return state;

  const objectiveIndex = mission.objectives.findIndex(o => o.objectiveId === objectiveId);
  if (objectiveIndex === -1) return state;

  const objective = mission.objectives[objectiveIndex];
  const newObjective = {
    ...objective,
    progress: Math.min(progress, typeof objective.target === 'number' ? objective.target : 1),
    status: progress >= (typeof objective.target === 'number' ? objective.target : 1) ? 'COMPLETED' as ObjectiveStatus : 'ACTIVE' as ObjectiveStatus,
  };

  const allObjectivesComplete = mission.objectives.every((o, i) => i === objectiveIndex ? newObjective.status === 'COMPLETED' : o.status === 'COMPLETED');
  const newMissionStatus = allObjectivesComplete ? 'COMPLETED' as MissionStatus : mission.status;
  const newMission = {
    ...mission,
    objectives: mission.objectives.map((o, i) => i === objectiveIndex ? newObjective : o),
    status: newMissionStatus,
    completedAt: allObjectivesComplete ? new Date().toISOString() : mission.completedAt,
  };

  const newChapter = {
    ...chapter,
    missions: chapter.missions.map(m => m.missionId === missionId ? newMission : m),
    status: mission.status === 'COMPLETED' && chapter.missions.every(m => m.status === 'COMPLETED') ? 'COMPLETED' as ChapterStatus : chapter.status,
  };

  const newCampaign = {
    ...campaign,
    chapters: campaign.chapters.map(c => c.chapterId === chapter.chapterId ? newChapter : c),
    totalProgress: calculateCampaignProgress(campaign.chapters.map(c => c.chapterId === chapter.chapterId ? newChapter : c)),
  };

  const newState = { ...state, campaigns: new Map(state.campaigns) };
  newState.campaigns.set(campaignId, newCampaign);
  newState.lastUpdatedAt = new Date().toISOString();
  return newState;
}

export function completeCampaign(state: CampaignState, campaignId: string): CampaignState {
  const campaign = state.campaigns.get(campaignId);
  if (!campaign) return state;

  const newCampaign = {
    ...campaign,
    status: 'COMPLETED' as CampaignStatus,
    completedAt: new Date().toISOString(),
    currentChapter: campaign.chapters.length,
    currentMission: undefined,
    chapters: campaign.chapters.map(c => ({
      ...c,
      status: 'COMPLETED' as ChapterStatus,
      completedAt: c.completedAt || new Date().toISOString(),
      missions: c.missions.map(m => ({ ...m, status: 'COMPLETED' as MissionStatus, completedAt: m.completedAt || new Date().toISOString() })),
    })),
    totalProgress: 100,
  };

  const newState = { ...state, campaigns: new Map(state.campaigns), activeCampaignId: undefined };
  newState.campaigns.set(campaignId, newCampaign);
  newState.completedCampaigns = [...state.completedCampaigns, campaignId];
  newState.lastUpdatedAt = new Date().toISOString();
  return newState;
}

export function claimMissionReward(
  state: CampaignState,
  campaignId: string,
  missionId: string,
  rewardId: string
): { state: CampaignState; reward: MissionReward | null } {
  const campaign = state.campaigns.get(campaignId);
  if (!campaign) return { state, reward: null };

  const chapter = campaign.chapters.find(c => c.missions.some(m => m.missionId === missionId));
  if (!chapter) return { state, reward: null };

  const mission = chapter.missions.find(m => m.missionId === missionId);
  if (!mission) return { state, reward: null };

  const reward = mission.rewards.find(r => r.rewardId === rewardId);
  if (!reward || reward.claimed) return { state, reward: null };

  const updatedReward = { ...reward, claimed: true, claimedAt: new Date().toISOString() };
  const newMission = { ...mission, rewards: mission.rewards.map(r => r.rewardId === rewardId ? updatedReward : r) };
  const newChapter = { ...chapter, missions: chapter.missions.map(m => m.missionId === missionId ? newMission : m) };
  const newCampaign = { ...campaign, chapters: campaign.chapters.map(c => c.chapterId === chapter.chapterId ? newChapter : c) };

  const newState = { ...state, campaigns: new Map(state.campaigns) };
  newState.campaigns.set(campaignId, newCampaign);
  newState.lastUpdatedAt = new Date().toISOString();
  return { state: newState, reward: updatedReward };
}

export function claimChapterReward(
  state: CampaignState,
  campaignId: string,
  chapterId: string,
  rewardId: string
): { state: CampaignState; reward: ChapterReward | null } {
  const campaign = state.campaigns.get(campaignId);
  if (!campaign) return { state, reward: null };

  const chapter = campaign.chapters.find(c => c.chapterId === chapterId);
  if (!chapter) return { state, reward: null };

  const reward = chapter.rewards.find(r => r.rewardId === rewardId);
  if (!reward || reward.claimed) return { state, reward: null };

  const updatedReward = { ...reward, claimed: true, claimedAt: new Date().toISOString() };
  const newChapter = { ...chapter, rewards: chapter.rewards.map(r => r.rewardId === rewardId ? updatedReward : r) };
  const newCampaign = { ...campaign, chapters: campaign.chapters.map(c => c.chapterId === chapterId ? newChapter : c) };

  const newState = { ...state, campaigns: new Map(state.campaigns) };
  newState.campaigns.set(campaignId, newCampaign);
  newState.lastUpdatedAt = new Date().toISOString();
  return { state: newState, reward: updatedReward };
}

export function calculateCampaignProgress(chapters: CampaignChapter[]): number {
  if (chapters.length === 0) return 0;
  let totalMissions = 0;
  let completedMissions = 0;
  for (const chapter of chapters) {
    for (const mission of chapter.missions) {
      totalMissions++;
      if (mission.status === 'COMPLETED') completedMissions++;
    }
  }
  return totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;
}

export function isChapterUnlocked(campaign: Campaign, chapter: CampaignChapter, playerState: { level: number; explorerRank: number; completedMissions: number; completedChains: string[] }): boolean {
  if (chapter.status !== 'LOCKED') return true;
  for (const cond of chapter.unlockConditions) {
    switch (cond.type) {
      case 'PREVIOUS_CHAPTER_COMPLETE':
        const prevChapter = campaign.chapters.find(c => c.number === chapter.number - 1);
        if (!prevChapter || prevChapter.status !== 'COMPLETED') return false;
        break;
      case 'PLAYER_LEVEL':
        if (playerState.level < cond.minLevel) return false;
        break;
      case 'EXPLORER_RANK':
        if (playerState.explorerRank < cond.minRank) return false;
        break;
      case 'MISSIONS_COMPLETED':
        if (playerState.completedMissions < cond.count) return false;
        break;
      case 'CHAINS_COMPLETED':
        if (!cond.chainIds.every(id => playerState.completedChains.includes(id))) return false;
        break;
    }
  }
  return true;
}

export function isMissionUnlocked(chapter: CampaignChapter, mission: CampaignMission, playerState: { level: number; explorerRank: number; completedChains: string[] }): boolean {
  if (mission.status !== 'LOCKED') return true;
  for (const cond of mission.unlockConditions) {
    switch (cond.type) {
      case 'PREVIOUS_MISSION_COMPLETE':
        const prevMission = chapter.missions.find(m => m.order === mission.order - 1);
        if (!prevMission || prevMission.status !== 'COMPLETED') return false;
        break;
      case 'CHAPTER_STARTED':
        if (chapter.status !== 'ACTIVE' && chapter.status !== 'COMPLETED') return false;
        break;
      case 'PLAYER_LEVEL':
        if (playerState.level < cond.minLevel) return false;
        break;
      case 'EXPLORER_RANK':
        if (playerState.explorerRank < cond.minRank) return false;
        break;
      case 'QUEST_CHAIN_COMPLETE':
        if (!playerState.completedChains.includes(cond.chainId)) return false;
        break;
      case 'SECTORS_DISCOVERED':
        break;
      case 'AREAS_COMPLETED':
        break;
    }
  }
  return true;
}

export const MAIN_CAMPAIGN: Campaign = {
  campaignId: 'main_campaign',
  name: 'The Signal Protocol',
  description: 'Uncover the mystery behind the world signals and awaken your true potential.',
  chapters: [
    {
      chapterId: 'chapter_0',
      campaignId: 'main_campaign',
      number: 0,
      title: 'Chapter 0 — Awakening',
      description: 'First contact with the SYSTEM. Learn the basics of world exploration.',
      missions: [
        {
          missionId: 'c0_m1',
          chapterId: 'chapter_0',
          order: 0,
          title: 'First Steps',
          description: 'Complete the Awakening quest chain to understand the SYSTEM.',
          objectives: [
            { objectiveId: 'c0_m1_o1', missionId: 'c0_m1', title: 'Complete Awakening Chain', description: 'Finish all stages of the Awakening quest chain', type: 'CHAIN_COMPLETE', target: 'awakening', progress: 0, status: 'PENDING', requiredForCompletion: true },
          ],
          status: 'LOCKED',
          unlockConditions: [{ type: 'CHAPTER_STARTED' }],
          rewards: [
            { rewardId: 'c0_m1_r1', type: 'REAL_XP', value: 500, claimed: false },
            { rewardId: 'c0_m1_r2', type: 'GAME_ENERGY', value: 25, claimed: false },
          ],
          chainId: 'awakening',
        },
      ],
      status: 'LOCKED',
      unlockConditions: [],
      rewards: [
        { rewardId: 'c0_r1', type: 'TITLE', value: 'SIGNAL HUNTER', claimed: false },
        { rewardId: 'c0_r2', type: 'REAL_XP', value: 1000, claimed: false },
      ],
    },
    {
      chapterId: 'chapter_1',
      campaignId: 'main_campaign',
      number: 1,
      title: 'Chapter 1 — First Steps',
      description: 'Expand your known world and establish your presence.',
      missions: [
        {
          missionId: 'c1_m1',
          chapterId: 'chapter_1',
          order: 0,
          title: 'Sector Surveyor',
          description: 'Discover 10 new sectors in your region.',
          objectives: [
            { objectiveId: 'c1_m1_o1', missionId: 'c1_m1', title: 'Discover 10 Sectors', description: 'Enter and discover 10 new sectors', type: 'SECTOR_DISCOVER', target: 10, progress: 0, status: 'PENDING', requiredForCompletion: true, reward: { realXp: 200, skillXp: { RES: 100 }, gameEnergy: 15 } },
          ],
          status: 'LOCKED',
          unlockConditions: [{ type: 'PREVIOUS_MISSION_COMPLETE' }],
          rewards: [
            { rewardId: 'c1_m1_r1', type: 'REAL_XP', value: 500, claimed: false },
            { rewardId: 'c1_m1_r2', type: 'SKILL_XP', value: 200, skillKey: 'RES', claimed: false },
          ],
        },
        {
          missionId: 'c1_m2',
          chapterId: 'chapter_1',
          order: 1,
          title: 'Landmark Collector',
          description: 'Visit 5 discovered landmarks.',
          objectives: [
            { objectiveId: 'c1_m2_o1', missionId: 'c1_m2', title: 'Visit 5 Landmarks', description: 'Physically visit 5 different landmarks', type: 'LANDMARK_VISIT', target: 5, progress: 0, status: 'PENDING', requiredForCompletion: true, reward: { realXp: 300, skillXp: { CRE: 150 }, gameEnergy: 20 } },
          ],
          status: 'LOCKED',
          unlockConditions: [{ type: 'PREVIOUS_MISSION_COMPLETE' }],
          rewards: [
            { rewardId: 'c1_m2_r1', type: 'REAL_XP', value: 750, claimed: false },
            { rewardId: 'c1_m2_r2', type: 'SKILL_XP', value: 300, skillKey: 'CRE', claimed: false },
          ],
        },
        {
          missionId: 'c1_m3',
          chapterId: 'chapter_1',
          order: 2,
          title: 'Distance Walker',
          description: 'Walk 5km of verified distance.',
          objectives: [
            { objectiveId: 'c1_m3_o1', missionId: 'c1_m3', title: 'Walk 5km', description: 'Complete 5km of GPS-verified movement', type: 'DISTANCE_WALK', target: 5000, progress: 0, status: 'PENDING', requiredForCompletion: true, reward: { realXp: 400, skillXp: { VIT: 200 }, gameEnergy: 25 } },
          ],
          status: 'LOCKED',
          unlockConditions: [{ type: 'PREVIOUS_MISSION_COMPLETE' }],
          rewards: [
            { rewardId: 'c1_m3_r1', type: 'REAL_XP', value: 1000, claimed: false },
            { rewardId: 'c1_m3_r2', type: 'SKILL_XP', value: 400, skillKey: 'VIT', claimed: false },
          ],
        },
      ],
      status: 'LOCKED',
      unlockConditions: [
        { type: 'PREVIOUS_CHAPTER_COMPLETE' },
        { type: 'CHAINS_COMPLETED', chainIds: ['awakening'] },
      ],
      rewards: [
        { rewardId: 'c1_r1', type: 'TITLE', value: 'PATHFINDER', claimed: false },
        { rewardId: 'c1_r2', type: 'REAL_XP', value: 2000, claimed: false },
        { rewardId: 'c1_r3', type: 'UNLOCK_CHAIN', value: 'explorer_basics', chainId: 'explorer_basics', claimed: false },
      ],
    },
    {
      chapterId: 'chapter_2',
      campaignId: 'main_campaign',
      number: 2,
      title: 'Chapter 2 — Break the Limit',
      description: 'Push beyond your comfort zone and explore further.',
      missions: [
        {
          missionId: 'c2_m1',
          chapterId: 'chapter_2',
          order: 0,
          title: 'Area Explorer',
          description: 'Complete exploration of your first area.',
          objectives: [
            { objectiveId: 'c2_m1_o1', missionId: 'c2_m1', title: 'Complete Area', description: 'Achieve 100% discovery and exploration in one area', type: 'SECTOR_DISCOVER', target: 100, progress: 0, status: 'PENDING', requiredForCompletion: true },
          ],
          status: 'LOCKED',
          unlockConditions: [{ type: 'PREVIOUS_MISSION_COMPLETE' }],
          rewards: [
            { rewardId: 'c2_m1_r1', type: 'REAL_XP', value: 1500, claimed: false },
            { rewardId: 'c2_m1_r2', type: 'SKILL_XP', value: 500, skillKey: 'RES', claimed: false },
          ],
        },
        {
          missionId: 'c2_m2',
          chapterId: 'chapter_2',
          order: 1,
          title: 'Cache Hunter',
          description: 'Find and claim 10 caches of any tier.',
          objectives: [
            { objectiveId: 'c2_m2_o1', missionId: 'c2_m2', title: 'Find 10 Caches', description: 'Locate and claim 10 world caches', type: 'CACHE_FIND', target: 10, progress: 0, status: 'PENDING', requiredForCompletion: true },
          ],
          status: 'LOCKED',
          unlockConditions: [{ type: 'PREVIOUS_MISSION_COMPLETE' }],
          rewards: [
            { rewardId: 'c2_m2_r1', type: 'REAL_XP', value: 2000, claimed: false },
            { rewardId: 'c2_m2_r2', type: 'SKILL_XP', value: 600, skillKey: 'CRE', claimed: false },
          ],
        },
        {
          missionId: 'c2_m3',
          chapterId: 'chapter_2',
          order: 2,
          title: 'Anomaly Investigator',
          description: 'Investigate 3 anomalies and survive.',
          objectives: [
            { objectiveId: 'c2_m3_o1', missionId: 'c2_m3', title: 'Investigate 3 Anomalies', description: 'Complete 3 anomaly investigations', type: 'ANOMALY_INVESTIGATE', target: 3, progress: 0, status: 'PENDING', requiredForCompletion: true },
          ],
          status: 'LOCKED',
          unlockConditions: [{ type: 'PREVIOUS_MISSION_COMPLETE' }],
          rewards: [
            { rewardId: 'c2_m3_r1', type: 'REAL_XP', value: 2500, claimed: false },
            { rewardId: 'c2_m3_r2', type: 'SKILL_XP', value: 750, skillKey: 'INT', claimed: false },
          ],
        },
      ],
      status: 'LOCKED',
      unlockConditions: [
        { type: 'PREVIOUS_CHAPTER_COMPLETE' },
        { type: 'PLAYER_LEVEL', minLevel: 15 },
        { type: 'EXPLORER_RANK', minRank: 2 },
      ],
      rewards: [
        { rewardId: 'c2_r1', type: 'TITLE', value: 'EXPLORER', claimed: false },
        { rewardId: 'c2_r2', type: 'REAL_XP', value: 5000, claimed: false },
        { rewardId: 'c2_r3', type: 'UNLOCK_CHAIN', value: 'anomaly_mastery', chainId: 'anomaly_mastery', claimed: false },
      ],
    },
    {
      chapterId: 'chapter_3',
      campaignId: 'main_campaign',
      number: 3,
      title: 'Chapter 3 — Unknown Territory',
      description: 'Venture into the unknown and face greater challenges.',
      missions: [
        {
          missionId: 'c3_m1',
          chapterId: 'chapter_3',
          order: 0,
          title: 'Regional Pioneer',
          description: 'Complete 3 areas in your region.',
          objectives: [
            { objectiveId: 'c3_m1_o1', missionId: 'c3_m1', title: 'Complete 3 Areas', description: 'Fully explore 3 different areas', type: 'AREA_COMPLETE', target: 3, progress: 0, status: 'PENDING', requiredForCompletion: true },
          ],
          status: 'LOCKED',
          unlockConditions: [{ type: 'PREVIOUS_MISSION_COMPLETE' }],
          rewards: [
            { rewardId: 'c3_m1_r1', type: 'REAL_XP', value: 5000, claimed: false },
            { rewardId: 'c3_m1_r2', type: 'SKILL_XP', value: 1500, skillKey: 'RES', claimed: false },
          ],
        },
        {
          missionId: 'c3_m2',
          chapterId: 'chapter_3',
          order: 1,
          title: 'Boss Hunter',
          description: 'Defeat your first world boss.',
          objectives: [
            { objectiveId: 'c3_m2_o1', missionId: 'c3_m2', title: 'Defeat Boss', description: 'Locate and defeat a world boss entity', type: 'BOSS_DEFEAT', target: 1, progress: 0, status: 'PENDING', requiredForCompletion: true },
          ],
          status: 'LOCKED',
          unlockConditions: [{ type: 'PREVIOUS_MISSION_COMPLETE' }],
          rewards: [
            { rewardId: 'c3_m2_r1', type: 'REAL_XP', value: 7500, claimed: false },
            { rewardId: 'c3_m2_r2', type: 'SKILL_XP', value: 2000, skillKey: 'WIL', claimed: false },
            { rewardId: 'c3_m2_r3', type: 'TITLE', value: 'BOSS SLAYER', claimed: false },
          ],
        },
        {
          missionId: 'c3_m3',
          chapterId: 'chapter_3',
          order: 2,
          title: 'Long Expedition',
          description: 'Complete a 20km expedition.',
          objectives: [
            { objectiveId: 'c3_m3_o1', missionId: 'c3_m3', title: '20km Expedition', description: 'Complete a single expedition of 20km or more', type: 'EXPEDITION_COMPLETE', target: 20000, progress: 0, status: 'PENDING', requiredForCompletion: true },
          ],
          status: 'LOCKED',
          unlockConditions: [{ type: 'PREVIOUS_MISSION_COMPLETE' }],
          rewards: [
            { rewardId: 'c3_m3_r1', type: 'REAL_XP', value: 5000, claimed: false },
            { rewardId: 'c3_m3_r2', type: 'SKILL_XP', value: 2000, skillKey: 'VIT', claimed: false },
          ],
        },
      ],
      status: 'LOCKED',
      unlockConditions: [
        { type: 'PREVIOUS_CHAPTER_COMPLETE' },
        { type: 'PLAYER_LEVEL', minLevel: 30 },
        { type: 'EXPLORER_RANK', minRank: 4 },
        { type: 'CHAINS_COMPLETED', chainIds: ['anomaly_mastery'] },
      ],
      rewards: [
        { rewardId: 'c3_r1', type: 'TITLE', value: 'RANGER', claimed: false },
        { rewardId: 'c3_r2', type: 'REAL_XP', value: 10000, claimed: false },
        { rewardId: 'c3_r3', type: 'UNLOCK_CHAIN', value: 'boss_hunter', chainId: 'boss_hunter', claimed: false },
      ],
    },
    {
      chapterId: 'chapter_4',
      campaignId: 'main_campaign',
      number: 4,
      title: 'Chapter 4 — The Signal',
      description: 'The truth behind the signals is revealed.',
      missions: [
        {
          missionId: 'c4_m1',
          chapterId: 'chapter_4',
          order: 0,
          title: 'Signal Master',
          description: 'Reach and analyze 5 world signals.',
          objectives: [
            { objectiveId: 'c4_m1_o1', missionId: 'c4_m1', title: 'Analyze 5 Signals', description: 'Complete 5 signal investigations', type: 'QUEST_COMPLETE', target: 5, progress: 0, status: 'PENDING', requiredForCompletion: true },
          ],
          status: 'LOCKED',
          unlockConditions: [{ type: 'PREVIOUS_MISSION_COMPLETE' }],
          rewards: [
            { rewardId: 'c4_m1_r1', type: 'REAL_XP', value: 10000, claimed: false },
            { rewardId: 'c4_m1_r2', type: 'SKILL_XP', value: 3000, skillKey: 'INT', claimed: false },
          ],
        },
        {
          missionId: 'c4_m2',
          chapterId: 'chapter_4',
          order: 1,
          title: 'Rank Ascension',
          description: 'Reach Explorer Rank 6 (VANGUARD).',
          objectives: [
            { objectiveId: 'c4_m2_o1', missionId: 'c4_m2', title: 'Reach VANGUARD', description: 'Achieve Explorer Rank 6', type: 'RANK_REACH', target: 6, progress: 0, status: 'PENDING', requiredForCompletion: true },
          ],
          status: 'LOCKED',
          unlockConditions: [{ type: 'PREVIOUS_MISSION_COMPLETE' }],
          rewards: [
            { rewardId: 'c4_m2_r1', type: 'REAL_XP', value: 15000, claimed: false },
            { rewardId: 'c4_m2_r2', type: 'TITLE', value: 'VANGUARD', claimed: false },
          ],
        },
        {
          missionId: 'c4_m3',
          chapterId: 'chapter_4',
          order: 2,
          title: 'The Final Signal',
          description: 'Confront the source of the signals.',
          objectives: [
            { objectiveId: 'c4_m3_o1', missionId: 'c4_m3', title: 'Final Confrontation', description: 'Complete the final boss encounter', type: 'BOSS_DEFEAT', target: 1, progress: 0, status: 'PENDING', requiredForCompletion: true },
          ],
          status: 'LOCKED',
          unlockConditions: [{ type: 'PREVIOUS_MISSION_COMPLETE' }],
          rewards: [
            { rewardId: 'c4_m3_r1', type: 'REAL_XP', value: 25000, claimed: false },
            { rewardId: 'c4_m3_r2', type: 'TITLE', value: 'WAYFARER', claimed: false },
            { rewardId: 'c4_m3_r3', type: 'UNLOCK_FEATURE', value: 'endgame_content', featureId: 'endgame', claimed: false },
          ],
        },
      ],
      status: 'LOCKED',
      unlockConditions: [
        { type: 'PREVIOUS_CHAPTER_COMPLETE' },
        { type: 'PLAYER_LEVEL', minLevel: 50 },
        { type: 'EXPLORER_RANK', minRank: 5 },
        { type: 'CHAINS_COMPLETED', chainIds: ['boss_hunter'] },
      ],
      rewards: [
        { rewardId: 'c4_r1', type: 'TITLE', value: 'CARTOGRAPHER', claimed: false },
        { rewardId: 'c4_r2', type: 'REAL_XP', value: 50000, claimed: false },
        { rewardId: 'c4_r3', type: 'UNLOCK_FEATURE', value: 'true_endgame', featureId: 'true_endgame', claimed: false },
      ],
    },
  ],
  currentChapter: 0,
  status: 'LOCKED',
  totalProgress: 0,
  rewards: [
    { rewardId: 'campaign_complete', type: 'TITLE', value: 'SYSTEM MASTER', claimed: false },
    { rewardId: 'campaign_xp', type: 'REAL_XP', value: 100000, claimed: false },
  ],
  claimedRewards: [],
  metadata: {
    difficulty: 'NORMAL',
    estimatedDurationHours: 100,
    minPlayerLevel: 1,
    minExplorerRank: 0,
    isMainCampaign: true,
  },
};

export function createDefaultCampaignState(): CampaignState {
  const state = createCampaignState();
  return addCampaign(state, MAIN_CAMPAIGN);
}