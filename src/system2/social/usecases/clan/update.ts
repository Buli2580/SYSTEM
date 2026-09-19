export const CLAN_UPDATE_USE_CASE='clan.update' as const;
export type ClanUpdateInput={actorId:string;targetId?:string};
export type ClanUpdateResult={ok:true}|{ok:false;code:string};
export function validateClanUpdate(input:ClanUpdateInput):ClanUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
