/** SYSTEM Network season/commands. Concrete extension seam; intentionally dependency-free. */
export const SEASON_COMMANDS_MODULE='season.commands' as const;
export type SeasonCommandsContext={actorId:string;now:string};
export function isSeasonCommandsContext(v:unknown):v is SeasonCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
