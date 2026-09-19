/** SYSTEM Network friends/permissions. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_PERMISSIONS_MODULE='friends.permissions' as const;
export type FriendsPermissionsContext={actorId:string;now:string};
export function isFriendsPermissionsContext(v:unknown):v is FriendsPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
