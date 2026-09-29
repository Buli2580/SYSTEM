// Run: node --test src/system2/tests/adaptive-budget.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require(require.resolve('typescript',{paths:[path.resolve(__dirname,'../../..'),process.cwd()]}));
const source=fs.readFileSync(path.join(__dirname,'../adaptive/engine.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const moduleRef={exports:{}};
vm.runInNewContext(compiled,{module:moduleRef,exports:moduleRef.exports,Date,Math,Number,Map,Set},{filename:'adaptive/engine.ts'});
const {newUserModel,planAdaptiveDay}=moduleRef.exports;
const now='2026-09-29T10:00:00.000Z';
test('special day types do not fill the full normal time budget',()=>{
 const model=newUserModel(now);
 const expected={NORMAL:3,BUSY:1,TRAVEL:1,RECOVERY:1,VACATION:1};
 for(const [lifeState,dailyCount] of Object.entries(expected)){
  const plan=planAdaptiveDay({...model,lifeState,availableMinutes:240},now);
  assert.equal(plan.dailyCount,dailyCount,lifeState);
 }
});
test('limited available time is respected in every day type',()=>{
 const model=newUserModel(now);
 for(const lifeState of ['NORMAL','BUSY','TRAVEL','RECOVERY','VACATION']){
  assert.equal(planAdaptiveDay({...model,lifeState,availableMinutes:12},now).dailyCount,1,lifeState);
 }
});
test('normal days preserve the existing adaptive three-quest baseline',()=>{
 const plan=planAdaptiveDay({...newUserModel(now),availableMinutes:45},now);
 assert.equal(plan.dailyCount,3);
});
