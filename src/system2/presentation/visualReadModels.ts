import type { useSystem } from '../state/SystemProvider';
import type { QuestCheckpoint } from '../storage/database';
import type { CloudSession } from '../cloud/auth';
import type { WorldTrackingState } from '../world/tracking';
import type { ActiveSkillNodes } from '../progression/skillTreeStorage';
import type { EquippedInventory } from '../inventory/storage';
import { awakeningQuestsForPlayer, getQuest } from '../quests/catalog';
import { questAvailability } from '../quests/availability';
import { QUESTS } from '../quests/catalog';
import { presentedCharacterStats } from '../core/inventory';
import { buildSystemCard } from '../cards/engine';
import { skillTreeState } from '../progression/skillTree2';

/** Compile-time read-only views of canonical objects; no clones, writes or extra store. */
export type ReadView<T> = T extends object ? {readonly [K in keyof T]: ReadView<T[K]>} : T;
export type VisualReadSource = Pick<ReturnType<typeof useSystem>,
  'player'|'ready'|'error'|'activeQuestId'|'completedQuestIds'|'failedQuestIds'|
  'inventory'|'domain'|'daily'|'story'|'progression'|'titles'|'awakeningCompleted'|
  'worldUnlocked'|'aiGameMaster'|'aiLoading'|'aiError'|'recentAttempts'|'recentActivity'|
  'goals'|'journeys'|'socialSessions'|'gameLoop'>;
export type CloudAuthObservation = {
  loaded: boolean; session: Pick<CloudSession,'user'> | null; error: string | null;
};
export type QuestReadOptions = {
  /** Fill only from existing database.getQuestAccess(id); absence means not checked. */
  bossAccess?: Readonly<Record<string,boolean>>;
  /** Already loaded by loadQuestCheckpoint/loadResumableQuestCheckpoint. */
  checkpoint?: QuestCheckpoint | null;
};
export type CharacterReadExtras = {
  activeSkillNodes?: ActiveSkillNodes;
  legacyEquipped?: EquippedInventory;
  activeCompanion?: string | null;
};
const health = (source: VisualReadSource) => ({ready:source.ready,error:source.error});

export function selectHomeReadModel(source: VisualReadSource): ReadView<{
  ready:boolean;error:string|null;profile:VisualReadSource['player'];
  level:number;xp:number;xpToNextLevel:number;totalXp:number;energy:number;streak:number;
  activeMission:ReturnType<typeof getQuest>|null;domain:VisualReadSource['domain'];
  loop:VisualReadSource['gameLoop']['state'];
}> {
  const player=source.player;
  return {...health(source),profile:player,level:player.realLevel,xp:player.realXp,
    xpToNextLevel:player.realXpToNextLevel,totalXp:player.totalRealXp,
    energy:player.gameEnergy,streak:player.streak,
    activeMission:source.activeQuestId ? getQuest(source.activeQuestId,source.story?.boss?.difficulty)??null : null,
    domain:source.domain,loop:source.gameLoop.state};
}

/** Catalog definitions plus existing access rules. Completion still rechecks SQLite. */
function questRows(source: VisualReadSource, options: QuestReadOptions) {
  const ids=new Set([
    ...awakeningQuestsForPlayer(source.player.birthDate).map(q=>q.id),
    ...QUESTS.filter(q=>q.category==='BOSS').map(q=>q.id),
    ...(source.daily?.questIds??[]),
    ...(source.activeQuestId?[source.activeQuestId]:[]),
  ]);
  return [...ids].flatMap(id=>{
    const quest=getQuest(id,source.story?.boss?.difficulty);
    if(!quest)return [];
    const access=questAvailability(id,{
      completedQuestIds:source.completedQuestIds,activeQuestId:source.activeQuestId,
      failedQuestId:source.failedQuestIds?.includes(id)?id:null,daily:source.daily,
      bossAccessible:options.bossAccess?.[id]??false,
    });
    return [{quest,access,
      accessKnown:quest.category!=='BOSS'||access.status==='COMPLETED'||options.bossAccess?.[id]!==undefined,
      conditions:quest.verification,rewards:quest.rewards,
      checkpoint:options.checkpoint?.questId===id?options.checkpoint:null,
      progress:options.checkpoint?.questId===id
        ? quest.verification.type==='TIMER'?options.checkpoint.durationSeconds:options.checkpoint.distanceMeters
        : quest.progress,
      progressSource:options.checkpoint?.questId===id?'CHECKPOINT' as const:'DEFINITION' as const,
      progressTarget:quest.progressTarget}];
  });
}
function questModel(source: VisualReadSource,options: QuestReadOptions) {
  const missions=questRows(source,options);
  return {...health(source),missions,
    activeMission:missions.find(row=>row.quest.id===source.activeQuestId)??null,
    availableMissions:missions.filter(row=>row.accessKnown&&row.access.status==='AVAILABLE'),
    completedQuestIds:source.completedQuestIds,
    daily:source.daily,weekly:source.daily,weeklyChallenges:source.progression?.weeklyChallenges??null,
    story:source.story,history:source.recentAttempts,recentActivity:source.recentActivity,
    director:{response:source.aiGameMaster,loading:source.aiLoading,error:source.aiError},
    goals:source.goals,journeys:source.journeys};
}
export function selectQuestReadModel(source: VisualReadSource,options: QuestReadOptions={}): ReadView<ReturnType<typeof questModel>> {
  return questModel(source,options);
}
function characterModel(source: VisualReadSource,extras: CharacterReadExtras) {
  return {...health(source),profile:source.player,stats:source.player.stats,
    presentedStats:presentedCharacterStats(source.player,source.inventory),
    inventory:source.inventory,equipped:source.inventory.filter(item=>item.equipped),
    rank:source.player.rank,evolution:source.player.avatarEvolution,titles:source.titles,
    progression:source.progression,skillTree:skillTreeState(source.player),heroCard:buildSystemCard(source.player),
    activeSkillNodes:extras.activeSkillNodes??null,legacyEquipped:extras.legacyEquipped??null,
    activeCompanion:extras.activeCompanion??null};
}
export function selectCharacterReadModel(source: VisualReadSource,extras: CharacterReadExtras={}): ReadView<ReturnType<typeof characterModel>> {
  return characterModel(source,extras);
}
function worldModel(source: VisualReadSource,tracking: WorldTrackingState|null) {
  return {...health(source),unlocked:source.worldUnlocked,
    discoveredSectors:source.player.discoveredSectors,totalDistanceMeters:source.player.totalDistanceMeters,
    story:source.story,tracking};
}
/** Pass the already mounted tracking hook's state; never start a second GPS observer. */
export function selectWorldReadModel(source: VisualReadSource,tracking: WorldTrackingState|null=null): ReadView<ReturnType<typeof worldModel>> {
  return worldModel(source,tracking);
}
function socialModel(source: VisualReadSource,auth?: CloudAuthObservation) {
  const status=!auth?.loaded?'UNKNOWN':auth.error?'ERROR':auth.session?'AUTHENTICATED':'SIGNED_OUT';
  const availability=status==='AUTHENTICATED'?'REQUIRES_API_CHECK':status==='SIGNED_OUT'?'REQUIRES_LOGIN':'UNCONFIRMED';
  return {...health(source),profile:source.player,localSessions:source.socialSessions,
    localMatchmakingAvailable:false as const,
    cloud:{status,userId:status==='AUTHENTICATED'?auth?.session?.user.id??null:null,error:auth?.error??null},
    cloudFeatures:{GUILD:availability,PVP:availability,RAID:availability,PROFILE:availability}};
}
/** Auth observation is supplied by the existing cloud auth API, never synthesized. */
export function selectSocialReadModel(source: VisualReadSource,auth?: CloudAuthObservation): ReadView<ReturnType<typeof socialModel>> {
  return socialModel(source,auth);
}
export type HomeReadModel=ReturnType<typeof selectHomeReadModel>;
export type QuestReadModel=ReturnType<typeof selectQuestReadModel>;
export type CharacterReadModel=ReturnType<typeof selectCharacterReadModel>;
export type WorldReadModel=ReturnType<typeof selectWorldReadModel>;
export type SocialReadModel=ReturnType<typeof selectSocialReadModel>;
