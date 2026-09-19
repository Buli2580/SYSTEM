/** SYSTEM Network season/audit. Concrete extension seam; intentionally dependency-free. */
export const SEASON_AUDIT_MODULE='season.audit' as const;
export type SeasonAuditContext={actorId:string;now:string};
export function isSeasonAuditContext(v:unknown):v is SeasonAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
