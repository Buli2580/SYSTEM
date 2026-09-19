/** SYSTEM Network challenge/service. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_SERVICE_MODULE='challenge.service' as const;
export type ChallengeServiceContext={actorId:string;now:string};
export function isChallengeServiceContext(v:unknown):v is ChallengeServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
