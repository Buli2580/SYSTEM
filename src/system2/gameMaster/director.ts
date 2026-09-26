import type { PlayerProfile, SkillKey } from '../core';
import type { DailyState } from '../storage/daily';
import type { StoryState } from '../story/types';
import { getQuest } from '../quests/catalog';
import type { RunnableQuest } from '../quests/types';

export type GameMasterDecision={quest:RunnableQuest|null;difficulty:'RECOVERY'|'STEADY'|'PUSH';message:string;reason:'ACTIVE'|'STORY'|'WEAK_SKILL'|'STREAK_RECOVERY'|'DAILY'|'STANDBY'};
function weakestSkill(player:PlayerProfile):SkillKey{return (Object.keys(player.stats) as SkillKey[]).sort((a,b)=>player.stats[a].level-player.stats[b].level||player.stats[a].totalXp-player.stats[b].totalXp)[0];}
export function directNextMission(input:{player:PlayerProfile;daily:DailyState|null;story:StoryState|null;completedQuestIds:readonly string[];activeQuestId:string|null;awakeningCompleted:boolean}):GameMasterDecision{
 const {player,daily,story,completedQuestIds,activeQuestId,awakeningCompleted,gameMasterProfile}=input;
 if(activeQuestId){const quest=getQuest(activeQuestId);if(quest)return{quest,difficulty:'STEADY',message:'MISSION IN PROGRESS // FINISH WHAT YOU STARTED',reason:'ACTIVE'};}
 const available=(daily?.questIds??[]).map(getQuest).filter((q):q is RunnableQuest=>Boolean(q)&&!completedQuestIds.includes(q!.id));
 if(!awakeningCompleted){const ids=['first_movement','focus_protocol','final_trial'];const quest=ids.map(getQuest).find((q):q is RunnableQuest=>Boolean(q)&&!completedQuestIds.includes(q!.id))??null;return{quest,difficulty:'STEADY',message:quest?'SYSTEM // AWAKENING PATH DETECTED':'SYSTEM // AWAKENING COMPLETE',reason:'STORY'};}
 if(player.streak===0&&available.length){const quest=available.find(q=>q.verification.type==='TIMER')??available[0];return{quest,difficulty:'RECOVERY',message:'STREAK LOST // RECOVERY MISSION SELECTED',reason:'STREAK_RECOVERY'};}
 const preferredSkill = gameMasterProfile?.path==='MOTION'?'VIT':gameMasterProfile?.path==='FOCUS'?'INT':gameMasterProfile?.path==='DISCIPLINE'?'WIL':null;
 const preferred=preferredSkill?available.find(q=>q.primarySkill===preferredSkill):undefined;
 if(preferred)return{quest:preferred,difficulty:player.streak>=7?'PUSH':'STEADY',message:'SYSTEM // '+gameMasterProfile!.path+' PATH DIRECTIVE',reason:'WEAK_SKILL'};

 const weak=weakestSkill(player);const targeted=available.find(q=>q.primarySkill===weak);
 if(targeted)return{quest:targeted,difficulty:player.streak>=7?'PUSH':'STEADY',message:'SYSTEM // '+weak+' REQUIRES DEVELOPMENT',reason:'WEAK_SKILL'};
 if(available.length)return{quest:available[0],difficulty:player.streak>=7?'PUSH':'STEADY',message:player.streak>=7?'MOMENTUM HIGH // PRESS THE ADVANTAGE':'NEXT DAILY DIRECTIVE READY',reason:'DAILY'};
 return{quest:null,difficulty:'STEADY',message:story?.bossComplete?'CHAPTER COMPLETE // MAINTAIN DAILY PROTOCOL':'STORY PROTOCOL HAS PRIORITY',reason:'STANDBY'};
}
