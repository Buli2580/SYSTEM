/** SYSTEM Network raid/errors. Concrete extension seam; intentionally dependency-free. */
export const RAID_ERRORS_MODULE='raid.errors' as const;
export type RaidErrorsContext={actorId:string;now:string};
export function isRaidErrorsContext(v:unknown):v is RaidErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
