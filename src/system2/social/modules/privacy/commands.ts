/** SYSTEM Network privacy/commands. Concrete extension seam; intentionally dependency-free. */
export const PRIVACY_COMMANDS_MODULE='privacy.commands' as const;
export type PrivacyCommandsContext={actorId:string;now:string};
export function isPrivacyCommandsContext(v:unknown):v is PrivacyCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
