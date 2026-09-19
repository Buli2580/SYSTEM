/** SYSTEM Network sponsor/commands. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_COMMANDS_MODULE='sponsor.commands' as const;
export type SponsorCommandsContext={actorId:string;now:string};
export function isSponsorCommandsContext(v:unknown):v is SponsorCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
