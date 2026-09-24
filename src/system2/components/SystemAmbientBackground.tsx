import { useFocusEffect } from 'expo-router';
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useCallback } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

// Preserve React Native's typed percentage syntax in dynamically generated scenes.
const percent = (value: number): `${number}%` => `${value}%`;
import { chooseScene, normalizedSceneContext } from '../visual/engine';
import type { ScreenMood, ThreatLevel, WorldSceneId, WorldWeather } from '../visual/types';
import {useAnimation4} from '../presentation/useAnimation4';

type Intensity = 'quiet' | 'default' | 'hero' | 'world';
type CinematicSource = number | {uri:string};

const CINEMATIC_ART:Partial<Record<WorldSceneId,CinematicSource>>={
  // Local require(...) assets can be added here when final artwork is committed.
  // Remote/CDN sources may be passed explicitly through cinematicSource.
};

export default function SystemAmbientBackground({
  intensity='default', screen='HOME', level=1, threat=0, scene, weather='CLEAR', cinematicSource,
}:{
  intensity?:Intensity;
  screen?:ScreenMood;
  level?:number;
  threat?:ThreatLevel;
  scene?:WorldSceneId;
  weather?:WorldWeather;
  cinematicSource?:CinematicSource;
}) {
  const far=useSharedValue(0);
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
      far.value=.5;mid.value=.5;near.value=.5;scan.value=.5;pulse.value=.5;
      return()=>[far,mid,near,scan,pulse].forEach(cancelAnimation);
    }
    far.value=withRepeat(withTiming(1,{duration:22000,easing:Easing.inOut(Easing.ease)}),-1,true);
    mid.value=withRepeat(withTiming(1,{duration:13500,easing:Easing.inOut(Easing.ease)}),-1,true);
    near.value=withRepeat(withTiming(1,{duration:7600,easing:Easing.inOut(Easing.ease)}),-1,true);
    scan.value=withRepeat(withTiming(1,{duration:8400,easing:Easing.linear}),-1,false);
    pulse.value=withRepeat(withTiming(1,{duration:2800,easing:Easing.inOut(Easing.ease)}),-1,true);
    return()=>[far,mid,near,scan,pulse].forEach(cancelAnimation);
  },[far,mid,near,scan,pulse,motion.reduced]));

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

  const strength=intensity==='hero'?1:intensity==='world'?.94:intensity==='quiet'?.48:.74;
  const timeDim=ctx.time==='NIGHT'?.18:ctx.time==='DUSK'?.11:.05;
  const weatherDim=weather==='STORM'?.20:weather==='RAIN'?.13:weather==='FOG'?.09:.04;
  const threatGlow=.12+threat*.08;

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

    {(worldScene.id==='CITY'||worldScene.id==='RUINS'||worldScene.id==='BOSS_ZONE')&&
      <CitySiege accent={worldScene.accent} strength={strength} reduced={motion.reduced} threat={threat}/>}
    <Animated.View style={[styles.nearLayer,nearStyle]}>
      <Particles kind={worldScene.particle} accent={worldScene.accent} strength={strength} weather={weather}/>
      {weather==='RAIN'||weather==='STORM'?<Rain accent={worldScene.accent} strength={strength}/>:null}
      {worldScene.particle==='runes'||screen==='LAUNCH'||screen==='CHARACTER'?<Runes accent={worldScene.accent} strength={strength}/>:null}
    </Animated.View>

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
  useFocusEffect(useCallback(()=>{
    if(reduced){attack.value=.55;debris.value=.45;return()=>{cancelAnimation(attack);cancelAnimation(debris)}}
    attack.value=withRepeat(withTiming(1,{duration:1850,easing:Easing.inOut(Easing.ease)}),-1,true);
    debris.value=withRepeat(withTiming(1,{duration:2600,easing:Easing.linear}),-1,false);
    return()=>{cancelAnimation(attack);cancelAnimation(debris)};
  },[attack,debris,reduced]));
  const ogre=useAnimatedStyle(()=>({transform:[
    {translateX:interpolate(attack.value,[0,1],[-8,5])},
    {translateY:interpolate(attack.value,[0,.5,1],[3,-5,3])},
    {rotate:interpolate(attack.value,[0,1],[-2,3])+'deg'},
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
  const hitGlow=useAnimatedStyle(()=>({opacity:interpolate(attack.value,[0,.42,.58,1],[0,0,.52,0]),transform:[{scale:interpolate(attack.value,[0,.5,1],[.65,1.2,.8])}]}));
  const opacity=(threat>=2?.42:.29)*strength;
  return <View style={[styles.siege,{opacity}]}>
    <View style={styles.damagedCity}>
      {[0,1,2,3,4].map(i=><View key={i} style={[styles.siegeBuilding,{left:percent(i*19),height:58+(i%3)*34,borderColor:accent,transform:[{rotate:(i===2?'-7deg':i===3?'5deg':'0deg')}]}]}>
        {i===2&&<View style={styles.buildingBite}/>}
      </View>)}
    </View>
    <Animated.View style={[styles.ogre,ogre]}>
      <View style={[styles.ogreBack,{borderColor:accent}]}/>
      <View style={[styles.ogreHead,{borderColor:accent}]}>
        <View style={[styles.ogreEye,{backgroundColor:accent,shadowColor:accent}]}/>
        <View style={[styles.ogreEye2,{backgroundColor:accent,shadowColor:accent}]}/>
      </View>
      <View style={[styles.ogreHornL,{borderColor:accent}]}/><View style={[styles.ogreHornR,{borderColor:accent}]}/>
      <Animated.View style={[styles.ogreArm,{borderColor:accent},arm]}/><View style={[styles.ogreArmRear,{borderColor:accent}]}/>
    </Animated.View>
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
});