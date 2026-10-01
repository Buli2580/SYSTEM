const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require(require.resolve('typescript', { paths: [path.resolve(__dirname, '../../..'), process.cwd()] }));
const root = path.resolve(__dirname, '../../..');

function load(relative) {
  const file = path.join(root, 'src/system2', relative);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, { module, exports: module.exports, require, console });
  return module.exports;
}

const mod = load('gameLoop/stateMachine.ts');

test('Game Loop 4 follows the canonical mission path without a dead end', () => {
  let state = mod.INITIAL_GAME_LOOP_STATE;
  state = mod.reduceGameLoop(state,'SELECT_QUEST',{questId:'first_movement'});
  assert.equal(state.phase,'BRIEFING');
  state = mod.reduceGameLoop(state,'START');
  state = mod.reduceGameLoop(state,'STARTED');
  assert.equal(state.phase,'ACTIVE');
  state = mod.reduceGameLoop(state,'VERIFY');
  state = mod.reduceGameLoop(state,'VERIFIED');
  state = mod.reduceGameLoop(state,'COMPLETE',{rewardId:'r1'});
  assert.equal(state.phase,'XP_REWARD');
  state = mod.reduceGameLoop(state,'XP_PRESENTED',{hasLoot:true,levelUp:true});
  assert.equal(state.phase,'LOOT_REWARD');
  state = mod.reduceGameLoop(state,'LOOT_PRESENTED',{levelUp:true});
  assert.equal(state.phase,'LEVEL_UP');
  state = mod.reduceGameLoop(state,'LEVEL_PRESENTED',{hasLoot:true});
  assert.equal(state.phase,'EQUIP');
  state = mod.reduceGameLoop(state,'EQUIP_DONE');
  assert.equal(state.phase,'WORLD_REACTION');
  state = mod.reduceGameLoop(state,'WORLD_REACTED');
  assert.equal(state.phase,'NEXT_QUEST');
  state = mod.reduceGameLoop(state,'CONTINUE',{questId:'focus_protocol'});
  assert.equal(state.phase,'BRIEFING');
  assert.equal(state.questId,'focus_protocol');
});

test('failure enters recovery and can resume an active quest', () => {
  let state = mod.reduceGameLoop(mod.INITIAL_GAME_LOOP_STATE,'SELECT_QUEST',{questId:'q'});
  state = mod.reduceGameLoop(state,'START');
  state = mod.reduceGameLoop(state,'STARTED');
  state = mod.reduceGameLoop(state,'FAIL');
  assert.equal(state.phase,'RECOVERY');
  assert.equal(mod.canContinueMission(state),true);
  state = mod.reduceGameLoop(state,'RESUME');
  assert.equal(state.phase,'ACTIVE');
});


test('reward plan skips optional loot and level phases when not earned', () => {
  const rewards = load('gameLoop/rewardPlan.ts');
  const receipt={id:'r2',realXp:10,skillXp:{},energy:1,distanceMeters:0,beforeLevel:2,afterLevel:2,beforeRank:'E',afterRank:'E',skillLevels:[],newTitles:[],worldUnlocked:false};
  assert.deepEqual(Array.from(rewards.buildRewardPresentationPlan(receipt,false),x=>x.phase),['XP_REWARD','WORLD_REACTION','NEXT_QUEST']);
});

test('loop invariants reject reward presentation without a receipt', () => {
  const guards=load('gameLoop/guards.ts');
  assert.throws(()=>guards.assertLoopInvariant({phase:'XP_REWARD',questId:'q',rewardId:null,recoverable:false}));
});

test('crash during active mission restores into recovery', () => {
  const recovery=load('gameLoop/recovery.ts');
  const session=load('gameLoop/session.ts');
  const saved=recovery.checkpoint({phase:'ACTIVE',questId:'q',rewardId:null,recoverable:false},'2026-09-30T00:00:00.000Z');
  const restored=session.restoreGameLoop(saved);
  assert.equal(restored.phase,'RECOVERY');
  assert.equal(session.shouldResumeTracking(restored),true);
});


test('every loop phase exposes exactly one primary action', () => {
  const cta=load('gameLoop/cta.ts');
  const phases=['HOME','BRIEFING','STARTING','ACTIVE','VERIFYING','COMPLETING','XP_REWARD','LOOT_REWARD','LEVEL_UP','EQUIP','WORLD_REACTION','NEXT_QUEST','RECOVERY'];
  for(const phase of phases){
    const action=cta.primaryGameLoopCTA({phase,questId:phase==='HOME'?null:'q',rewardId:['XP_REWARD','LOOT_REWARD','LEVEL_UP','EQUIP','WORLD_REACTION'].includes(phase)?'r':null,recoverable:phase==='RECOVERY'});
    assert.equal(typeof action.label,'string');
    assert.ok(action.label.length>0);
  }
});

test('reward presentation is replayable without granting a second reward', () => {
  const p=load('gameLoop/presentation.ts');
  const receipt={id:'reward:1',realXp:25,skillXp:{},energy:1,distanceMeters:0,beforeLevel:2,afterLevel:3,beforeRank:'E',afterRank:'E',skillLevels:[],newTitles:[],worldUnlocked:false};
  let view=p.createRewardPresentation(receipt,{id:'loot:1'});
  assert.equal(p.currentRewardStep(view).phase,'XP_REWARD');
  const same=p.createRewardPresentation(receipt,{id:'loot:1'});
  assert.equal(same.rewardId,view.rewardId);
  while(!p.rewardPresentationComplete(view)) view=p.advanceRewardPresentation(view);
  assert.equal(p.rewardPresentationComplete(view),true);
});
