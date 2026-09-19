/** SYSTEM Network presence/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_LIFECYCLE_MODULE='presence.lifecycle' as const;
export type PresenceLifecycleContext={actorId:string;now:string};
export function isPresenceLifecycleContext(v:unknown):v is PresenceLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
