/** SYSTEM Network reputation/reducer. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_REDUCER_MODULE='reputation.reducer' as const;
export type ReputationReducerContext={actorId:string;now:string};
export function isReputationReducerContext(v:unknown):v is ReputationReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
