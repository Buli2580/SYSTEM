export type SponsorChallengeContract={actorId:string;enabled:boolean};export const validateSponsorChallenge=(v:SponsorChallengeContract)=>v.actorId.trim().length>0&&v.enabled;
