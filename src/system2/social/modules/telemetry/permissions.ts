/** SYSTEM Network telemetry/permissions. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_PERMISSIONS_MODULE='telemetry.permissions' as const;
export type TelemetryPermissionsContext={actorId:string;now:string};
export function isTelemetryPermissionsContext(v:unknown):v is TelemetryPermissionsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
