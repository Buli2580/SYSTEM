/** SYSTEM Network challenge/eligibility. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_ELIGIBILITY_MODULE='challenge.eligibility' as const;
export type ChallengeEligibilityContext={actorId:string;now:string};
export function isChallengeEligibilityContext(v:unknown):v is ChallengeEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
