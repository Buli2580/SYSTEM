export type GuildInvitePolicyContract={actorId:string;enabled:boolean};export const validateGuildInvitePolicy=(v:GuildInvitePolicyContract)=>v.actorId.trim().length>0&&v.enabled;
