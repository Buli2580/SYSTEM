/** SYSTEM Network profile/selector. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_SELECTOR_MODULE='profile.selector' as const;
export type ProfileSelectorContext={actorId:string;now:string};
export function isProfileSelectorContext(v:unknown):v is ProfileSelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
