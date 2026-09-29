// Run: node --test src/system2/tests/autoquest-policy.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ts=require(require.resolve('typescript',{paths:[path.resolve(__dirname,'../../..'),process.cwd()]}));
const source=fs.readFileSync(path.join(__dirname,'../verification/autoQuestPolicy.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
vm.runInNewContext(compiled,{module:mod,exports:mod.exports,Number},{filename:'verification/autoQuestPolicy.ts'});
const {planAutoQuest,preflightAutoQuest}=mod.exports;
const cap={gps:true,timer:true,locationPermission:true,steps:false};
const quest=(verification)=>({id:'q',verification});
const timer=quest({type:'TIMER',minimumDurationSeconds:60,verificationScoreRequired:100});
const gps=quest({type:'GPS_DISTANCE',minimumDistanceMeters:500,verificationScoreRequired:70});
const multi=quest({type:'MULTI',minimumDistanceMeters:500,minimumDurationSeconds:120,verificationScoreRequired:80});
test('timer is available without location permission',()=>{
 assert.equal(planAutoQuest(timer,{...cap,locationPermission:false}).status,'READY');
});
test('GPS requires permission and GPS hardware',()=>{
 assert.equal(planAutoQuest(gps,{...cap,locationPermission:false}).reason,'NO_PERMISSION');
 assert.equal(planAutoQuest(gps,{...cap,gps:false}).reason,'NO_SENSOR');
});
test('MULTI needs timer and GPS',()=>{
 assert.equal(planAutoQuest(multi,{...cap,timer:false}).status,'UNAVAILABLE');
 assert.equal(planAutoQuest(multi,cap).method,'MULTI');
});
test('invalid target never starts automatic verification',()=>{
 assert.equal(planAutoQuest(quest({type:'GPS_DISTANCE',minimumDistanceMeters:NaN}),cap).reason,'INVALID_TARGET');
 assert.equal(planAutoQuest(quest({type:'TIMER',minimumDurationSeconds:0}),cap).reason,'INVALID_TARGET');
});
test('timer evidence must reach target and cannot carry GPS distance',()=>{
 assert.equal(preflightAutoQuest(timer,{questId:'q',verificationType:'TIMER',durationSeconds:60,verificationScore:100}),true);
 assert.equal(preflightAutoQuest(timer,{questId:'q',verificationType:'TIMER',durationSeconds:59,verificationScore:100}),false);
 assert.equal(preflightAutoQuest(timer,{questId:'q',verificationType:'TIMER',durationSeconds:60,verificationScore:100,distanceMeters:10}),false);
});
test('GPS evidence must match identity, score and distance',()=>{
 const e={questId:'q',verificationType:'GPS_DISTANCE',durationSeconds:200,verificationScore:75,distanceMeters:500};
 assert.equal(preflightAutoQuest(gps,e),true);
 assert.equal(preflightAutoQuest(gps,{...e,questId:'other'}),false);
 assert.equal(preflightAutoQuest(gps,{...e,distanceMeters:499}),false);
 assert.equal(preflightAutoQuest(gps,{...e,verificationScore:101}),false);
});
test('MULTI checks distance and duration',()=>{
 const e={questId:'q',verificationType:'MULTI',durationSeconds:120,verificationScore:80,distanceMeters:500};
 assert.equal(preflightAutoQuest(multi,e),true);
 assert.equal(preflightAutoQuest(multi,{...e,durationSeconds:119}),false);
});
