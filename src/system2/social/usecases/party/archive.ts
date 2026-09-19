export const PARTY_ARCHIVE_USE_CASE='party.archive' as const;
export type PartyArchiveInput={actorId:string;targetId?:string};
export type PartyArchiveResult={ok:true}|{ok:false;code:string};
export function validatePartyArchive(input:PartyArchiveInput):PartyArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
