export type ProfileVisibility='PUBLIC'|'FOLLOWERS'|'PRIVATE';
export function privacyBadge(v:ProfileVisibility){return v==='PUBLIC'?'PUBLIC PROFILE':v==='FOLLOWERS'?'FOLLOWERS ONLY':'PRIVATE PROFILE';}
