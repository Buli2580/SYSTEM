/** SYSTEM Network friends/serializer. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_SERIALIZER_MODULE='friends.serializer' as const;
export type FriendsSerializerContext={actorId:string;now:string};
export function isFriendsSerializerContext(v:unknown):v is FriendsSerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
