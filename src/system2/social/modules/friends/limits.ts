/** SYSTEM Network friends/limits. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_LIMITS_MODULE='friends.limits' as const;
export type FriendsLimitsContext={actorId:string;now:string};
export function isFriendsLimitsContext(v:unknown):v is FriendsLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
