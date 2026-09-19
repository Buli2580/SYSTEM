/** SYSTEM Network badge/commands. Concrete extension seam; intentionally dependency-free. */
export const BADGE_COMMANDS_MODULE='badge.commands' as const;
export type BadgeCommandsContext={actorId:string;now:string};
export function isBadgeCommandsContext(v:unknown):v is BadgeCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
