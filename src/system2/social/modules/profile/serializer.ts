/** SYSTEM Network profile/serializer. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_SERIALIZER_MODULE='profile.serializer' as const;
export type ProfileSerializerContext={actorId:string;now:string};
export function isProfileSerializerContext(v:unknown):v is ProfileSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
