const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=process.env.SYSTEM_PROJECT_ROOT||path.resolve(__dirname,'../../..');
function loader(mocks={}){const cache=new Map();function load(file){file=path.resolve(root,'src/system2',file);if(!path.extname(file))file+='.ts';if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:false,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:name=>name in mocks?mocks[name]:name.startsWith('.')?load(path.resolve(path.dirname(file),name)):require(name),Date,console,Set,Map,Math,JSON});return exports;}return load;}
const load=loader({'@react-native-async-storage/async-storage':{default:{}}});
test('technical errors never count as player failure',()=>{
 const {isTechnicalFailure}=load('gameMaster/history');
 for(const reason of ['GPS_ERROR','DATABASE_ERROR','APP_CRASH','TECHNICAL_ERROR','PROCESS_ENDED','PERMISSION_DENIED'])assert.equal(isTechnicalFailure(reason),true);
 assert.equal(isTechnicalFailure('VERIFICATION_REJECTED'),false);
});
test('campaign duplicate completion cannot advance chain twice',()=>{
 const {newCampaign,recordMissionOutcome}=load('gameMaster/campaignStore');
 let c=newCampaign('p','2026-09-01T12:00:00Z','FOCUS');
 const event={id:'a',questId:'q',at:'2026-09-02T12:00:00Z',result:'COMPLETED'};
 c=recordMissionOutcome(c,event);c=recordMissionOutcome(c,{...event,id:'retry'});
 assert.equal(c.completed.length,1);
});
module.exports={loader};

const core=load('core/progression'),templates=load('generation/templates');
function fixture(overrides={}) {
 const now='2026-09-10T12:00:00.000Z',player={...core.createNewPlayer(),id:'gm-test',birthDate:'1990-01-01',realLevel:10,rank:'D',streak:5};
 const questIds=templates.QUEST_TEMPLATES.flatMap(t=>['easy','normal','hard'].map(d=>`daily:2026-09-10:g1_${t.id}_${d}`));
 return {player,completedQuestIds:load('quests/catalog').AWAKENING_QUESTS.map(q=>q.id),activeQuestId:null,awakeningCompleted:true,worldUnlocked:true,daily:{questIds,clockAnomaly:false,weeklyCompleted:2,weeklyTarget:5},story:{worldLinkComplete:false,bossComplete:false},campaign:load('gameMaster/campaignStore').newCampaign(player.id,'2026-09-01T12:00:00Z'),history:[],now,hour:12,...overrides};
}
function outcome(day,result='COMPLETED',reason=null,questId='daily:2026-09-01:g1_learn_read_easy') {
 return load('gameMaster/history').missionHistoryEntry({id:'attempt:'+day,quest:templates.generatedQuest(questId),at:`2026-09-${String(day).padStart(2,'0')}T10:00:00.000Z`,result,reason,minutes:5,verification:result==='COMPLETED'?100:null});
}
const gm=()=>load('gameMaster/runtime');
test('offline deterministic decision selects a canonical available mission without AI or network',()=>{
 const input=fixture(),a=gm().getGameMasterState(input),b=gm().getGameMasterState(input);
 assert.ok(a.mission.quest);assert.equal(a.mission.quest.id,b.mission.quest.id);assert.ok(input.daily.questIds.includes(a.mission.quest.id));
 assert.ok(a.explanation.length>=3);assert.equal(a.telemetry.version,4);
});
test('semantic identity ignores paraphrases and cooldown excludes matching family/activity/stat/duration/difficulty',()=>{
 const q=templates.generatedQuest('daily:2026-09-10:g1_walk_reset_easy'),h=load('gameMaster/history');
 assert.equal(h.semanticQuest(q).signature,h.semanticQuest({...q,id:'different',title:'Idź na spacer'}).signature);
 const input=fixture({history:[outcome(9,'COMPLETED',null,q.id)]});
 assert.notEqual(gm().getGameMasterState(input).mission.quest?.id,q.id);
});
test('stable verified successes increase difficulty; technical failures do not lower it',()=>{
 const history=[5,6,7,8,9].map(d=>outcome(d));
 const a=gm().getGameMasterState(fixture({history}));
 const b=gm().getGameMasterState(fixture({history:[...history,outcome(10,'FAILED','GPS_ERROR')]}));
 assert.equal(a.mission.difficulty,3);assert.equal(b.mission.difficulty,a.mission.difficulty);assert.equal(b.telemetry.technicalExcluded,1);
});
test('actual overload reduces difficulty and produces recovery directives',()=>{
 const s=gm().getGameMasterState(fixture({history:[outcome(8,'FAILED'),outcome(9,'ABANDONED')]}));
 assert.equal(s.mission.difficulty,1);assert.equal(s.world.reaction,'RECOVERY');assert.equal(s.character,'RECOVERY');assert.equal(s.world.threat,0);
});
test('absence gives comeback and a gentle existing mission without penalty',()=>{
 const s=gm().getGameMasterState(fixture({history:[outcome(1)]}));
 assert.equal(s.world.reaction,'COMEBACK');assert.equal(s.world.lighting,'WARM');assert.equal(s.mission.difficulty,1);assert.ok(s.mission.quest);assert.equal(s.mission.quest.difficulty,'EASY');
});
for(const [birthDate,cap] of [['2019-01-01',1],['2015-01-01',1],['2011-01-01',2],['1990-01-01',3],[undefined,1]])test('age constraints: '+(birthDate??'unknown'),()=>{
 const input=fixture();input.player.birthDate=birthDate;
 const s=gm().getGameMasterState(input),q=s.mission.quest;
 assert.ok(q);assert.ok(s.mission.difficulty<=cap);
 if(birthDate!=='1990-01-01'){assert.equal(q.verification.type,'TIMER');assert.notEqual(templates.templateFor(q.id).id,'focus_social_message');}
});
test('saved AI wording for a minor is replaced before reaching HOME',()=>{
 const input=fixture();input.player.birthDate='2019-01-01';
 const s=gm().getGameMasterState(input);const id=s.mission.quest.id;
 load('ai/registry').replaceAIQuestPresentations([{id,title:'Meet a stranger alone',description:'Unsafe suggestion'}]);
 const next=gm().getGameMasterState(input);assert.notEqual(next.mission.quest.title,'Meet a stranger alone');
 load('ai/registry').clearAIQuestPresentations();
});
test('active canonical mission keeps priority and reward contract',()=>{
 const input=fixture();input.activeQuestId=input.daily.questIds[0];
 const s=gm().getGameMasterState(input);assert.equal(s.mission.quest.id,input.activeQuestId);assert.equal(s.mission.quest.rewards.realXp,templates.generatedQuest(input.activeQuestId).rewards.realXp);
});
test('campaign choice affects mission stat; boss, arc, victory and character reach HOME adapter',()=>{
 const input=fixture();input.campaign.choice='FOCUS';
 const s=gm().getGameMasterState(input);assert.equal(s.mission.quest.primarySkill,'INT');assert.equal(s.mission.campaign.arc,s.campaign.arc);
 const b=gm().getGameMasterState({...input,story:{worldLinkComplete:true,bossComplete:false}});
 const adapter=load('home4/directives').directivePresentation;
 assert.equal(adapter(b.world,b.boss,false,false).boss,'THREAT');
 const v=gm().getGameMasterState({...input,victory:true,levelUp:true});assert.equal(v.world.reaction,'VICTORY');assert.equal(v.character,'LEVEL_UP');assert.equal(adapter(v.world,v.boss,false,false).warm,true);
});
test('30-day campaign survives restart and includes failure, absence, choices and progression',()=>{
 let campaign=fixture().campaign,history=[];const modes=new Set(),difficulty=new Set(),families=new Set();let lastState;
 for(let day=1;day<=30;day++){
  if(day>=10&&day<=16)continue;
  const date=`2026-09-${String(day).padStart(2,'0')}`,input=fixture({campaign,history,now:date+'T12:00:00Z'});
  input.daily.questIds=input.daily.questIds.map(id=>id.replace('2026-09-10',date));
  input.player.streak=day===8?0:day;input.player.stats.WIL.level=day>=20?4:1;
  input.player.realLevel=day>=20?25:10;input.story.worldLinkComplete=day>=22;input.story.bossComplete=day>=28;
  if(day===18){campaign={...campaign,choice:'FOCUS'};input.campaign=campaign;}
  const state=gm().getGameMasterState(input);lastState=state;modes.add(state.world.reaction);difficulty.add(state.mission.difficulty);
  assert.ok(state.mission.quest,'day '+day+' needs a safe mission');
  const event=outcome(day,day===5||day===6?'FAILED':day===7?'FAILED':'COMPLETED',day===7?'APP_CRASH':null,state.mission.quest.id);
  if(event.result==='COMPLETED')families.add(event.family);
  history.push(event);campaign=load('gameMaster/campaignStore').recordMissionOutcome(campaign,event);
  campaign=load('gameMaster/campaignStore').decodeCampaign(JSON.stringify(campaign),input.player.id,input.now);
 }
 assert.ok(modes.has('RECOVERY'));assert.ok(modes.has('COMEBACK'));assert.ok(modes.has('BOSS'));
 assert.ok(difficulty.has(1));assert.ok(difficulty.has(3));assert.ok(families.size>=4);
 assert.ok(campaign.completed.length>=15);assert.ok(lastState.campaign.chapter>=2);assert.equal(campaign.choice,'FOCUS');assert.equal(lastState.campaign.day,30);
 console.log('30-day simulation:',JSON.stringify({completed:campaign.completed.length,families:families.size,modes:[...modes],difficulty:[...difficulty]}));
});


test('SQLite memory and campaign recover after restart, keep quality and ignore duplicate outcomes',async()=>{
 const {DatabaseSync}=require('node:sqlite'),sqlite=new DatabaseSync(':memory:');
 sqlite.exec('CREATE TABLE app_state(key TEXT PRIMARY KEY,value TEXT);CREATE TABLE quest_attempts(attempt_id TEXT,quest_id TEXT,ended_at TEXT,result TEXT,reason TEXT,duration REAL);CREATE TABLE quest_completions(quest_id TEXT,completed_at TEXT);CREATE TABLE verified_events(quest_id TEXT,payload TEXT,created_at TEXT);');
 const db={getAllAsync:async(q,...p)=>sqlite.prepare(q).all(...p),getFirstAsync:async(q,...p)=>sqlite.prepare(q).get(...p),runAsync:async(q,...p)=>sqlite.prepare(q).run(...p)};
 const player=fixture().player,key='daily:2026-09-02:g1_learn_read_easy';
 const store=load('storage/gameMaster');
 await store.reconcileGameMaster(db,player,'2026-09-01T12:00:00Z');
 sqlite.prepare('INSERT INTO quest_attempts VALUES (?,?,?,?,?,?)').run('done',key,'2026-09-02T12:00:00Z','COMPLETED',null,300);
 sqlite.prepare('INSERT INTO quest_attempts VALUES (?,?,?,?,?,?)').run('error',key,'2026-09-03T12:00:00Z','FAILED','TECHNICAL_ERROR',50);
 sqlite.prepare('INSERT INTO quest_completions VALUES (?,?)').run(key,'2026-09-02T12:00:00Z');
 sqlite.prepare('INSERT INTO verified_events VALUES (?,?,?)').run(key,JSON.stringify({verified:true,verificationScore:93}),'2026-09-02T12:00:00Z');
 const first=await store.reconcileGameMaster(db,player,'2026-09-03T12:00:00Z',undefined,'FOCUS');
 assert.equal(first.campaign.completed.length,1);assert.equal(first.history.find(h=>h.result==='COMPLETED').verification,93);assert.equal(first.history[1].result,'TECHNICAL');
 const restarted=loader({'@react-native-async-storage/async-storage':{default:{}}})('storage/gameMaster');
 const again=await restarted.reconcileGameMaster(db,player,'2026-09-04T12:00:00Z');
 assert.equal(again.campaign.completed.length,1);assert.equal(again.campaign.choice,'FOCUS');
 sqlite.prepare('UPDATE app_state SET value=?').run('{broken');
 await assert.rejects(()=>store.reconcileGameMaster(db,player,'2026-09-05T12:00:00Z'));
 assert.equal(sqlite.prepare('SELECT value FROM app_state').get().value,'{broken');sqlite.close();
});
test('canonical Director returns the real Awakening id for a new adult',()=>{
 const input=fixture({completedQuestIds:[],awakeningCompleted:false,daily:null});
 assert.equal(gm().getGameMasterState(input).mission.quest.id,'first_movement_v1');
});
test('minor onboarding cannot silently bypass unavailable guardian-aware mission',()=>{
 const input=fixture({completedQuestIds:[],awakeningCompleted:false,daily:null});input.player.birthDate='2019-01-01';
 assert.equal(gm().getGameMasterState(input).mission.quest,null);
});
