/** SYSTEM Network rival/repository. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_REPOSITORY_MODULE='rival.repository' as const;
export type RivalRepositoryContext={actorId:string;now:string};
export function isRivalRepositoryContext(v:unknown):v is RivalRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
