/** SYSTEM Network friends/reducer. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_REDUCER_MODULE='friends.reducer' as const;
export type FriendsReducerContext={actorId:string;now:string};
export function isFriendsReducerContext(v:unknown):v is FriendsReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
