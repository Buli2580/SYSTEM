/** SYSTEM Network profile/eligibility. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_ELIGIBILITY_MODULE='profile.eligibility' as const;
export type ProfileEligibilityContext={actorId:string;now:string};
export function isProfileEligibilityContext(v:unknown):v is ProfileEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
