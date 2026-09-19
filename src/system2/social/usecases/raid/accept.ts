export const RAID_ACCEPT_USE_CASE='raid.accept' as const;
export type RaidAcceptInput={actorId:string;targetId?:string};
export type RaidAcceptResult={ok:true}|{ok:false;code:string};
export function validateRaidAccept(input:RaidAcceptInput):RaidAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
