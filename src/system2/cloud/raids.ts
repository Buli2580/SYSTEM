import {getValidSession} from './auth';
import {cloudRequest} from './http';
import type {RaidStatus,SocialRaid} from '../social/raids';

type RaidRow={id:string;title:string;boss_hp:number|string;damage:number|string;starts_at:string;ends_at:string;status:RaidStatus};

async function session(){const s=await getValidSession();if(!s)throw new Error('Najpierw zaloguj SYSTEM CLOUD.');return s;}
function mapRaid(row:RaidRow):SocialRaid{return{id:row.id,title:row.title,bossHp:Number(row.boss_hp)||0,damage:Number(row.damage)||0,startsAt:row.starts_at,endsAt:row.ends_at,status:row.status};}

export async function getActiveRaids(){const s=await session();const rows=await cloudRequest<RaidRow[]>('/rest/v1/rpc/get_active_raids',{method:'POST',body:'{}'},s.accessToken);return rows.map(mapRaid);}
export async function submitRaidDamage(raidId:string,eventKey:string,damage:number){const s=await session();await cloudRequest('/rest/v1/rpc/submit_raid_damage',{method:'POST',body:JSON.stringify({p_raid:raidId,p_event_key:eventKey,p_damage:Math.max(0,Math.floor(damage))})},s.accessToken);}
