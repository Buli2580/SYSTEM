export type RaidDamageContract={actorId:string;enabled:boolean};export const validateRaidDamage=(v:RaidDamageContract)=>v.actorId.trim().length>0&&v.enabled;
