/** SYSTEM Network moderation/repository. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_REPOSITORY_MODULE='moderation.repository' as const;
export type ModerationRepositoryContext={actorId:string;now:string};
export function isModerationRepositoryContext(v:unknown):v is ModerationRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
