export const MODERATION_REMOVE_USE_CASE='moderation.remove' as const;
export type ModerationRemoveInput={actorId:string;targetId?:string};
export type ModerationRemoveResult={ok:true}|{ok:false;code:string};
export function validateModerationRemove(input:ModerationRemoveInput):ModerationRemoveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
