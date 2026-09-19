/** SYSTEM Network matchmaking/validator. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_VALIDATOR_MODULE='matchmaking.validator' as const;
export type MatchmakingValidatorContext={actorId:string;now:string};
export function isMatchmakingValidatorContext(v:unknown):v is MatchmakingValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
