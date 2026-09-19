export const SPONSOR_PUBLISH_USE_CASE='sponsor.publish' as const;
export type SponsorPublishInput={actorId:string;targetId?:string};
export type SponsorPublishResult={ok:true}|{ok:false;code:string};
export function validateSponsorPublish(input:SponsorPublishInput):SponsorPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
