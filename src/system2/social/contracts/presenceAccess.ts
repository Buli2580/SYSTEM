export type PresenceAccessContract={actorId:string;enabled:boolean};export const validatePresenceAccess=(v:PresenceAccessContract)=>v.actorId.trim().length>0&&v.enabled;
