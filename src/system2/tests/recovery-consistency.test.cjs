// Run: node --test src/system2/tests/recovery-consistency.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require(require.resolve('typescript',{paths:[path.resolve(__dirname,'../../..'),process.cwd()]}));
const source=fs.readFileSync(path.join(__dirname,'../recovery/consistency.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
vm.runInNewContext(compiled,{module:mod,exports:mod.exports,Date,Math,Number,Set,Error},{filename:'recovery/consistency.ts'});
const {recoverySnapshot}=mod.exports;
const event=(id,at,outcome='COMPLETE')=>({id,at,questType:'WALK',difficulty:1,outcome});
test('new player starts with one quest and no invented missed days',()=>{
 const result=recoverySnapshot([],'2026-09-29');
 assert.equal(result.phase,'NEW');
 assert.equal(result.missedDays,null);
 assert.equal(result.suggestedQuestCount,1);
 assert.equal(result.ember,0);
});
test('one missed day does not erase progress or trigger comeback',()=>{
 const result=recoverySnapshot([event('a','2026-09-27T12:00:00.000Z')],'2026-09-29');
 assert.equal(result.phase,'ACTIVE');
 assert.equal(result.missedDays,1);
 assert.equal(result.activeDays7,1);
});
test('return after two missed days has a small two-quest target',()=>{
 const result=recoverySnapshot([event('a','2026-09-26T12:00:00.000Z')],'2026-09-29');
 assert.equal(result.phase,'REBUILD');
 assert.equal(result.suggestedQuestCount,2);
});
test('long break has a gentle one-quest return without XP mutation',()=>{
 const original=[event('a','2026-09-20T12:00:00.000Z')];
 const result=recoverySnapshot(original,'2026-09-29');
 assert.equal(result.phase,'GENTLE_RETURN');
 assert.equal(result.suggestedQuestCount,1);
 assert.equal(original.length,1);
});
test('deduplicates multiple quests on the same day',()=>{
 const result=recoverySnapshot([event('a','2026-09-28T10:00:00.000Z'),event('b','2026-09-28T18:00:00.000Z')],'2026-09-29');
 assert.equal(result.activeDays7,1);
});
test('ignores failed, future and invalid events',()=>{
 const result=recoverySnapshot([event('a','2026-09-28T10:00:00.000Z','FAILED'),event('b','2026-10-01T10:00:00.000Z'),event('c','bad')],'2026-09-29');
 assert.equal(result.phase,'NEW');
});
test('recovery outcomes count as active days',()=>{
 const result=recoverySnapshot([event('a','2026-09-29T10:00:00.000Z','RECOVERY')],'2026-09-29');
 assert.equal(result.phase,'ACTIVE');
 assert.equal(result.consistency7,14);
});
test('30 day projection caps at 100',()=>{
 const events=Array.from({length:30},(_,i)=>event(String(i),new Date(Date.UTC(2026,8,29-i,12)).toISOString()));
 const result=recoverySnapshot(events,'2026-09-29');
 assert.equal(result.consistency30,100);
 assert.equal(result.ember,100);
});
test('invalid calendar date is rejected',()=>assert.throws(()=>recoverySnapshot([],'2026-02-30')));
