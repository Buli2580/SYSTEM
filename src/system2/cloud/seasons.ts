import {getValidSession} from './auth';
import {cloudRequest} from './http';
import type {SocialSeason} from '../social/seasons';

type SeasonRow={id:string;name:string;starts_at:string;ends_at:string};

export async function getCurrentSeason(){
  const s=await getValidSession();if(!s)throw new Error('Najpierw zaloguj SYSTEM CLOUD.');
  const now=encodeURIComponent(new Date().toISOString());
  const rows=await cloudRequest<SeasonRow[]>('/rest/v1/seasons?select=id,name,starts_at,ends_at&starts_at=lte.'+now+'&ends_at=gt.'+now+'&order=starts_at.desc&limit=1',{method:'GET'},s.accessToken);
  const row=rows[0];
  return row?{id:row.id,name:row.name,startsAt:row.starts_at,endsAt:row.ends_at} satisfies SocialSeason:null;
}
