import type {MoveAgeMode,MoveQuest} from './types';
import type {QuestTemplate} from '../generation/templates';
/** Daily has no guardian approval flow. Physical quests stay in supervised MOVE
 * for minors; independent Daily uses bounded, curated cognitive activities. */
export function independentDailyAllowed(template: QuestTemplate, ageMode: MoveAgeMode): boolean {
 if(!moveSafetyPolicy(ageMode).parentApprovalRequired)return true;
 const maxSeconds=ageMode==='UNDER_6'||ageMode==='UNKNOWN'?300:moveSafetyPolicy(ageMode).maxSingleQuestMinutes*60/2;
 return template.verification==='TIMER' && template.id!=='focus_social_message' && template.baseTarget<=maxSeconds;
}
export type MoveSafetyPolicy={publicPreciseLocation:false;bodyWeightRanking:false;appearanceRanking:false;minorDirectMessages:false;parentApprovalRequired:boolean;maxSingleQuestMinutes:number};
export function moveSafetyPolicy(ageMode:MoveAgeMode):MoveSafetyPolicy{
 return{publicPreciseLocation:false,bodyWeightRanking:false,appearanceRanking:false,minorDirectMessages:false,parentApprovalRequired:ageMode!=='ADULT',maxSingleQuestMinutes:ageMode==='UNDER_6'||ageMode==='UNKNOWN'?0:ageMode==='AGE_6_8'?20:ageMode==='AGE_9_12'?30:60};
}
export function isSafeMoveQuest(quest:MoveQuest,ageMode:MoveAgeMode){
 const policy=moveSafetyPolicy(ageMode);
 return quest.ageModes.includes(ageMode)&&quest.minutes<=policy.maxSingleQuestMinutes;
}
export function publicMoveProfile<T extends Record<string,unknown>>(value:T){
 const blocked=new Set(['latitude','longitude','birthDate','schoolName','homeAddress','preciseLocation']);
 return Object.fromEntries(Object.entries(value).filter(([k])=>!blocked.has(k)));
}
