/** SYSTEM Network profile/queries. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_QUERIES_MODULE='profile.queries' as const;
export type ProfileQueriesContext={actorId:string;now:string};
export function isProfileQueriesContext(v:unknown):v is ProfileQueriesContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
