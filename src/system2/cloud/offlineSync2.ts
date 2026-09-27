export type OfflineSyncDecision={delayMs:number;priority:'LOW'|'NORMAL'|'HIGH';reason:string};
export function nextSyncDelay(attempt:number,pending:number,lastError?:string):OfflineSyncDecision{
 if(pending<=0)return{delayMs:60000,priority:'LOW',reason:'queue empty'};
 if(lastError==='AUTH')return{delayMs:300000,priority:'LOW',reason:'auth required'};
 const delay=Math.min(15*60_000,Math.max(10_000,2**Math.min(attempt,6)*5000));
 return{delayMs:delay,priority:pending>=20?'HIGH':'NORMAL',reason:'exponential backoff'};
}
export function syncBatchSize(pending:number){return Math.min(100,Math.max(10,pending>=50?50:pending));}