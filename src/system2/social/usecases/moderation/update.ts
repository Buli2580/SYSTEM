export const MODERATION_UPDATE_USE_CASE='moderation.update' as const;
export type ModerationUpdateInput={actorId:string;targetId?:string};
export type ModerationUpdateResult={ok:true}|{ok:false;code:string};
export function validateModerationUpdate(input:ModerationUpdateInput):ModerationUpdateResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
