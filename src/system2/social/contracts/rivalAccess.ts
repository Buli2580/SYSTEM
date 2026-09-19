export type RivalAccessContract={actorId:string;enabled:boolean};export const validateRivalAccess=(v:RivalAccessContract)=>v.actorId.trim().length>0&&v.enabled;
