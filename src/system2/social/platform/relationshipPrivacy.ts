export type RelationshipPrivacyPolicy={enabled:boolean;limit?:number;cooldownMs?:number};
export const DEFAULT_RELATIONSHIP_PRIVACY:Readonly<RelationshipPrivacyPolicy>={enabled:true};
export function allowsRelationshipPrivacy(p:RelationshipPrivacyPolicy,current=0,lastAt?:number,now=Date.now()){if(!p.enabled)return false;if(p.limit!==undefined&&current>=p.limit)return false;if(p.cooldownMs&&lastAt!==undefined&&now-lastAt<p.cooldownMs)return false;return true;}
