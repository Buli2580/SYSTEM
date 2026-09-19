/** SYSTEM Network telemetry/limits. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_LIMITS_MODULE='telemetry.limits' as const;
export type TelemetryLimitsContext={actorId:string;now:string};
export function isTelemetryLimitsContext(v:unknown):v is TelemetryLimitsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
