/** SYSTEM Network profile/mapper. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_MAPPER_MODULE='profile.mapper' as const;
export type ProfileMapperContext={actorId:string;now:string};
export function isProfileMapperContext(v:unknown):v is ProfileMapperContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
