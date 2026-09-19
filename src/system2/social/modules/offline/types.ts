/** SYSTEM Network offline/types. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_TYPES_MODULE='offline.types' as const;
export type OfflineTypesContext={actorId:string;now:string};
export function isOfflineTypesContext(v:unknown):v is OfflineTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
