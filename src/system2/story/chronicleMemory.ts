/** Privacy-minimized, deterministic memory projection. No external AI calls or raw GPS. */
import type {VerifiedEvent} from '../core/types';
export type ChronicleEntry={id:string;day:string;questId:string;xp:number;distanceMeters:number};
export type ChronicleMemory={playerId:string;entries:ChronicleEntry[];verifiedCount:number;totalXp:number;totalDistanceMeters:number;activeDays:number;latestDay:string|null};
const DAY=/^\d{4}-\d{2}-\d{2}$/;
export function buildChronicle(playerId:string,events:readonly VerifiedEvent[],limit=30):ChronicleMemory{
 if(!playerId||!Number.isSafeInteger(limit)||limit<0||limit>100)throw new Error('Invalid chronicle request');
 const seen=new Set<string>(),valid:ChronicleEntry[]=[];
 for(const event of events){
  if(!event||event.playerId!==playerId||event.verified!==true||typeof event.id!=='string'||!event.id||seen.has(event.id)||
  typeof event.questId!=='string'||!event.questId||!Number.isSafeInteger(event.realXpAwarded)||event.realXpAwarded<0)continue;
  const date=Date.parse(event.createdAt),day=event.createdAt?.slice(0,10);
  if(!Number.isFinite(date)||typeof day!=='string'||!DAY.test(day))continue;
  const distance=event.distanceMeters??0;
  if(!Number.isFinite(distance)||distance<0)continue;
  seen.add(event.id);
  valid.push({id:event.id,day:new Date(date).toISOString().slice(0,10),questId:event.questId,xp:event.realXpAwarded,distanceMeters:distance});
 }
 valid.sort((a,b)=>b.day.localeCompare(a.day)||a.id.localeCompare(b.id));
 const entries=valid.slice(0,limit);
 return{playerId,entries,verifiedCount:valid.length,totalXp:valid.reduce((sum,e)=>sum+e.xp,0),
  totalDistanceMeters:valid.reduce((sum,e)=>sum+e.distanceMeters,0),
  activeDays:new Set(valid.map(e=>e.day)).size,latestDay:valid[0]?.day??null};
}
