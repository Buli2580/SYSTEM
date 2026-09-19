/** SYSTEM Network presence/repository. Concrete extension seam; intentionally dependency-free. */
export const PRESENCE_REPOSITORY_MODULE='presence.repository' as const;
export type PresenceRepositoryContext={actorId:string;now:string};
export function isPresenceRepositoryContext(v:unknown):v is PresenceRepositoryContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
