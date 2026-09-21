export function seasonProgress(now:number,start:number,end:number){if(end<=start)return 1;return Math.max(0,Math.min(1,(now-start)/(end-start)));}
export function seasonCountdown(now:number,end:number){return Math.max(0,end-now);}
