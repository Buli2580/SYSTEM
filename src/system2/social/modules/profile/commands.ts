/** SYSTEM Network profile/commands. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_COMMANDS_MODULE='profile.commands' as const;
export type ProfileCommandsContext={actorId:string;now:string};
export function isProfileCommandsContext(v:unknown):v is ProfileCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
