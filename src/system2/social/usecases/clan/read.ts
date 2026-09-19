export const CLAN_READ_USE_CASE='clan.read' as const;
export type ClanReadInput={actorId:string;targetId?:string};
export type ClanReadResult={ok:true}|{ok:false;code:string};
export function validateClanRead(input:ClanReadInput):ClanReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
