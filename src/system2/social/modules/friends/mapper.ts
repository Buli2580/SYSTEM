/** SYSTEM Network friends/mapper. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_MAPPER_MODULE='friends.mapper' as const;
export type FriendsMapperContext={actorId:string;now:string};
export function isFriendsMapperContext(v:unknown):v is FriendsMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
