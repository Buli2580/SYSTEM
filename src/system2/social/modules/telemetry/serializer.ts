/** SYSTEM Network telemetry/serializer. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_SERIALIZER_MODULE='telemetry.serializer' as const;
export type TelemetrySerializerContext={actorId:string;now:string};
export function isTelemetrySerializerContext(v:unknown):v is TelemetrySerializerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
