/** Read-only onboarding and comeback projection. Never resets XP or modifies quest history. */
import type {PlayerProfile,VerifiedEvent} from '../core/types';
export type UnlockFeature='QUESTS'|'CHARACTER'|'WORLD'|'SOCIAL'|'BOSSES';
export type OnboardingStage='FIRST_QUEST'|'DISCOVER_CHARACTER'|'EXPLORE_WORLD'|'ESTABLISHED';
export type OnboardingProjection={stage:OnboardingStage;unlocked:UnlockFeature[];verifiedCount:number;daysSinceLastQuest:number|null;comeback:boolean;suggestedDailyQuests:number;message:string};
export function projectOnboarding(player:PlayerProfile,events:readonly VerifiedEvent[],now:string):OnboardingProjection{
 const current=Date.parse(now);
 if(!player||typeof player.id!=='string'||!player.id||!Number.isFinite(current)||!Number.isSafeInteger(player.realLevel)||player.realLevel<1)throw new Error('Invalid onboarding input');
 const seen=new Set<string>();
 let count=0,latest=-Infinity;
 for(const event of events){
  if(!event||event.playerId!==player.id||event.verified!==true||typeof event.id!=='string'||!event.id||seen.has(event.id))continue;
  const at=Date.parse(event.createdAt);
  if(!Number.isFinite(at)||at>current||!Number.isSafeInteger(event.realXpAwarded)||event.realXpAwarded<0)continue;
  seen.add(event.id);count++;latest=Math.max(latest,at);
 }
 const daysSinceLastQuest=latest===-Infinity?null:Math.floor((current-latest)/86400000);
 const comeback=daysSinceLastQuest!==null&&daysSinceLastQuest>=7;
 const stage:OnboardingStage=count===0?'FIRST_QUEST':count<3?'DISCOVER_CHARACTER':count<5?'EXPLORE_WORLD':'ESTABLISHED';
 const unlocked:UnlockFeature[]=['QUESTS'];
 if(count>=1)unlocked.push('CHARACTER');
 if(count>=3)unlocked.push('WORLD');
 if(count>=5)unlocked.push('SOCIAL');
 if(count>=10&&player.realLevel>=3)unlocked.push('BOSSES');
 const suggestedDailyQuests=count===0||comeback?1:count<3?2:3;
 const message=comeback?'Witaj z powrotem. Jedna misja wystarczy.':
  stage==='FIRST_QUEST'?'Rozpocznij pierwszą misję.':
  stage==='DISCOVER_CHARACTER'?'Poznaj rozwój swojej postaci.':
  stage==='EXPLORE_WORLD'?'Odkryj świat SYSTEM-u.':'Wybierz kolejny cel.';
 return{stage,unlocked,verifiedCount:count,daysSinceLastQuest,comeback,suggestedDailyQuests,message};
}
