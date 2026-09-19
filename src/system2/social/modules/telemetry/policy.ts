/** SYSTEM Network telemetry/policy. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_POLICY_MODULE='telemetry.policy' as const;
export type TelemetryPolicyContext={actorId:string;now:string};
export function isTelemetryPolicyContext(v:unknown):v is TelemetryPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
