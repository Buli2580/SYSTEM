export type SmartReminderContext={
  streak:number;
  nextStreakMilestone?:number|null;
  weeklyCompleted?:number;
  weeklyTarget?:number;
  bossHp?:number|null;
  activeQuestTitle?:string|null;
  worldEventTitle?:string|null;
  worldEventRemaining?:string|null;
  worldEventEndsAt?:string|null;
};

export function smartReminderCopy(context:SmartReminderContext,scheduledAt=Date.now()){
  const eventEnd=context.worldEventEndsAt?Date.parse(context.worldEventEndsAt):NaN;
  const eventActive=Number.isFinite(eventEnd)&&eventEnd>scheduledAt;
  const eventMinutes=eventActive?Math.max(1,Math.ceil((eventEnd-scheduledAt)/60000)):0;
  // Never snapshot changing boss/streak state into notifications scheduled hours or days ahead.
  const fresh=scheduledAt-Date.now()<=15*60*1000;
  const weeklyTarget=context.weeklyTarget??5;
  if(fresh&&context.worldEventTitle&&eventActive){
    return {title:'SYSTEM // WORLD EVENT',body:`${context.worldEventTitle} znika za ${eventMinutes} min.`};
  }
  if(fresh&&typeof context.bossHp==='number'&&context.bossHp>0&&context.bossHp<=20){
    return {title:'SYSTEM // BOSS CRITICAL',body:`Boss ma ${context.bossHp} HP. Jeden mocny quest może zakończyć walkę.`};
  }
  if(fresh&&(context.weeklyCompleted??0)===weeklyTarget-1){
    return {title:'SYSTEM // WEEKLY',body:`Weekly ${context.weeklyCompleted}/${weeklyTarget}. Został jeden zweryfikowany quest.`};
  }
  if(fresh&&context.nextStreakMilestone&&context.streak===context.nextStreakMilestone-1){
    return {title:'SYSTEM // STREAK',body:`Brakuje Ci jednego dnia do ${context.nextStreakMilestone}-day streak.`};
  }
  if(fresh&&context.activeQuestTitle){
    return {title:'SYSTEM // ACTIVE QUEST',body:`${context.activeQuestTitle} nadal czeka na ukończenie i weryfikację.`};
  }
  return {title:'SYSTEM // PROTOKÓŁ DZIENNY',body:'Twoje dzisiejsze misje nadal czekają.'};
}
