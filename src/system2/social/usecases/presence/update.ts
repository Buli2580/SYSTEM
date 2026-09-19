export const PRESENCE_UPDATE_USE_CASE='presence.update' as const;
export type PresenceUpdateInput={actorId:string;targetId?:string};
export type PresenceUpdateResult={ok:true}|{ok:false;code:string};
export function validatePresenceUpdate(input:PresenceUpdateInput):PresenceUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
