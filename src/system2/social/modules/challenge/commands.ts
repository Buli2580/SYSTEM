/** SYSTEM Network challenge/commands. Concrete extension seam; intentionally dependency-free. */
export const CHALLENGE_COMMANDS_MODULE='challenge.commands' as const;
export type ChallengeCommandsContext={actorId:string;now:string};
export function isChallengeCommandsContext(v:unknown):v is ChallengeCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
