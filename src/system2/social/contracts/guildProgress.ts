export type GuildProgressContract={actorId:string;enabled:boolean};export const validateGuildProgress=(v:GuildProgressContract)=>v.actorId.trim().length>0&&v.enabled;
