import {getValidSession} from './auth';
import {cloudRequest} from './http';
import type {RaidStatus,SocialRaid} from '../social/raids';

type RaidRow={
 id:string;title:string;boss_hp:number|string;damage:number|string;starts_at:string;ends_at:string;status:RaidStatus;
 participant_count:number|string;my_damage:number|string;my_event_count:number|string;my_rank:number|string;
};
export type CloudRaidV3=SocialRaid&{participantCount:number;myDamage:number;myEventCount:number;myRank:number};
export type CloudRaidLeaderboardRow={userId:string;displayName:string;damage:number;verifiedEvents:number;rank:number};
const RAID_STATUSES=new Set<RaidStatus>(['UPCOMING','ACTIVE','DEFEATED','EXPIRED']);

async function session(){const s=await getValidSession();if(!s)throw new Error('Najpierw zaloguj SYSTEM CLOUD.');return s;}
function whole(value:number|string,label:string,min=0){const n=Number(value);if(!Number.isSafeInteger(n)||n<min)throw new Error('Nieprawidłowe dane SYSTEM CLOUD: '+label+'.');return n;}
function validDate(value:string,label:string){if(!value||!Number.isFinite(Date.parse(value)))throw new Error('Nieprawidłowe dane SYSTEM CLOUD: '+label+'.');return value;}
function mapRaid(row:RaidRow):CloudRaidV3{
 const bossHp=whole(row.boss_hp,'raid boss_hp',1),damage=whole(row.damage,'raid damage');
 if(damage>bossHp)throw new Error('Nieprawidłowe dane SYSTEM CLOUD: raid damage.');
 if(!RAID_STATUSES.has(row.status))throw new Error('Nieprawidłowe dane SYSTEM CLOUD: raid status.');
 const startsAt=validDate(row.starts_at,'raid starts_at'),endsAt=validDate(row.ends_at,'raid ends_at');
 if(Date.parse(endsAt)<=Date.parse(startsAt))throw new Error('Nieprawidłowe dane SYSTEM CLOUD: raid window.');
 return{
  id:row.id,title:row.title,bossHp,damage,startsAt,endsAt,status:row.status,
  participantCount:whole(row.participant_count,'raid participant_count'),
  myDamage:whole(row.my_damage,'raid my_damage'),
  myEventCount:whole(row.my_event_count,'raid my_event_count'),
  myRank:whole(row.my_rank,'raid my_rank'),
 };
}

export async function getActiveRaids(){
 const s=await session();
 const rows=await cloudRequest<RaidRow[]>('/rest/v1/rpc/get_active_raids_v3',{method:'POST',body:'{}'},s.accessToken);
 return rows.map(mapRaid);
}
export async function getRaidLeaderboardV3(raidId:string,limit=10){
 if(!raidId.trim())throw new Error('Nieprawidłowy raid.');
 const s=await session();
 const rows=await cloudRequest<{user_id:string;display_name:string;damage:number|string;verified_events:number|string;rank_no:number|string}[]>(
  '/rest/v1/rpc/get_raid_leaderboard_v3',
  {method:'POST',body:JSON.stringify({p_raid:raidId,p_limit:Math.max(1,Math.min(25,Math.floor(limit)))})},
  s.accessToken,
 );
 return rows.map(row=>({
  userId:row.user_id,displayName:String(row.display_name||'PLAYER'),
  damage:whole(row.damage,'raid leaderboard damage'),
  verifiedEvents:whole(row.verified_events,'raid leaderboard events'),
  rank:whole(row.rank_no,'raid leaderboard rank',1),
 })) satisfies CloudRaidLeaderboardRow[];
}
// Legacy manual submission remains server-validated but normal app flow uses automatic reward-ledger routing.
export async function submitRaidDamage(raidId:string,eventKey:string,damage:number){
 if(!raidId.trim())throw new Error('Nieprawidłowy raid.');
 if(!/^verified:[A-Za-z0-9._:-]{1,180}$/.test(eventKey.trim()))throw new Error('Nieprawidłowy klucz zweryfikowanego zdarzenia.');
 if(!Number.isFinite(damage)||damage<0)throw new Error('Nieprawidłowa wartość damage.');
 const s=await session();
 await cloudRequest('/rest/v1/rpc/submit_raid_damage',{method:'POST',body:JSON.stringify({p_raid:raidId,p_event_key:eventKey.trim(),p_damage:Math.floor(damage)})},s.accessToken);
}
