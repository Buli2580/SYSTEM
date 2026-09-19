/** SYSTEM Network presence/types. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_TYPES_MODULE='presence.types' as const;
export type PresenceTypesContext={actorId:string;now:string};
export function isPresenceTypesContext(v:unknown):v is PresenceTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
