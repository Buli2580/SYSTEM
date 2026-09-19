export type DiscoveryAccessContract={actorId:string;enabled:boolean};export const validateDiscoveryAccess=(v:DiscoveryAccessContract)=>v.actorId.trim().length>0&&v.enabled;
