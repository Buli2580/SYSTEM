/** SYSTEM Network telemetry/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_LIFECYCLE_MODULE='telemetry.lifecycle' as const;
export type TelemetryLifecycleContext={actorId:string;now:string};
export function isTelemetryLifecycleContext(v:unknown):v is TelemetryLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
