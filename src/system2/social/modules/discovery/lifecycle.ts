/** SYSTEM Network discovery/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_LIFECYCLE_MODULE='discovery.lifecycle' as const;
export type DiscoveryLifecycleContext={actorId:string;now:string};
export function isDiscoveryLifecycleContext(v:unknown):v is DiscoveryLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
