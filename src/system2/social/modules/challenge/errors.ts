/** SYSTEM Network challenge/errors. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_ERRORS_MODULE='challenge.errors' as const;
export type ChallengeErrorsContext={actorId:string;now:string};
export function isChallengeErrorsContext(v:unknown):v is ChallengeErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
