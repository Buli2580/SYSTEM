/** SYSTEM Network telemetry/service. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_SERVICE_MODULE='telemetry.service' as const;
export type TelemetryServiceContext={actorId:string;now:string};
export function isTelemetryServiceContext(v:unknown):v is TelemetryServiceContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
