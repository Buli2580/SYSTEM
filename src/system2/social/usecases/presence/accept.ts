export const PRESENCE_ACCEPT_USE_CASE='presence.accept' as const;
export type PresenceAcceptInput={actorId:string;targetId?:string};
export type PresenceAcceptResult={ok:true}|{ok:false;code:string};
export function validatePresenceAccept(input:PresenceAcceptInput):PresenceAcceptResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
