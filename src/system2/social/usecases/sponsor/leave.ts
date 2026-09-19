export const SPONSOR_LEAVE_USE_CASE='sponsor.leave' as const;
export type SponsorLeaveInput={actorId:string;targetId?:string};
export type SponsorLeaveResult={ok:true}|{ok:false;code:string};
export function validateSponsorLeave(input:SponsorLeaveInput):SponsorLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
