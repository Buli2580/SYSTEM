import {getValidSession} from './auth';
import {cloudRequest} from './http';
import type {SocialSeason} from '../social/seasons';

type SeasonRow={id:string;name:string;starts_at:string;ends_at:string};

function mapSeason(row:SeasonRow):SocialSeason{
  if(!row?.id?.trim()||!row?.name?.trim())throw new Error('Nieprawidłowe dane SYSTEM CLOUD: season identity.');
  const start=Date.parse(row.starts_at),end=Date.parse(row.ends_at);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)throw new Error('Nieprawidłowe dane SYSTEM CLOUD: season window.');
  return{id:row.id,name:row.name,startsAt:row.starts_at,endsAt:row.ends_at};
}

export async function getCurrentSeason(){
  const s=await getValidSession();if(!s)throw new Error('Najpierw zaloguj SYSTEM CLOUD.');
  const now=encodeURIComponent(new Date().toISOString());
  const rows=await cloudRequest<SeasonRow[]>('/rest/v1/seasons?select=id,name,starts_at,ends_at&starts_at=lte.'+now+'&ends_at=gt.'+now+'&order=starts_at.desc&limit=1',{method:'GET'},s.accessToken);
  return rows[0]?mapSeason(rows[0]):null;
}
