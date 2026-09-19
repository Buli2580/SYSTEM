/** SYSTEM Network moderation/commands. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_COMMANDS_MODULE='moderation.commands' as const;
export type ModerationCommandsContext={actorId:string;now:string};
export function isModerationCommandsContext(v:unknown):v is ModerationCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
