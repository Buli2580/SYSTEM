/** SYSTEM Network moderation/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_LIFECYCLE_MODULE='moderation.lifecycle' as const;
export type ModerationLifecycleContext={actorId:string;now:string};
export function isModerationLifecycleContext(v:unknown):v is ModerationLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
