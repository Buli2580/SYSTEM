import type {SmartReminderContext} from './smart';
export type NotificationDecision={kind:'SILENT'|'NUDGE'|'URGENT';score:number;reason:string};
export function smartNotificationDecision(c:SmartReminderContext,now=Date.now()):NotificationDecision{
 let score=0,reasons:string[]=[];
 if(c.activeQuestTitle){score+=18;reasons.push('active quest')}
 if(c.nextStreakMilestone&&c.streak===c.nextStreakMilestone-1){score+=26;reasons.push('streak milestone')}
 if(typeof c.bossHp==='number'&&c.bossHp>0&&c.bossHp<=20){score+=30;reasons.push('boss critical')}
 if(c.worldEventEndsAt&&Date.parse(c.worldEventEndsAt)>now&&Date.parse(c.worldEventEndsAt)-now<90*60*1000){score+=24;reasons.push('world event closing')}
 if((c.weeklyCompleted??0)===(c.weeklyTarget??5)-1){score+=20;reasons.push('weekly final')}
 return{kind:score>=45?'URGENT':score>=18?'NUDGE':'SILENT',score:Math.min(100,score),reason:reasons.join(' · ')||'low priority'};
}