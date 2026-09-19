export type GuildMembershipContract={actorId:string;enabled:boolean};export const validateGuildMembership=(v:GuildMembershipContract)=>v.actorId.trim().length>0&&v.enabled;
