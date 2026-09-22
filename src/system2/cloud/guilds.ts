import {getValidSession} from './auth';
import {cloudRequest} from './http';
import type {Guild} from '../social/guilds';

type GuildRow={id:string;name:string;tag:string;owner_id:string;member_count:number;level:number;xp:number;visibility:Guild['visibility']};

async function session(){const s=await getValidSession();if(!s)throw new Error('Najpierw zaloguj SYSTEM CLOUD.');return s;}

function mapGuild(row:GuildRow):Guild{
  return{id:row.id,name:row.name,tag:row.tag,ownerId:row.owner_id,memberCount:Number(row.member_count)||0,level:Number(row.level)||1,xp:Number(row.xp)||0,visibility:row.visibility};
}

export async function listGuilds(){
  const s=await session();
  const rows=await cloudRequest<GuildRow[]>('/rest/v1/guilds?select=id,name,tag,owner_id,member_count,level,xp,visibility&order=xp.desc&limit=50',{method:'GET'},s.accessToken);
  return rows.map(mapGuild);
}
export async function joinGuild(id:string){const s=await session();await cloudRequest('/rest/v1/rpc/join_guild',{method:'POST',body:JSON.stringify({p_guild:id})},s.accessToken);}
