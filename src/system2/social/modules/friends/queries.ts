/** SYSTEM Network friends/queries. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_QUERIES_MODULE='friends.queries' as const;
export type FriendsQueriesContext={actorId:string;now:string};
export function isFriendsQueriesContext(v:unknown):v is FriendsQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
