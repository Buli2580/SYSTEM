export type RelationshipLimitsPolicy={enabled:boolean;limit?:number;cooldownMs?:number};
export const DEFAULT_RELATIONSHIP_LIMITS:Readonly<RelationshipLimitsPolicy>={enabled:true};
export function allowsRelationshipLimits(p:RelationshipLimitsPolicy,current=0,lastAt?:number,now=Date.now()){if(!p.enabled)return false;if(p.limit!==undefined&&current>=p.limit)return false;if(p.cooldownMs&&lastAt!==undefined&&now-lastAt<p.cooldownMs)return false;return true;}
