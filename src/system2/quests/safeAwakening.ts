import type {RunnableQuest} from './types';
/** Curated, independent, indoor-safe alternatives. No location, strangers, equipment or exertion. */
export const SAFE_AWAKENING_QUESTS:readonly RunnableQuest[]=[
 ['awakening_observe_v1','PIERWSZY SYGNAŁ','Przez pięć minut spokojnie obserwuj znane, bezpieczne miejsce. Zauważ trzy kolory lub kształty. Nie musisz wychodzić ani niczego dotykać.','WIL'],
 ['awakening_imagine_v1','MAPA WYOBRAŹNI','Przez pięć minut wyobraź sobie spokojne miejsce i jego kolory. Możesz pozostać na swoim miejscu; nie potrzebujesz aparatu ani materiałów.','CRE'],
 ['awakening_plan_v1','MAŁY KROK','Przez pięć minut zastanów się nad jedną drobną rzeczą, której chcesz się nauczyć. Nie musisz kontaktować się z innymi ani wykonywać ćwiczeń.','INT'],
].map(([id,title,description,skill],index)=>({id,title,description,primarySkill:skill as 'WIL'|'CRE'|'INT',category:'MAIN',difficulty:'EASY',order:index+1,secondarySkills:[],arc:'AWAKENING',chapter:1,verification:{type:'TIMER',minimumDurationSeconds:300,verificationScoreRequired:100},rewards:{realXp:50,skillXp:{[skill]:40},gameEnergy:5},progress:0,progressTarget:300,createdAt:'2026-10-01T00:00:00.000Z'}));
const classic=['first_movement_v1','focus_protocol_v1','final_trial_v1'];
export function awakeningStage(id:string):number|null {
 const old=classic.indexOf(id);if(old>=0)return old+1;
 const safe=SAFE_AWAKENING_QUESTS.find(q=>q.id===id);return safe?.order??null;
}
export function awakeningStageCompleted(stage:number,ids:readonly string[]){return ids.some(id=>awakeningStage(id)===stage);}
export function isSafeAwakening(id:string){return SAFE_AWAKENING_QUESTS.some(q=>q.id===id);}
