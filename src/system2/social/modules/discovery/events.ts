/** SYSTEM Network discovery/events. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_EVENTS_MODULE='discovery.events' as const;
export type DiscoveryEventsContext={actorId:string;now:string};
export function isDiscoveryEventsContext(v:unknown):v is DiscoveryEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
