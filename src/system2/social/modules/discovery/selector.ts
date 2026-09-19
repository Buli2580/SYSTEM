/** SYSTEM Network discovery/selector. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_SELECTOR_MODULE='discovery.selector' as const;
export type DiscoverySelectorContext={actorId:string;now:string};
export function isDiscoverySelectorContext(v:unknown):v is DiscoverySelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
