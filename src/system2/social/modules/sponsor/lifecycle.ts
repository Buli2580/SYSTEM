/** SYSTEM Network sponsor/lifecycle. Concrete extension seam; intentionally dependency-free. */
export const SPONSOR_LIFECYCLE_MODULE='sponsor.lifecycle' as const;
export type SponsorLifecycleContext={actorId:string;now:string};
export function isSponsorLifecycleContext(v:unknown):v is SponsorLifecycleContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
