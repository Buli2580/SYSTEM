export type ModerationReportContract={actorId:string;enabled:boolean};export const validateModerationReport=(v:ModerationReportContract)=>v.actorId.trim().length>0&&v.enabled;
