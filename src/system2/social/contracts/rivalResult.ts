export type RivalResultContract={actorId:string;enabled:boolean};export const validateRivalResult=(v:RivalResultContract)=>v.actorId.trim().length>0&&v.enabled;
