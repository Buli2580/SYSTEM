export type ModerationAccessContract={actorId:string;enabled:boolean};export const validateModerationAccess=(v:ModerationAccessContract)=>v.actorId.trim().length>0&&v.enabled;
