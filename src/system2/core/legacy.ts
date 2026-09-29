/** Read-only long-term legacy derived from canonical verified events. No XP or reward mutations. */
import type {PlayerProfile,VerifiedEvent} from '../core/types';
export type LegacyMilestone={id:string;kind:'QUESTS'|'DISTANCE'|'LEVEL';threshold:number;achieved:boolean};
export type LegacySnapshot={verifiedQuestCount:number;verifiedDistanceMeters:number;milestones:LegacyMilestone[];nextQuestTarget:number|null;nextDistanceTargetMeters:number|null};
const QUEST_TARGETS=[1,10,50,100,500,1000] as const;
const DISTANCE_TARGETS=[1000,10000,50000,100000,500000,1000000] as const;
const LEVEL_TARGETS=[5,10,25,50,100,200,300] as const;
export function deriveLegacy(player:PlayerProfile,events:readonly VerifiedEvent[]):LegacySnapshot{
 if(!player||typeof player.id!=='string'||!Number.isSafeInteger(player.realLevel)||player.realLevel<1)throw new Error('Invalid player');
 const seen=new Set<string>();
 let verifiedQuestCount=0,verifiedDistanceMeters=0;
 for(const event of events){
  if(!event||event.playerId!==player.id||event.verified!==true||typeof event.id!=='string'||!event.id||seen.has(event.id))continue;
  if(!Number.isFinite(Date.parse(event.createdAt))||!Number.isSafeInteger(event.realXpAwarded)||event.realXpAwarded<0)continue;
  const distance=event.distanceMeters??0;
  if(!Number.isFinite(distance)||distance<0)continue;
  seen.add(event.id);
  verifiedQuestCount++;
  verifiedDistanceMeters+=distance;
 }
 const milestones:LegacyMilestone[]=[
  ...QUEST_TARGETS.map(threshold=>({id:`QUESTS_${threshold}`,kind:'QUESTS' as const,threshold,achieved:verifiedQuestCount>=threshold})),
  ...DISTANCE_TARGETS.map(threshold=>({id:`DISTANCE_${threshold}`,kind:'DISTANCE' as const,threshold,achieved:verifiedDistanceMeters>=threshold})),
  ...LEVEL_TARGETS.map(threshold=>({id:`LEVEL_${threshold}`,kind:'LEVEL' as const,threshold,achieved:player.realLevel>=threshold}))
 ];
 return{verifiedQuestCount,verifiedDistanceMeters,milestones,
  nextQuestTarget:QUEST_TARGETS.find(n=>n>verifiedQuestCount)??null,
  nextDistanceTargetMeters:DISTANCE_TARGETS.find(n=>n>verifiedDistanceMeters)??null};
}
