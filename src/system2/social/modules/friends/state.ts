/** SYSTEM Network friends/state. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_STATE_MODULE='friends.state' as const;
export type FriendsStateContext={actorId:string;now:string};
export function isFriendsStateContext(v:unknown):v is FriendsStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
