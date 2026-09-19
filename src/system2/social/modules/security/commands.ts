/** SYSTEM Network security/commands. Concrete extension seam; intentionally dependency-free. */
export const SECURITY_COMMANDS_MODULE='security.commands' as const;
export type SecurityCommandsContext={actorId:string;now:string};
export function isSecurityCommandsContext(v:unknown):v is SecurityCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
