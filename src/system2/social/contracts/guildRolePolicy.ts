export type GuildRolePolicyContract={actorId:string;enabled:boolean};export const validateGuildRolePolicy=(v:GuildRolePolicyContract)=>v.actorId.trim().length>0&&v.enabled;
