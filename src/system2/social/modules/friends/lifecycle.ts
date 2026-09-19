/** SYSTEM Network friends/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_LIFECYCLE_MODULE='friends.lifecycle' as const;
export type FriendsLifecycleContext={actorId:string;now:string};
export function isFriendsLifecycleContext(v:unknown):v is FriendsLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
