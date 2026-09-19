/** SYSTEM Network profile/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_LIFECYCLE_MODULE='profile.lifecycle' as const;
export type ProfileLifecycleContext={actorId:string;now:string};
export function isProfileLifecycleContext(v:unknown):v is ProfileLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
