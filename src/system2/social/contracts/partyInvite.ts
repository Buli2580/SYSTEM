export type PartyInviteContract={actorId:string;enabled:boolean};export const validatePartyInvite=(v:PartyInviteContract)=>v.actorId.trim().length>0&&v.enabled;
