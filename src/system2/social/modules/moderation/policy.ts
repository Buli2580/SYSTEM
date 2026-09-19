/** SYSTEM Network moderation/policy. Concrete extension seam; intentionally dependency-free. */
export const MODERATION_POLICY_MODULE='moderation.policy' as const;
export type ModerationPolicyContext={actorId:string;now:string};
export function isModerationPolicyContext(v:unknown):v is ModerationPolicyContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
