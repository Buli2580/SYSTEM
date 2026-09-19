export const CLAN_JOIN_USE_CASE='clan.join' as const;
export type ClanJoinInput={actorId:string;targetId?:string};
export type ClanJoinResult={ok:true}|{ok:false;code:string};
export function validateClanJoin(input:ClanJoinInput):ClanJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
