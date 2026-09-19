/** SYSTEM Network moderation/service. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_SERVICE_MODULE='moderation.service' as const;
export type ModerationServiceContext={actorId:string;now:string};
export function isModerationServiceContext(v:unknown):v is ModerationServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
