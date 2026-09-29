/** Deterministic quest ranking; pure offline logic, no XP or completion side effects. */
import type {QuestTemplate} from '../generation/templates';
import type {GoalCategory} from '../goals/model';
import type {Outcome,UserModel} from '../adaptive/engine';
export type QuestChoice={templateId:string;score:number;reasons:string[]};
export type QuestSelection={choices:QuestChoice[];excluded:{templateId:string;reason:string}[]};
export type QuestSelectionInput={
 templates:readonly QuestTemplate[];model:UserModel;goals:readonly GoalCategory[];
 recentTemplateIds:readonly string[];playerLevel:number;count:number;
 allowedActivities?:readonly ('WALK'|'RUN'|'BIKE')[];now:string;
};
function recentSuccess(outcomes:readonly Outcome[],now:number):Set<string>{
 const success=new Set<string>();
 for(const event of outcomes){
  const timestamp=Date.parse(event.at);
  if(Number.isFinite(timestamp)&&timestamp<=now&&now-timestamp<=30*86400000&&event.outcome==='COMPLETE')success.add(event.questType);
 }
 return success;
}
export function selectIntelligentQuests(input:QuestSelectionInput):QuestSelection{
 const time=Date.parse(input.now);
 if(!Number.isFinite(time))throw new Error('Invalid selection time');
 const count=Number.isFinite(input.count)?Math.max(0,Math.min(5,Math.floor(input.count))):0;
 const allowed=new Set(input.allowedActivities??['WALK']);
 const goals=new Set(input.goals);
 const recent=new Set(input.recentTemplateIds);
 const successes=recentSuccess(input.model.outcomes,time);
 const excluded:QuestSelection['excluded']=[];
 const choices:QuestChoice[]=[];
 for(const template of input.templates){
  if(!template||!template.id)continue;
  if(template.minimumLevel>input.playerLevel){excluded.push({templateId:template.id,reason:'LEVEL'});continue;}
  if(template.activity&&!allowed.has(template.activity)){excluded.push({templateId:template.id,reason:'ACTIVITY_DISABLED'});continue;}
  const reasons:string[]=[];
  let score=0;
  if(template.goals.some(goal=>goals.has(goal))){score+=40;reasons.push('GOAL_MATCH');}
  if(input.model.preferredTypes.includes(template.id)||input.model.preferredTypes.includes(template.category)){score+=15;reasons.push('PREFERENCE');}
  if(successes.has(template.id)||successes.has(template.category)){score+=8;reasons.push('HISTORY');}
  if(recent.has(template.id)){score-=30;reasons.push('RECENT_REPETITION');}
  if(template.verification==='TIMER'&&input.model.availableMinutes<10){score+=5;reasons.push('SHORT_SESSION');}
  choices.push({templateId:template.id,score,reasons});
 }
 choices.sort((a,b)=>b.score-a.score||a.templateId.localeCompare(b.templateId));
 // Prefer fresh choices, but never leave a loadout empty merely because all candidates were recent.
 const fresh=choices.filter(choice=>!recent.has(choice.templateId));
 const repeated=choices.filter(choice=>recent.has(choice.templateId));
 return{choices:[...fresh,...repeated].slice(0,count),excluded};
}
