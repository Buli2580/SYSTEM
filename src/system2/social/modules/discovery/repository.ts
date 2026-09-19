/** SYSTEM Network discovery/repository. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_REPOSITORY_MODULE='discovery.repository' as const;
export type DiscoveryRepositoryContext={actorId:string;now:string};
export function isDiscoveryRepositoryContext(v:unknown):v is DiscoveryRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
