export const PRESENCE_REJECT_USE_CASE='presence.reject' as const;
export type PresenceRejectInput={actorId:string;targetId?:string};
export type PresenceRejectResult={ok:true}|{ok:false;code:string};
export function validatePresenceReject(input:PresenceRejectInput):PresenceRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
