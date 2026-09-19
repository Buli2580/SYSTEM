/** SYSTEM Network telemetry/audit. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_AUDIT_MODULE='telemetry.audit' as const;
export type TelemetryAuditContext={actorId:string;now:string};
export function isTelemetryAuditContext(v:unknown):v is TelemetryAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
