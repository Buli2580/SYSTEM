export type SeasonRewardsContract={actorId:string;enabled:boolean};export const validateSeasonRewards=(v:SeasonRewardsContract)=>v.actorId.trim().length>0&&v.enabled;
