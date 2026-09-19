/** SYSTEM Network presence/state. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_STATE_MODULE='presence.state' as const;
export type PresenceStateContext={actorId:string;now:string};
export function isPresenceStateContext(v:unknown):v is PresenceStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
