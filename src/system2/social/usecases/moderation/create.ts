export const MODERATION_CREATE_USE_CASE='moderation.create' as const;
export type ModerationCreateInput={actorId:string;targetId?:string};
export type ModerationCreateResult={ok:true}|{ok:false;code:string};
export function validateModerationCreate(input:ModerationCreateInput):ModerationCreateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
