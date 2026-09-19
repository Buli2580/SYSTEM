export type ModerationBlockContract={actorId:string;enabled:boolean};export const validateModerationBlock=(v:ModerationBlockContract)=>v.actorId.trim().length>0&&v.enabled;
