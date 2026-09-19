/** SYSTEM Network telemetry/validator. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_VALIDATOR_MODULE='telemetry.validator' as const;
export type TelemetryValidatorContext={actorId:string;now:string};
export function isTelemetryValidatorContext(v:unknown):v is TelemetryValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
