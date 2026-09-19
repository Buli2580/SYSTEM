/** SYSTEM Network moderation/permissions. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_PERMISSIONS_MODULE='moderation.permissions' as const;
export type ModerationPermissionsContext={actorId:string;now:string};
export function isModerationPermissionsContext(v:unknown):v is ModerationPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
