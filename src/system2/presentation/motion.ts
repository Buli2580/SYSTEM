export const MOTION={fast:180,normal:320,hero:520,celebration:900} as const;
export function stagger(index:number,step=70){return Math.max(0,index)*step;}
export function reducedMotionDuration(duration:number,reduced:boolean){return reduced?0:duration;}
