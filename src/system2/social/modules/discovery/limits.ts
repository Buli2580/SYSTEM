/** SYSTEM Network discovery/limits. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_LIMITS_MODULE='discovery.limits' as const;
export type DiscoveryLimitsContext={actorId:string;now:string};
export function isDiscoveryLimitsContext(v:unknown):v is DiscoveryLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
