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

test('busy, travel and recovery plans keep weekly goals modest',()=>{
 const model=newUserModel(now);
 for(const lifeState of ['BUSY','TRAVEL','RECOVERY','VACATION']){
  const plan=planAdaptiveDay({...model,lifeState,availableMinutes:240},now);
  assert.equal(plan.weeklyCount,1,lifeState);
  assert.ok(plan.reasons.some(reason=>reason.includes('budżetu trybu dnia')),lifeState);
 }
});
test('normal mode can grow after a successful week without exceeding the time budget',()=>{
 const model=newUserModel(now);
 const outcomes=Array.from({length:5},(_,i)=>({id:'win-'+i,questType:'WALK',difficulty:2,outcome:'COMPLETE',at:'2026-09-28T10:00:00.000Z'}));
 assert.equal(planAdaptiveDay({...model,availableMinutes:240,outcomes},now).dailyCount,4);
 assert.equal(planAdaptiveDay({...model,availableMinutes:24,outcomes},now).dailyCount,2);
});
test('overload reduces normal daily load without reducing special days below one',()=>{
 const model=newUserModel(now);
 const outcomes=Array.from({length:4},(_,i)=>({id:'fail-'+i,questType:'WALK',difficulty:2,outcome:'FAILED',at:'2026-09-28T10:00:00.000Z'}));
 assert.equal(planAdaptiveDay({...model,availableMinutes:240,outcomes},now).dailyCount,2);
 assert.equal(planAdaptiveDay({...model,lifeState:'RECOVERY',availableMinutes:240,outcomes},now).dailyCount,1);
 assert.equal(planAdaptiveDay({...model,availableMinutes:240,outcomes},now).suggestedState,'RECOVERY');
});
test('a seven-day return always starts with one small quest',()=>{
 const model=newUserModel(now);
 const outcomes=[{id:'old',questType:'WALK',difficulty:2,outcome:'COMPLETE',at:'2026-09-20T10:00:00.000Z'}];
 const plan=planAdaptiveDay({...model,availableMinutes:240,outcomes},now);
 assert.equal(plan.dailyCount,1);
 assert.equal(plan.difficulty,1);
 assert.equal(plan.suggestedState,'RECOVERY');
});
test('planner ignores outcomes dated in the future',()=>{
 const model=newUserModel(now);
 const outcomes=Array.from({length:5},(_,i)=>({id:'future-'+i,questType:'WALK',difficulty:2,outcome:'COMPLETE',at:'2026-10-01T10:00:00.000Z'}));
 assert.equal(planAdaptiveDay({...model,availableMinutes:240,outcomes},now).dailyCount,3);
});
test('normalization constrains malformed time budgets',()=>{
 const {normalizeUserModel}=moduleRef.exports;
 assert.equal(normalizeUserModel({availableMinutes:-1}).availableMinutes,2);
 assert.equal(normalizeUserModel({availableMinutes:9999}).availableMinutes,240);
 assert.equal(normalizeUserModel({availableMinutes:'nonsense'}).availableMinutes,2);
});
