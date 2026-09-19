/** SYSTEM Network sponsor/permissions. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_PERMISSIONS_MODULE='sponsor.permissions' as const;
export type SponsorPermissionsContext={actorId:string;now:string};
export function isSponsorPermissionsContext(v:unknown):v is SponsorPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
