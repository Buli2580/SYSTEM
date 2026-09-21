export type LocalRankScope='COUNTRY'|'REGION'|'CITY';
export function localRankTitle(scope:LocalRankScope,label:string){return scope+' // '+label.trim().toUpperCase();}
