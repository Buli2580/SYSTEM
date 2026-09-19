/** SYSTEM Network telemetry/state. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_STATE_MODULE='telemetry.state' as const;
export type TelemetryStateContext={actorId:string;now:string};
export function isTelemetryStateContext(v:unknown):v is TelemetryStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
