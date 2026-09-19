/** SYSTEM Network offline/commands. Concrete extension seam; intentionally dependency-free. */
export const OFFLINE_COMMANDS_MODULE='offline.commands' as const;
export type OfflineCommandsContext={actorId:string;now:string};
export function isOfflineCommandsContext(v:unknown):v is OfflineCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
