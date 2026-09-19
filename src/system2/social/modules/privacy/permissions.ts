/** SYSTEM Network privacy/permissions. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_PERMISSIONS_MODULE='privacy.permissions' as const;
export type PrivacyPermissionsContext={actorId:string;now:string};
export function isPrivacyPermissionsContext(v:unknown):v is PrivacyPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
