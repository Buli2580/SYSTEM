export type DiscoverySuggestContract={actorId:string;enabled:boolean};export const validateDiscoverySuggest=(v:DiscoverySuggestContract)=>v.actorId.trim().length>0&&v.enabled;
