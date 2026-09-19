export type SeasonAccessContract={actorId:string;enabled:boolean};export const validateSeasonAccess=(v:SeasonAccessContract)=>v.actorId.trim().length>0&&v.enabled;
