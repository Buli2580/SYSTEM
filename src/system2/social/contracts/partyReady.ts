export type PartyReadyContract={actorId:string;enabled:boolean};export const validatePartyReady=(v:PartyReadyContract)=>v.actorId.trim().length>0&&v.enabled;
