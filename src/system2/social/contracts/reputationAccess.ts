export type ReputationAccessContract={actorId:string;enabled:boolean};export const validateReputationAccess=(v:ReputationAccessContract)=>v.actorId.trim().length>0&&v.enabled;
