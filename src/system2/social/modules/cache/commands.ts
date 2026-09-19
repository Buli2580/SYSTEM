/** SYSTEM Network cache/commands. Concrete extension seam; intentionally dependency-free. */
export const CACHE_COMMANDS_MODULE='cache.commands' as const;
export type CacheCommandsContext={actorId:string;now:string};
export function isCacheCommandsContext(v:unknown):v is CacheCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
