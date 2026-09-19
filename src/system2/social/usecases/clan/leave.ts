export const CLAN_LEAVE_USE_CASE='clan.leave' as const;
export type ClanLeaveInput={actorId:string;targetId?:string};
export type ClanLeaveResult={ok:true}|{ok:false;code:string};
export function validateClanLeave(input:ClanLeaveInput):ClanLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
