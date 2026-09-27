export type FeedTone='PROGRESS'|'SOCIAL'|'BOSS'|'SYSTEM';
export function feedEyebrow(t:FeedTone){return ({PROGRESS:'PROGRESS SIGNAL',SOCIAL:'NETWORK SIGNAL',BOSS:'BOSS SIGNAL',SYSTEM:'SYSTEM SIGNAL'} as const)[t];}
