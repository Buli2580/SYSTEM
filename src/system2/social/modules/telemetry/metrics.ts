/** SYSTEM Network telemetry/metrics. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_METRICS_MODULE='telemetry.metrics' as const;
export type TelemetryMetricsContext={actorId:string;now:string};
export function isTelemetryMetricsContext(v:unknown):v is TelemetryMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
