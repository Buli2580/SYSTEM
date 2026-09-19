/** SYSTEM Network badge/state. Concrete extension seam; intentionally dependency-free. */
export const BADGE_STATE_MODULE='badge.state' as const;
export type BadgeStateContext={actorId:string;now:string};
export function isBadgeStateContext(v:unknown):v is BadgeStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
