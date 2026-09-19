/** SYSTEM Network offline/mapper. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_MAPPER_MODULE='offline.mapper' as const;
export type OfflineMapperContext={actorId:string;now:string};
export function isOfflineMapperContext(v:unknown):v is OfflineMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
