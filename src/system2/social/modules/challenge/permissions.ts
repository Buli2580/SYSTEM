/** SYSTEM Network challenge/permissions. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_PERMISSIONS_MODULE='challenge.permissions' as const;
export type ChallengePermissionsContext={actorId:string;now:string};
export function isChallengePermissionsContext(v:unknown):v is ChallengePermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
