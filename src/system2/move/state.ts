import {dayOrdinal,nextStreak} from '../daily/calendar';
import {MOVE_QUESTS} from './catalog';
import {initialMovementSkills,moveQuestSkillXp,applyMovementXp} from './skills';
import type {MovementSkillKey,MovementSkillProgress,MoveAgeMode} from './types';
import {isSafeMoveQuest} from './safety';
import {verifyMoveQuest,type MoveVerificationEvidence} from './verification';

export type MoveCompletionEvidence=MoveVerificationEvidence&{dayKey:string};
export type MoveHistoryDay={dayKey:string;minutes:number;questIds:string[]};
export type MoveState={
  dayKey:string;
  ageMode:MoveAgeMode;
  completedQuestIds:string[];
  activeMinutes:number;
  streak:number;
  bestStreak:number;
  lastActiveDay:string|null;
  skills:Record<MovementSkillKey,MovementSkillProgress>;
  history:MoveHistoryDay[];
};

export function createMoveState(dayKey:string,ageMode:MoveAgeMode):MoveState{
 return{dayKey,ageMode,completedQuestIds:[],activeMinutes:0,streak:0,bestStreak:0,lastActiveDay:null,skills:initialMovementSkills(),history:[]};
}
export function rolloverMoveState(state:MoveState,currentDay:string,ageMode:MoveAgeMode):MoveState{
 if(state.dayKey===currentDay&&state.ageMode===ageMode)return state;
 if(state.dayKey===currentDay)return{...state,ageMode,completedQuestIds:[],activeMinutes:0};
 const history=[...state.history,{dayKey:state.dayKey,minutes:state.activeMinutes,questIds:[...state.completedQuestIds]}].slice(-31);
 return{...state,dayKey:currentDay,ageMode,completedQuestIds:[],activeMinutes:0,history};
}
export function validateMoveEvidence(e:MoveCompletionEvidence,ageMode?:MoveAgeMode){
 const quest=MOVE_QUESTS.find(q=>q.id===e.questId);
 if(!quest)throw new Error('Nie znaleziono misji MOVE.');
 if(ageMode&&!isSafeMoveQuest(quest,ageMode))throw new Error('Ta misja MOVE nie jest dostępna dla tego trybu wieku.');
 const result=verifyMoveQuest(quest,e);
 if(!result.ok)throw new Error('MOVE_VERIFICATION_FAILED:'+result.code);
 return{quest,result};
}
export function completeMoveQuest(state:MoveState,e:MoveCompletionEvidence):MoveState{
 let current=rolloverMoveState(state,e.dayKey,state.ageMode);
 const {quest}=validateMoveEvidence(e,current.ageMode);
 if(current.completedQuestIds.includes(quest.id))return current;
 const completed=[...current.completedQuestIds,quest.id];
 const activeMinutes=current.activeMinutes+quest.minutes;
 const xp=moveQuestSkillXp(quest);
 const skills={...current.skills};
 for(const [key,amount] of Object.entries(xp) as [MovementSkillKey,number][]){skills[key]=applyMovementXp(skills[key],amount)}
 let streak=current.streak,last=current.lastActiveDay,best=current.bestStreak;
 const reachedTargetBefore=current.activeMinutes>=60,reachedTargetNow=activeMinutes>=60;
 if(!reachedTargetBefore&&reachedTargetNow){
   streak=nextStreak(last??undefined,e.dayKey,current.streak);
   last=e.dayKey;best=Math.max(best,streak);
 }
 return{...current,completedQuestIds:completed,activeMinutes,skills,streak,bestStreak:best,lastActiveDay:last};
}
export function moveProgress(state:MoveState){return Math.max(0,Math.min(1,state.activeMinutes/60))}
export function moveRecentAverage(state:MoveState){
 const rows=[...state.history,{dayKey:state.dayKey,minutes:state.activeMinutes,questIds:state.completedQuestIds}].slice(-7);
 return rows.length?Math.round(rows.reduce((n,x)=>n+x.minutes,0)/rows.length):0;
}
