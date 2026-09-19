/** SYSTEM Network matchmaking/commands. Concrete extension seam; intentionally dependency-free. */
export const MATCHMAKING_COMMANDS_MODULE='matchmaking.commands' as const;
export type MatchmakingCommandsContext={actorId:string;now:string};
export function isMatchmakingCommandsContext(v:unknown):v is MatchmakingCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
