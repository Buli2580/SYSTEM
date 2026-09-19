export const MODERATION_VERIFY_USE_CASE='moderation.verify' as const;
export type ModerationVerifyInput={actorId:string;targetId?:string};
export type ModerationVerifyResult={ok:true}|{ok:false;code:string};
export function validateModerationVerify(input:ModerationVerifyInput):ModerationVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
