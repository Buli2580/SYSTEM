const {test}=require('node:test');
const assert=require('node:assert/strict');
const load=require('./gm-test-support.cjs').loader();
const machine=load('gameLoop/stateMachine');
const recovery=load('gameLoop/session');
const checkpoint=load('gameLoop/recovery').checkpoint;

test('completion captures historical difficulty and target independently of later balance',()=>{
 const player=load('core/progression').createNewPlayer();
 const result=load('core/questEngine').completeQuest(player,{questId:'wall_focus_v1',verificationType:'TIMER',verificationScore:100,durationSeconds:1800},'ACTIVE','2026-10-01T00:00:00Z',5);
 assert.equal(result.event.questDifficulty,5);
 assert.equal(result.event.questTarget,1800);
 assert.equal(result.event.durationSeconds,1800);
});

test('Game Loop refuses missing mission and missing canonical receipt',()=>{
 assert.equal(machine.reduceGameLoop(machine.INITIAL_GAME_LOOP_STATE,'SELECT_QUEST').phase,'HOME');
 const completing={phase:'COMPLETING',questId:'q',rewardId:null,recoverable:false};
 assert.equal(machine.reduceGameLoop(completing,'COMPLETE').phase,'COMPLETING');
});
for(const phase of ['STARTING','ACTIVE','VERIFYING','COMPLETING'])test('restart '+phase+' waits for canonical QuestRun recovery',()=>{
 const restored=recovery.restoreGameLoop(checkpoint({phase,questId:'q',rewardId:null,recoverable:false}));
 assert.equal(restored.phase,'RECOVERY');
 assert.equal(machine.reduceGameLoop(restored,'RESUME').phase,'BRIEFING');
});
test('reward failure preserves receipt and exact presentation phase',()=>{
 for(const phase of ['XP_REWARD','LOOT_REWARD','LEVEL_UP','EQUIP','WORLD_REACTION']){
  const state={phase,questId:'q',rewardId:'receipt',recoverable:false};
  assert.equal(machine.reduceGameLoop(state,'FAIL').phase,phase);
  assert.equal(recovery.restoreGameLoop(checkpoint(state)).phase,phase);
 }
});
test('reward flags survive restart so optional steps cannot be lost',()=>{
 let state={phase:'COMPLETING',questId:'q',rewardId:null,recoverable:false};
 state=machine.reduceGameLoop(state,'COMPLETE',{rewardId:'receipt',hasLoot:true,levelUp:true});
 state=recovery.restoreGameLoop(checkpoint(state));
 for(const [event,phase] of [['XP_PRESENTED','LOOT_REWARD'],['LOOT_PRESENTED','LEVEL_UP'],['LEVEL_PRESENTED','EQUIP'],['EQUIP_DONE','WORLD_REACTION'],['WORLD_REACTED','NEXT_QUEST']]){
  state=machine.reduceGameLoop(state,event);assert.equal(state.phase,phase);
 }
 assert.equal(machine.reduceGameLoop(state,'CONTINUE',{questId:'next'}).questId,'next');
});

test('QuestRun adapter follows verifier and never invents an active session',()=>{
 const {questRunLoopState}=load('gameLoop/questRunAdapter');
 for(const [status,phase] of [['CHECKING','RECOVERY'],['READY','BRIEFING'],['STARTING','STARTING'],['TRACKING','ACTIVE'],['COMPLETING','VERIFYING'],['COMPLETED','NEXT_QUEST'],['DENIED','RECOVERY'],['ERROR','RECOVERY'],['LOCKED','HOME']]){
  assert.equal(questRunLoopState(status,'q').phase,phase);
 }
});
test('HOME action chooses pending receipt before a newly selected mission',()=>{
 const {selectHomeLoop}=load('gameLoop/selectors');
 const state=selectHomeLoop({missionId:'next',activeQuestId:'running',pendingRewardId:'receipt'});
 assert.equal(state.phase,'XP_REWARD');assert.equal(state.rewardId,'receipt');
 assert.equal(selectHomeLoop({missionId:'next',activeQuestId:'running'}).questId,'running');
 assert.equal(selectHomeLoop({missionId:'next',activeQuestId:null}).phase,'BRIEFING');
});

test('durable reward cursor resumes every phase and ignores double taps without writing rewards',async()=>{
 const {DatabaseSync}=require('node:sqlite');const native=new DatabaseSync(':memory:');
 native.exec('CREATE TABLE app_state(key TEXT PRIMARY KEY,value TEXT);');
 const db={getFirstAsync:async(sql,...args)=>native.prepare(sql).get(...args),runAsync:async(sql,...args)=>native.prepare(sql).run(...args)};
 const repo=load('storage/gameLoopPresentation');
 const receipt={id:'quest_q',realXp:25,beforeLevel:1,afterLevel:2};
 const plan=load('gameLoop/rewardPlan').buildRewardPresentationPlan(receipt,true);
 for(let i=0;i<plan.length;i++){
  assert.equal(await repo.rewardCursor(db,receipt.id,plan),i);
  await repo.advanceRewardCursor(db,receipt.id,plan,plan[i].key);
  await repo.advanceRewardCursor(db,receipt.id,plan,plan[i].key);
  assert.equal(await repo.rewardCursor(db,receipt.id,plan),i+1);
 }
 assert.equal(native.prepare('SELECT count(*) AS n FROM app_state').get().n,1);
 native.close();
});

for(const birthDate of ['2023-01-01','2019-01-01','2016-01-01','2011-01-01',null])test('safe Awakening is playable offline for '+birthDate,()=>{
 const catalog=load('quests/catalog'),runtime=load('gameMaster/runtime');
 const player={...load('core/progression').createNewPlayer(),birthDate};
 const completedQuestIds=[];
 const campaign=load('gameMaster/campaignStore').newCampaign(player.id,'2026-10-01T12:00:00Z');
 for(let i=0;i<3;i++){
  const state=runtime.getGameMasterState({player,completedQuestIds,activeQuestId:null,awakeningCompleted:false,daily:null,story:null,campaign,history:[],now:'2026-10-01T12:00:00Z',hour:12});
  assert.ok(state.mission.quest,'missing safe mission');const quest=state.mission.quest;
  assert.equal(quest.verification.type,'TIMER');assert.ok(quest.verification.minimumDurationSeconds<=300);
  assert.equal(catalog.prerequisitesCompleted(quest,completedQuestIds),true);
  completedQuestIds.push(quest.id);
 }
 assert.equal(catalog.getAwakeningProgress(completedQuestIds).completed,3);
 for(const quest of catalog.AWAKENING_QUESTS)assert.equal(catalog.getQuestStatus(quest.id,completedQuestIds),'COMPLETED');
});
