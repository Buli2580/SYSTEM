/** SYSTEM Network profile/reducer. Concrete extension seam; intentionally dependency-free. */
export const PROFILE_REDUCER_MODULE='profile.reducer' as const;
export type ProfileReducerContext={actorId:string;now:string};
export function isProfileReducerContext(v:unknown):v is ProfileReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
