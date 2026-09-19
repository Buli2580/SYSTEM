export type ChallengeAccessContract={actorId:string;enabled:boolean};export const validateChallengeAccess=(v:ChallengeAccessContract)=>v.actorId.trim().length>0&&v.enabled;
