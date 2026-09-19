/** SYSTEM Network telemetry/mapper. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_MAPPER_MODULE='telemetry.mapper' as const;
export type TelemetryMapperContext={actorId:string;now:string};
export function isTelemetryMapperContext(v:unknown):v is TelemetryMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
