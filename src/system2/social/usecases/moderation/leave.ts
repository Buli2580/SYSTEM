export const MODERATION_LEAVE_USE_CASE='moderation.leave' as const;
export type ModerationLeaveInput={actorId:string;targetId?:string};
export type ModerationLeaveResult={ok:true}|{ok:false;code:string};
export function validateModerationLeave(input:ModerationLeaveInput):ModerationLeaveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
