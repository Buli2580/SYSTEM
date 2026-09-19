/** SYSTEM Network discovery/audit. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_AUDIT_MODULE='discovery.audit' as const;
export type DiscoveryAuditContext={actorId:string;now:string};
export function isDiscoveryAuditContext(v:unknown):v is DiscoveryAuditContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
