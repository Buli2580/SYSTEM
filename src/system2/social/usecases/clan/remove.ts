export const CLAN_REMOVE_USE_CASE='clan.remove' as const;
export type ClanRemoveInput={actorId:string;targetId?:string};
export type ClanRemoveResult={ok:true}|{ok:false;code:string};
export function validateClanRemove(input:ClanRemoveInput):ClanRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
