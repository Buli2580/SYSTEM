export type ProfileDiscoveryContract={actorId:string;enabled:boolean};export const validateProfileDiscovery=(v:ProfileDiscoveryContract)=>v.actorId.trim().length>0&&v.enabled;
