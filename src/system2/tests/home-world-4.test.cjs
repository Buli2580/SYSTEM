const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load() {
 const file = require.resolve('../home4/model.ts');
 const code = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const exports={}; vm.runInNewContext(code,{exports}); return exports;
}
test('night, boss and progression derive only presentation state',()=>{
 const m=load().worldPresentation({hour:23,level:25,bossActive:true,bossComplete:false,reduced:false,lowPower:false});
 assert.equal(m.night,true); assert.equal(m.tier,3); assert.equal(m.weather,'ASH'); assert.equal(m.boss,'THREAT');
});
test('cleared boss changes atmosphere; day uses local hour',()=>{
 const m=load().worldPresentation({hour:12,level:1,bossActive:false,bossComplete:true,reduced:false,lowPower:false});
 assert.equal(m.night,false); assert.equal(m.boss,'CLEARED'); assert.equal(m.weather,'MIST');
});
test('reduce motion and low performance disable every moving layer',()=>{
 for(const flags of [{reduced:true,lowPower:false},{reduced:false,lowPower:true}]){
  const m=load().worldPresentation({hour:12,level:10,bossActive:true,bossComplete:false,...flags});
  assert.equal(m.animate,false); assert.equal(m.particles,0); assert.equal(m.parallax,0);
 }
});
test('mission action seam preserves callback and supports future Game Loop labels',()=>{
 const {missionAction}=load(); let calls=0;
 const action=missionAction('CONTINUE MISSION',()=>calls++);
 assert.equal(action.label,'CONTINUE MISSION'); action.onPress(); assert.equal(calls,1);
});
function component(file, overrides={}) {
 const cache=new Map();
 function read(file){
  if(cache.has(file))return cache.get(file);
  const exports={};cache.set(file,exports);
  const jsx=(type,props)=>({type,props:props??{}});
  const mocks={
   'react':{useState:v=>[v,()=>{}],useCallback:f=>f,useEffect:()=>{}},
   'react/jsx-runtime':{jsx,jsxs:jsx},
   'react-native':{View:'View',Text:'Text',Pressable:'Pressable',ScrollView:'ScrollView',StyleSheet:{create:x=>x,absoluteFill:{}},useWindowDimensions:()=>({width:390,height:844})},
   'expo-image':{Image:'Image'},
   'expo-router':{useFocusEffect:()=>{},useRouter:()=>({push:()=>{}})},
   'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:24,bottom:20})},
   'react-native-reanimated':{default:{View:'Animated.View'},useSharedValue:v=>({value:v}),useAnimatedStyle:f=>f(),cancelAnimation:()=>{},withTiming:v=>v},
   '../visual/assets':{ART:{home:1,boss:2},characterArt:()=>3},
   '../components/IdentityAvatar':{default:'IdentityAvatar'},
   ...overrides,
  };
  const requireMock=name=>{
   if(name in mocks)return mocks[name];
   if(name.startsWith('.'))return read(require.resolve(require('node:path').resolve(require('node:path').dirname(file),name)+ (name==='./model'?'.ts':'.tsx')));
   throw Error('Unexpected '+name);
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:false,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:requireMock});
  return exports;
 }
 return read(require.resolve('../home4/'+file));
}
function nodes(tree){if(!tree||typeof tree!=='object')return [];return [tree,...[tree.props?.children].flat(Infinity).flatMap(nodes)];}
test('mission CTA dispatches supplied action once without reward mutations',()=>{
 let calls=0;const Focus=component('MissionFocus.tsx').default;
 const tree=Focus({title:'GPS',subtitle:'Walk',progress:1,total:3,reward:20,action:{label:'RESUME MISSION',onPress:()=>calls++}});
 const buttons=nodes(tree).filter(n=>n.type==='Pressable');assert.equal(buttons.length,1);
 buttons[0].props.onPress();assert.equal(calls,1);
 assert.ok(nodes(tree).some(n=>n.props.children==='RESUME MISSION'));
});
test('character preserves photo priority, equipment slot and character navigation',()=>{
 const Character=component('CharacterStage.tsx').default;let calls=0;
 const tree=Character({uri:'local-photo',evolution:2,avatarStyle:'DARK',name:'Hunter',event:'VICTORY',animate:false,onPress:()=>calls++,equipment:'real equipped item'});
 assert.ok(nodes(tree).some(n=>n.type==='IdentityAvatar'&&n.props.uri==='local-photo'));
 assert.ok(nodes(tree).some(n=>n.props.children==='real equipped item'));
 tree.props.onPress();assert.equal(calls,1);
});
test('world uses actual boss state, noninteractive art, and low-end fallback',()=>{
 const Stage=component('WorldStage.tsx').default;
 for(const bossActive of [false,true]){
  const p=load().worldPresentation({hour:20,level:1,bossActive,bossComplete:false,reduced:true,lowPower:false});
  const tree=Stage({presentation:p,event:'HOME',foreground:true});
  assert.equal(tree.props.pointerEvents,'none');
  assert.equal(nodes(tree).filter(n=>n.props.testID==='world-boss').length,bossActive?1:0);
  assert.equal(nodes(tree).find(n=>n.props.testID==='world-weather').props.children.length,0);
 }
});
test('HOME connects actual mission, world, boss, character and secondary quest actions',()=>{
 const pushes=[];const Stub='Stub';
 const Screen=component('HomeWorldScreen.tsx',{
  'expo-router':{useFocusEffect:()=>{},useRouter:()=>({push:path=>pushes.push(path)})},
  '../components/BottomNavigation':{default:Stub},'../components/SystemError':{default:Stub},'../components/SystemScreen':{default:Stub},
  '../core':{getPlayerProgressPercent:()=>.2},
  '../quests/catalog':{AWAKENING_QUESTS:[],AWAKENING_REWARD_XP:100,getAwakeningProgress:()=>({completed:3,total:3}),getQuestStatus:()=>''},
  '../state/SystemProvider':{useSystem:()=>({player:{realLevel:2,displayName:'H',realXp:20,realXpToNextLevel:100,gameEnergy:5,streak:2},ready:true,completedQuestIds:[],awakeningCompleted:true,worldUnlocked:true,activeQuestId:'actual',settings:{},inventory:[],story:{bossComplete:false}})},
  '../story/selectors':{mainStoryObjective:()=>({completed:1,total:3,reward:100})},
  '../gameMaster/director':{directNextMission:()=>({quest:{id:'actual',title:'Actual mission',rewards:{realXp:30}},message:'Continue'})},
  '../identity/audio':{playSceneMusic:()=>{},stopMusic:()=>{}},
  './useWorldEnvironment':{useWorldEnvironment:()=>({hour:12,reduced:true,foreground:true})},
  './WorldStage':{default:'WorldStage'},'./CharacterStage':{default:'CharacterStage'},'./MissionFocus':{default:'MissionFocus'},
 }).default;
 const tree=Screen(),all=nodes(tree);
 const mission=all.find(n=>n.type==='MissionFocus');assert.equal(mission.props.title,'Actual mission');assert.equal(mission.props.reward,30);
 assert.equal(mission.props.action.label,'CONTINUE MISSION');mission.props.action.onPress();
 assert.equal(pushes[0].params.questId,'actual');
 all.filter(n=>n.type==='Pressable').forEach(n=>n.props.onPress());
 all.find(n=>n.type==='CharacterStage').props.onPress();
 for(const route of ['/world','/story','/quests','/character'])assert.ok(pushes.includes(route));
});


test('world motion is finite and cancels on blur; background and reduce motion never start it',()=>{
 for(const [animate,foreground,expected] of [[true,true,1],[false,true,0],[true,false,0]]){
  let started=0,cancelled=0;const cleanup=[];
  const Stage=component('WorldStage.tsx',{
   'expo-router':{useFocusEffect:fn=>cleanup.push(fn())},
   'react-native-reanimated':{default:{View:'Animated.View'},useSharedValue:v=>({value:v}),useAnimatedStyle:fn=>fn(),cancelAnimation:()=>cancelled++,withTiming:(v,options)=>{assert.ok(options.duration<=1400);started++;return v;}},
  }).default;
  Stage({presentation:{animate,parallax:6,particles:0,boss:'DORMANT',tier:1,night:true},event:'HOME',foreground});
  assert.equal(started,expected);cleanup.forEach(fn=>fn?.());assert.equal(cancelled,2);
 }
});
test('image failure has a static fallback and a different source can load',()=>{
 let failed;const Art=component('WorldStage.tsx',{'react':{useState:()=>[failed,v=>failed=v]}}).SceneArt;
 Art({source:1}).props.onError();assert.equal(Art({source:1}).type,'View');assert.equal(Art({source:2}).type,'Image');
});
test('environment listens to accessibility and app lifecycle and removes listeners',async()=>{
 const state=[],cleanup=[],handlers={};let removed=0;
 const env=component('useWorldEnvironment.ts',{
  'react':{useState:v=>{const i=state.length;state.push(v);return [v,x=>state[i]=x];},useEffect:fn=>cleanup.push(fn()),useCallback:fn=>fn},
  'react-native':{AccessibilityInfo:{isReduceMotionEnabled:async()=>false,addEventListener:(event,fn)=>{handlers[event]=fn;return {remove:()=>removed++};}},AppState:{currentState:'active',addEventListener:(event,fn)=>{handlers[event]=fn;return {remove:()=>removed++};}}},
 }).useWorldEnvironment;
 assert.equal(env().reduced,true);await Promise.resolve();assert.equal(state[0],false);
 handlers.reduceMotionChanged(true);assert.equal(state[0],true);
 handlers.change('background');assert.equal(state[1],false);
 handlers.change('active');assert.equal(state[1],true);
 cleanup.forEach(fn=>fn());assert.equal(removed,2);
});
