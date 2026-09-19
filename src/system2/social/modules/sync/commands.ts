/** SYSTEM Network sync/commands. Concrete extension seam; intentionally dependency-free. */
export const SYNC_COMMANDS_MODULE='sync.commands' as const;
export type SyncCommandsContext={actorId:string;now:string};
export function isSyncCommandsContext(v:unknown):v is SyncCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
