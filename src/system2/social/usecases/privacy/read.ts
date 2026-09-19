export const PRIVACY_READ_USE_CASE='privacy.read' as const;
export type PrivacyReadInput={actorId:string;targetId?:string};
export type PrivacyReadResult={ok:true}|{ok:false;code:string};
export function validatePrivacyRead(input:PrivacyReadInput):PrivacyReadResult{return input.actorId.trim()?{ok:true}:{ok:false,code:'ACTOR_REQUIRED'};}
