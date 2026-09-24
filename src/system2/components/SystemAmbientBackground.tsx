import { useFocusEffect } from 'expo-router';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useCallback } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

// Preserve React Native's typed percentage syntax in dynamically generated scenes.
const percent = (value: number): `${number}%` => `${value}%`;
import { chooseScene, normalizedSceneContext } from '../visual/engine';
import type { ScreenMood, ThreatLevel, WorldSceneId, WorldWeather } from '../visual/types';
import {useAnimation4} from '../presentation/useAnimation4';
import {triggerCinematicEvent,type AwakeningCinematicState,type BossCinematicState} from '../audio/engine';

type Intensity = 'quiet' | 'default' | 'hero' | 'world';
export type CinematicSource = number | {uri:string};

const CINEMATIC_ART:Partial<Record<WorldSceneId,CinematicSource>>={
  // Final artwork slots. Keep fallbacks procedural until binary artwork is committed.
};
export const CINEMATIC_ASSET_SLOTS={
  HOME_CITY:'assets/cinematic/home-ogre-city.jpg',
  AWAKENING:'assets/cinematic/awakening-card.jpg',
  WORLD:'assets/cinematic/world-rift.jpg',
  BOSS:'assets/cinematic/boss-domain.jpg',
  CHARACTER:'assets/cinematic/character-awakened.jpg',
} as const;

export default function SystemAmbientBackground({
  intensity='default', screen='HOME', level=1, threat=0, scene, weather='CLEAR', cinematicSource, bossState, awakeningState,
}:{
  intensity?:Intensity;
  screen?:ScreenMood;
  level?:number;
  threat?:ThreatLevel;
  scene?:WorldSceneId;
  weather?:WorldWeather;
  cinematicSource?:CinematicSource;
  bossState?:BossCinematicState;
  awakeningState?:AwakeningCinematicState;
}) {
  const far=useSharedValue(0);
  const fire=useSharedValue(0);
  const smoke=useSharedValue(0);
  const embers=useSharedValue(0);
  const energy=useSharedValue(0);
  const lightning=useSharedValue(0);
  const shake=useSharedValue(0);
  const bossPhase=useSharedValue(0);
  const awakening=useSharedValue(0);
  const mid=useSharedValue(0);
  const near=useSharedValue(0);
  const scan=useSharedValue(0);
  const pulse=useSharedValue(0);
  const motion=useAnimation4();
  const ctx=normalizedSceneContext({screen,level,threat,scene,weather});
  const worldScene=chooseScene(ctx);
  const art=cinematicSource??CINEMATIC_ART[worldScene.id];

  useFocusEffect(useCallback(()=>{
    if(motion.reduced){
      far.value=.5;mid.value=.5;near.value=.5;scan.value=.5;pulse.value=.5;fire.value=.5;smoke.value=.5;embers.value=.5;energy.value=.5;lightning.value=0;shake.value=.5;bossPhase.value=.5;awakening.value=.5;
      return()=>[far,mid,near,scan,pulse,fire,smoke,embers,energy,lightning,shake,bossPhase,awakening].forEach(cancelAnimation);
    }
    far.value=withRepeat(withTiming(1,{duration:22000,easing:Easing.inOut(Easing.ease)}),-1,true);
    mid.value=withRepeat(withTiming(1,{duration:13500,easing:Easing.inOut(Easing.ease)}),-1,true);
    near.value=withRepeat(withTiming(1,{duration:7600,easing:Easing.inOut(Easing.ease)}),-1,true);
    scan.value=withRepeat(withTiming(1,{duration:8400,easing:Easing.linear}),-1,false);
    pulse.value=withRepeat(withTiming(1,{duration:2800,easing:Easing.inOut(Easing.ease)}),-1,true);
    fire.value=withRepeat(withTiming(1,{duration:760,easing:Easing.inOut(Easing.ease)}),-1,true);
    smoke.value=withRepeat(withTiming(1,{duration:9800,easing:Easing.inOut(Easing.ease)}),-1,true);
    embers.value=withRepeat(withTiming(1,{duration:4300,easing:Easing.linear}),-1,false);
    energy.value=withRepeat(withTiming(1,{duration:1450,easing:Easing.inOut(Easing.ease)}),-1,true);
    lightning.value=withRepeat(withTiming(1,{duration:5100,easing:Easing.linear}),-1,false);
    shake.value=withRepeat(withTiming(1,{duration:1900,easing:Easing.inOut(Easing.ease)}),-1,true);
    bossPhase.value=withRepeat(withTiming(1,{duration:6400,easing:Easing.inOut(Easing.ease)}),-1,true);
    awakening.value=withRepeat(withTiming(1,{duration:4200,easing:Easing.inOut(Easing.ease)}),-1,true);
    return()=>[far,mid,near,scan,pulse,fire,smoke,embers,energy,lightning,shake,bossPhase,awakening].forEach(cancelAnimation);
  },[far,mid,near,scan,pulse,fire,smoke,embers,energy,lightning,shake,bossPhase,awakening,motion.reduced]));

  const farStyle=useAnimatedStyle(()=>({transform:[
    {translateX:interpolate(far.value,[0,1],[-7,10])},
    {translateY:interpolate(far.value,[0,1],[4,-5])},
    {scale:interpolate(far.value,[0,1],[1,1.025])},
  ]}));
  const midStyle=useAnimatedStyle(()=>({transform:[
    {translateX:interpolate(mid.value,[0,1],[10,-13])},
    {translateY:interpolate(mid.value,[0,1],[-4,7])},
    {scale:interpolate(mid.value,[0,1],[1.015,1.045])},
  ]}));
  const nearStyle=useAnimatedStyle(()=>({transform:[
    {translateX:interpolate(near.value,[0,1],[-15,18])},
    {translateY:interpolate(near.value,[0,1],[8,-9])},
  ],opacity:interpolate(near.value,[0,1],[.72,1])}));
  const scanStyle=useAnimatedStyle(()=>({
    transform:[{translateY:interpolate(scan.value,[0,1],[-420,760])}],
    opacity:interpolate(scan.value,[0,.5,1],[0,.19,0]),
  }));
  const pulseStyle=useAnimatedStyle(()=>({
    opacity:interpolate(pulse.value,[0,1],[.16,.58]),
    transform:[{scale:interpolate(pulse.value,[0,1],[.9,1.1])}],
  }));

  const fireStyle=useAnimatedStyle(()=>({opacity:interpolate(fire.value,[0,1],[.08,.26]),transform:[{translateY:interpolate(fire.value,[0,1],[4,-5])},{scaleY:interpolate(fire.value,[0,1],[.9,1.12])}]}));
  const smokeStyle=useAnimatedStyle(()=>({opacity:interpolate(smoke.value,[0,1],[.10,.24]),transform:[{translateX:interpolate(smoke.value,[0,1],[-35,42])},{translateY:interpolate(smoke.value,[0,1],[18,-26])},{scale:interpolate(smoke.value,[0,1],[.96,1.08])}]}));
  const emberStyle=useAnimatedStyle(()=>({opacity:interpolate(embers.value,[0,.15,.8,1],[0,.9,.55,0]),transform:[{translateY:interpolate(embers.value,[0,1],[80,-520])},{translateX:interpolate(embers.value,[0,.5,1],[-8,18,-4])}]}));
  const energyStyle=useAnimatedStyle(()=>({opacity:interpolate(energy.value,[0,1],[.16,.62]),transform:[{scale:interpolate(energy.value,[0,1],[.92,1.12])}]}));
  const lightningStyle=useAnimatedStyle(()=>({opacity:interpolate(lightning.value,[0,.72,.76,.79,.82,1],[0,0,.62,.05,.38,0])}));
  const shakeStyle=useAnimatedStyle(()=>({transform:[{translateX:interpolate(shake.value,[0,1],[-1.5,1.5])},{translateY:interpolate(shake.value,[0,1],[1,-1])}]}));
  const bossPhaseStyle=useAnimatedStyle(()=>({opacity:interpolate(bossPhase.value,[0,.45,1],[.10,.48,.18]),transform:[{scale:interpolate(bossPhase.value,[0,1],[.78,1.22])}]}));
  const awakeningStyle=useAnimatedStyle(()=>({opacity:interpolate(awakening.value,[0,.55,1],[.12,.72,.18]),transform:[{scale:interpolate(awakening.value,[0,1],[.72,1.32])},{rotate:interpolate(awakening.value,[0,1],[0,18])+'deg'}]}));

  const strength=intensity==='hero'?1:intensity==='world'?.94:intensity==='quiet'?.48:.74;
  const timeDim=ctx.time==='NIGHT'?.18:ctx.time==='DUSK'?.11:.05;
  const weatherDim=weather==='STORM'?.20:weather==='RAIN'?.13:weather==='FOG'?.09:.04;
  const threatGlow=.12+threat*.08;
  const bossStateStrength=bossState==='VICTORY'?0.35:bossState==='DEATH'?0.2:bossState==='ENRAGE'?1:bossState==='PHASE_2'?0.82:bossState==='ATTACK'||bossState==='HIT'?0.68:0.5;
  const awakeningStateStrength=awakeningState==='AWAKENED'?1:awakeningState==='FLASH'||awakeningState==='DROP'?0.92:awakeningState==='PUSH'||awakeningState==='WIND'?0.72:awakeningState==='ENERGY'||awakeningState==='RUNES'?0.58:awakeningState==='PORTAL'?0.42:0.2;

  return <View pointerEvents="none" style={styles.root}>
    {art?<CinematicBackdrop source={art} accent={worldScene.accent} strength={strength} reduced={motion.reduced}/>:null}
    <View style={[StyleSheet.absoluteFill,{backgroundColor:worldScene.secondary,opacity:art?.20:.42*strength}]} />
    <View style={[styles.skyGlow,{backgroundColor:worldScene.accent,opacity:(.06+threatGlow)*strength}]} />

    <Animated.View style={[styles.farLayer,farStyle]}>
      <Silhouette type={worldScene.silhouettes} accent={worldScene.accent} strength={strength*.62} depth="far" />
      <View style={[styles.horizon,{borderColor:worldScene.accent,opacity:.12*strength}]} />
    </Animated.View>

    <Animated.View style={[styles.midLayer,midStyle]}>
      <Silhouette type={worldScene.silhouettes} accent={worldScene.accent} strength={strength} depth="mid" />
      <View style={[styles.energyArc,{borderColor:worldScene.accent,opacity:(.12+threat*.04)*strength}]} />
      {(weather==='FOG'||weather==='RAIN'||weather==='STORM')&&<FogBands accent={worldScene.accent} strength={strength}/>}
    </Animated.View>

    {worldScene.id==='FOREST'&&<Animated.View style={[styles.forestMist,smokeStyle]}>{Array.from({length:intensity==='quiet'?5:10},(_,i)=><View key={i} style={[styles.firefly,{left:percent((i*41)%96),top:percent(18+(i*23)%68),backgroundColor:worldScene.accent,shadowColor:worldScene.accent}]}/>)}</Animated.View>}
    {worldScene.id==='INDUSTRIAL'&&<Animated.View style={[styles.industrialSteam,smokeStyle]}>{Array.from({length:intensity==='quiet'?4:8},(_,i)=><View key={i} style={[styles.spark,{left:percent(8+(i*17)%88),top:percent(25+(i*19)%62),backgroundColor:worldScene.accent}]}/>)}</Animated.View>}
    {worldScene.id==='WORLD'&&<><Animated.View style={[styles.worldCloud,smokeStyle]} /><Animated.View style={[styles.energyPulse,{borderColor:worldScene.accent,shadowColor:worldScene.accent},pulseStyle]}/></>}
    {(worldScene.id==='PORTAL'||screen==='LAUNCH')&&<><Animated.View style={[styles.portalVeil,{borderColor:worldScene.accent,shadowColor:worldScene.accent},energyStyle]} /><Animated.View style={[styles.energyArc,{borderColor:worldScene.accent,opacity:.34*strength},awakeningStyle]}/></>}
    {worldScene.id==='BOSS_ZONE'&&<Animated.View style={[styles.lightningFlash,lightningStyle]}/>}
    {worldScene.id==='RUINS'&&<Animated.View style={[styles.smokeBand,{opacity:.28*strength},smokeStyle]}/>} 
    {(worldScene.id==='CITY'||worldScene.id==='RUINS'||worldScene.id==='BOSS_ZONE')&&<>
      <Animated.View style={[styles.smokeBand,smokeStyle]}/>
      <Animated.View style={[styles.fireField,fireStyle]}>{Array.from({length:12},(_,i)=><View key={i} style={[styles.flame,{left:percent((i*31)%104),height:24+(i%5)*15,opacity:.28+(i%3)*.12}]}/>)}</Animated.View>
      <Animated.View style={[styles.emberField,emberStyle]}>{Array.from({length:20},(_,i)=><View key={i} style={[styles.hotEmber,{left:percent((i*47)%100),top:percent((i*29)%92)}]}/>)}</Animated.View>
      <Animated.View style={[styles.energyPulse,{borderColor:worldScene.accent,shadowColor:worldScene.accent},energyStyle]}/>
      <Animated.View style={[styles.lightningFlash,lightningStyle]}/>
      <Animated.View style={[styles.impactShake,shakeStyle]}><CitySiege accent={worldScene.accent} strength={strength} reduced={motion.reduced} threat={threat}/></Animated.View></>}
    <Animated.View style={[styles.nearLayer,nearStyle]}>
      <Particles kind={worldScene.particle} accent={worldScene.accent} strength={strength} weather={weather}/>
      {weather==='RAIN'||weather==='STORM'?<Rain accent={worldScene.accent} strength={strength}/>:null}
      {worldScene.particle==='runes'||screen==='LAUNCH'||screen==='CHARACTER'?<Runes accent={worldScene.accent} strength={strength}/>:null}
    </Animated.View>

    {worldScene.id==='BOSS_ZONE'&&<Animated.View style={[styles.bossDomain,{borderColor:worldScene.accent,shadowColor:worldScene.accent,opacity:bossStateStrength},bossPhaseStyle]} />}
    {(worldScene.id==='PORTAL'||screen==='LAUNCH')&&<>
      <Animated.View style={[styles.awakeningBurst,{borderColor:worldScene.accent,shadowColor:worldScene.accent,opacity:awakeningStateStrength},awakeningStyle]} />
      <Animated.View style={[styles.awakeningCore,{backgroundColor:worldScene.accent,shadowColor:worldScene.accent,opacity:awakeningStateStrength},energyStyle]} />
    </>}
    <Animated.View style={[styles.portal,{borderColor:worldScene.accent,shadowColor:worldScene.accent},pulseStyle]} />
    <Animated.View style={[styles.scanLine,{backgroundColor:worldScene.accent},scanStyle]} />
    {threat>=2&&<Animated.View style={[styles.threatCore,{borderColor:worldScene.accent,shadowColor:worldScene.accent},pulseStyle]} />}

    <View style={[styles.environmentDim,{backgroundColor:'#000',opacity:timeDim+weatherDim}]} />
    <View style={styles.uiScrim}/>
    <View style={styles.vignette}/>
  </View>;
}

function CinematicBackdrop({source,accent,strength,reduced}:{source:CinematicSource;accent:string;strength:number;reduced:boolean}) {
  const drift=useSharedValue(0);
  useFocusEffect(useCallback(()=>{
    if(reduced){drift.value=.5;return()=>cancelAnimation(drift)}
    drift.value=withRepeat(withTiming(1,{duration:12000,easing:Easing.inOut(Easing.ease)}),-1,true);
    return()=>cancelAnimation(drift);
  },[drift,reduced]));
  const artStyle=useAnimatedStyle(()=>({opacity:.78*strength,transform:[
    {scale:interpolate(drift.value,[0,1],[1.04,1.11])},
    {translateX:interpolate(drift.value,[0,1],[-7,7])},
    {translateY:interpolate(drift.value,[0,1],[4,-7])},
  ]}));
  const glow=useAnimatedStyle(()=>({opacity:interpolate(drift.value,[0,1],[.08,.23])*strength,transform:[{scale:interpolate(drift.value,[0,1],[.88,1.12])}]}));
  return <View style={styles.cinematic}>
    <Animated.View style={[StyleSheet.absoluteFill,artStyle]}>
      <ImageBackground source={source} resizeMode="cover" style={StyleSheet.absoluteFill}/>
    </Animated.View>
    <Animated.View style={[styles.cinematicGlow,{backgroundColor:accent,shadowColor:accent},glow]}/>
    <View style={styles.cinematicContrast}/>
  </View>;
}

function CitySiege({accent,strength,reduced,threat}:{accent:string;strength:number;reduced:boolean;threat:ThreatLevel}) {
  const attack=useSharedValue(0);
  const debris=useSharedValue(0);
  const collapse=useSharedValue(0);
  const lunge=useSharedValue(0);
  const stomp=useSharedValue(0);
  const pattern=useSharedValue(0);
  const stompWaveStyle=useAnimatedStyle(()=>({opacity:interpolate(stomp.value,[0,.48,.58,1],[0,0,.45,0]),transform:[{scale:interpolate(stomp.value,[0,.5,1],[.4,.65,1.8])}]}));
  useFocusEffect(useCallback(()=>{
    if(reduced){attack.value=.55;debris.value=.45;collapse.value=.35;lunge.value=.2;stomp.value=.2;pattern.value=0;return()=>{[attack,debris,collapse,lunge,stomp,pattern].forEach(cancelAnimation)}}
    attack.value=0;debris.value=0;collapse.value=0;lunge.value=0;stomp.value=0;pattern.value=0;
    return()=>{[attack,debris,collapse,lunge,stomp,pattern].forEach(cancelAnimation)};
  },[attack,debris,collapse,lunge,stomp,pattern,reduced]));
  useFocusEffect(useCallback(()=>{
    if(reduced)return;
    let phase=0;
    const delays=[1700,2350,1450,3100,2050,2700];
    let timer:ReturnType<typeof setTimeout>|null=null;
    let active=true;
    const run=()=>{
      if(!active)return;
      phase=(phase+1)%8;
      pattern.value=withTiming(phase%4,{duration:260});
      if(phase===0){triggerCinematicEvent('OGRE_STEP');stomp.value=withSequence(withTiming(1,{duration:260}),withTiming(0,{duration:720}))}
      else if(phase===1){triggerCinematicEvent('BUILDING_HIT');triggerCinematicEvent('BASS_IMPACT');attack.value=withSequence(withTiming(1,{duration:320}),withTiming(0,{duration:760}))}
      else if(phase===2){triggerCinematicEvent('DEBRIS');collapse.value=withSequence(withTiming(1,{duration:650}),withTiming(.25,{duration:1800}))}
      else if(phase===3&&threat>=2){triggerCinematicEvent('OGRE_ROAR');lunge.value=withSequence(withTiming(1,{duration:520}),withTiming(0,{duration:900}))}
      else if(phase===4){triggerCinematicEvent('OGRE_STEP');triggerCinematicEvent('DEBRIS');stomp.value=withSequence(withTiming(1,{duration:180}),withTiming(0,{duration:520}))}
      else if(phase===5){triggerCinematicEvent('BUILDING_HIT');attack.value=withSequence(withTiming(.7,{duration:240}),withTiming(0,{duration:420}),withTiming(1,{duration:210}),withTiming(0,{duration:620}))}
      else if(phase===6&&threat>=2){triggerCinematicEvent('THUNDER');triggerCinematicEvent('OGRE_ROAR')}
      else {triggerCinematicEvent('DEBRIS');triggerCinematicEvent('BASS_IMPACT')}
      if(active)timer=setTimeout(run,delays[phase%delays.length]);
    };
    timer=setTimeout(run,900);
    return()=>{active=false;if(timer)clearTimeout(timer)};
  },[attack,collapse,debris,lunge,pattern,reduced,stomp,threat]));
  const ogre=useAnimatedStyle(()=>({transform:[
    {scale:interpolate(stomp.value,[0,.45,.55,1],[1,1.025,.97,1])},
    {translateX:interpolate(lunge.value,[0,.5,1],[0,12,0])},
    {translateX:interpolate(attack.value,[0,1],[-8,5])},
    {translateY:interpolate(attack.value,[0,.5,1],[3,-5,3])},
    {rotate:(interpolate(attack.value,[0,1],[-2,3])+interpolate(pattern.value,[0,1,2,3],[0,-2,2,0]))+'deg'},
  ]}));
  const arm=useAnimatedStyle(()=>({transform:[
    {rotate:interpolate(attack.value,[0,.55,1],[-34,28,-34])+'deg'},
    {translateY:interpolate(attack.value,[0,.55,1],[0,10,0])},
  ]}));
  const debrisStyle=useAnimatedStyle(()=>({opacity:interpolate(debris.value,[0,.18,.78,1],[0,.7,.34,0]),transform:[
    {translateX:interpolate(debris.value,[0,1],[0,-54])},
    {translateY:interpolate(debris.value,[0,.35,1],[0,-28,72])},
    {rotate:interpolate(debris.value,[0,1],[0,160])+'deg'},
  ]}));
  const collapseStyle=useAnimatedStyle(()=>({transform:[{translateY:interpolate(collapse.value,[0,.6,1],[0,0,28])},{rotate:interpolate(collapse.value,[0,1],[0,8])+'deg'}],opacity:interpolate(collapse.value,[0,.72,1],[1,.92,.48])}));
  const hitGlow=useAnimatedStyle(()=>({opacity:interpolate(attack.value,[0,.42,.58,1],[0,0,.52,0]),transform:[{scale:interpolate(attack.value,[0,.5,1],[.65,1.2,.8])}]}));
  const opacity=(threat>=2?.42:.29)*strength;
  return <View style={[styles.siege,{opacity}]}>
    <Animated.View style={[styles.damagedCity,collapseStyle]}>
      {[0,1,2,3,4].map(i=><View key={i} style={[styles.siegeBuilding,{left:percent(i*19),height:58+(i%3)*34,borderColor:accent,transform:[{rotate:(i===2?'-7deg':i===3?'5deg':'0deg')}]}]}>
        {i===2&&<View style={styles.buildingBite}/>}
      </View>)}
    </Animated.View>
    <Animated.View style={[styles.ogre,ogre]}>
      <View style={[styles.ogreBack,{borderColor:accent}]}/>
      <View style={[styles.ogreHead,{borderColor:accent}]}>
        <View style={[styles.ogreEye,{backgroundColor:accent,shadowColor:accent}]}/>
        <View style={[styles.ogreEye2,{backgroundColor:accent,shadowColor:accent}]}/>
      </View>
      <View style={[styles.ogreHornL,{borderColor:accent}]}/><View style={[styles.ogreHornR,{borderColor:accent}]}/>
      <Animated.View style={[styles.ogreArm,{borderColor:accent},arm]}/><View style={[styles.ogreArmRear,{borderColor:accent}]}/>
    </Animated.View>
    <Animated.View style={[styles.stompWave,{borderColor:accent},stompWaveStyle]} />
    <Animated.View style={[styles.hitGlow,{backgroundColor:accent,shadowColor:accent},hitGlow]}/>
    {[0,1,2,3,4,5].map(i=><Animated.View key={i} style={[styles.debris,{left:percent(54+(i%3)*6),top:percent(50+(i%2)*5),borderColor:accent},debrisStyle]}/>)}
  </View>;
}

function Particles({kind,accent,strength,weather}:{kind:string;accent:string;strength:number;weather:WorldWeather}) {
  const count=weather==='STORM'?24:kind==='embers'||kind==='shards'?18:14;
  return <>{Array.from({length:count},(_,i)=><View key={i} style={[
    styles.particle,
    {
      left:percent((i*37)%100),top:percent((i*53)%94),
      width:kind==='rain'?1:2+(i%3),height:kind==='rain'?20+(i%5)*6:2+(i%3),
      backgroundColor:accent,
      opacity:(.055+(i%5)*.022)*strength,
      transform:[{rotate:kind==='rain'?'-18deg':(i*23)+'deg'}],
    }
  ]}/>)}</>;
}

function Rain({accent,strength}:{accent:string;strength:number}) {
  return <>{Array.from({length:22},(_,i)=><View key={i} style={[styles.rain,{
    left:percent((i*29)%105),top:percent((i*41)%96),backgroundColor:accent,opacity:(.06+(i%3)*.03)*strength,
    height:20+(i%5)*9,
  }]}/>)}</>;
}

function FogBands({accent,strength}:{accent:string;strength:number}) {
  return <>{[0,1,2].map(i=><View key={i} style={[styles.fog,{
    top:percent(28+i*19),left:percent(-18+i*8),borderColor:accent,opacity:(.035+i*.018)*strength,
    transform:[{rotate:(i%2?'-6deg':'5deg')}],
  }]}/>)}</>;
}

function Runes({accent,strength}:{accent:string;strength:number}) {
  return <>{['◇','⌁','△','⟡','◈','⋄'].map((r,i)=><View key={r+i} style={[styles.runeWrap,{left:percent((8+i*17)%92),top:percent((15+i*13)%78),opacity:(.08+(i%3)*.04)*strength}]}>
    <Animated.Text style={[styles.rune,{color:accent}]}>{r}</Animated.Text>
  </View>)}</>;
}

function Silhouette({type,accent,strength,depth}:{type:string;accent:string;strength:number;depth:'far'|'mid'}) {
  const depthScale=depth==='far'?.72:1;
  if(type==='boss') return <View style={[styles.bossWrap,{opacity:.26*strength,transform:[{scale:depthScale}]}]}>
    <View style={[styles.bossHornLeft,{borderColor:accent}]}/>
    <View style={[styles.bossHornRight,{borderColor:accent}]}/>
    <View style={[styles.bossHead,{borderColor:accent}]} />
    <View style={[styles.bossShoulder,{borderColor:accent}]} />
    <View style={[styles.bossEye,{backgroundColor:accent,shadowColor:accent}]} />
    <View style={[styles.bossEye2,{backgroundColor:accent,shadowColor:accent}]} />
  </View>;
  if(type==='trees') return <View style={styles.skyline}>{[0,1,2,3,4,5,6].map(i=><View key={i} style={[styles.tree,{left:percent(i*16),height:(78+(i%4)*38)*depthScale,opacity:.10*strength}]}/>)}</View>;
  if(type==='factory') return <View style={styles.skyline}>{[0,1,2,3,4].map(i=><View key={i} style={[styles.factory,{left:percent(i*23),height:(54+i*15)*depthScale,borderColor:accent,opacity:.12*strength}]}/>)}</View>;
  if(type==='portal') return <View style={[styles.portalSpire,{borderColor:accent,opacity:.17*strength,transform:[{rotate:'18deg'},{scale:depthScale}]}]} />;
  if(type==='ruins') return <View style={styles.skyline}>{[0,1,2,3,4,5].map(i=><View key={i} style={[styles.ruin,{left:percent(i*19),height:(38+(i%4)*31)*depthScale,borderColor:accent,opacity:.11*strength,transform:[{rotate:(i%2?'-5deg':'4deg')}]}]}/>)}</View>;
  return <View style={styles.skyline}>{[0,1,2,3,4,5,6].map(i=><View key={i} style={[styles.building,{left:percent(i*16),height:(42+(i%5)*27)*depthScale,borderColor:accent,opacity:.10*strength}]}/>)}</View>;
}

const styles=StyleSheet.create({
  root:{...StyleSheet.absoluteFill,overflow:'hidden',backgroundColor:'#020609'},
  farLayer:{...StyleSheet.absoluteFill},
  midLayer:{...StyleSheet.absoluteFill},
  nearLayer:{...StyleSheet.absoluteFill},
  skyGlow:{position:'absolute',width:520,height:520,borderRadius:260,top:-280,right:-190},
  horizon:{position:'absolute',width:'135%',height:300,borderWidth:1,borderRadius:190,bottom:-185,left:'-18%'},
  portal:{position:'absolute',width:250,height:250,borderRadius:125,borderWidth:1.5,top:'18%',right:-110,shadowOpacity:.45,shadowRadius:24},
  portalSpire:{position:'absolute',width:120,height:300,borderWidth:1,borderRadius:60,top:'22%',left:'50%',marginLeft:-60},
  energyArc:{position:'absolute',width:470,height:470,borderRadius:235,borderWidth:1,top:'31%',left:-250},
  scanLine:{position:'absolute',height:1,width:'130%',left:'-15%',top:'20%',opacity:.22},
  environmentDim:{...StyleSheet.absoluteFill},
  uiScrim:{...StyleSheet.absoluteFill,backgroundColor:'rgba(1,5,8,.26)'},
  vignette:{...StyleSheet.absoluteFill,borderWidth:28,borderColor:'rgba(0,0,0,.16)'},
  particle:{position:'absolute',borderRadius:4},
  rain:{position:'absolute',width:1,transform:[{rotate:'-18deg'}]},
  fog:{position:'absolute',width:'125%',height:94,borderRadius:55,borderWidth:18},
  runeWrap:{position:'absolute'},
  rune:{fontSize:20,fontWeight:'700'},
  skyline:{position:'absolute',left:0,right:0,bottom:0,height:'46%'},
  building:{position:'absolute',bottom:0,width:'20%',borderWidth:1,borderBottomWidth:0,borderTopLeftRadius:4,borderTopRightRadius:4},
  factory:{position:'absolute',bottom:0,width:'22%',borderWidth:1,borderBottomWidth:0},
  ruin:{position:'absolute',bottom:-5,width:'23%',borderWidth:1,borderBottomWidth:0,borderTopWidth:2},
  tree:{position:'absolute',bottom:-28,width:0,borderLeftWidth:26,borderRightWidth:26,borderTopWidth:0,borderBottomWidth:98,borderLeftColor:'transparent',borderRightColor:'transparent',borderBottomColor:'rgba(23,57,49,.62)',backgroundColor:'transparent'},
  bossWrap:{position:'absolute',right:-18,bottom:4,width:260,height:360},
  bossHead:{position:'absolute',width:122,height:138,borderRadius:54,borderWidth:2,top:28,right:50,transform:[{rotate:'-7deg'}]},
  bossShoulder:{position:'absolute',width:255,height:165,borderRadius:100,borderWidth:2,bottom:12,right:-2,transform:[{rotate:'7deg'}]},
  bossHornLeft:{position:'absolute',width:68,height:92,borderLeftWidth:3,borderTopWidth:3,borderTopLeftRadius:60,top:0,right:132,transform:[{rotate:'-24deg'}]},
  bossHornRight:{position:'absolute',width:68,height:92,borderRightWidth:3,borderTopWidth:3,borderTopRightRadius:60,top:2,right:20,transform:[{rotate:'25deg'}]},
  bossEye:{position:'absolute',width:13,height:4,borderRadius:4,top:91,right:120,shadowOpacity:1,shadowRadius:10},
  bossEye2:{position:'absolute',width:13,height:4,borderRadius:4,top:91,right:82,shadowOpacity:1,shadowRadius:10},
  threatCore:{position:'absolute',width:92,height:92,borderRadius:46,borderWidth:1.5,top:'42%',left:'50%',marginLeft:-46,shadowOpacity:.8,shadowRadius:22},
  smokeBand:{position:'absolute',left:'-20%',bottom:'16%',width:'140%',height:180,borderRadius:90,backgroundColor:'rgba(35,42,48,.34)'},
  emberField:{...StyleSheet.absoluteFill},
  hotEmber:{position:'absolute',width:3,height:7,borderRadius:3,backgroundColor:'#ff9b42',shadowColor:'#ff5a16',shadowOpacity:.9,shadowRadius:6},
  energyPulse:{position:'absolute',right:'4%',top:'23%',width:170,height:170,borderRadius:85,borderWidth:2,shadowOpacity:.9,shadowRadius:28},
  fireField:{position:'absolute',left:0,right:0,bottom:0,height:'38%',overflow:'hidden'},
  flame:{position:'absolute',bottom:-8,width:18,borderRadius:12,backgroundColor:'#ff6a1a',shadowColor:'#ff9b42',shadowOpacity:.9,shadowRadius:12,transform:[{rotate:'8deg'}]},
  lightningFlash:{...StyleSheet.absoluteFill,backgroundColor:'rgba(175,225,255,.55)'},
  impactShake:{...StyleSheet.absoluteFill},
  cinematic:{...StyleSheet.absoluteFill,overflow:'hidden'},
  cinematicGlow:{position:'absolute',width:360,height:360,borderRadius:180,right:-170,top:'12%',shadowOpacity:.9,shadowRadius:36},
  cinematicContrast:{...StyleSheet.absoluteFill,backgroundColor:'rgba(0,5,8,.18)'},
  siege:{position:'absolute',left:0,right:0,bottom:0,height:'58%',overflow:'hidden'},
  damagedCity:{position:'absolute',left:0,right:0,bottom:-4,height:'52%'},
  siegeBuilding:{position:'absolute',bottom:0,width:'23%',borderWidth:1,borderBottomWidth:0,backgroundColor:'rgba(2,6,9,.72)'},
  buildingBite:{position:'absolute',right:-8,top:-7,width:24,height:28,backgroundColor:'#020609',transform:[{rotate:'28deg'}]},
  ogre:{position:'absolute',right:'5%',bottom:'7%',width:185,height:245},
  ogreBack:{position:'absolute',right:22,bottom:0,width:132,height:170,borderWidth:2,borderRadius:58,backgroundColor:'rgba(2,5,7,.82)'},
  ogreHead:{position:'absolute',right:42,top:18,width:86,height:92,borderWidth:2,borderRadius:38,backgroundColor:'rgba(2,5,7,.9)'},
  ogreHornL:{position:'absolute',right:105,top:2,width:40,height:58,borderLeftWidth:3,borderTopWidth:3,borderTopLeftRadius:40,transform:[{rotate:'-22deg'}]},
  ogreHornR:{position:'absolute',right:23,top:3,width:40,height:58,borderRightWidth:3,borderTopWidth:3,borderTopRightRadius:40,transform:[{rotate:'24deg'}]},
  ogreEye:{position:'absolute',left:20,top:42,width:11,height:4,borderRadius:4,shadowOpacity:1,shadowRadius:9},
  ogreEye2:{position:'absolute',right:20,top:42,width:11,height:4,borderRadius:4,shadowOpacity:1,shadowRadius:9},
  ogreArm:{position:'absolute',right:112,top:94,width:34,height:122,borderWidth:2,borderRadius:20,backgroundColor:'rgba(2,5,7,.86)',transformOrigin:'top center'},
  ogreArmRear:{position:'absolute',right:4,top:98,width:31,height:112,borderWidth:2,borderRadius:20,backgroundColor:'rgba(2,5,7,.72)',transform:[{rotate:'-18deg'}]},
  hitGlow:{position:'absolute',right:'37%',bottom:'29%',width:62,height:62,borderRadius:31,shadowOpacity:.9,shadowRadius:20},
  debris:{position:'absolute',width:9,height:9,borderWidth:1,backgroundColor:'rgba(2,5,7,.8)'},
  bossDomain:{position:'absolute',width:330,height:330,borderRadius:165,borderWidth:3,top:'18%',left:'8%',shadowOpacity:.85,shadowRadius:36},
  awakeningBurst:{position:'absolute',width:260,height:260,borderRadius:130,borderWidth:2,top:'24%',left:'17%',shadowOpacity:.95,shadowRadius:42},
  awakeningCore:{position:'absolute',width:72,height:72,borderRadius:36,top:'35%',left:'41%',shadowOpacity:1,shadowRadius:34,opacity:.28},
  stompWave:{position:'absolute',width:180,height:54,borderRadius:90,borderWidth:2,bottom:'12%',left:'34%'},
  forestMist:{position:'absolute',left:'-12%',right:'-12%',bottom:'8%',height:'55%',borderRadius:160,backgroundColor:'rgba(120,180,160,.045)'},
  firefly:{position:'absolute',width:4,height:4,borderRadius:2,opacity:.65,shadowOpacity:.9,shadowRadius:8},
  industrialSteam:{position:'absolute',left:'-8%',right:'-8%',bottom:'6%',height:'62%',borderRadius:120,backgroundColor:'rgba(120,140,150,.055)'},
  spark:{position:'absolute',width:2,height:12,borderRadius:2,opacity:.58,transform:[{rotate:'28deg'}]},
  worldCloud:{position:'absolute',left:'-25%',top:'12%',width:'150%',height:190,borderRadius:95,backgroundColor:'rgba(150,185,210,.035)'},
  portalVeil:{position:'absolute',width:310,height:310,borderRadius:155,borderWidth:2,top:'18%',left:'9%',shadowOpacity:.75,shadowRadius:32},
});