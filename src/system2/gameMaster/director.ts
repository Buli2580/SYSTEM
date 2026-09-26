import type { PlayerProfile, SkillKey } from '../core';
import type { DailyState } from '../storage/daily';
import type { StoryState } from '../story/types';
import { getQuest } from '../quests/catalog';
import type { RunnableQuest } from '../quests/types';

export type GameMasterDecision={quest:RunnableQuest|null;difficulty:'RECOVERY'|'STEADY'|'PUSH';message:string;reason:'ACTIVE'|'STORY'|'WEAK_SKILL'|'STREAK_RECOVERY'|'ATTEMPT_RECOVERY'|'DAILY'|'SOCIAL'|'STANDBY'};
export type GameMasterProfile={goal:string;path:'DISCIPLINE'|'MOTION'|'FOCUS'};
export type AttemptSignal={questId:string;result:string;reason:string|null};
function weakestSkill(player:PlayerProfile):SkillKey{return (Object.keys(player.stats) as SkillKey[]).sort((a,b)=>player.stats[a].level-player.stats[b].level||player.stats[a].totalXp-player.stats[b].totalXp)[0];}
export function directNextMission(input:{player:PlayerProfile;daily:DailyState|null;story:StoryState|null;completedQuestIds:readonly string[];activeQuestId:string|null;awakeningCompleted:boolean;gameMasterProfile?:GameMasterProfile|null;recentAttempt?:AttemptSignal|null;recentAttempts?:AttemptSignal[];socialSignal?:{mode:'GUILD'|'PVP'|'RAID';outcome:'SUCCESS'|'PENDING';completedAt?:string}|null}):GameMasterDecision{
 const {player,daily,story,completedQuestIds,activeQuestId,awakeningCompleted,gameMasterProfile,recentAttempt,recentAttempts=[],socialSignal}=input;
 if(activeQuestId){const quest=getQuest(activeQuestId);if(quest)return{quest,difficulty:'STEADY',message:'MISSION IN PROGRESS // FINISH WHAT YOU STARTED',reason:'ACTIVE'};}
 const available=(daily?.questIds??[]).map(getQuest).filter((q):q is RunnableQuest=>Boolean(q)&&!completedQuestIds.includes(q!.id));
 if(!awakeningCompleted){const ids=['first_movement','focus_protocol','final_trial'];const quest=ids.map(getQuest).find((q):q is RunnableQuest=>Boolean(q)&&!completedQuestIds.includes(q!.id))??null;return{quest,difficulty:'STEADY',message:quest?'SYSTEM // AWAKENING PATH DETECTED':'SYSTEM // AWAKENING COMPLETE',reason:'STORY'};}
 const failureCount=recentAttempts.filter(a=>['FAILED','REJECTED','INTERRUPTED','ABANDONED'].includes(a.result)).length;
 if(recentAttempt&&['FAILED','REJECTED','INTERRUPTED','ABANDONED'].includes(recentAttempt.result)){const retry=available.find(q=>q.id===recentAttempt.questId);if(retry)return{quest:retry,difficulty:'RECOVERY',message:failureCount>=2?'SYSTEM // FAILURE PATTERN DETECTED // DIFFICULTY REDUCED':'SYSTEM // FAILURE ANALYZED // RECOVERY ROUTE',reason:'ATTEMPT_RECOVERY'};}
 if(socialSignal?.outcome==='SUCCESS'&&available.length){return{quest:available[0],difficulty:'PUSH',message:'SYSTEM // '+socialSignal.mode+' VICTORY CONFIRMED // CONTINUE MOMENTUM',reason:'SOCIAL'};}\n if(player.streak===0&&available.length){const quest=available.find(q=>q.verification.type==='TIMER')??available[0];return{quest,difficulty:'RECOVERY',message:'STREAK LOST // RECOVERY MISSION SELECTED',reason:'STREAK_RECOVERY'};}
 const preferredSkill = gameMasterProfile?.path==='MOTION'?'VIT':gameMasterProfile?.path==='FOCUS'?'INT':gameMasterProfile?.path==='DISCIPLINE'?'WIL':null;
 const recentIds=recentAttempts.slice(0,2).map(a=>a.questId);
 const freshAvailable=available.filter(q=>!recentIds.includes(q.id));
 const pool=freshAvailable.length?freshAvailable:available;
 const preferred=preferredSkill?pool.find(q=>q.primarySkill===preferredSkill):undefined;
 if(preferred)return{quest:preferred,difficulty:player.streak>=7?'PUSH':'STEADY',message:'SYSTEM // '+gameMasterProfile!.path+' PATH DIRECTIVE',reason:'WEAK_SKILL'};

 const weak=weakestSkill(player);const targeted=pool.find(q=>q.primarySkill===weak);
 if(targeted)return{quest:targeted,difficulty:player.streak>=7?'PUSH':'STEADY',message:'SYSTEM // '+weak+' REQUIRES DEVELOPMENT',reason:'WEAK_SKILL'};
 if(pool.length)return{quest:pool[0],difficulty:player.streak>=7?'PUSH':'STEADY',message:player.streak>=7?'MOMENTUM HIGH // PRESS THE ADVANTAGE':'NEXT DAILY DIRECTIVE READY',reason:'DAILY'};
 return{quest:null,difficulty:'STEADY',message:story?.bossComplete?'CHAPTER COMPLETE // MAINTAIN DAILY PROTOCOL':'STORY PROTOCOL HAS PRIORITY',reason:'STANDBY'};
}
