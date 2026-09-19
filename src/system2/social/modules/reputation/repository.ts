/** SYSTEM Network reputation/repository. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_REPOSITORY_MODULE='reputation.repository' as const;
export type ReputationRepositoryContext={actorId:string;now:string};
export function isReputationRepositoryContext(v:unknown):v is ReputationRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
