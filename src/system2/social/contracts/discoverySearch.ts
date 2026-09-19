export type DiscoverySearchContract={actorId:string;enabled:boolean};export const validateDiscoverySearch=(v:DiscoverySearchContract)=>v.actorId.trim().length>0&&v.enabled;
