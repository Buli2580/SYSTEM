/** Offline AutoQuest proposals. The canonical verification provider alone awards XP. */
import type {QuestTemplate} from '../generation/templates';
export type AutoQuestCapabilities={gps:boolean;timer:boolean;walking:boolean;running:boolean;cycling:boolean};
export type AutoQuestProposal={templateId:string;verification:'TIMER'|'GPS_DISTANCE';target:number;estimatedMinutes:number;reason:string};
export type AutoQuestPlan={proposals:AutoQuestProposal[];skipped:{templateId:string;reason:string}[]};
export function proposeAutoQuests(templates:readonly QuestTemplate[],capabilities:AutoQuestCapabilities,minutes:number,count:number):AutoQuestPlan{
 const skipped:AutoQuestPlan['skipped']=[];
 const proposals:AutoQuestProposal[]=[];
 const budget=Number.isFinite(minutes)?Math.max(0,Math.min(240,Math.floor(minutes))):0;
 const slots=Number.isFinite(count)?Math.max(0,Math.min(5,Math.floor(count))):0;
 if(!budget||!slots)return{proposals,skipped};
 const candidates=templates.filter(template=>{
  if(template.verification==='GPS_DISTANCE'&&!capabilities.gps){skipped.push({templateId:template.id,reason:'GPS_UNAVAILABLE'});return false;}
  if(template.verification==='TIMER'&&!capabilities.timer){skipped.push({templateId:template.id,reason:'TIMER_UNAVAILABLE'});return false;}
  if(template.activity==='WALK'&&!capabilities.walking||template.activity==='RUN'&&!capabilities.running||template.activity==='BIKE'&&!capabilities.cycling){skipped.push({templateId:template.id,reason:'ACTIVITY_DISABLED'});return false;}
  return true;
 });
 const take=Math.min(slots,budget,candidates.length);
 const perQuest=Math.floor(budget/take);
 for(const template of candidates.slice(0,take)){
  const speed=template.activity==='BIKE'?4:template.activity==='RUN'?2.5:1.25;
  const target=Math.max(1,Math.min(template.baseTarget,Math.floor(perQuest*60*(template.verification==='TIMER'?1:speed))));
  proposals.push({templateId:template.id,verification:template.verification,target,estimatedMinutes:template.verification==='TIMER'?Math.ceil(target/60):Math.ceil(target/speed/60),reason:'CAPABILITY_AND_TIME_BUDGET'});
 }
 return{proposals,skipped};
}
