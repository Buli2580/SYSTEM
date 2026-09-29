// Run: node --test src/system2/tests/cooperative-progress.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require(require.resolve('typescript',{paths:[path.resolve(__dirname,'../../..'),process.cwd()]}));
const source=fs.readFileSync(path.join(__dirname,'../social/cooperativeProgress.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
vm.runInNewContext(compiled,{module:mod,exports:mod.exports,Date,Set,Number,Error},{filename:'social/cooperativeProgress.ts'});
const {cooperativeProgress:progress}=mod.exports;
const objective={id:'city-walk',questIds:['walk'],targetCompletions:2,minimumParticipants:2,startsAt:'2026-09-01T00:00:00Z',endsAt:'2026-09-30T23:59:59Z'};
const event=(id,playerId='p1')=>({id,playerId,questId:'walk',verified:true,createdAt:'2026-09-29T12:00:00Z',realXpAwarded:20});
test('two distinct players complete a cooperative objective',()=>{const r=progress(objective,[event('a'),event('b','p2')]);assert.equal(r.complete,true);assert.equal(r.participantCount,2);});
test('one player cannot satisfy participant requirement',()=>{const r=progress(objective,[event('a'),event('b')]);assert.equal(r.complete,false);assert.equal(r.verifiedCompletions,2);});
test('duplicate and unverified events do not count',()=>{const r=progress(objective,[event('a'),event('a'),{...event('b','p2'),verified:false}]);assert.equal(r.verifiedCompletions,1);});
test('other quests and out-of-window events do not count',()=>{const r=progress(objective,[{...event('a'),questId:'other'},{...event('b'),createdAt:'2026-10-01T12:00:00Z'}]);assert.equal(r.verifiedCompletions,0);});
test('invalid objectives are rejected',()=>assert.throws(()=>progress({...objective,minimumParticipants:0},[])));
