export type ProfileAccessContract={actorId:string;enabled:boolean};export const validateProfileAccess=(v:ProfileAccessContract)=>v.actorId.trim().length>0&&v.enabled;
