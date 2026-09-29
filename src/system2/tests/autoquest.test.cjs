const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require(require.resolve('typescript',{paths:[path.resolve(__dirname,'../../..'),process.cwd()]}));
const source=fs.readFileSync(path.join(__dirname,'../generation/autoQuest.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
vm.runInNewContext(compiled,{module:mod,exports:mod.exports,Math,Number},{filename:'generation/autoQuest.ts'});
const {proposeAutoQuests:propose}=mod.exports;
const templates=[
 {id:'walk',verification:'GPS_DISTANCE',activity:'WALK',baseTarget:600},
 {id:'run',verification:'GPS_DISTANCE',activity:'RUN',baseTarget:500},
 {id:'focus',verification:'TIMER',baseTarget:300},
];
const caps={gps:true,timer:true,walking:true,running:false,cycling:false};
test('never proposes a disabled activity',()=>{
 const result=propose(templates,caps,20,3);
 assert.equal(result.proposals.some(q=>q.templateId==='run'),false);
 assert.equal(result.skipped[0].reason,'ACTIVITY_DISABLED');
});
test('no GPS means no distance quest',()=>{
 const result=propose(templates,{...caps,gps:false},20,3);
 assert.equal(result.proposals.length,1);
 assert.equal(result.proposals[0].verification,'TIMER');
});
test('no timer means no timed quest',()=>{
 const result=propose(templates,{...caps,timer:false},20,3);
 assert.equal(result.proposals.length,1);
 assert.equal(result.proposals[0].verification,'GPS_DISTANCE');
});
test('zero time or count creates no proposals',()=>{
 assert.equal(propose(templates,caps,0,3).proposals.length,0);
 assert.equal(propose(templates,caps,20,0).proposals.length,0);
});
test('targets fit the approximate available time',()=>{
 const result=propose(templates,caps,2,2);
 assert.equal(result.proposals.length,2);
 assert.ok(result.proposals.every(q=>q.estimatedMinutes<=1));
});
test('never exceeds five proposed quests',()=>{
 const many=Array.from({length:12},(_,i)=>({id:'timer-'+i,verification:'TIMER',baseTarget:300}));
 assert.equal(propose(many,caps,240,100).proposals.length,5);
});
test('proposal does not contain evidence, reward or completion status',()=>{
 const result=propose(templates,caps,20,2);
 assert.ok(result.proposals.every(q=>!('rewards' in q)&&!('evidence' in q)&&!('completed' in q)));
});

test('proposal count is deterministic and capped by available templates',()=>{
 const result=propose(templates,caps,20,5);
 assert.equal(result.proposals.length,2);
 assert.equal(result.proposals[0].templateId,'walk');
});
test('non-finite time and count are rejected',()=>{
 assert.equal(propose(templates,caps,NaN,3).proposals.length,0);
 assert.equal(propose(templates,caps,20,Infinity).proposals.length,0);
});
