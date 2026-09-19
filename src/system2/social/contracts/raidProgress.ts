export type RaidProgressContract={actorId:string;enabled:boolean};export const validateRaidProgress=(v:RaidProgressContract)=>v.actorId.trim().length>0&&v.enabled;
