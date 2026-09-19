/** SYSTEM Network offline/selector. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_SELECTOR_MODULE='offline.selector' as const;
export type OfflineSelectorContext={actorId:string;now:string};
export function isOfflineSelectorContext(v:unknown):v is OfflineSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
