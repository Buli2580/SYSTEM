/** SYSTEM Network presence/errors. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_ERRORS_MODULE='presence.errors' as const;
export type PresenceErrorsContext={actorId:string;now:string};
export function isPresenceErrorsContext(v:unknown):v is PresenceErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
