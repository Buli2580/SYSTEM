/** SYSTEM Network telemetry/events. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_EVENTS_MODULE='telemetry.events' as const;
export type TelemetryEventsContext={actorId:string;now:string};
export function isTelemetryEventsContext(v:unknown):v is TelemetryEventsContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
