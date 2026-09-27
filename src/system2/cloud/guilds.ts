import {getValidSession} from './auth';
import {cloudRequest} from './http';
import type {Guild} from '../social/guilds';

type GuildRow={id:string;name:string;tag:string;owner_id:string;member_count:number|string;level:number|string;xp:number|string;visibility:Guild['visibility']};
const VISIBILITY=new Set<Guild['visibility']>(['PUBLIC','INVITE_ONLY']);

async function session(){const s=await getValidSession();if(!s)throw new Error('Najpierw zaloguj SYSTEM CLOUD.');return s;}
function whole(value:number|string,label:string,min=0){const n=Number(value);if(!Number.isSafeInteger(n)||n<min)throw new Error('Nieprawidłowe dane SYSTEM CLOUD: '+label+'.');return n;}

function mapGuild(row:GuildRow):Guild{
 if(!row.id||!row.name||!row.tag||!row.owner_id)throw new Error('Nieprawidłowe dane SYSTEM CLOUD: guild identity.');
 if(!VISIBILITY.has(row.visibility))throw new Error('Nieprawidłowe dane SYSTEM CLOUD: guild visibility.');
 return{id:row.id,name:row.name,tag:row.tag,ownerId:row.owner_id,memberCount:whole(row.member_count,'guild member_count',1),level:whole(row.level,'guild level',1),xp:whole(row.xp,'guild xp'),visibility:row.visibility};
}

export async function listGuilds(){
 const s=await session();
 const rows=await cloudRequest<GuildRow[]>('/rest/v1/guilds?select=id,name,tag,owner_id,member_count,level,xp,visibility&order=xp.desc&limit=50',{method:'GET'},s.accessToken);
 return rows.map(mapGuild);
}
export async function joinGuild(id:string){const key=id.trim();if(!key)throw new Error('Nieprawidłowa gildia.');const s=await session();await cloudRequest('/rest/v1/rpc/join_guild',{method:'POST',body:JSON.stringify({p_guild:key})},s.accessToken);}
