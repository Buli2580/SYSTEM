export const REFERRAL_ARCHIVE_USE_CASE='referral.archive' as const;
export type ReferralArchiveInput={actorId:string;targetId?:string};
export type ReferralArchiveResult={ok:true}|{ok:false;code:string};
export function validateReferralArchive(input:ReferralArchiveInput):ReferralArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
