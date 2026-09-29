/** Offline, deterministic adaptive planning. No LLM or sensitive raw signals required. */
export type LifeState='NORMAL'|'BUSY'|'TRAVEL'|'RECOVERY'|'VACATION';
export type QuestOutcome='COMPLETE'|'PARTIAL'|'FAILED'|'REROLL'|'RECOVERY';
export type Outcome={id:string;questType:string;difficulty:number;outcome:QuestOutcome;at:string;minutes?:number};
export type UserModel={version:1;lifeState:LifeState;availableMinutes:number;preferredTypes:string[];preferredDifficulty:number;outcomes:Outcome[];updatedAt:string};
export type Plan={lifeState:LifeState;readiness:number;effort:number;difficulty:number;dailyCount:number;weeklyCount:number;bossDifficulty:number;reasons:string[];suggestedState:LifeState|null};
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,Number.isFinite(n)?n:min));
export function newUserModel(now=new Date().toISOString()):UserModel{return{version:1,lifeState:'NORMAL',availableMinutes:45,preferredTypes:[],preferredDifficulty:2,outcomes:[],updatedAt:now};}
export function normalizeUserModel(value:unknown):UserModel{
 const raw=value&&typeof value==='object'?value as Partial<UserModel>:{};
 const base=newUserModel();
 const states:LifeState[]=['NORMAL','BUSY','TRAVEL','RECOVERY','VACATION'];
 return{...base,lifeState:states.includes(raw.lifeState as LifeState)?raw.lifeState!:base.lifeState,
 availableMinutes:clamp(Number(raw.availableMinutes??45),2,240),
 preferredTypes:Array.isArray(raw.preferredTypes)?raw.preferredTypes.filter((x):x is string=>typeof x==='string').slice(0,20):[],
 preferredDifficulty:clamp(Number(raw.preferredDifficulty??2),1,5),
 outcomes:Array.isArray(raw.outcomes)?raw.outcomes.filter((x):x is Outcome=>!!x&&typeof x.id==='string'&&typeof x.at==='string'&&['COMPLETE','PARTIAL','FAILED','REROLL','RECOVERY'].includes(x.outcome)).slice(-500):[],
 updatedAt:typeof raw.updatedAt==='string'?raw.updatedAt:base.updatedAt};
}
export function recordOutcome(model:UserModel,event:Outcome):UserModel{
 if(model.outcomes.some(x=>x.id===event.id))return model;
 const outcomes=[...model.outcomes,event].slice(-500);
 const scores=new Map<string,number>();
 for(const outcome of outcomes.slice(-60))if(outcome.questType){const weight=outcome.outcome==='COMPLETE'?2:outcome.outcome==='RECOVERY'?1:outcome.outcome==='FAILED'?-1:outcome.outcome==='REROLL'?-2:0;scores.set(outcome.questType,(scores.get(outcome.questType)??0)+weight);}
 const preferredTypes=[...scores].filter(([,score])=>score>0).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,5).map(([type])=>type);
 return{...model,outcomes,preferredTypes,updatedAt:event.at};
}
export function setLifeState(model:UserModel,state:LifeState,now=new Date().toISOString()):UserModel{return{...model,lifeState:state,updatedAt:now};}
export function planAdaptiveDay(model:UserModel,now=new Date().toISOString()):Plan{
 const m=normalizeUserModel(model),time=Date.parse(now),valid=Number.isFinite(time)?time:Date.now();
 const recent=(days:number)=>m.outcomes.filter(x=>{const t=Date.parse(x.at);return Number.isFinite(t)&&t<=valid&&t>=valid-days*86400000;});
 const week=recent(7),month=recent(30),yesterday=recent(1);
 const lastCompletion=Math.max(...m.outcomes.filter(x=>x.outcome==='COMPLETE'||x.outcome==='RECOVERY').map(x=>Date.parse(x.at)).filter(t=>Number.isFinite(t)&&t<=valid));
 const returning=Number.isFinite(lastCompletion)&&valid-lastCompletion>=7*86400000;
 const complete=week.filter(x=>x.outcome==='COMPLETE'||x.outcome==='RECOVERY').length;
 const failed=week.filter(x=>x.outcome==='FAILED').length;
 const rerolls=week.filter(x=>x.outcome==='REROLL').length;
 const attempts=complete+failed+rerolls+week.filter(x=>x.outcome==='PARTIAL').length;
 const completion=attempts?complete/attempts:0.65;
 const overload=failed>=3||rerolls>=4||(attempts>=4&&completion<0.4);
 const effortless=attempts>=5&&completion>=0.9&&failed===0&&rerolls===0;
 if(returning)return{lifeState:m.lifeState,readiness:40,effort:30,difficulty:1,dailyCount:1,weeklyCount:1,bossDifficulty:1,reasons:['Łagodny powrót po przerwie: jeden mały krok, bez nadrabiania zaległości.'],suggestedState:m.lifeState==='NORMAL'?'RECOVERY':null};
 const baseline:Record<LifeState,number>={NORMAL:3,BUSY:1,TRAVEL:1,RECOVERY:1,VACATION:1};
 // A declared time budget is an upper bound, not a target to fill on a difficult day.
 // Keep special-day loadouts small even when the player normally has ample time.
 const stateBudget:Record<LifeState,number>={NORMAL:240,BUSY:24,TRAVEL:36,RECOVERY:12,VACATION:24};
 const effectiveMinutes=Math.min(m.availableMinutes,stateBudget[m.lifeState]);
 const capacity=Math.max(1,Math.floor(effectiveMinutes/12));
 const dailyCount=Math.min(capacity,Math.max(1,baseline[m.lifeState]+(m.lifeState==='NORMAL'&&!overload&&effortless?1:0)-(overload?1:0)));
 const readiness=clamp(Math.round(65+completion*25-failed*8-rerolls*3-(m.lifeState==='RECOVERY'?25:0)-(m.lifeState==='BUSY'?12:0)),0,100);
 const effort=clamp(Math.round(30+complete*7+week.filter(x=>x.outcome==='PARTIAL').length*3),0,100);
 const difficulty=clamp(m.preferredDifficulty+(effortless&&m.lifeState==='NORMAL'?1:0)-(overload?1:0)-(m.lifeState==='RECOVERY'?1:0),1,5);
 const reasons=[effectiveMinutes<m.availableMinutes?'Ograniczono obciążenie do budżetu trybu dnia':'Uwzględniono dostępny czas',m.lifeState!=='NORMAL'?'Dopasowano do trybu '+m.lifeState:'Standardowy tryb dnia',overload?'Zmniejszono obciążenie po trudnościach':effortless?'Delikatnie zwiększono wyzwanie':'Utrzymano stabilne tempo',yesterday.length===0?'Brak aktywności w ostatniej dobie':'Uwzględniono ostatnią dobę',month.length?'Uwzględniono historię 30 dni':'Brak historii 30 dni'];
 return{lifeState:m.lifeState,readiness,effort,difficulty,dailyCount,weeklyCount:m.lifeState==='NORMAL'&&!overload?2:1,bossDifficulty:clamp(difficulty-(overload?1:0),1,5),reasons,suggestedState:overload&&m.lifeState==='NORMAL'?'RECOVERY':null};
}
export function explainAdaptivePlan(plan:Plan):string{return plan.reasons.join('. ')+'.';}
