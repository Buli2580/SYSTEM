/** SYSTEM Network challenge/queries. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_QUERIES_MODULE='challenge.queries' as const;
export type ChallengeQueriesContext={actorId:string;now:string};
export function isChallengeQueriesContext(v:unknown):v is ChallengeQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
