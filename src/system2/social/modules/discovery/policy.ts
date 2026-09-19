/** SYSTEM Network discovery/policy. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_POLICY_MODULE='discovery.policy' as const;
export type DiscoveryPolicyContext={actorId:string;now:string};
export function isDiscoveryPolicyContext(v:unknown):v is DiscoveryPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
