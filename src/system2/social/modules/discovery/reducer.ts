/** SYSTEM Network discovery/reducer. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_REDUCER_MODULE='discovery.reducer' as const;
export type DiscoveryReducerContext={actorId:string;now:string};
export function isDiscoveryReducerContext(v:unknown):v is DiscoveryReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
