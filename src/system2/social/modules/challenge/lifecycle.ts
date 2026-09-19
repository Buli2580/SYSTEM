/** SYSTEM Network challenge/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_LIFECYCLE_MODULE='challenge.lifecycle' as const;
export type ChallengeLifecycleContext={actorId:string;now:string};
export function isChallengeLifecycleContext(v:unknown):v is ChallengeLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
