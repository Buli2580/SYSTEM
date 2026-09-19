export const PRESENCE_CREATE_USE_CASE='presence.create' as const;
export type PresenceCreateInput={actorId:string;targetId?:string};
export type PresenceCreateResult={ok:true}|{ok:false;code:string};
export function validatePresenceCreate(input:PresenceCreateInput):PresenceCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
