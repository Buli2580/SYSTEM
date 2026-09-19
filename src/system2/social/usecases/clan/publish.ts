export const CLAN_PUBLISH_USE_CASE='clan.publish' as const;
export type ClanPublishInput={actorId:string;targetId?:string};
export type ClanPublishResult={ok:true}|{ok:false;code:string};
export function validateClanPublish(input:ClanPublishInput):ClanPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
