export type RaidHistoryContract={actorId:string;enabled:boolean};export const validateRaidHistory=(v:RaidHistoryContract)=>v.actorId.trim().length>0&&v.enabled;
