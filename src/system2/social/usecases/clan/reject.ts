export const CLAN_REJECT_USE_CASE='clan.reject' as const;
export type ClanRejectInput={actorId:string;targetId?:string};
export type ClanRejectResult={ok:true}|{ok:false;code:string};
export function validateClanReject(input:ClanRejectInput):ClanRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
