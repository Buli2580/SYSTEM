export const RAID_READ_USE_CASE='raid.read' as const;
export type RaidReadInput={actorId:string;targetId?:string};
export type RaidReadResult={ok:true}|{ok:false;code:string};
export function validateRaidRead(input:RaidReadInput):RaidReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
