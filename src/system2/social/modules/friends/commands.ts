/** SYSTEM Network friends/commands. Concrete extension seam; intentionally dependency-free. */
export const FRIENDS_COMMANDS_MODULE='friends.commands' as const;
export type FriendsCommandsContext={actorId:string;now:string};
export function isFriendsCommandsContext(v:unknown):v is FriendsCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
