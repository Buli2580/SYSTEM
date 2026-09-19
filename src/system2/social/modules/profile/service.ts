/** SYSTEM Network profile/service. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_SERVICE_MODULE='profile.service' as const;
export type ProfileServiceContext={actorId:string;now:string};
export function isProfileServiceContext(v:unknown):v is ProfileServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
