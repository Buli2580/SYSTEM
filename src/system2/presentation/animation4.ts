export type Motion4Intent=
 |'MICRO'
 |'NAV'
 |'SCREEN'
 |'PANEL'
 |'OVERLAY'
 |'HERO'
 |'COMBAT'
 |'CELEBRATION'
 |'BOOT';

export const ANIMATION4={
 version:4,
 durations:{
  MICRO:110,
  NAV:180,
  SCREEN:360,
  PANEL:300,
  OVERLAY:320,
  HERO:520,
  COMBAT:150,
  CELEBRATION:900,
  BOOT:620,
 } satisfies Record<Motion4Intent,number>,
 pressScale:.965,
 navActiveScale:1.08,
 screenTranslateY:14,
 panelTranslateY:10,
 staggerStep:58,
 maxStagger:290,
 ambientMultiplier:1,
} as const;

export function motion4Duration(intent:Motion4Intent,reduced=false){
 return reduced?0:ANIMATION4.durations[intent];
}
export function motion4Stagger(index:number,reduced=false){
 if(reduced)return 0;
 return Math.min(ANIMATION4.maxStagger,Math.max(0,Math.floor(index))*ANIMATION4.staggerStep);
}
export function motion4EventDuration(kind:string,reduced=false){
 const base=kind==='QUEST_COMPLETE'?1550:
  kind==='LEVEL_UP'?2200:
  kind==='RANK_UP'?2600:
  kind==='TITLE_UNLOCK'?2400:
  kind==='WORLD_UNLOCK'?2500:2100;
 // Reduced Motion removes animation, not reading time.
 return reduced?Math.max(1500,Math.min(base,2000)):base;
}
export function motion4CombatBeat(kind:string,reduced=false){
 if(reduced)return 0;
 return kind==='IMPACT'||kind==='DAMAGE_NUMBER'?120:220;
}
export function motion4AmbientDuration(base:number,reduced=false){
 return reduced?0:Math.max(500,Math.round(base*ANIMATION4.ambientMultiplier));
}
