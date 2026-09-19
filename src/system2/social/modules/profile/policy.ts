/** SYSTEM Network profile/policy. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_POLICY_MODULE='profile.policy' as const;
export type ProfilePolicyContext={actorId:string;now:string};
export function isProfilePolicyContext(v:unknown):v is ProfilePolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
