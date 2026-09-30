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
