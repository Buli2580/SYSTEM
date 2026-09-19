export type RivalMatchContract={actorId:string;enabled:boolean};export const validateRivalMatch=(v:RivalMatchContract)=>v.actorId.trim().length>0&&v.enabled;
