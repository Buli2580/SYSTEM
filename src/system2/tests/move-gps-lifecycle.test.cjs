const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=process.env.SYSTEM_PROJECT_ROOT??path.resolve(__dirname,'../../..');
const ts=require(require.resolve('typescript',{paths:[root,process.cwd()]}));

function createHookHarness(){
 const states=[],refs=[],effects=[];let si=0,ri=0;
 let watcherReady, removed=0, watchStarted=0;
 const appStateListeners=new Set();
 const AppState={currentState:'active',addEventListener:(type,fn)=>{
   appStateListeners.add(fn);return{remove:()=>appStateListeners.delete(fn)};
 }};
 const subscription=new Promise(resolve=>{watcherReady=resolve;});
 const react={
   useState(initial){
     const id=si++;
     states[id]=initial;
     return[states[id],value=>{states[id]=typeof value==='function'?value(states[id]):value;}];
   },
   useRef(initial){const id=ri++;return refs[id]??(refs[id]={current:initial});},
   useCallback:fn=>fn,
   useEffect:effect=>effects.push(effect()),
 };
 const dependencies={
  react,
  'react-native':{AppState},
  'expo-location':{
   Accuracy:{High:4},
   requestForegroundPermissionsAsync:async()=>({status:'granted'}),
   watchPositionAsync:async()=>{watchStarted++;return subscription;},
  },
  '../activity/features':{createActivityWindow:()=>({add(){},features:()=>({distanceMeters:0,durationSeconds:0})})},
  '../activity/classifier':{classifyActivity:()=>({verdict:'VERIFIED'})},
  './verification':{moveExpectedActivity:()=> 'WALK'},
  './health':{moveHealthAvailable:async()=>false,readMoveHealth:async()=>[]},
  '../health/contract':{sumHealthSamples:()=>0},
  './sessionClock':{
   createMoveSessionClock:(wall,mono)=>({startedAtWallMs:wall,startedAtMonotonicMs:mono}),
   moveElapsedMs:(c,now)=>now-c.startedAtMonotonicMs,
   moveWallEndMs:(c,now)=>c.startedAtWallMs+now-c.startedAtMonotonicMs,
  },
 };
 const file=path.join(root,'src/system2/move/useMoveVerification.ts');
 const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText;
 const module={exports:{}};
 vm.runInNewContext(js,{module,exports:module.exports,
  require:name=>{
   if(Object.hasOwn(dependencies,name))return dependencies[name];
   throw new Error('Unexpected import: '+name);
  },
  Date,Math,Error,performance:{now:()=>25000},
  setInterval:()=>42,clearInterval:()=>{},
 },{filename:file});
 const run=module.exports.useMoveVerification({
  verification:'GPS_DISTANCE',kind:'WALK',id:'move_walk_10',
 });
 return{
  run,
  get status(){return states[0];},
  get watchStarted(){return watchStarted;},
  get removed(){return removed;},
  settle:()=>watcherReady({remove:()=>{removed++;}}),
  background:()=>{AppState.currentState='background';appStateListeners.forEach(fn=>fn('background'));},
  unmount:()=>effects.forEach(fn=>fn?.()),
 };
}

test('a watcher created after RESET is immediately removed, not published',async()=>{
 const h=createHookHarness();
 const starting=h.run.start();
 for(let i=0;i<6;i++)await Promise.resolve();
 assert.equal(h.watchStarted,1);
 h.run.reset();
 h.settle();
 await starting;
 assert.equal(h.removed,1);
 assert.equal(h.status,'READY');
 h.unmount();
});

test('a watcher created after UNMOUNT is immediately removed',async()=>{
 const h=createHookHarness();
 const starting=h.run.start();
 for(let i=0;i<6;i++)await Promise.resolve();
 assert.equal(h.watchStarted,1);
 h.unmount();
 h.settle();
 await starting;
 assert.equal(h.removed,1);
});

test('foreground-only MOVE refuses to credit activity after app backgrounds',async()=>{
 const h=createHookHarness();
 const starting=h.run.start();
 for(let i=0;i<6;i++)await Promise.resolve();
 assert.equal(h.watchStarted,1);
 h.background();
 h.settle();
 await starting;
 assert.equal(h.removed,1);
 assert.equal(h.status,'ERROR');
 h.unmount();
});
