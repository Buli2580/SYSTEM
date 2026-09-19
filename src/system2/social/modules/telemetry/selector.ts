/** SYSTEM Network telemetry/selector. Concrete extension seam; intentionally dependency-free. */
export const TELEMETRY_SELECTOR_MODULE='telemetry.selector' as const;
export type TelemetrySelectorContext={actorId:string;now:string};
export function isTelemetrySelectorContext(v:unknown):v is TelemetrySelectorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
