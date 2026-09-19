export type ChallengeProgressContract={actorId:string;enabled:boolean};export const validateChallengeProgress=(v:ChallengeProgressContract)=>v.actorId.trim().length>0&&v.enabled;
