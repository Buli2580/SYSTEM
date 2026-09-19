/** SYSTEM Network discovery/service. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_SERVICE_MODULE='discovery.service' as const;
export type DiscoveryServiceContext={actorId:string;now:string};
export function isDiscoveryServiceContext(v:unknown):v is DiscoveryServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
