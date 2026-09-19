/** SYSTEM Network telemetry/repository. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_REPOSITORY_MODULE='telemetry.repository' as const;
export type TelemetryRepositoryContext={actorId:string;now:string};
export function isTelemetryRepositoryContext(v:unknown):v is TelemetryRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
