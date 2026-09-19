/** SYSTEM Network telemetry/commands. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_COMMANDS_MODULE='telemetry.commands' as const;
export type TelemetryCommandsContext={actorId:string;now:string};
export function isTelemetryCommandsContext(v:unknown):v is TelemetryCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
