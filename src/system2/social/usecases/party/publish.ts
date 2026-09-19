export const PARTY_PUBLISH_USE_CASE='party.publish' as const;
export type PartyPublishInput={actorId:string;targetId?:string};
export type PartyPublishResult={ok:true}|{ok:false;code:string};
export function validatePartyPublish(input:PartyPublishInput):PartyPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
