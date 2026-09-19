/** SYSTEM Network discovery/types. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_TYPES_MODULE='discovery.types' as const;
export type DiscoveryTypesContext={actorId:string;now:string};
export function isDiscoveryTypesContext(v:unknown):v is DiscoveryTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
