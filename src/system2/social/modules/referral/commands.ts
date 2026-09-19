/** SYSTEM Network referral/commands. Concrete extension seam; intentionally dependency-free. */
export const REFERRAL_COMMANDS_MODULE='referral.commands' as const;
export type ReferralCommandsContext={actorId:string;now:string};
export function isReferralCommandsContext(v:unknown):v is ReferralCommandsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
