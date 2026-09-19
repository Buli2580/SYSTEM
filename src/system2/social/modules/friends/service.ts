/** SYSTEM Network friends/service. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_SERVICE_MODULE='friends.service' as const;
export type FriendsServiceContext={actorId:string;now:string};
export function isFriendsServiceContext(v:unknown):v is FriendsServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
