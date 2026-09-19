export type ModerationMuteContract={actorId:string;enabled:boolean};export const validateModerationMute=(v:ModerationMuteContract)=>v.actorId.trim().length>0&&v.enabled;
