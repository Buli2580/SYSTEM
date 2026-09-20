import { primaryJourney, type Journey } from '../journeys/model';
import type { PlayerProfile } from '../core';
import type { PlayerGoal } from '../goals/model';
import type { ActivityPreferences } from '../daily/templates';
import { dayOrdinal, deterministicPick } from '../daily/calendar';
import { QUEST_TEMPLATES, DIFFICULTY, generatedQuest, type GeneratedDifficulty, type QuestTemplate, type QuestTheme } from './templates';
export type RecentActivity={templateId?:string;category?:QuestTheme;difficulty?:string;day:string;result:'COMPLETED'|'FAILED'|'OFFERED'};
export type GenerationInput={journeys?:readonly Journey[];player:PlayerProfile;goals:readonly PlayerGoal[];day:string;history:readonly RecentActivity[];prefs:ActivityPreferences;weeklyCompleted:number;weeklyClear:boolean;systemDebt?:0|1|2|3;exclude?:readonly string[];maximumDifficulty?:GeneratedDifficulty};
export type Candidate={quest:NonNullable<ReturnType<typeof generatedQuest>>;reason:string;templateId:string;category:QuestTheme;recovery:boolean};
export function adaptiveDifficulty(input:GenerationInput):{difficulty:GeneratedDifficulty;recovery:boolean} {
 const recent=input.history.filter(h=>h.result!=='OFFERED'&&dayOrdinal(input.day)-dayOrdinal(h.day)>=0&&dayOrdinal(input.day)-dayOrdinal(h.day)<=7).slice(0,6);
 const failures=recent.filter(h=>h.result==='FAILED').length,success=recent.filter(h=>h.result==='COMPLETED').length;
 const lastSuccess=input.history.find(h=>h.result==='COMPLETED');
 const recovery=(input.systemDebt??0)>0||failures>=2||(!!lastSuccess&&dayOrdinal(input.day)-dayOrdinal(lastSuccess.day)>=4);
 if(recovery||input.player.realLevel<3)return {difficulty:'EASY',recovery};
 const recentHard=recent.filter(h=>h.difficulty==='HARD').length;
 return {difficulty:input.player.realLevel>=8&&input.player.rank!=='E'&&success>=4&&failures===0&&input.player.streak>=3&&recentHard<3?'HARD':'NORMAL',recovery:false};
}
export function generateLoadout(input:GenerationInput,count=3):Candidate[] {
 const policy=adaptiveDifficulty(input),active=input.goals.filter(g=>g.status==='ACTIVE').slice().sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));
 const primary=primaryJourney(input.journeys??[],active);
 const blocked=new Set(input.exclude??[]),picked:Candidate[]=[];
 const enabled=(t:QuestTemplate)=>!t.activity||({WALK:input.prefs.walking,RUN:input.prefs.running,BIKE:input.prefs.cycling})[t.activity];
 const candidates=QUEST_TEMPLATES.filter(t=>(t.id!=='focus_return'||policy.recovery)&&enabled(t)&&input.player.realLevel>=t.minimumLevel&&!blocked.has(t.id));
 const cool=(t:QuestTemplate)=>!input.history.some(h=>h.templateId===t.id&&dayOrdinal(input.day)-dayOrdinal(h.day)>=0&&dayOrdinal(input.day)-dayOrdinal(h.day)<t.cooldownDays);
 const available=candidates.filter(cool); // Never bypass cooldown just to fill a slot.
 for(let slot=0;slot<count;slot++) {
  let pool=available.filter(t=>!picked.some(p=>p.templateId===t.id));
  if(!pool.length)break;
  if(slot===0&&policy.recovery) {const recovery=pool.find(t=>t.id==='focus_return');if(recovery)pool=[recovery];}
  else if(slot===0&&!active.length) {const general=pool.filter(t=>t.category==='GENERAL');if(general.length)pool=general;}
  else if(slot===1&&primary&&!picked.some(p=>QUEST_TEMPLATES.find(t=>t.id===p.templateId)?.goals.includes(primary.category))&&pool.some(t=>t.goals.includes(primary.category))) {pool=pool.filter(t=>t.goals.includes(primary.category));}
  else if(slot===1&&!picked.some(p=>p.quest.activityType)) {const movement=pool.filter(t=>t.activity);if(movement.length)pool=movement;}
  const shuffled=deterministicPick(pool,input.player.id+input.day+slot+input.weeklyCompleted+input.weeklyClear,pool.length);
  const affinity=(t:QuestTemplate)=>active.filter(g=>t.goals.includes(g.category)).reduce((n,g)=>n+g.priority*(t.category===g.category?36:30),0);
  const score=(t:QuestTemplate)=> (slot===0?affinity(t)+(primary&&t.goals.includes(primary.category)?500:0):affinity(t)*.15) + Math.max(0,10-input.player.stats[t.stat].level)*2 - picked.filter(p=>p.category===t.category).length*80 - input.history.slice(0,9).filter(h=>h.category===t.category).length*4;
  shuffled.sort((a,b)=>score(b)-score(a)); const t=shuffled[0];
  const recovery=policy.recovery&&t.id==='focus_return';
  const proposed=recovery?'EASY':policy.difficulty;
  const difficulty=input.maximumDifficulty&&DIFFICULTY[proposed].xp>DIFFICULTY[input.maximumDifficulty].xp?input.maximumDifficulty:proposed;
  if(input.player.realLevel<DIFFICULTY[difficulty].minLevel)throw new Error('Difficulty eligibility');
  const goal=active.find(g=>t.goals.includes(g.category));
  const reason=recovery?'Quest regeneracyjny — mały krok na powrót.':goal?'Powiązane z celem: '+goal.title:slot===2&&!input.weeklyClear?'Kolejny krok do Weekly.':`Rozwój ${t.stat} · ${difficulty==='EASY'?'łagodny start':'tempo dopasowane do ostatnich prób'}.`;
  picked.push({quest:generatedQuest(`daily:${input.day}:g1_${t.id}_${difficulty.toLowerCase()}`)!,reason,templateId:t.id,category:t.category,recovery});
 }
 return picked;
}
