// Run: node --test src/system2/tests/intelligent-selection.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require(require.resolve('typescript',{paths:[path.resolve(__dirname,'../../..'),process.cwd()]}));
const source=fs.readFileSync(path.join(__dirname,'../generation/intelligentSelection.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
vm.runInNewContext(compiled,{module:mod,exports:mod.exports,Date,Math,Number,Set,Error},{filename:'generation/intelligentSelection.ts'});
const {selectIntelligentQuests:select}=mod.exports;
const now='2026-09-29T10:00:00.000Z';
const template=(id,goals=['FITNESS'],activity)=>({id,category:'FITNESS',goals,minimumLevel:1,verification:activity?'GPS_DISTANCE':'TIMER',activity});
const model={availableMinutes:45,preferredTypes:[],outcomes:[]};
const base={templates:[template('walk',['FITNESS'],'WALK'),template('read',['LEARNING']),template('run',['FITNESS'],'RUN')],model,goals:['LEARNING'],recentTemplateIds:[],playerLevel:1,count:2,now};
test('prioritizes goal match and respects disabled movement',()=>{
 const result=select(base);
 assert.equal(result.choices[0].templateId,'read');
 assert.equal(result.excluded[0].reason,'ACTIVITY_DISABLED');
});
test('recent template is postponed when a fresh choice exists',()=>{
 const result=select({...base,recentTemplateIds:['read']});
 assert.equal(result.choices[0].templateId,'walk');
});
test('repetition fallback does not leave the day empty',()=>{
 const result=select({...base,templates:[template('read',['LEARNING'])],recentTemplateIds:['read'],count:1});
 assert.equal(result.choices.length,1);
});
test('level gate blocks unavailable quests',()=>{
 const result=select({...base,templates:[{...template('advanced'),minimumLevel:8}],count:1});
 assert.equal(result.choices.length,0);
 assert.equal(result.excluded[0].reason,'LEVEL');
});
test('run requires explicit activity opt-in',()=>{
 const result=select({...base,allowedActivities:['RUN'],goals:['FITNESS'],count:3});
 assert.equal(result.choices.some(x=>x.templateId==='run'),true);
 assert.equal(result.choices.some(x=>x.templateId==='walk'),false);
});
test('completed history is a preference, not a mandatory repeat',()=>{
 const outcomes=[{id:'1',questType:'FITNESS',outcome:'COMPLETE',at:'2026-09-28T10:00:00.000Z'}];
 const result=select({...base,model:{...model,outcomes},goals:[],count:2});
 assert.equal(result.choices[0].templateId,'walk');
});
test('future history does not affect selection',()=>{
 const outcomes=[{id:'1',questType:'FITNESS',outcome:'COMPLETE',at:'2026-10-01T10:00:00.000Z'}];
 const result=select({...base,model:{...model,outcomes},goals:[],count:2});
 assert.equal(result.choices[0].score,0);
});
test('zero or invalid requested count yields no quests',()=>{
 assert.equal(select({...base,count:0}).choices.length,0);
 assert.equal(select({...base,count:NaN}).choices.length,0);
});
test('same input produces deterministic order',()=>{
 assert.deepEqual(JSON.stringify(select(base)),JSON.stringify(select(base)));
});
