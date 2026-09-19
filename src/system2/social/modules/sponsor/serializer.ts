/** SYSTEM Network sponsor/serializer. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_SERIALIZER_MODULE='sponsor.serializer' as const;
export type SponsorSerializerContext={actorId:string;now:string};
export function isSponsorSerializerContext(v:unknown):v is SponsorSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
