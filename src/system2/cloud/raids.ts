import {getValidSession} from './auth';
import {cloudRequest} from './http';
import type {RaidStatus,SocialRaid} from '../social/raids';

type RaidRow={id:string;title:string;boss_hp:number|string;damage:number|string;starts_at:string;ends_at:string;status:RaidStatus};
const RAID_STATUSES=new Set<RaidStatus>(['UPCOMING','ACTIVE','DEFEATED','EXPIRED']);

async function session(){const s=await getValidSession();if(!s)throw new Error('Najpierw zaloguj SYSTEM CLOUD.');return s;}
function finiteNumber(value:number|string,label:string,min=0){const n=Number(value);if(!Number.isFinite(n)||n<min)throw new Error('Nieprawidłowe dane SYSTEM CLOUD: '+label+'.');return n;}
function validDate(value:string,label:string){if(!value||!Number.isFinite(Date.parse(value)))throw new Error('Nieprawidłowe dane SYSTEM CLOUD: '+label+'.');return value;}
function mapRaid(row:RaidRow):SocialRaid{
 const bossHp=finiteNumber(row.boss_hp,'raid boss_hp',Number.EPSILON),damage=finiteNumber(row.damage,'raid damage');
 if(damage>bossHp)throw new Error('Nieprawidłowe dane SYSTEM CLOUD: raid damage.');
 if(!RAID_STATUSES.has(row.status))throw new Error('Nieprawidłowe dane SYSTEM CLOUD: raid status.');
 const startsAt=validDate(row.starts_at,'raid starts_at'),endsAt=validDate(row.ends_at,'raid ends_at');
 if(endsAt<=startsAt)throw new Error('Nieprawidłowe dane SYSTEM CLOUD: raid window.');
 return{id:row.id,title:row.title,bossHp,damage,startsAt,endsAt,status:row.status};
}

export async function getActiveRaids(){const s=await session();const rows=await cloudRequest<RaidRow[]>('/rest/v1/rpc/get_active_raids',{method:'POST',body:'{}'},s.accessToken);return rows.map(mapRaid);}
export async function submitRaidDamage(raidId:string,eventKey:string,damage:number){
 if(!raidId.trim())throw new Error('Nieprawidłowy raid.');
 if(!/^verified:[A-Za-z0-9._:-]{1,180}$/.test(eventKey.trim()))throw new Error('Nieprawidłowy klucz zweryfikowanego zdarzenia.');
 if(!Number.isFinite(damage)||damage<0)throw new Error('Nieprawidłowa wartość damage.');
 const s=await session();
 await cloudRequest('/rest/v1/rpc/submit_raid_damage',{method:'POST',body:JSON.stringify({p_raid:raidId,p_event_key:eventKey.trim(),p_damage:Math.floor(damage)})},s.accessToken);
}
