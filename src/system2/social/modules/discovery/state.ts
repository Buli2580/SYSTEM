/** SYSTEM Network discovery/state. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_STATE_MODULE='discovery.state' as const;
export type DiscoveryStateContext={actorId:string;now:string};
export function isDiscoveryStateContext(v:unknown):v is DiscoveryStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
