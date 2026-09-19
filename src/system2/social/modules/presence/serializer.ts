/** SYSTEM Network presence/serializer. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_SERIALIZER_MODULE='presence.serializer' as const;
export type PresenceSerializerContext={actorId:string;now:string};
export function isPresenceSerializerContext(v:unknown):v is PresenceSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
