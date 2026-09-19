/** SYSTEM Network raid/repository. Concrete extension seam; intentionally dependency-free. */
export const RAID_REPOSITORY_MODULE='raid.repository' as const;
export type RaidRepositoryContext={actorId:string;now:string};
export function isRaidRepositoryContext(v:unknown):v is RaidRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
