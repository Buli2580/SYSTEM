/** SYSTEM Network presence/commands. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_COMMANDS_MODULE='presence.commands' as const;
export type PresenceCommandsContext={actorId:string;now:string};
export function isPresenceCommandsContext(v:unknown):v is PresenceCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
