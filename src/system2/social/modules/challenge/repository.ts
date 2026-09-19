/** SYSTEM Network challenge/repository. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_REPOSITORY_MODULE='challenge.repository' as const;
export type ChallengeRepositoryContext={actorId:string;now:string};
export function isChallengeRepositoryContext(v:unknown):v is ChallengeRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
