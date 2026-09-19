export const REPUTATION_ARCHIVE_USE_CASE='reputation.archive' as const;
export type ReputationArchiveInput={actorId:string;targetId?:string};
export type ReputationArchiveResult={ok:true}|{ok:false;code:string};
export function validateReputationArchive(input:ReputationArchiveInput):ReputationArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
