/** SYSTEM Network profile/limits. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_LIMITS_MODULE='profile.limits' as const;
export type ProfileLimitsContext={actorId:string;now:string};
export function isProfileLimitsContext(v:unknown):v is ProfileLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
