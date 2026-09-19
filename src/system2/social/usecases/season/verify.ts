export const SEASON_VERIFY_USE_CASE='season.verify' as const;
export type SeasonVerifyInput={actorId:string;targetId?:string};
export type SeasonVerifyResult={ok:true}|{ok:false;code:string};
export function validateSeasonVerify(input:SeasonVerifyInput):SeasonVerifyResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
