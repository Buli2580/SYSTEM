/** SYSTEM Network discovery/errors. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_ERRORS_MODULE='discovery.errors' as const;
export type DiscoveryErrorsContext={actorId:string;now:string};
export function isDiscoveryErrorsContext(v:unknown):v is DiscoveryErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
