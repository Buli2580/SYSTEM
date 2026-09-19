/** SYSTEM Network telemetry/eligibility. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_ELIGIBILITY_MODULE='telemetry.eligibility' as const;
export type TelemetryEligibilityContext={actorId:string;now:string};
export function isTelemetryEligibilityContext(v:unknown):v is TelemetryEligibilityContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
