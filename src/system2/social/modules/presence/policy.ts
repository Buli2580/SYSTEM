/** SYSTEM Network presence/policy. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_POLICY_MODULE='presence.policy' as const;
export type PresencePolicyContext={actorId:string;now:string};
export function isPresencePolicyContext(v:unknown):v is PresencePolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
