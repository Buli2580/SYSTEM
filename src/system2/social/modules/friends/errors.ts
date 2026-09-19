/** SYSTEM Network friends/errors. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_ERRORS_MODULE='friends.errors' as const;
export type FriendsErrorsContext={actorId:string;now:string};
export function isFriendsErrorsContext(v:unknown):v is FriendsErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
