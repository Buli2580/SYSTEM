export function referralProgress(accepted:number,target:number){return Math.max(0,Math.min(1,accepted/Math.max(1,target)));}
export function referralLabel(accepted:number){return accepted===1?'1 RECRUIT':accepted.toLocaleString()+' RECRUITS';}
