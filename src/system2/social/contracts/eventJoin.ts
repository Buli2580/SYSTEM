export type EventJoinContract={actorId:string;enabled:boolean};export const validateEventJoin=(v:EventJoinContract)=>v.actorId.trim().length>0&&v.enabled;
