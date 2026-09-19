/** SYSTEM Network profile/state. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_STATE_MODULE='profile.state' as const;
export type ProfileStateContext={actorId:string;now:string};
export function isProfileStateContext(v:unknown):v is ProfileStateContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
