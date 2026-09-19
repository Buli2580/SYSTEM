/** SYSTEM Network sync/selector. Concrete extension seam; intentionally dependency-free. */
export const SYNC_SELECTOR_MODULE='sync.selector' as const;
export type SyncSelectorContext={actorId:string;now:string};
export function isSyncSelectorContext(v:unknown):v is SyncSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
