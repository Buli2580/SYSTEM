export const PRESENCE_JOIN_USE_CASE='presence.join' as const;
export type PresenceJoinInput={actorId:string;targetId?:string};
export type PresenceJoinResult={ok:true}|{ok:false;code:string};
export function validatePresenceJoin(input:PresenceJoinInput):PresenceJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
