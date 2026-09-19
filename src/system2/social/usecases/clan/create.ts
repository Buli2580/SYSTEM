export const CLAN_CREATE_USE_CASE='clan.create' as const;
export type ClanCreateInput={actorId:string;targetId?:string};
export type ClanCreateResult={ok:true}|{ok:false;code:string};
export function validateClanCreate(input:ClanCreateInput):ClanCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
