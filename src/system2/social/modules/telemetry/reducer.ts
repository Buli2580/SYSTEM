/** SYSTEM Network telemetry/reducer. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_REDUCER_MODULE='telemetry.reducer' as const;
export type TelemetryReducerContext={actorId:string;now:string};
export function isTelemetryReducerContext(v:unknown):v is TelemetryReducerContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
