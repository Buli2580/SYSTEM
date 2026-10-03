const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
function model(){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve('../inventory/tracebook.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});return exports;}
const date=n=>`2026-10-${String(n).padStart(2,'0')}T12:00:00.000Z`;
test('category filtering never exposes a different profile or changes history order',()=>{
 const {filterTracebook}=model();
 const rows=[{id:'a',playerId:'p',category:'LOOT'},{id:'b',playerId:'other',category:'LOOT'},{id:'c',playerId:'p',category:'QUEST'}];
 assert.equal(filterTracebook(rows,'p','LOOT').length,1);
 assert.equal(filterTracebook(rows,'p','ALL').map(x=>x.id).join(','),'a,c');
 assert.equal(rows.length,3);
});
test('missing legacy dates do not manufacture domain milestone dates or level-ups',()=>{
 const rows=model().buildTracebook({playerId:'legacy',quests:[{quest_id:'old',completed_at:'',title:'Old',category:'QUEST'},{quest_id:'new',completed_at:date(2),title:'New',category:'QUEST'}],events:[{id:'old',createdAt:date(1)}],chapters:[],bonuses:[],loot:[]});
 assert.equal(rows.length,1);assert.equal(rows[0].title,'New');
});
test('Tracebook derives canonical dated history, deduplicates and sorts without manufacturing old levels',()=>{
 const {buildTracebook}=model();
 const input={playerId:'p',quests:[{quest_id:'q',completed_at:date(1),title:'Real quest',category:'DAILY'},{quest_id:'q',completed_at:date(1),title:'Real quest',category:'DAILY'}],events:[],chapters:[],bonuses:[],loot:[]};
 const rows=buildTracebook(input);
 assert.equal(rows.filter(x=>x.category==='DAILY').length,1);
 assert.equal(rows.filter(x=>x.category==='DOMAIN').length,1);
 assert.equal(rows.filter(x=>x.category==='LEVEL').length,0);
 assert.ok(rows.every(x=>x.playerId==='p'&&x.at===date(1)));
 assert.equal(JSON.stringify(buildTracebook(input)),JSON.stringify(rows));
 assert.equal(buildTracebook({...input,quests:[]}).length,0);
});
test('Tracebook records only evidenced level changes, Awakening, weekly and owned loot',()=>{
 const {buildTracebook}=model();
 const quests=Array.from({length:5},(_,i)=>({quest_id:'q'+i,completed_at:date(i+1),title:'Quest',category:i===4?'BOSS':'QUEST'}));
 const rows=buildTracebook({playerId:'p',quests,events:[{id:'e',createdAt:date(3),levelBefore:1,levelAfter:2}],chapters:[{chapter_id:'awakening_chapter_1',completed_at:date(3)}],bonuses:[{bonus_key:'w',kind:'weekly_complete',created_at:date(4)}],loot:[{id:'item-instance',name:'Real item',rarity:'RARE',acquiredAt:date(5)}]});
 assert.equal(rows.filter(x=>x.category==='LEVEL').length,1);
 assert.equal(rows.filter(x=>x.category==='DOMAIN').length,2);
 for(const category of ['AWAKENING','WEEKLY','LOOT','BOSS'])assert.equal(rows.filter(x=>x.category===category).length,1);
 assert.ok(rows.every((x,i)=>i===0||Date.parse(rows[i-1].at)>=Date.parse(x.at)));
 assert.equal(new Set(rows.map(x=>x.id)).size,rows.length);
});
