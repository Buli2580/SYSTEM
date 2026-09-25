const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=process.env.SYSTEM_PROJECT_ROOT??path.resolve(__dirname,'../../..');
const ts=require(require.resolve('typescript',{paths:[root,process.cwd()]}));

function loader(){
 const cache=new Map();
 function load(file){
  const resolved=[file,file+'.ts',path.join(file,'index.ts')].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
  if(!resolved)throw new Error('Missing module: '+file);
  if(cache.has(resolved))return cache.get(resolved).exports;
  const module={exports:{}};cache.set(resolved,module);
  const source=ts.transpileModule(fs.readFileSync(resolved,'utf8'),{
   compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
  }).outputText;
  const requireMock=name=>{
   if(name.startsWith('.'))return load(path.resolve(path.dirname(resolved),name));
   if(name==='@react-native-async-storage/async-storage')return{default:{getItem:async()=>null,setItem:async()=>{},removeItem:async()=>{}}};
   throw new Error('Unexpected dependency: '+name);
  };
  vm.runInNewContext(source,{module,exports:module.exports,require:requireMock,console,Date,Set,Math,JSON,Intl},{filename:resolved});
  return module.exports;
 }
 return relative=>load(path.join(root,'src/system2',relative));
}

function player(level=1){
 const stat=lv=>({key:'STR',level:lv,xp:0,xpToNextLevel:100,totalXp:0});
 return{
  id:'p',displayName:'Tester',realLevel:level,realXp:0,realXpToNextLevel:100,totalRealXp:0,rank:'E',
  stats:{
   STR:{...stat(level),key:'STR'},VIT:{...stat(level),key:'VIT'},INT:{...stat(level),key:'INT'},
   WIL:{...stat(level),key:'WIL'},CHA:{...stat(level),key:'CHA'},CRE:{...stat(level),key:'CRE'},RES:{...stat(level),key:'RES'},
  },
  streak:0,verifiedQuestCount:0,createdAt:'2026-01-01T00:00:00.000Z',updatedAt:'2026-01-01T00:00:00.000Z',
  mode:'STANDARD',avatarEvolution:0,discoveredSectors:0,totalDistanceMeters:0,gameEnergy:0,
 };
}

test('Inventory unlocks are progression-gated and never all open at level 1',()=>{
 const {INVENTORY_ITEMS,unlockedInventory}=loader()('inventory/catalog');
 const start=unlockedInventory(1,false,false);
 assert.ok(start.length<INVENTORY_ITEMS.length);
 assert.equal(start.some(x=>x.id==='relic-origin-shard'),false);
 assert.equal(unlockedInventory(1,false,true).some(x=>x.id==='relic-origin-shard'),true);
 assert.equal(unlockedInventory(1,true,false).some(x=>x.id==='badge-first-wall'),true);
});

test('WEEKLY habits are due once per real Monday-based week, not once per month',()=>{
 const {dueHabits,habitWeekKey}=loader()('habits/engine');
 const habit={id:'w',title:'Weekly',frequency:'WEEKLY',minutes:10,streak:3,lastCompletedDay:'2026-09-21'};
 assert.equal(habitWeekKey('2026-09-21'),'2026-09-21');
 assert.equal(dueHabits([habit],'2026-09-24',4).length,0);
 assert.equal(dueHabits([habit],'2026-09-28',1).length,1);
});

test('habit streak resets after a missed daily period and advances on continuity',()=>{
 const {completeHabit}=loader()('habits/engine');
 const base={id:'d',title:'Daily',frequency:'DAILY',minutes:5,streak:4,lastCompletedDay:'2026-09-23'};
 assert.equal(completeHabit(base,'2026-09-24').streak,5);
 assert.equal(completeHabit(base,'2026-09-26').streak,1);
});

test('Skill Tree 2.0 unlock state follows canonical skill levels',()=>{
 const {skillTreeState}=loader()('progression/skillTree2');
 const low=skillTreeState(player(1));
 assert.ok(low.every(x=>x.unlocked===false));
 const high=skillTreeState(player(5));
 assert.ok(high.every(x=>x.unlocked===true));
});

test('PvP targets are bounded and cannot request absurd goals',()=>{
 const {safePvpTarget}=loader()('social/pvp');
 assert.equal(safePvpTarget('QUESTS',999999),100);
 assert.equal(safePvpTarget('REAL_XP',999999),100000);
 assert.equal(safePvpTarget('QUESTS',0),1);
});

test('Raid 2.0 phases progress deterministically from canonical HP',()=>{
 const {raid2Phase}=loader()('social/raid2');
 const raid={id:'r',title:'Boss',bossHp:100,damage:0,startsAt:'2026-09-01',endsAt:'2026-10-01',status:'ACTIVE'};
 assert.equal(raid2Phase(raid),'ENGAGE');
 assert.equal(raid2Phase({...raid,damage:40}),'BREAK');
 assert.equal(raid2Phase({...raid,damage:70}),'ENRAGE');
 assert.equal(raid2Phase({...raid,damage:90}),'FINAL_STRIKE');
 assert.equal(raid2Phase({...raid,damage:100}),'DEFEATED');
});

test('Season 2.0 time progress is bounded',()=>{
 const {seasonProgress2}=loader()('social/season2');
 const season={id:'s',name:'S1',startsAt:'2026-09-01T00:00:00.000Z',endsAt:'2026-10-01T00:00:00.000Z'};
 assert.equal(seasonProgress2(season,Date.parse('2026-08-01T00:00:00.000Z')).percent,0);
 assert.equal(seasonProgress2(season,Date.parse('2026-11-01T00:00:00.000Z')).percent,100);
});

test('Offline Sync 2.0 backs off and caps retries',()=>{
 const {nextSyncDelay,syncBatchSize}=loader()('cloud/offlineSync2');
 assert.equal(nextSyncDelay(0,0).priority,'LOW');
 assert.equal(nextSyncDelay(4,50).priority,'HIGH');
 assert.ok(nextSyncDelay(20,50).delayMs<=15*60_000);
 assert.equal(syncBatchSize(500),50);
});

test('Anti-Cheat 2.0 hard-rejects mocked GPS and teleport',()=>{
 const {inspectGpsRisk}=loader()('verification/sessionRisk');
 const now=Date.now();
 const mocked={
  coords:{latitude:54.54,longitude:17.75,accuracy:5,altitude:null,altitudeAccuracy:null,heading:null,speed:null},
  timestamp:now,mocked:true,
 };
 assert.equal(inspectGpsRisk(null,mocked,now).action,'REJECT');
 const a={...mocked,mocked:false,timestamp:now-5000,coords:{...mocked.coords,latitude:54.54,longitude:17.75}};
 const b={...mocked,mocked:false,timestamp:now,coords:{...mocked.coords,latitude:54.55,longitude:17.75}};
 const risk=inspectGpsRisk(a,b,now);
 assert.equal(risk.action,'REJECT');
 assert.ok(risk.signals.some(x=>x.kind==='TELEPORT'||x.kind==='IMPOSSIBLE_SPEED'));
});


test('Planner recurrence respects DAILY, WEEKDAYS and selected WEEKLY weekday',()=>{
 const {planBlockDue}=loader()('planning/storage');
 const daily={id:'d',title:'Daily',time:'18:00',minutes:30,kind:'FOCUS',frequency:'DAILY'};
 const weekdays={...daily,id:'wd',frequency:'WEEKDAYS'};
 const weekly={...daily,id:'w',frequency:'WEEKLY',weekday:1};
 const monday=new Date('2026-09-28T12:00:00');
 const sunday=new Date('2026-09-27T12:00:00');
 assert.equal(planBlockDue(daily,sunday),true);
 assert.equal(planBlockDue(weekdays,monday),true);
 assert.equal(planBlockDue(weekdays,sunday),false);
 assert.equal(planBlockDue(weekly,monday),true);
 assert.equal(planBlockDue(weekly,sunday),false);
});

test('MOVE Verified Event v3 is server validated and grants no REAL XP',()=>{
 const migration=fs.readFileSync(path.join(root,'supabase/migrations/20260924113000_move_verified_event_v3.sql'),'utf8');
 assert.match(migration,/submit_move_verified_event_v3/);
 assert.match(migration,/MOVE_VERIFIED_EVENT/);
 assert.match(migration,/IMPOSSIBLE_SPEED/);
 assert.match(migration,/move_walk_10/);
 assert.match(migration,/move_run_10/);
 assert.match(migration,/move_bike_20/);
 assert.doesNotMatch(migration,/insert into public\.reward_ledger/i);
});

test('MOVE completion persists server evidence before asynchronous group publish',()=>{
 const source=fs.readFileSync(path.join(root,'src/system2/screens/MoveQuestScreen.tsx'),'utf8');
 assert.match(source,/queueMoveServerVerification/);
 assert.match(source,/flushPendingMoveServerVerifications/);
 assert.match(source,/publishVerifiedMoveToGroups/);
 const queueIndex=source.indexOf('await queueMoveServerVerification');
 const publishIndex=source.indexOf('publishVerifiedMoveToGroups({',queueIndex);
 assert.ok(queueIndex>=0&&publishIndex>queueIndex);
});

test('School UI no longer claims its online backend is disconnected',()=>{
 const source=fs.readFileSync(path.join(root,'src/system2/screens/MoveSchoolScreen.tsx'),'utf8');
 assert.doesNotMatch(source,/NOT LINKED/);
 assert.match(source,/ONLINE BACKEND READY/);
});


test('Social Competition v3 exposes rich PvP, Guild War, Raid and Season loops',()=>{
 const migration=fs.readFileSync(path.join(root,'supabase/migrations/20260924121000_social_competition_v3.sql'),'utf8');
 assert.match(migration,/get_my_pvp_challenges_v3/);
 assert.match(migration,/get_my_guild_wars_v3/);
 assert.match(migration,/get_active_raids_v3/);
 assert.match(migration,/get_raid_leaderboard_v3/);
 assert.match(migration,/get_current_season_v3/);
 assert.match(migration,/claim_season_reward_v3/);
 assert.match(migration,/season_claims_v3/);
});

test('Season rewards remain cosmetic-only',()=>{
 const source=fs.readFileSync(path.join(root,'src/system2/social/seasonRewards.ts'),'utf8');
 assert.doesNotMatch(source,/\bxp\s*:/i);
 assert.match(source,/COSMETIC/);
 assert.match(source,/CARD_FRAME/);
});


test('Animation Engine 4.0 is mounted once and owns route transitions',()=>{
 const layout=fs.readFileSync(path.join(root,'src/app/_layout.tsx'),'utf8');
 assert.match(layout,/AnimationEngine4Provider/);
 assert.match(layout,/SystemRouteMotion/);
 assert.match(layout,/animation:\s*['"]none['"]/);
});

test('Boot intro remains wired to Animation Engine 4.0 and audio',()=>{
 const boot=fs.readFileSync(path.join(root,'src/system2/components/SystemBootSequence.tsx'),'utf8');
 assert.match(boot,/useAnimationEngine4/);
 assert.match(boot,/playAudioTheme/);
 assert.match(boot,/AWAKENING/);
 assert.match(boot,/POMIŃ INTRO/);
});

test('Animation Engine 4.0 has a single canonical timing source',()=>{
 const engine=fs.readFileSync(path.join(root,'src/system2/presentation/animationEngine4.ts'),'utf8');
 const adapter=fs.readFileSync(path.join(root,'src/system2/presentation/animation4.ts'),'utf8');
 assert.match(engine,/MOTION_4/);
 assert.match(engine,/reducedMotion|reduced/);
 assert.match(adapter,/from '.\/animationEngine4'/);
 assert.doesNotMatch(adapter,/durations:\s*\{/);
});

test('Core overlays use the canonical Animation Engine 4.0 provider',()=>{
 for(const rel of [
  'src/system2/components/SystemPage.tsx',
  'src/system2/components/SystemEventOverlay.tsx',
  'src/system2/components/CombatImpactOverlay.tsx',
  'src/system2/cards/MilestoneCardOverlay.tsx',
 ]){
  const source=fs.readFileSync(path.join(root,rel),'utf8');
  assert.match(source,/AnimationEngine4Provider|useAnimation4/);
  assert.equal((source.match(/const motion\s*=/g)||[]).length,1,rel+' must have exactly one motion hook');
 }
});
