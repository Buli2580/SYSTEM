export type RaidAccessContract={actorId:string;enabled:boolean};export const validateRaidAccess=(v:RaidAccessContract)=>v.actorId.trim().length>0&&v.enabled;
