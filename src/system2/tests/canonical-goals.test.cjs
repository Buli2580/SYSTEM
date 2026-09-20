// Recovery regressions from archive/codex-before-cloud-processor c958a928.
// Real SQLite and TypeScript loader; existing gameplay suite remains intact.
// Run from the project: node --test src/system2/tests/gameplay.test.cjs
// Uses installed TypeScript and Node's real in-memory SQLite; no new dependencies.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.SYSTEM_PROJECT_ROOT ?? path.resolve(__dirname, '../../..');
const ts = require(require.resolve('typescript', { paths: [root, process.cwd()] }));

// Live GPS fixtures use wall time; freeze time only when a test explicitly injects a clock.
function loader(mocks, clock = { get now() { return Date.now(); } }) {
  const cache = new Map();
  function load(file) {
    const resolved = [file, file + '.ts', file + '.tsx', path.join(file, 'index.ts')]
      .find(p => fs.existsSync(p) && fs.statSync(p).isFile());
    if (!resolved) throw new Error('Missing module: ' + file);
    if (cache.has(resolved)) return cache.get(resolved).exports;
    const module = { exports: {} };
    cache.set(resolved, module);
    const source = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const requireMock = name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name === 'react-native-reanimated') {
        const transition = { duration() { return this; }, delay() { return this; }, springify() { return this; } };
        return { default: { View: 'View', Text: 'Text' }, View: 'View', Text: 'Text',
          FadeInUp: transition, FadeIn: transition, FadeOut: transition,
          Easing: { inOut: x => x, ease: x => x, linear: x => x },
          useSharedValue: value => ({ value }), useAnimatedStyle: fn => fn(),
          withTiming: value => value, withRepeat: value => value, withSequence: (...v) => v.at(-1),
          cancelAnimation() {}, interpolate: (v, input, output) => output[0] };
      }
      if (name.startsWith('.')) return load(path.resolve(path.dirname(resolved), name));
      throw new Error('Unexpected dependency: ' + name);
    };
    vm.runInNewContext(source, {
      module, exports: module.exports, require: requireMock, console, Error, __DEV__: mocks.__DEV__ ?? false,
      setTimeout, clearTimeout,
      setInterval: clock.intervals ? fn => { const id = {}; clock.intervals.set(id, fn); return id; } : setInterval,
      clearInterval: clock.intervals ? id => clock.intervals.delete(id) : clearInterval,
      performance: { now: () => clock.monotonic ?? clock.now },
      Date: class extends Date { static now() { return clock.now; } },
    }, { filename: resolved });
    return module.exports;
  }
  return relative => load(path.join(root, 'src/system2', relative));
}

function databaseHarness(t, clock) {
  const sql = new DatabaseSync(':memory:');
  t.after(() => sql.close());
  const faults = { open: false, init: false, statement: '', commit: false, afterCommit: false, failWhen: null };
  let transaction = false;
  function query(inTransaction) {
    return {
      async execAsync(source) {
        if (faults.init) { faults.init = false; throw new Error('init failed'); }
        sql.exec(source);
      },
      async getFirstAsync(source, ...params) {
        assert.equal(transaction, inTransaction, 'queries must use the transaction handle');
        return sql.prepare(source).get(...params) ?? null;
      },
      async getAllAsync(source, ...params) {
        assert.equal(transaction, inTransaction);
        return sql.prepare(source).all(...params);
      },
      async runAsync(source, ...params) {
        assert.equal(transaction, inTransaction, 'writes must use the transaction handle');
        if (faults.failWhen?.(source, params)) {
          faults.failWhen = null;
          throw new Error('injected chapter failure');
        }
        if (faults.statement && source.includes(faults.statement)) {
          faults.statement = '';
          throw new Error('write failed');
        }
        const result=sql.prepare(source).run(...params);
        return {...result,lastInsertRowId:Number(result.lastInsertRowid)};
      },
    };
  }
  const adapter = {
    ...query(false),
    async withExclusiveTransactionAsync(task) {
      sql.exec('BEGIN'); transaction = true;
      try {
        await task(query(true));
        if (faults.commit) { faults.commit = false; throw new Error('commit failed'); }
        sql.exec('COMMIT');
      } catch (error) {
        sql.exec('ROLLBACK');
        throw error;
      } finally { transaction = false; }
      if (faults.afterCommit) { faults.afterCommit = false; throw new Error('connection close failed after commit'); }
    },
  };
  const mocks = { 'expo-sqlite': { async openDatabaseAsync() {
    if (faults.open) { faults.open = false; throw new Error('open failed'); }
    return adapter;
  } } };
  const load = loader(mocks, clock);
  return { db: load('storage/database'), faults, sql, load, reload: () => loader(mocks, clock)('storage/database'), reloadWorld: () => loader(mocks, clock)('storage/world') };
}
const evidence = { questId: 'first_movement_v1', verificationType: 'GPS_DISTANCE', verificationScore: 95, distanceMeters: 503.25, durationSeconds: 400 };

const focusEvidence = { questId: 'focus_protocol_v1', verificationType: 'TIMER', verificationScore: 100, durationSeconds: 600 };
const multiEvidence = { questId: 'final_trial_v1', verificationType: 'MULTI', verificationScore: 95, durationSeconds: 600, distanceMeters: 603 };
const flush = () => new Promise(resolve => setImmediate(resolve));
async function unlockWorld(h) {
  await h.db.loadSystemState();
  await h.db.completeVerifiedQuest(evidence);
  await h.db.completeVerifiedQuest(focusEvidence);
  await h.db.completeVerifiedQuest(multiEvidence);
  return h.load('storage/world');
}
const activityLoad = loader({});
const classify = activityLoad('activity/classifier').classifyActivity;
function features(patch = {}) {
 return { distanceMeters: 1500, durationSeconds: 600, averageSpeedMps: 2.5, medianSpeedMps: 2.5,
 maxSpeedMps: 4, speedVariance: .3, accelerationChanges: 0, stops: 0, movingSeconds: 600, stationarySeconds: 0,
 gpsGaps: 0, rejectedSamples: 0, teleportCount: 0, sampleCount: 120, meanAccuracy: 5, maxAccuracy: 5, mocked: false, ...patch };
}
function dailyEvidence(h,id) {
 const q=h.load('quests/catalog').getQuest(id);
 if(q.verification.type==='TIMER') return {questId:id,verificationType:'TIMER',durationSeconds:q.verification.minimumDurationSeconds,verificationScore:100};
 const activity=classify(q.activityType,features({distanceMeters:q.verification.minimumDistanceMeters,medianSpeedMps:1.5}));
 return {questId:id,verificationType:'GPS_DISTANCE',durationSeconds:activity.features.durationSeconds,distanceMeters:activity.features.distanceMeters,verificationScore:activity.verificationScore,activity};
}
async function dailyHarness(t) {
 const clock={now:new Date(2026,8,18,10).getTime()}; const h=databaseHarness(t,clock); await unlockWorld(h); return {...h,clock};
}
function treeText(node) {
  if (Array.isArray(node)) return node.map(treeText).join('');
  if (node && typeof node === 'object') return treeText(node.props?.children);
  return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
}
function findButtons(node) {
  if (Array.isArray(node)) return node.flatMap(findButtons);
  if (!node || typeof node !== 'object') return [];
  return [...(node.type === 'Pressable' ? [node] : []), ...findButtons(node.props?.children)];
}
function integrationUI(context,extra={}) {
 const slots=[];let cursor=0;const navigation=[];
 const react={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},
 useRef(initial){const i=cursor++;return slots[i]??(slots[i]={current:initial});},useCallback:fn=>fn,useEffect:()=>{}};
 const jsx=(type,props)=>typeof type==='function'?type(props):({type,props});
 const load=loader({
  react,'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'Fragment'},
  'react-native':{Text:'Text',TextInput:'TextInput',View:'View',Pressable:'Pressable',ScrollView:'ScrollView',Modal:'Modal',Switch:'Switch',KeyboardAvoidingView:'KeyboardAvoidingView',Platform:{OS:'android'},StyleSheet:{create:s=>s},Linking:{openSettings:async()=>{}}},
  'expo-router':{useRouter:()=>({replace:p=>navigation.push(p),push:p=>navigation.push(p)}),useFocusEffect:()=>{}},
  'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:24,bottom:24})},
  '../components/SystemPage':{__esModule:true,default:'SystemPage',pageStyles:{}},
  '../components/BetaSettings':{__esModule:true,default:'BetaSettings'},
  '../components/IdentityAvatar':{__esModule:true,default:'IdentityAvatar'},
  'expo-constants':{__esModule:true,default:{expoConfig:{version:'1.0.0',android:{versionCode:1}}}},
  'expo-location':{},'expo-image-picker':{},
  '../identity/avatar':{persistAvatar:async()=>'',removeOwnedAvatar:()=>{}},
  '../state/SystemProvider':{useSystem:()=>context},...extra,
 });
 return {navigation,render(file){cursor=0;return load(file).default();},load};
}
function nodesOfType(tree,type){if(Array.isArray(tree))return tree.flatMap(n=>nodesOfType(n,type));if(!tree||typeof tree!=='object')return [];return [...(tree.type===type?[tree]:[]),...nodesOfType(tree.props?.children,type)];}
function generationFixture(overrides={}) {
 const load=loader({}),player=load('core').createNewPlayer('NOVA',{id:'adaptive-test',createdAt:'2026-09-18T00:00:00.000Z'});
 return {player,goals:[],day:'2026-09-18',history:[],prefs:{walking:true,running:false,cycling:false},weeklyCompleted:0,weeklyClear:false,...overrides};
}
const goalFixture=(category='LEARNING',priority=3)=>({id:'goal',category,priority,title:'Mój cel',description:'',createdAt:'2026-09-18T00:00:00.000Z',status:'ACTIVE'});
test('generation has 35 unique conservative templates, deterministic output and truthful timer evidence',()=>{
 const load=loader({}),engine=load('generation/engine'),templates=load('generation/templates');
 assert.equal(templates.QUEST_TEMPLATES.length,35);assert.equal(new Set(templates.QUEST_TEMPLATES.map(t=>t.id)).size,35);
 const input=generationFixture(),a=engine.generateLoadout(input),b=engine.generateLoadout(input);
 assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(a.length,3);assert.equal(a[0].category,'GENERAL');
 assert.equal(new Set(a.map(c=>c.templateId)).size,3);assert.ok(a.every(c=>c.quest.difficulty==='EASY'));
 for(const t of templates.QUEST_TEMPLATES)for(const level of ['easy','normal','hard']){
  const q=templates.generatedQuest('daily:2026-09-18:g1_'+t.id+'_'+level);assert.ok(q.rewards.realXp<=75);
  if(q.verification.type==='TIMER'){assert.match(q.description,/wyłącznie czas/);assert.ok(q.progressTarget<=600);}else assert.ok(q.progressTarget<=3000);
 }
});
for(const category of ['LEARNING','SOCIAL','PRODUCTIVITY','DISCIPLINE','FITNESS','LIFESTYLE'])test('active goal steers first generated slot: '+category,()=>{
 const engine=loader({})('generation/engine'),a=engine.generateLoadout(generationFixture({goals:[goalFixture(category)]}));
 assert.equal(a[0].category,category);assert.match(a[0].reason,/Powiązane z celem/);
 const paused=engine.generateLoadout(generationFixture({goals:[{...goalFixture(category),status:'PAUSED'}]}));assert.equal(paused[0].category,'GENERAL');
});
test('higher priority wins; depleted stat and category diversity influence later slots',()=>{
 const input=generationFixture({goals:[{...goalFixture('SOCIAL',1),id:'social'},goalFixture('LEARNING',3)]});
 const engine=loader({})('generation/engine'),a=engine.generateLoadout(input);assert.equal(a[0].category,'LEARNING');assert.ok(new Set(a.map(c=>c.category)).size>=2);
});
test('adaptive difficulty is gated, softens on failure and offers recovery after lost momentum',()=>{
 const engine=loader({})('generation/engine'),input=generationFixture();input.player.realLevel=12;input.player.rank='D';input.player.streak=4;
 input.history=Array.from({length:4},()=>({day:'2026-09-17',result:'COMPLETED',difficulty:'NORMAL'}));
 assert.equal(engine.adaptiveDifficulty(input).difficulty,'HARD');
 input.player.realLevel=1;assert.equal(engine.adaptiveDifficulty(input).difficulty,'EASY');
 input.player.realLevel=12;input.history=[{day:'2026-09-17',result:'FAILED'},{day:'2026-09-17',result:'FAILED'}];
 const result=engine.generateLoadout(input);assert.equal(result[0].templateId,'focus_return');assert.equal(result[0].quest.difficulty,'EASY');assert.equal(result[0].recovery,true);
 input.history=[{day:'2026-09-10',result:'COMPLETED'}];assert.equal(engine.adaptiveDifficulty(input).recovery,true);
});
test('template cooldown persists across tiers and allows repetition after cooldown',()=>{
 const engine=loader({})('generation/engine'),input=generationFixture(),a=engine.generateLoadout(input);
 input.history=a.map(c=>({templateId:c.templateId,category:c.category,day:input.day,result:'OFFERED'}));input.day='2026-09-19';
 const b=engine.generateLoadout(input);assert.ok(b.every(c=>!a.some(old=>old.templateId===c.templateId)));
 input.day='2026-09-21';assert.equal(engine.generateLoadout(input).length,3);
 input.prefs={walking:false,running:false,cycling:false};assert.ok(engine.generateLoadout(input).every(c=>c.quest.verification.type==='TIMER'));
});
test('goals persist lifecycle without XP, reject invalid input and do not reroll current Daily',async t=>{
 const h=await dailyHarness(t),before=await h.db.loadSystemState();
 await assert.rejects(h.db.createPlayerGoal({category:'LEARNING',priority:3,title:' ',description:''}));
 await assert.rejects(h.db.createPlayerGoal({category:'LEARNING',priority:3,title:'Valid',description:'',targetDate:'2026-02-31'}));
 let s=await h.db.createPlayerGoal({category:'LEARNING',priority:3,title:'Angielski',description:'Powtórki',target:'Czytać opowiadania',targetDate:'2027-01-01'}),id=s.goals[0].id;
 assert.equal(s.player.totalRealXp,before.player.totalRealXp);assert.equal(JSON.stringify(s.daily.questIds),JSON.stringify(before.daily.questIds));
 assert.equal((await h.reload().loadSystemState()).goals[0].title,'Angielski');
 s=await h.db.updateGoalStatus(id,'PAUSED');assert.equal(s.goals[0].status,'PAUSED');
 s=await h.db.updateGoalStatus(id,'ACTIVE');assert.equal(s.goals[0].status,'ACTIVE');
 s=await h.db.updateGoalStatus(id,'COMPLETED');assert.equal(s.goals[0].status,'COMPLETED');await assert.rejects(h.db.updateGoalStatus(id,'ACTIVE'));
 assert.equal(s.player.totalRealXp,before.player.totalRealXp);assert.ok((await h.db.loadChronicle()).some(e=>e.type==='GOAL_COMPLETED'));
});
test('goal changes affect next local day only; generation event and loadout persist once',async t=>{
 const h=await dailyHarness(t),first=await h.db.loadSystemState();await h.db.createPlayerGoal({category:'LEARNING',title:'Angielski',description:'',priority:3});
 await Promise.all(Array.from({length:4},()=>h.db.loadSystemState()));
 assert.equal(h.sql.prepare("SELECT COUNT(*) AS n FROM story_events WHERE type='DAILY_GENERATED'").get().n,1);
 h.clock.now+=86400000;const next=await h.reload().loadSystemState();assert.notEqual(next.daily.dayKey,first.daily.dayKey);
 const q=next.daily.questIds[0];assert.equal(h.load('generation/templates').templateFor(q).category,'LEARNING');assert.match(next.daily.reasons[q],/Angielski/);
 assert.equal(JSON.stringify((await h.reload().loadSystemState()).daily),JSON.stringify(next.daily));assert.equal(next.daily.questIds.length,3);
});
test('reroll races claim one allowance, persist, block old quest and reset next day',async t=>{
 const h=await dailyHarness(t),before=await h.db.loadSystemState(),id=before.daily.questIds[0];
 const results=await Promise.allSettled([h.db.rerollDailyQuest(id),h.db.rerollDailyQuest(id)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 let s=await h.reload().loadSystemState();assert.equal(s.daily.rerollsUsed,1);assert.equal(s.daily.questIds.length,3);assert.ok(!s.daily.questIds.includes(id));
 assert.equal(s.player.totalRealXp,before.player.totalRealXp);await assert.rejects(h.db.completeVerifiedQuest(dailyEvidence(h,id)));
 await assert.rejects(h.db.rerollDailyQuest(s.daily.questIds[0]));assert.equal((await h.db.testerHealthCheck()).ok,true);
 const replacement=s.daily.questIds.find(id=>!before.daily.questIds.includes(id));await h.db.completeVerifiedQuest(dailyEvidence(h,replacement));
 assert.equal((await h.db.loadSystemState()).daily.completed,1);h.clock.now+=86400000;s=await h.db.loadSystemState();assert.equal(s.daily.rerollsUsed,0);
});
test('reroll refuses started and completed quests, and transaction failure consumes no allowance',async t=>{
 const h=await dailyHarness(t),s=await h.db.loadSystemState(),[a,b,c]=s.daily.questIds;
 await h.db.beginQuestAttempt(a,'active-reroll');await assert.rejects(h.db.rerollDailyQuest(a));
 await h.db.completeVerifiedQuest(dailyEvidence(h,b));await assert.rejects(h.db.rerollDailyQuest(b));
 h.faults.failWhen=(sql)=>sql.includes('INSERT INTO daily_generation');await assert.rejects(h.db.rerollDailyQuest(c));
 const after=await h.db.loadSystemState();assert.equal(after.daily.rerollsUsed,0);assert.ok(after.daily.questIds.includes(c));await h.db.rerollDailyQuest(c);
});
test('generated rewards match preview and existing completion pipeline remains atomic and idempotent',async t=>{
 const h=await dailyHarness(t),s=await h.db.loadSystemState(),id=s.daily.questIds[0],q=h.load('quests/catalog').getQuest(id);
 h.faults.commit=true;await assert.rejects(h.db.completeVerifiedQuest(dailyEvidence(h,id)));assert.equal((await h.db.loadSystemState()).player.totalRealXp,s.player.totalRealXp);
 const results=await Promise.all([h.db.completeVerifiedQuest(dailyEvidence(h,id)),h.db.completeVerifiedQuest(dailyEvidence(h,id))]);assert.equal(results.filter(r=>r.awarded).length,1);
 const after=await h.db.loadSystemState();assert.equal(after.player.totalRealXp-s.player.totalRealXp,q.rewards.realXp);assert.equal(after.player.stats[q.primarySkill].totalXp-s.player.stats[q.primarySkill].totalXp,q.rewards.skillXp[q.primarySkill]);
 assert.equal(after.daily.weeklyCompleted,1);assert.equal((await h.db.testerHealthCheck()).ok,true);
});
test('eligible repeated failures create one recovery offer on next day, technical errors do not',async t=>{
 const h=await dailyHarness(t),s=await h.db.loadSystemState();
 for(const [n,id] of s.daily.questIds.slice(0,2).entries()){await h.db.beginQuestAttempt(id,'recovery'+n);h.clock.now+=10000;await h.db.endQuestAttempt('recovery'+n,'FAILED','VERIFICATION_REJECTED',10);}
 h.clock.now+=86400000;const next=await h.db.loadSystemState();assert.ok(next.daily.questIds[0].includes('focus_return_easy'));
 await h.reload().loadSystemState();assert.equal(h.sql.prepare("SELECT COUNT(*) AS n FROM story_events WHERE type='RECOVERY_OFFERED'").get().n,1);
});
test('boss support damage is capped, unique and cannot bypass mandatory boss stages',async t=>{
 const h=await dailyHarness(t),now=new Date(h.clock.now).toISOString();h.sql.prepare('INSERT INTO story_progress(id,completed_at) VALUES (?,?)').run('world_link_chapter_2',now);
 await h.db.startBossProtocol();let s=await h.db.loadSystemState();const id=s.daily.questIds[0];
 await h.db.completeVerifiedQuest(dailyEvidence(h,id));s=await h.db.loadSystemState();assert.ok(s.story.bossSupportDamage>=2);assert.equal(s.story.bossComplete,false);assert.ok(s.story.bossHp>0);
 await h.db.completeVerifiedQuest(dailyEvidence(h,id));assert.equal(h.sql.prepare('SELECT COUNT(*) AS n FROM boss_contributions').get().n,1);
 const policy=h.load('story/damage');assert.equal(policy.bossHealth({focus_at:now,move_at:now,discipline_at:null},999),10);assert.equal(policy.bossHealth({focus_at:now,move_at:now,discipline_at:now},999),0);
 assert.equal((await h.reload().loadSystemState()).story.bossSupportDamage,s.story.bossSupportDamage);
});
test('schema 5 migration preserves real legacy Daily, profile and completion history',async t=>{
 const h=await dailyHarness(t),s=await h.db.loadSystemState();
 h.sql.exec('DELETE FROM daily_instances;');const legacy=h.load('daily/templates').generateDaily(s.player.id,s.daily.dayKey,{walking:true,running:false,cycling:false});
 for(const q of legacy)h.sql.prepare('INSERT INTO daily_instances(id,template_id,day_key,week_key) VALUES (?,?,?,?)').run(q.id,q.templateId,q.dayKey,s.daily.weekKey);
 await h.db.completeVerifiedQuest(dailyEvidence(h,legacy[0].id));const before=await h.db.loadSystemState();
 h.sql.exec('DROP TABLE player_goals; DROP TABLE daily_generation; DROP TABLE daily_rerolls; DROP TABLE boss_contributions; PRAGMA user_version=5;');
 const after=await h.reload().loadSystemState();assert.equal(JSON.stringify(after.player),JSON.stringify(before.player));assert.equal(JSON.stringify(after.completedQuestIds),JSON.stringify(before.completedQuestIds));assert.equal(JSON.stringify(after.daily.questIds),JSON.stringify(before.daily.questIds));
 assert.equal(after.goals.length,0);assert.equal(h.sql.prepare('PRAGMA user_version').get().user_version,h.load('storage/migrations').SCHEMA_VERSION);assert.equal((await h.db.testerHealthCheck()).ok,true);
});
test('recommendation respects Awakening, active quest, goals, weekly and completion state',()=>{
 const recommend=loader({})('director/engine').directSystem,base={awakeningCompleted:false,completedQuestIds:[],goals:[],daily:null,story:null};
 assert.equal(recommend(base,null).title,'AWAKENING');base.awakeningCompleted=true;assert.equal(recommend(base,null).route,'/goals');
 assert.equal(recommend(base,'first_movement_v1').title,'CONTINUE ACTIVE QUEST');base.goals=[goalFixture()];base.daily={questIds:['daily:2026-09-18:g1_learn_read_easy'],weeklyCompleted:4,weeklyClear:false};
 assert.equal(recommend(base,null).title,'COMPLETE WEEKLY OBJECTIVE');base.completedQuestIds=base.daily.questIds;assert.equal(recommend(base,null).title,'DAILY COMPLETE');
});


test('goal form creates and completes a persisted goal through the real provider API boundary',async t=>{
 const h=databaseHarness(t);const ctx=await h.db.loadSystemState();
 ctx.createPlayerGoal=async input=>Object.assign(ctx,await h.db.createPlayerGoal(input));ctx.updateGoalStatus=async(id,status)=>Object.assign(ctx,await h.db.updateGoalStatus(id,status));
 const ui=integrationUI(ctx);let tree=ui.render('screens/GoalsScreen');
 nodesOfType(tree,'TextInput').find(n=>n.props.accessibilityLabel==='Tytuł celu').props.onChangeText('Mały cel');
 tree=ui.render('screens/GoalsScreen');findButtons(tree).find(b=>treeText(b)==='DODAJ CEL').props.onPress();await flush();
 tree=ui.render('screens/GoalsScreen');assert.match(treeText(tree),/Mały cel/);assert.equal(ctx.goals.length,1);
 findButtons(tree).find(b=>treeText(b)==='CEL OSIĄGNIĘTY · BEZ XP').props.onPress();await flush();
 assert.equal((await h.reload().loadSystemState()).goals[0].status,'COMPLETED');assert.equal(ctx.player.totalRealXp,0);
});
test('Daily generation failure rolls back the whole set and does not poison next refresh',async t=>{
 const h=await dailyHarness(t);h.clock.now+=86400000;h.faults.failWhen=sql=>sql.includes('INSERT INTO daily_generation');
 await assert.rejects(h.db.loadSystemState());assert.equal(h.sql.prepare('SELECT COUNT(*) AS n FROM daily_sets').get().n,1);
 const s=await h.db.loadSystemState();assert.equal(s.daily.questIds.length,3);assert.equal(h.sql.prepare('SELECT COUNT(*) AS n FROM daily_sets').get().n,2);
});
test('technical GPS failures do not trigger recovery and clock rollback blocks reroll',async t=>{
 const h=await dailyHarness(t),s=await h.db.loadSystemState();
 for(const [n,id] of s.daily.questIds.slice(0,2).entries()){await h.db.beginQuestAttempt(id,'tech'+n);h.clock.now+=10000;await h.db.endQuestAttempt('tech'+n,'FAILED','TECHNICAL_ERROR',10);}
 h.clock.now+=86400000;const next=await h.db.loadSystemState();assert.ok(!next.daily.questIds.some(id=>id.includes('focus_return')));
 h.clock.now-=86400000;await assert.rejects(h.db.rerollDailyQuest(next.daily.questIds[0]));assert.equal(h.sql.prepare('SELECT COUNT(*) AS n FROM daily_rerolls').get().n,0);
});
test('reroll difficulty ceiling prevents mid-day progression increasing replacement difficulty',()=>{
 const input=generationFixture();input.player.realLevel=12;input.player.rank='D';input.player.streak=4;input.history=Array.from({length:5},()=>({day:'2026-09-17',result:'COMPLETED'}));input.maximumDifficulty='EASY';
 assert.ok(loader({})('generation/engine').generateLoadout(input).every(c=>c.quest.difficulty==='EASY'));
});




async function learningJourney(t){const h=await dailyHarness(t);await h.db.createPlayerGoal({category:'LEARNING',title:'Angielski',description:'',priority:3});return h;}
async function nextJourneyQuest(h){for(let i=0;i<4;i++){const s=await h.db.loadSystemState(),j=s.journeys.find(j=>j.status==='ACTIVE');const id=s.daily.questIds.find(id=>s.journeyQuestIds[id]===j?.id&&!s.completedQuestIds.includes(id));if(id)return {s,j,id};h.clock.now+=86400000;}throw new Error('Missing relevant Daily');}
test('Journey creation is unique, category-specific and refresh cannot advance or reward it',async t=>{
 const h=await learningJourney(t),s=await h.db.loadSystemState(),j=s.journeys[0];assert.equal(j.goalId,s.goals[0].id);assert.equal(j.currentStage,0);assert.equal(j.progress.actions,0);
 for(let n=0;n<3;n++)await h.db.loadSystemState();const reloaded=await h.reload().loadSystemState();assert.equal(JSON.stringify(reloaded.journeys),JSON.stringify(s.journeys));assert.equal(reloaded.player.totalRealXp,s.player.totalRealXp);
 assert.equal(h.sql.prepare("SELECT COUNT(*) AS n FROM story_events WHERE type='JOURNEY_CREATED'").get().n,1);
 const plan=h.load('journeys/model').journeyPlan;assert.notEqual(plan('FITNESS')[1].days,plan('SOCIAL')[1].days);
});
test('Journey milestone and verified quest rewards commit once together, and failure rolls both back',async t=>{
 const h=await learningJourney(t),{s,j,id}=await nextJourneyQuest(h),q=h.load('quests/catalog').getQuest(id);
 h.faults.failWhen=(sql)=>sql.includes('INSERT INTO journey_milestones');await assert.rejects(h.db.completeVerifiedQuest(dailyEvidence(h,id)));
 let after=await h.db.loadSystemState();assert.equal(after.player.totalRealXp,s.player.totalRealXp);assert.equal(after.journeys[0].currentStage,0);assert.equal(h.sql.prepare('SELECT COUNT(*) AS n FROM journey_activity').get().n,0);
 const results=await Promise.all([h.db.completeVerifiedQuest(dailyEvidence(h,id)),h.db.completeVerifiedQuest(dailyEvidence(h,id))]);assert.equal(results.filter(r=>r.awarded).length,1);
 after=await h.reload().loadSystemState();assert.equal(after.journeys[0].currentStage,1);assert.equal(after.player.totalRealXp-s.player.totalRealXp,q.rewards.realXp+10);assert.equal(h.sql.prepare('SELECT COUNT(*) AS n FROM journey_milestones').get().n,1);
 assert.ok((await h.db.loadChronicle()).some(e=>e.type==='JOURNEY_MILESTONE'));assert.equal(after.goals[0].status,'ACTIVE');assert.equal((await h.db.testerHealthCheck()).ok,true);
});
test('Journey pause blocks progress; resume retains stage and manual goal completion grants no milestones',async t=>{
 const h=await learningJourney(t),{s,id}=await nextJourneyQuest(h),goal=s.goals[0];await h.db.updateGoalStatus(goal.id,'PAUSED');await h.db.completeVerifiedQuest(dailyEvidence(h,id));let after=await h.db.loadSystemState();assert.equal(after.journeys[0].status,'PAUSED');assert.equal(after.journeys[0].currentStage,0);
 await h.db.updateGoalStatus(goal.id,'ACTIVE');assert.equal((await h.db.loadSystemState()).journeys[0].status,'ACTIVE');const xp=(await h.db.loadSystemState()).player.totalRealXp;
 await h.db.updateGoalStatus(goal.id,'COMPLETED');after=await h.db.loadSystemState();assert.equal(after.journeys[0].status,'PAUSED');assert.equal(after.player.totalRealXp,xp);assert.equal(h.sql.prepare('SELECT COUNT(*) AS n FROM journey_milestones').get().n,0);
});
test('five Journey stages are completable through real generated Daily pipeline across distinct days',async t=>{
 const h=await learningJourney(t);let state=await h.db.loadSystemState();let completed=0;
 for(let day=0;day<45&&state.journeys[0].status!=='COMPLETED';day++){
  state=await h.db.loadSystemState();const id=state.daily.questIds.find(id=>state.journeyQuestIds[id]===state.journeys[0].id&&!state.completedQuestIds.includes(id));
  if(id){await h.db.completeVerifiedQuest(dailyEvidence(h,id));completed++;}
  state=await h.db.loadSystemState();if(state.journeys[0].status!=='COMPLETED')h.clock.now+=86400000;
 }
 assert.equal(state.journeys[0].status,'COMPLETED');assert.equal(state.journeys[0].completedStages.length,5);assert.ok(completed>=14);assert.equal(state.goals[0].status,'ACTIVE');
 const milestones=h.sql.prepare('SELECT * FROM journey_milestones ORDER BY stage').all();assert.equal(milestones.length,5);
 const activities=h.sql.prepare('SELECT stage,COUNT(DISTINCT day_key) AS days FROM journey_activity GROUP BY stage').all();assert.ok(activities.find(a=>a.stage===1).days>=3);
 const before=state.player.totalRealXp;await h.reload().loadSystemState();assert.equal((await h.db.loadSystemState()).player.totalRealXp,before);assert.equal((await h.db.loadChronicle()).filter(e=>e.type==='JOURNEY_COMPLETED').length,1);
});
test('multiple goals choose priority deterministically and one quest cannot feed multiple journeys',async t=>{
 const h=await learningJourney(t);await h.db.createPlayerGoal({category:'LEARNING',title:'Drugi cel',description:'',priority:1});const {s,id}=await nextJourneyQuest(h);const model=h.load('journeys/model');assert.equal(model.primaryJourney(s.journeys,s.goals).goalId,s.goals[0].id);
 await h.db.completeVerifiedQuest(dailyEvidence(h,id));const after=await h.db.loadSystemState();assert.equal(after.journeys.filter(j=>j.currentStage===1).length,1);assert.equal(h.sql.prepare('SELECT COUNT(*) AS n FROM journey_activity WHERE quest_id=?').get(id).n,1);
});
test('schema 6 migration preserves goals, player, Daily and history; no retroactive Journey XP',async t=>{
 const h=await learningJourney(t),before=await h.db.loadSystemState();
 h.sql.exec('DROP TABLE journey_milestones; DROP TABLE journey_activity; DROP TABLE journey_quests; DROP TABLE journeys; PRAGMA user_version=6;');
 const after=await h.reload().loadSystemState();assert.equal(JSON.stringify(after.player),JSON.stringify(before.player));assert.equal(JSON.stringify(after.goals),JSON.stringify(before.goals));assert.equal(JSON.stringify(after.daily),JSON.stringify(before.daily));assert.equal(JSON.stringify(after.completedQuestIds),JSON.stringify(before.completedQuestIds));assert.equal(after.journeys.length,1);assert.equal(after.journeys[0].currentStage,0);assert.equal(h.sql.prepare('PRAGMA user_version').get().user_version,h.load('storage/migrations').SCHEMA_VERSION);
});
function directorFixture(){const base=generationFixture(),model=loader({})('journeys/model'),goal=goalFixture('LEARNING');const j=model.newJourney(goal,'2026-09-18T00:00:00.000Z'),id='daily:2026-09-18:g1_learn_read_easy';return {...base,awakeningCompleted:true,completedQuestIds:[],goals:[goal],journeys:[j],journeyQuestIds:{[id]:j.id},recentActivity:[],story:null,daily:{dayKey:'2026-09-18',questIds:[id],clockAnomaly:false,weeklyCompleted:0,weeklyClear:false}};}
const directorNow=new Date(2026,8,18,12).getTime();
test('Director deterministic journey directive shows real quest reward and stage state',()=>{const s=directorFixture(),engine=loader({})('director/engine');const a=engine.directSystem(s,null,directorNow),b=engine.directSystem(s,null,directorNow);assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(a.kind,'CONTINUE_JOURNEY');assert.match(a.reason,/INITIATION/);assert.equal(a.reward.realXp,30);assert.equal(a.objective,'Mój cel');});
test('Director respects mandatory progression, active quest, recovery, weekly and locked boss',()=>{
 const s=directorFixture(),direct=loader({})('director/engine').directSystem;s.awakeningCompleted=false;assert.equal(direct(s,null,directorNow).kind,'AWAKENING');s.awakeningCompleted=true;assert.equal(direct(s,s.daily.questIds[0],directorNow).kind,'ACTIVE_QUEST');
 s.recentActivity=[{day:'2026-09-17',result:'FAILED'},{day:'2026-09-17',result:'FAILED'}];assert.equal(direct(s,null,directorNow).kind,'RECOVER_MOMENTUM');s.recentActivity=[];s.journeyQuestIds={};s.daily.weeklyCompleted=4;assert.equal(direct(s,null,directorNow).kind,'ADVANCE_WEEKLY');
 s.daily.weeklyCompleted=0;s.story={worldLinkComplete:false,bossComplete:false,boss:null};assert.notEqual(direct(s,null,directorNow).kind,'CHALLENGE_BOSS');s.story.worldLinkComplete=true;assert.equal(direct(s,null,directorNow).kind,'CHALLENGE_BOSS');
 s.story.boss={focus_at:'done',move_at:'done',start_day:'2026-09-18'};assert.notEqual(direct(s,null,directorNow).kind,'CHALLENGE_BOSS');s.story.boss.start_day='2026-09-17';assert.equal(direct(s,null,directorNow).kind,'CHALLENGE_BOSS');
 s.daily.clockAnomaly=true;assert.equal(direct(s,null,directorNow).kind,'CLOCK');
});
test('Daily generation prioritizes primary Journey without bypassing cooldown or recovery',()=>{
 const input=generationFixture({goals:[goalFixture('LEARNING')]}),model=loader({})('journeys/model'),engine=loader({})('generation/engine');input.journeys=[model.newJourney(input.goals[0],'2026-09-18T00:00:00.000Z')];
 const a=engine.generateLoadout(input);assert.equal(a[0].category,'LEARNING');assert.ok(new Set(a.map(c=>c.category)).size>1);
 input.history=a.map(c=>({templateId:c.templateId,category:c.category,day:input.day,result:'OFFERED'}));input.day='2026-09-19';const b=engine.generateLoadout(input);assert.equal(b[0].category,'LEARNING');assert.ok(b.every(c=>!a.some(old=>old.templateId===c.templateId)));
 input.history=[{day:input.day,result:'FAILED'},{day:input.day,result:'FAILED'}];const c=engine.generateLoadout(input);assert.equal(c[0].recovery,true);assert.equal(c[1].category,'LEARNING');assert.ok(c.every(q=>q.quest.difficulty==='EASY'));
});


test('Director recovery does not send player into hard saved Daily and weak stat is occasional',()=>{
 const s=directorFixture(),direct=loader({})('director/engine').directSystem;s.recentActivity=[{day:'2026-09-18',result:'FAILED'},{day:'2026-09-18',result:'FAILED'}];s.daily.questIds=['daily:2026-09-18:g1_learn_read_hard'];
 const recovery=direct(s,null,directorNow);assert.equal(recovery.kind,'RECOVER_MOMENTUM');assert.equal(recovery.questId,undefined);
 s.recentActivity=[];s.journeys=[];s.journeyQuestIds={};s.daily.questIds=['daily:2026-09-18:g1_learn_read_easy'];for(const stat of Object.values(s.player.stats))stat.level=3;s.player.stats.INT.level=1;
 assert.equal(direct(s,null,directorNow).kind,'DEVELOP_WEAK_STAT');s.daily.dayKey='2026-09-19';assert.notEqual(direct(s,null,new Date(2026,8,19,12).getTime()).kind,'DEVELOP_WEAK_STAT');
});
test('Goals UI opens persisted Journey stages without altering progression',async t=>{
 const h=await learningJourney(t),ctx=await h.db.loadSystemState(),ui=integrationUI(ctx);let tree=ui.render('screens/GoalsScreen');
 findButtons(tree).find(b=>treeText(b)==='OTWÓRZ JOURNEY').props.onPress();tree=ui.render('screens/GoalsScreen');assert.match(treeText(tree),/INITIATION/);assert.match(treeText(tree),/MASTERY/);assert.match(treeText(tree),/POSTĘP/);
 assert.equal((await h.db.loadSystemState()).player.totalRealXp,ctx.player.totalRealXp);
});

for (const legacyVersion of [6, 7, 8]) test('canonical migration reconciles branch schema '+legacyVersion+' without losing goals', async t => {
 const h=databaseHarness(t,{now:Date.parse('2026-09-20T12:00:00Z')});
 await h.db.loadSystemState();
 h.sql.exec('DROP TABLE player_goals; DROP TABLE cloud_outbox; DROP TABLE daily_generation; DROP TABLE progression_claims; DROP TABLE progression_contributions;');
 h.sql.exec('CREATE TABLE player_goals(id TEXT PRIMARY KEY,type TEXT,title TEXT,description TEXT,priority TEXT,status TEXT,created_at TEXT,progress_target REAL,unit TEXT,target_date TEXT);');
 h.sql.prepare('INSERT INTO player_goals VALUES(?,?,?,?,?,?,?,?,?,?)').run('legacy-42','LEARNING','Read a book','Keep this exact description','HIGH','ACTIVE','2026-09-01T12:00:00Z',50,'pages','2026-12-01');
 h.sql.exec('PRAGMA user_version='+legacyVersion);
 const db=h.reload(),state=await db.loadSystemState();
 assert.equal(state.goals.length,1);assert.equal(state.goals[0].title,'Read a book');
 assert.equal(state.goals[0].priority,3);assert.equal(state.goals[0].target,'50 pages');
 assert.equal(h.sql.prepare('SELECT description FROM legacy_player_goals_v8').get().description,'Keep this exact description');
 assert.equal(h.sql.prepare('PRAGMA user_version').get().user_version,h.load('storage/migrations').SCHEMA_VERSION);
 assert.equal(h.sql.prepare('SELECT COUNT(*) n FROM cloud_outbox').get().n,0);
 assert.equal(h.sql.prepare('SELECT COUNT(*) n FROM progression_claims').get().n,0);
 assert.equal((await h.reload().loadSystemState()).goals.length,1,'migration must not import twice');
});

test('reset cannot resurrect imported legacy goals on restart', async t => {
 const h=databaseHarness(t,{now:Date.parse('2026-09-20T12:00:00Z')});await h.db.loadSystemState();
 h.sql.exec("CREATE TABLE legacy_player_goals_v8(id TEXT PRIMARY KEY,title TEXT,status TEXT); INSERT INTO legacy_player_goals_v8 VALUES('old','Imported','ACTIVE');");
 const db=h.reload();assert.equal((await db.loadSystemState()).goals.length,1);
 await db.resetSystemData(true);assert.equal((await h.reload().loadSystemState()).goals.length,0);
 assert.equal(h.sql.prepare('SELECT COUNT(*) n FROM legacy_player_goals_v8').get().n,0);
});
