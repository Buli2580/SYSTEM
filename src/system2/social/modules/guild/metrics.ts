/** SYSTEM Network guild/metrics. Concrete extension seam; intentionally dependency-free. */
export const GUILD_METRICS_MODULE='guild.metrics' as const;
export type GuildMetricsContext={actorId:string;now:string};
export function isGuildMetricsContext(v:unknown):v is GuildMetricsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
