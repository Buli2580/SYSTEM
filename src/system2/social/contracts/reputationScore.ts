export type ReputationScoreContract={actorId:string;enabled:boolean};export const validateReputationScore=(v:ReputationScoreContract)=>v.actorId.trim().length>0&&v.enabled;
