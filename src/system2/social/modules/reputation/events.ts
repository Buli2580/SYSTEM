/** SYSTEM Network reputation/events. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_EVENTS_MODULE='reputation.events' as const;
export type ReputationEventsContext={actorId:string;now:string};
export function isReputationEventsContext(v:unknown):v is ReputationEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
