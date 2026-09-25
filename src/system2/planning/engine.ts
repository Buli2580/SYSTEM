export type PlanBlock={id:string;title:string;startsAt:string;minutes:number;kind:'QUEST'|'HABIT'|'FOCUS'|'MOVE';sourceId?:string};
export function buildDayPlan(date:string,quests:{id:string;title:string;minutes?:number}[],habits:{id:string;title:string;minutes?:number}[]=[]):PlanBlock[]{
 const blocks:PlanBlock[]=[];let hour=8;
 for(const q of quests.slice(0,4)){blocks.push({id:'q-'+q.id,title:q.title,startsAt:date+'T'+String(hour).padStart(2,'0')+':00:00',minutes:q.minutes??20,kind:'QUEST',sourceId:q.id});hour+=2}
 for(const h of habits.slice(0,3)){blocks.push({id:'h-'+h.id,title:h.title,startsAt:date+'T'+String(Math.min(hour,20)).padStart(2,'0')+':00:00',minutes:h.minutes??10,kind:'HABIT',sourceId:h.id});hour+=1}
 return blocks;
}