export const MODERATION_JOIN_USE_CASE='moderation.join' as const;
export type ModerationJoinInput={actorId:string;targetId?:string};
export type ModerationJoinResult={ok:true}|{ok:false;code:string};
export function validateModerationJoin(input:ModerationJoinInput):ModerationJoinResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
