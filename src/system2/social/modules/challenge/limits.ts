/** SYSTEM Network challenge/limits. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_LIMITS_MODULE='challenge.limits' as const;
export type ChallengeLimitsContext={actorId:string;now:string};
export function isChallengeLimitsContext(v:unknown):v is ChallengeLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
