/** SYSTEM Network discovery/validator. Concrete extension seam; intentionally dependency-free. */
export const DISCOVERY_VALIDATOR_MODULE='discovery.validator' as const;
export type DiscoveryValidatorContext={actorId:string;now:string};
export function isDiscoveryValidatorContext(v:unknown):v is DiscoveryValidatorContext{return !!v&&typeof v==='object'&&typeof (v as any).actorId==='string'&&typeof (v as any).now==='string';}
