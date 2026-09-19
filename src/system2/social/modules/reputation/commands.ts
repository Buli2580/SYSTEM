/** SYSTEM Network reputation/commands. Concrete extension seam; intentionally dependency-free. */
export const REPUTATION_COMMANDS_MODULE='reputation.commands' as const;
export type ReputationCommandsContext={actorId:string;now:string};
export function isReputationCommandsContext(v:unknown):v is ReputationCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
