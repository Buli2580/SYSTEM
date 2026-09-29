// Run: node --test src/system2/tests/chronicle-memory.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require(require.resolve('typescript',{paths:[path.resolve(__dirname,'../../..'),process.cwd()]}));
const source=fs.readFileSync(path.join(__dirname,'../story/chronicleMemory.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};
vm.runInNewContext(compiled,{module:mod,exports:mod.exports,Date,Set,Number,Error},{filename:'story/chronicleMemory.ts'});
const {buildChronicle:build}=mod.exports;
const event=(id,day='2026-09-29')=>({id,playerId:'p1',questId:'walk',verified:true,createdAt:day+'T12:00:00Z',realXpAwarded:10,distanceMeters:100,latitude:54.5,longitude:17.7});
test('only verified events from the player enter memory',()=>{const r=build('p1',[event('a'),{...event('b'),verified:false},{...event('c'),playerId:'p2'}]);assert.equal(r.verifiedCount,1);});
test('duplicate events do not inflate XP',()=>{const r=build('p1',[event('a'),event('a')]);assert.equal(r.totalXp,10);});
test('location and activity evidence never enter the memory summary',()=>{const r=build('p1',[event('a')]);assert.equal(JSON.stringify(r).includes('latitude'),false);assert.equal(JSON.stringify(r).includes('17.7'),false);});
test('bounded entries retain aggregate history',()=>{const r=build('p1',[event('a'),event('b','2026-09-28')],1);assert.equal(r.entries.length,1);assert.equal(r.verifiedCount,2);assert.equal(r.activeDays,2);});
test('invalid events and request limits are rejected',()=>{assert.equal(build('p1',[{...event('a'),realXpAwarded:-1}]).verifiedCount,0);assert.throws(()=>build('p1',[],101));});
