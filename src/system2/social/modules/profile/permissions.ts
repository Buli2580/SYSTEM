/** SYSTEM Network profile/permissions. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_PERMISSIONS_MODULE='profile.permissions' as const;
export type ProfilePermissionsContext={actorId:string;now:string};
export function isProfilePermissionsContext(v:unknown):v is ProfilePermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
