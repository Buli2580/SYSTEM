/** SYSTEM Network profile/repository. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_REPOSITORY_MODULE='profile.repository' as const;
export type ProfileRepositoryContext={actorId:string;now:string};
export function isProfileRepositoryContext(v:unknown):v is ProfileRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
