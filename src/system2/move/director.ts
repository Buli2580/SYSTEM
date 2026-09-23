import type {MoveAgeMode,MoveDayPlan,MoveQuest} from './types';
import {MOVE_QUESTS} from './catalog';
function hash(text:string){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
export function buildMoveDayPlan(dayKey:string,ageMode:MoveAgeMode,failedYesterday=false,targetMinutes=60):MoveDayPlan{
 const recovery=failedYesterday;
 const candidates=MOVE_QUESTS.filter(q=>q.ageModes.includes(ageMode)&&(!recovery||q.difficulty==='EASY'));
 const ordered=[...candidates].sort((a,b)=>(hash(dayKey+a.id)%1000)-(hash(dayKey+b.id)%1000));
 const picked:MoveQuest[]=[];let total=0;
 for(const q of ordered){
   if(picked.length>=5)break;
   if(total>=targetMinutes)break;
   picked.push(q);total+=q.minutes;
 }
 return{dayKey,ageMode,quests:picked,targetMinutes,plannedMinutes:total,recovery};
}
export function nextMoveQuest(plan:MoveDayPlan,completedIds:string[]){return plan.quests.find(q=>!completedIds.includes(q.id))??null}
export function moveDirectorLine(plan:MoveDayPlan,completedIds:string[]){
 const next=nextMoveQuest(plan,completedIds);
 if(!next)return plan.plannedMinutes<=0?'MOVE LOCKED // SET VALID AGE PROFILE':'MOVE TARGET COMPLETE // 60 MIN';
 return plan.recovery?`RECOVERY MOVE // ${next.title} · ${next.minutes} MIN`:`NEXT MOVE // ${next.title} · ${next.minutes} MIN`;
}
