/** SYSTEM Network telemetry/types. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_TYPES_MODULE='telemetry.types' as const;
export type TelemetryTypesContext={actorId:string;now:string};
export function isTelemetryTypesContext(v:unknown):v is TelemetryTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
