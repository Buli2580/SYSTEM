/** SYSTEM Network friends/selector. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_SELECTOR_MODULE='friends.selector' as const;
export type FriendsSelectorContext={actorId:string;now:string};
export function isFriendsSelectorContext(v:unknown):v is FriendsSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
