export type EventRewardContract={actorId:string;enabled:boolean};export const validateEventReward=(v:EventRewardContract)=>v.actorId.trim().length>0&&v.enabled;
