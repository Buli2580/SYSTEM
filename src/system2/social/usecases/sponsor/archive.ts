export const SPONSOR_ARCHIVE_USE_CASE='sponsor.archive' as const;
export type SponsorArchiveInput={actorId:string;targetId?:string};
export type SponsorArchiveResult={ok:true}|{ok:false;code:string};
export function validateSponsorArchive(input:SponsorArchiveInput):SponsorArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
