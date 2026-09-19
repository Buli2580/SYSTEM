/** SYSTEM Network ranking/commands. Concrete extension seam; intentionally dependency-free. */
export const RANKING_COMMANDS_MODULE='ranking.commands' as const;
export type RankingCommandsContext={actorId:string;now:string};
export function isRankingCommandsContext(v:unknown):v is RankingCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
