/** SYSTEM Network offline/state. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_STATE_MODULE='offline.state' as const;
export type OfflineStateContext={actorId:string;now:string};
export function isOfflineStateContext(v:unknown):v is OfflineStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
