/** SYSTEM Network raid/commands. Concrete extension seam; intentionally dependency-free. */
export const RAID_COMMANDS_MODULE='raid.commands' as const;
export type RaidCommandsContext={actorId:string;now:string};
export function isRaidCommandsContext(v:unknown):v is RaidCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
