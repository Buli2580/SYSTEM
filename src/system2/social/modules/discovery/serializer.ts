/** SYSTEM Network discovery/serializer. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_SERIALIZER_MODULE='discovery.serializer' as const;
export type DiscoverySerializerContext={actorId:string;now:string};
export function isDiscoverySerializerContext(v:unknown):v is DiscoverySerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
