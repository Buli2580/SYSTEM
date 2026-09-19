export const PRESENCE_VERIFY_USE_CASE='presence.verify' as const;
export type PresenceVerifyInput={actorId:string;targetId?:string};
export type PresenceVerifyResult={ok:true}|{ok:false;code:string};
export function validatePresenceVerify(input:PresenceVerifyInput):PresenceVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
