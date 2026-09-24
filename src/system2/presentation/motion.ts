import {ANIMATION4,motion4Duration,motion4Stagger} from './animation4';

export const MOTION={
 fast:ANIMATION4.durations.NAV,
 normal:ANIMATION4.durations.PANEL,
 hero:ANIMATION4.durations.HERO,
 celebration:ANIMATION4.durations.CELEBRATION,
} as const;
export function stagger(index:number,step=ANIMATION4.staggerStep){
 return Math.min(ANIMATION4.maxStagger,Math.max(0,index)*step);
}
export function reducedMotionDuration(duration:number,reduced:boolean){
 return reduced?0:duration;
}
export const motionDuration4=motion4Duration;
export const motionStagger4=motion4Stagger;
