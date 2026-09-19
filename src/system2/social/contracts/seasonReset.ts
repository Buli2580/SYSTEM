export type SeasonResetContract={actorId:string;enabled:boolean};export const validateSeasonReset=(v:SeasonResetContract)=>v.actorId.trim().length>0&&v.enabled;
