// Run: node --test src/system2/tests/adaptive.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../../..');
const ts=require(require.resolve('typescript',{paths:[root,process.cwd()]}));
const source=ts.transpileModule(fs.readFileSync(path.join(root,'src/system2/adaptive/engine.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const moduleRef={exports:{}};
vm.runInNewContext(source,{module:moduleRef,exports:moduleRef.exports,Date,console});
const {newUserModel,setLifeState,recordOutcome,planAdaptiveDay,normalizeUserModel}=moduleRef.exports;
const now='2026-09-26T12:00:00.000Z';
test('life states never demand more than normal day',()=>{
 const normal=planAdaptiveDay(newUserModel(now),now);
 for(const state of ['BUSY','TRAVEL','RECOVERY','VACATION']){
  const plan=planAdaptiveDay(setLifeState(newUserModel(now),state,now),now);
  assert.ok(plan.dailyCount<=normal.dailyCount);
  assert.ok(plan.dailyCount>=1);
 }
});
test('duplicate event does not inflate outcomes or preferences',()=>{
 const event={id:'e1',questType:'focus_session',difficulty:2,outcome:'COMPLETE',at:now};
 const first=recordOutcome(newUserModel(now),event);
 const second=recordOutcome(first,event);
 assert.equal(second.outcomes.length,1);
 assert.deepEqual(Array.from(second.preferredTypes),['focus_session']);
});
test('failures reduce load and suggest recovery',()=>{
 let model=newUserModel(now);
 for(let i=0;i<4;i++)model=recordOutcome(model,{id:'f'+i,questType:'focus_session',difficulty:2,outcome:'FAILED',at:now});
 const plan=planAdaptiveDay(model,now);
 assert.ok(plan.dailyCount<3);
 assert.equal(plan.suggestedState,'RECOVERY');
});
test('short available time caps load and malformed model is normalized',()=>{
 const model=normalizeUserModel({availableMinutes:-5,lifeState:'UNKNOWN',outcomes:'bad'});
 const plan=planAdaptiveDay(model,now);
 assert.equal(model.lifeState,'NORMAL');
 assert.equal(plan.dailyCount,1);
});
