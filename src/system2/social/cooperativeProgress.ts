/** Pure cooperative progress projection; server-authoritative verification remains required. */
import type {VerifiedEvent} from '../core/types';
export type CooperativeObjective={id:string;questIds:readonly string[];targetCompletions:number;minimumParticipants:number;startsAt:string;endsAt:string};
export type CooperativeSnapshot={objectiveId:string;verifiedCompletions:number;participantCount:number;complete:boolean;participantIds:string[]};
export function cooperativeProgress(objective:CooperativeObjective,events:readonly VerifiedEvent[]):CooperativeSnapshot{
 const start=Date.parse(objective.startsAt),end=Date.parse(objective.endsAt);
 if(!objective.id||!Number.isFinite(start)||!Number.isFinite(end)||end<=start||
 !Number.isSafeInteger(objective.targetCompletions)||objective.targetCompletions<1||
 !Number.isSafeInteger(objective.minimumParticipants)||objective.minimumParticipants<1)throw new Error('Invalid cooperative objective');
 const questIds=new Set(objective.questIds);
 const seen=new Set<string>(),participants=new Set<string>();
 let verifiedCompletions=0;
 for(const event of events){
  if(!event||event.verified!==true||typeof event.id!=='string'||!event.id||seen.has(event.id)||
  typeof event.playerId!=='string'||!event.playerId||!questIds.has(event.questId))continue;
  const at=Date.parse(event.createdAt);
  if(!Number.isFinite(at)||at<start||at>end||
  !Number.isSafeInteger(event.realXpAwarded)||event.realXpAwarded<0)continue;
  seen.add(event.id);participants.add(event.playerId);verifiedCompletions++;
 }
 const participantIds=[...participants].sort();
 return{objectiveId:objective.id,verifiedCompletions,participantCount:participantIds.length,
  complete:verifiedCompletions>=objective.targetCompletions&&participantIds.length>=objective.minimumParticipants,participantIds};
}
