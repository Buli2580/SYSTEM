export type PartyAccessContract={actorId:string;enabled:boolean};export const validatePartyAccess=(v:PartyAccessContract)=>v.actorId.trim().length>0&&v.enabled;
