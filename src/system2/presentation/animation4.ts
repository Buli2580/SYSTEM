import {eventDisplayDuration,MOTION_4,motionDuration,motionStagger,type MotionToken} from './animationEngine4';

export type Motion4Intent='MICRO'|'NAV'|'SCREEN'|'PANEL'|'OVERLAY'|'HERO'|'COMBAT'|'CELEBRATION'|'BOOT';
const TOKEN:Record<Motion4Intent,MotionToken>={
 MICRO:'micro',NAV:'fast',SCREEN:'normal',PANEL:'normal',OVERLAY:'normal',
 HERO:'hero',COMBAT:'micro',CELEBRATION:'cinematic',BOOT:'hero',
};
export const ANIMATION4={
 version:4,
 pressScale:MOTION_4.pressScale,
 navActiveScale:MOTION_4.navActiveScale,
 staggerStep:60,
 maxStagger:MOTION_4.maxStaggerMs,
} as const;
export function motion4Duration(intent:Motion4Intent,reduced=false){return motionDuration(TOKEN[intent],reduced);}
export function motion4Stagger(index:number,reduced=false){return motionStagger(index,'default',reduced);}
export function motion4EventDuration(kind:string,reduced=false){return eventDisplayDuration(kind,reduced);}
export function motion4CombatBeat(kind:string,reduced=false){return reduced?0:kind==='IMPACT'||kind==='DAMAGE_NUMBER'?120:220;}
export function motion4AmbientDuration(base:number,reduced=false){return reduced?0:Math.max(500,Math.round(base));}
