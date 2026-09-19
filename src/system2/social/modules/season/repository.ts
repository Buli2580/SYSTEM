/** SYSTEM Network season/repository. Concrete extension seam; intentionally dependency-free. */
export const SEASON_REPOSITORY_MODULE='season.repository' as const;
export type SeasonRepositoryContext={actorId:string;now:string};
export function isSeasonRepositoryContext(v:unknown):v is SeasonRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
