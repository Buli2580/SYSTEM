export type SmartReminderContext={
  streak:number;
  nextStreakMilestone?:number|null;
  weeklyCompleted?:number;
  weeklyTarget?:number;
  bossHp?:number|null;
  activeQuestTitle?:string|null;
  worldEventTitle?:string|null;
  worldEventRemaining?:string|null;
};

export function smartReminderCopy(context:SmartReminderContext){
  const weeklyTarget=context.weeklyTarget??5;
  if(context.worldEventTitle&&context.worldEventRemaining){
    return {title:'SYSTEM // WORLD EVENT',body:`${context.worldEventTitle} znika za ${context.worldEventRemaining}.`};
  }
  if(typeof context.bossHp==='number'&&context.bossHp>0&&context.bossHp<=20){
    return {title:'SYSTEM // BOSS CRITICAL',body:`Boss ma ${context.bossHp} HP. Jeden mocny quest może zakończyć walkę.`};
  }
  if((context.weeklyCompleted??0)===weeklyTarget-1){
    return {title:'SYSTEM // WEEKLY',body:`Weekly ${context.weeklyCompleted}/${weeklyTarget}. Został jeden zweryfikowany quest.`};
  }
  if(context.nextStreakMilestone&&context.streak===context.nextStreakMilestone-1){
    return {title:'SYSTEM // STREAK',body:`Brakuje Ci jednego dnia do ${context.nextStreakMilestone}-day streak.`};
  }
  if(context.activeQuestTitle){
    return {title:'SYSTEM // ACTIVE QUEST',body:`${context.activeQuestTitle} nadal czeka na ukończenie i weryfikację.`};
  }
  return {title:'SYSTEM // PROTOKÓŁ DZIENNY',body:'Twoje dzisiejsze misje nadal czekają.'};
}
