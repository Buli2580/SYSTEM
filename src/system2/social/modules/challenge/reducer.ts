/** SYSTEM Network challenge/reducer. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_REDUCER_MODULE='challenge.reducer' as const;
export type ChallengeReducerContext={actorId:string;now:string};
export function isChallengeReducerContext(v:unknown):v is ChallengeReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
