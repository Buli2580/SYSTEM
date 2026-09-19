/** SYSTEM Network telemetry/queries. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_QUERIES_MODULE='telemetry.queries' as const;
export type TelemetryQueriesContext={actorId:string;now:string};
export function isTelemetryQueriesContext(v:unknown):v is TelemetryQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
