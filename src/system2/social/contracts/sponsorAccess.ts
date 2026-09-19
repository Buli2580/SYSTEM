export type SponsorAccessContract={actorId:string;enabled:boolean};export const validateSponsorAccess=(v:SponsorAccessContract)=>v.actorId.trim().length>0&&v.enabled;
