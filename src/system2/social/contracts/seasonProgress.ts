export type SeasonProgressContract={actorId:string;enabled:boolean};export const validateSeasonProgress=(v:SeasonProgressContract)=>v.actorId.trim().length>0&&v.enabled;
