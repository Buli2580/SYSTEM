export const MODERATION_REJECT_USE_CASE='moderation.reject' as const;
export type ModerationRejectInput={actorId:string;targetId?:string};
export type ModerationRejectResult={ok:true}|{ok:false;code:string};
export function validateModerationReject(input:ModerationRejectInput):ModerationRejectResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
