/** SYSTEM Network profile/errors. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_ERRORS_MODULE='profile.errors' as const;
export type ProfileErrorsContext={actorId:string;now:string};
export function isProfileErrorsContext(v:unknown):v is ProfileErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
