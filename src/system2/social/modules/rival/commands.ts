/** SYSTEM Network rival/commands. Concrete extension seam; intentionally dependency-free. */
export const RIVAL_COMMANDS_MODULE='rival.commands' as const;
export type RivalCommandsContext={actorId:string;now:string};
export function isRivalCommandsContext(v:unknown):v is RivalCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
