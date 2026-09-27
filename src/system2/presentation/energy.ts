export function energyLabel(value:number){return Math.max(0,value).toLocaleString()+' ENERGY';}
export function energyState(value:number){return value<=0?'EMPTY':value<10?'LOW':'READY';}
