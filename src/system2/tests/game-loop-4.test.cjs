import assert from 'node:assert/strict';
import test from 'node:test';

const mod = await import('../gameLoop/stateMachine.ts');

test('Game Loop 4 follows the canonical mission path without a dead end', () => {
  let state = mod.INITIAL_GAME_LOOP_STATE;
  state = mod.reduceGameLoop(state,'SELECT_QUEST',{questId:'first_movement'});
  assert.equal(state.phase,'BRIEFING');
  state = mod.reduceGameLoop(state,'START');
  assert.equal(state.phase,'STARTING');
  state = mod.reduceGameLoop(state,'STARTED');
  assert.equal(state.phase,'ACTIVE');
  state = mod.reduceGameLoop(state,'VERIFY');
  assert.equal(state.phase,'VERIFYING');
  state = mod.reduceGameLoop(state,'VERIFIED');
  assert.equal(state.phase,'COMPLETING');
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
  state = mod.reduceGameLoop(state,'RESUME');
  assert.equal(state.phase,'ACTIVE');
});
