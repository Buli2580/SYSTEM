export type MotionToken='micro'|'fast'|'normal'|'hero'|'cinematic';
export type MotionIntensity='quiet'|'default'|'hero'|'world';
export type MotionProfile={
 revealY:number;headerY:number;scanOpacity:number;scanDuration:number;ambientPulseMs:number;staggerMs:number;
};

export const MOTION_4={
 micro:110,
 fast:180,
 normal:320,
 hero:520,
 cinematic:900,
 pressScale:.965,
 navActiveScale:1.08,
 maxStaggerMs:300,
} as const;

export const MOTION_PROFILE_4:Record<MotionIntensity,MotionProfile>={
 quiet:{revealY:8,headerY:-6,scanOpacity:.08,scanDuration:5200,ambientPulseMs:4200,staggerMs:45},
 default:{revealY:14,headerY:-10,scanOpacity:.13,scanDuration:4200,ambientPulseMs:3400,staggerMs:60},
 hero:{revealY:22,headerY:-14,scanOpacity:.20,scanDuration:3000,ambientPulseMs:2500,staggerMs:75},
 world:{revealY:18,headerY:-12,scanOpacity:.16,scanDuration:3600,ambientPulseMs:3000,staggerMs:65},
};

export function motionDuration(token:MotionToken,reduced=false,scale=1){
 if(reduced)return 0;
 const safe=Math.max(.5,Math.min(1.6,Number.isFinite(scale)?scale:1));
 return Math.round(MOTION_4[token]*safe);
}
export function motionStagger(index:number,intensity:MotionIntensity='default',reduced=false){
 if(reduced)return 0;
 return Math.min(MOTION_4.maxStaggerMs,Math.max(0,Math.floor(index))*MOTION_PROFILE_4[intensity].staggerMs);
}
export function motionProfile(intensity:MotionIntensity='default',reduced=false):MotionProfile{
 const base=MOTION_PROFILE_4[intensity];
 if(!reduced)return base;
 return{...base,revealY:0,headerY:0,scanOpacity:0,scanDuration:0,ambientPulseMs:0,staggerMs:0};
}
// Reduced Motion disables movement but must not make important text disappear instantly.
export function overlayAutoDismiss(baseMs:number,reduced=false){
 const safe=Math.max(800,Math.floor(baseMs));
 return reduced?Math.max(1500,Math.min(safe,2200)):safe;
}
export function eventDisplayDuration(kind:string,reduced=false){
 const base=kind==='QUEST_COMPLETE'?1550:
  kind==='LEVEL_UP'?2200:
  kind==='RANK_UP'?2600:
  kind==='TITLE_UNLOCK'?2400:
  kind==='WORLD_UNLOCK'?2500:2100;
 return overlayAutoDismiss(base,reduced);
}
