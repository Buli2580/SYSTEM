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

export type SeasonV2Row={
  id:string;name:string;starts_at:string;ends_at:string;
  verified_events:number|string;season_points:number|string;track_level:number|string;
};
export type SeasonV2Snapshot={
  id:string;name:string;startsAt:string;endsAt:string;
  verifiedEvents:number;seasonPoints:number;trackLevel:number;
};
function safeSeasonNumber(value:number|string,label:string){
  const n=Number(value);if(!Number.isSafeInteger(n)||n<0)throw new Error('Nieprawidłowe dane SYSTEM CLOUD: '+label+'.');return n;
}
export async function getCurrentSeasonV2():Promise<SeasonV2Snapshot|null>{
  const s=await getValidSession();if(!s)throw new Error('Najpierw zaloguj SYSTEM CLOUD.');
  const rows=await cloudRequest<SeasonV2Row[]>('/rest/v1/rpc/get_current_season_v2',{method:'POST',body:'{}'},s.accessToken);
  const row=rows[0];if(!row)return null;
  const mapped=mapSeason({id:row.id,name:row.name,starts_at:row.starts_at,ends_at:row.ends_at});
  return{
    ...mapped,
    verifiedEvents:safeSeasonNumber(row.verified_events,'season verified_events'),
    seasonPoints:safeSeasonNumber(row.season_points,'season points'),
    trackLevel:safeSeasonNumber(row.track_level,'season track_level'),
  };
}
