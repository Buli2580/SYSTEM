/** SYSTEM Network discovery/commands. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_COMMANDS_MODULE='discovery.commands' as const;
export type DiscoveryCommandsContext={actorId:string;now:string};
export function isDiscoveryCommandsContext(v:unknown):v is DiscoveryCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
