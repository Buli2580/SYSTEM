/** SYSTEM Network security/permissions. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_PERMISSIONS_MODULE='security.permissions' as const;
export type SecurityPermissionsContext={actorId:string;now:string};
export function isSecurityPermissionsContext(v:unknown):v is SecurityPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
