/** SYSTEM Network referral/permissions. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_PERMISSIONS_MODULE='referral.permissions' as const;
export type ReferralPermissionsContext={actorId:string;now:string};
export function isReferralPermissionsContext(v:unknown):v is ReferralPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
