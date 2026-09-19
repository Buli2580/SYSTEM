/** SYSTEM Network rival/reducer. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_REDUCER_MODULE='rival.reducer' as const;
export type RivalReducerContext={actorId:string;now:string};
export function isRivalReducerContext(v:unknown):v is RivalReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
