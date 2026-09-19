export type PresenceStatusContract={actorId:string;enabled:boolean};export const validatePresenceStatus=(v:PresenceStatusContract)=>v.actorId.trim().length>0&&v.enabled;
