/** SYSTEM Network discovery/mapper. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_MAPPER_MODULE='discovery.mapper' as const;
export type DiscoveryMapperContext={actorId:string;now:string};
export function isDiscoveryMapperContext(v:unknown):v is DiscoveryMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
