export const CLAN_VERIFY_USE_CASE='clan.verify' as const;
export type ClanVerifyInput={actorId:string;targetId?:string};
export type ClanVerifyResult={ok:true}|{ok:false;code:string};
export function validateClanVerify(input:ClanVerifyInput):ClanVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
