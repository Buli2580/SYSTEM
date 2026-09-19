export const PRESENCE_LEAVE_USE_CASE='presence.leave' as const;
export type PresenceLeaveInput={actorId:string;targetId?:string};
export type PresenceLeaveResult={ok:true}|{ok:false;code:string};
export function validatePresenceLeave(input:PresenceLeaveInput):PresenceLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
