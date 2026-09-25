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

export type SeasonV3Row={
  id:string;name:string;starts_at:string;ends_at:string;
  verified_events:number|string;season_points:number|string;track_level:number|string;
  claimed_levels:number[]|null;next_reward_level:number|string|null;
  global_players:number|string;global_points:number|string;
};
export type SeasonV2Snapshot={
  id:string;name:string;startsAt:string;endsAt:string;
  verifiedEvents:number;seasonPoints:number;trackLevel:number;
  claimedLevels:number[];nextRewardLevel:number|null;globalPlayers:number;globalPoints:number;
};
function safeSeasonNumber(value:number|string,label:string){
  const n=Number(value);if(!Number.isSafeInteger(n)||n<0)throw new Error('Nieprawidłowe dane SYSTEM CLOUD: '+label+'.');return n;
}
export async function getCurrentSeasonV2():Promise<SeasonV2Snapshot|null>{
  const s=await getValidSession();if(!s)throw new Error('Najpierw zaloguj SYSTEM CLOUD.');
  const rows=await cloudRequest<SeasonV3Row[]>('/rest/v1/rpc/get_current_season_v3',{method:'POST',body:'{}'},s.accessToken);
  const row=rows[0];if(!row)return null;
  const mapped=mapSeason({id:row.id,name:row.name,starts_at:row.starts_at,ends_at:row.ends_at});
  const claimed=Array.isArray(row.claimed_levels)?row.claimed_levels.filter(x=>[5,15,30,50].includes(Number(x))).map(Number):[];
  return{
    ...mapped,
    verifiedEvents:safeSeasonNumber(row.verified_events,'season verified_events'),
    seasonPoints:safeSeasonNumber(row.season_points,'season points'),
    trackLevel:safeSeasonNumber(row.track_level,'season track_level'),
    claimedLevels:claimed,
    nextRewardLevel:row.next_reward_level===null?null:safeSeasonNumber(row.next_reward_level,'season next reward'),
    globalPlayers:safeSeasonNumber(row.global_players,'season global players'),
    globalPoints:safeSeasonNumber(row.global_points,'season global points'),
  };
}
export async function claimSeasonRewardV3(level:number){
  if(![5,15,30,50].includes(level))throw new Error('Nieprawidłowy milestone sezonu.');
  const s=await getValidSession();if(!s)throw new Error('Najpierw zaloguj SYSTEM CLOUD.');
  return cloudRequest<number>('/rest/v1/rpc/claim_season_reward_v3',{method:'POST',body:JSON.stringify({p_level:level})},s.accessToken);
}
