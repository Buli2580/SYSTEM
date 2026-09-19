/** SYSTEM Network profile/types. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_TYPES_MODULE='profile.types' as const;
export type ProfileTypesContext={actorId:string;now:string};
export function isProfileTypesContext(v:unknown):v is ProfileTypesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
