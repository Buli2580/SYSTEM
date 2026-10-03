export type TraceCategory='QUEST'|'DAILY'|'WEEKLY'|'BOSS'|'AWAKENING'|'LEVEL'|'DOMAIN'|'LOOT'|'PROGRESSION';
export type TraceEntry={id:string;playerId:string;at:string;category:TraceCategory;title:string;detail:string};
export function filterTracebook(entries:TraceEntry[],playerId:string,category:'ALL'|TraceCategory){
 return entries.filter(row=>row.playerId===playerId&&(category==='ALL'||row.category===category));
}
export type TraceInput={
 playerId:string;
 quests:{quest_id:string;completed_at:string;title:string;category:string}[];
 events:{id:string;createdAt:string;levelBefore?:number;levelAfter?:number}[];
 chapters:{chapter_id:string;completed_at:string}[];
 bonuses:{bonus_key:string;kind:string;created_at:string}[];
 loot:{id:string;name:string;rarity:string;acquiredAt:string}[];
};
export function buildTracebook(input:TraceInput):TraceEntry[]{
 const entries=new Map<string,TraceEntry>();
 const add=(id:string,at:string,category:TraceCategory,title:string,detail:string)=>{
  if(!Number.isFinite(Date.parse(at)))return;
  const scoped=`${input.playerId}:${id}`;
  if(!entries.has(scoped))entries.set(scoped,{id:scoped,playerId:input.playerId,at,category,title,detail});
 };
 const quests=[...new Map(input.quests.map(q=>[q.quest_id,q])).values()].sort((a,b)=>Date.parse(a.completed_at)-Date.parse(b.completed_at)||a.quest_id.localeCompare(b.quest_id));
 quests.forEach(q=>add('quest:'+q.quest_id,q.completed_at,['DAILY','WEEKLY','BOSS'].includes(q.category)?q.category as TraceCategory:'QUEST',q.title,q.quest_id));
 // Missing historic timestamps cannot establish which quest crossed a domain threshold.
 if(quests.every(q=>Number.isFinite(Date.parse(q.completed_at))))quests.forEach((q,i)=>{
  if(i===0)add('domain:first',q.completed_at,'DOMAIN','Pierwszy fundament','Pierwsza ukończona misja wspiera Twój azyl.');
  if((i+1)%5===0)add('domain:level:'+(1+(i+1)/5),q.completed_at,'DOMAIN','Domena · poziom '+(1+(i+1)/5),(i+1)+' unikalnych ukończonych misji');
 });
 input.events.forEach(e=>{
  if(Number.isSafeInteger(e.levelBefore)&&Number.isSafeInteger(e.levelAfter)&&e.levelBefore!>=1&&e.levelAfter!>e.levelBefore!)
   add('level:'+e.id,e.createdAt,'LEVEL',`REAL LEVEL ${e.levelBefore} → ${e.levelAfter}`,'Awans zapisany w zweryfikowanym zdarzeniu.');
 });
 input.chapters.forEach(c=>add('chapter:'+c.chapter_id,c.completed_at,c.chapter_id==='awakening_chapter_1'?'AWAKENING':'PROGRESSION',c.chapter_id==='awakening_chapter_1'?'Pierwsze Przebudzenie':'Ukończony rozdział',c.chapter_id));
 input.bonuses.forEach(b=>{
  if(b.kind==='weekly_complete'||b.kind==='daily_clear')add('bonus:'+b.bonus_key,b.created_at,b.kind==='weekly_complete'?'WEEKLY':'DAILY',b.kind==='weekly_complete'?'Tydzień ukończony':'Dzień ukończony',b.bonus_key);
 });
 input.loot.forEach(item=>add('loot:'+item.id,item.acquiredAt,'LOOT',item.name,item.rarity+' · '+item.id));
 return [...entries.values()].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)||a.id.localeCompare(b.id));
}
