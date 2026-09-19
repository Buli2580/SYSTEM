/** SYSTEM Network telemetry/errors. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_ERRORS_MODULE='telemetry.errors' as const;
export type TelemetryErrorsContext={actorId:string;now:string};
export function isTelemetryErrorsContext(v:unknown):v is TelemetryErrorsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
