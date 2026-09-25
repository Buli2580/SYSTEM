import {MOTION_4,motionDuration,motionStagger} from './animationEngine4';

export const MOTION={
 fast:MOTION_4.fast,
 normal:MOTION_4.normal,
 hero:MOTION_4.hero,
 celebration:MOTION_4.cinematic,
} as const;
export function stagger(index:number,step=60){
 return Math.min(MOTION_4.maxStaggerMs,Math.max(0,index)*step);
}
export function reducedMotionDuration(duration:number,reduced:boolean){
 return reduced?0:duration;
}
export const motionDuration4=motionDuration;
export const motionStagger4=motionStagger;
