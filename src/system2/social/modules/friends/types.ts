/** SYSTEM Network friends/types. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_TYPES_MODULE='friends.types' as const;
export type FriendsTypesContext={actorId:string;now:string};
export function isFriendsTypesContext(v:unknown):v is FriendsTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
