export const CLAN_ACCEPT_USE_CASE='clan.accept' as const;
export type ClanAcceptInput={actorId:string;targetId?:string};
export type ClanAcceptResult={ok:true}|{ok:false;code:string};
export function validateClanAccept(input:ClanAcceptInput):ClanAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
