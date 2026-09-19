export const PRESENCE_READ_USE_CASE='presence.read' as const;
export type PresenceReadInput={actorId:string;targetId?:string};
export type PresenceReadResult={ok:true}|{ok:false;code:string};
export function validatePresenceRead(input:PresenceReadInput):PresenceReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
