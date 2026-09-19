export const DISCOVERY_ARCHIVE_USE_CASE='discovery.archive' as const;
export type DiscoveryArchiveInput={actorId:string;targetId?:string};
export type DiscoveryArchiveResult={ok:true}|{ok:false;code:string};
export function validateDiscoveryArchive(input:DiscoveryArchiveInput):DiscoveryArchiveResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
