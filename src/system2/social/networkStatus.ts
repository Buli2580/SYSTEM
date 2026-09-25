export type NetworkStatus='OFFLINE'|'SYNCING'|'ONLINE'|'DEGRADED';
export function networkLabel(s:NetworkStatus){return ({OFFLINE:'LOCAL MODE',SYNCING:'SYNCING',ONLINE:'SYSTEM ONLINE',DEGRADED:'LIMITED NETWORK'} as const)[s];}
