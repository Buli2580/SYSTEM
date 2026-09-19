export const MODERATION_CLAIM_USE_CASE='moderation.claim' as const;
export type ModerationClaimInput={actorId:string;targetId?:string};
export type ModerationClaimResult={ok:true}|{ok:false;code:string};
export function validateModerationClaim(input:ModerationClaimInput):ModerationClaimResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
