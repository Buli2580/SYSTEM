/** SYSTEM Network presence/reducer. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_REDUCER_MODULE='presence.reducer' as const;
export type PresenceReducerContext={actorId:string;now:string};
export function isPresenceReducerContext(v:unknown):v is PresenceReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
