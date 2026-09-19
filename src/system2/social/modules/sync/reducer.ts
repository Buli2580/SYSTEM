/** SYSTEM Network sync/reducer. Concrete extension seam; intentionally dependency-free. */
export const SYNC_REDUCER_MODULE='sync.reducer' as const;
export type SyncReducerContext={actorId:string;now:string};
export function isSyncReducerContext(v:unknown):v is SyncReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
