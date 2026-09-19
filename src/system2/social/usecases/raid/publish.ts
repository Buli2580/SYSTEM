export const RAID_PUBLISH_USE_CASE='raid.publish' as const;
export type RaidPublishInput={actorId:string;targetId?:string};
export type RaidPublishResult={ok:true}|{ok:false;code:string};
export function validateRaidPublish(input:RaidPublishInput):RaidPublishResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
