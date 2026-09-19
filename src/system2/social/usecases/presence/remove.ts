export const PRESENCE_REMOVE_USE_CASE='presence.remove' as const;
export type PresenceRemoveInput={actorId:string;targetId?:string};
export type PresenceRemoveResult={ok:true}|{ok:false;code:string};
export function validatePresenceRemove(input:PresenceRemoveInput):PresenceRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
