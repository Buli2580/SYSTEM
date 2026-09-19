export type GuildRewardsContract={actorId:string;enabled:boolean};export const validateGuildRewards=(v:GuildRewardsContract)=>v.actorId.trim().length>0&&v.enabled;
