/** SYSTEM Network sponsor/repository. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_REPOSITORY_MODULE='sponsor.repository' as const;
export type SponsorRepositoryContext={actorId:string;now:string};
export function isSponsorRepositoryContext(v:unknown):v is SponsorRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
