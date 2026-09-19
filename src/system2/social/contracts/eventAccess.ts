export type EventAccessContract={actorId:string;enabled:boolean};export const validateEventAccess=(v:EventAccessContract)=>v.actorId.trim().length>0&&v.enabled;
