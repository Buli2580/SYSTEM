const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {DatabaseSync}=require('node:sqlite');
const ts=require('typescript');
function load(){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../domain/storage.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports});return exports;}
test('domain survives SQLite restart; duplicate completions cannot advance it',async t=>{
 const dir=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'system-domain-'));
 const file=path.join(dir,'domain.sqlite');let sql=new DatabaseSync(file);
 t.after(()=>{sql.close();fs.rmSync(dir,{recursive:true});});
 sql.exec('CREATE TABLE app_state(key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE quest_completions(quest_id TEXT PRIMARY KEY);');
 const db={getFirstAsync:async(q,...p)=>sql.prepare(q).get(...p),getAllAsync:async(q,...p)=>sql.prepare(q).all(...p),runAsync:async(q,...p)=>sql.prepare(q).run(...p)};
 const {readDomain}=load();
 assert.equal(await readDomain(db,'player-a','A',false),null);
 const initial=await readDomain(db,'player-a','A',true);
 assert.equal(initial.level,1);assert.equal(initial.completedQuests,0);
 sql.exec("INSERT INTO quest_completions VALUES('real-quest');");
 const advanced=await readDomain(db,'player-a','A',true);
 assert.equal(advanced.completedQuests,1);assert.equal(advanced.firstAchievement,true);
 assert.equal(JSON.stringify(await readDomain(db,'player-a','A',true)),JSON.stringify(advanced));
 sql.close();sql=new DatabaseSync(file);
 assert.equal(JSON.stringify(await load().readDomain(db,'player-a','renamed',true)),JSON.stringify(advanced));
 assert.equal(sql.prepare('SELECT count(*) AS n FROM app_state').get().n,1);
});
test('legacy profile initializes deterministically from unique canonical completions without XP writes',async()=>{
 const sql=new DatabaseSync(':memory:');try{
 sql.exec("CREATE TABLE app_state(key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE quest_completions(quest_id TEXT PRIMARY KEY); INSERT INTO app_state VALUES('player','original');");
 for(let i=0;i<5;i++)sql.prepare('INSERT INTO quest_completions VALUES(?)').run('q'+i);
 const db={getFirstAsync:async(q,...p)=>sql.prepare(q).get(...p),getAllAsync:async(q,...p)=>sql.prepare(q).all(...p),runAsync:async(q,...p)=>sql.prepare(q).run(...p)};
 const domain=await load().readDomain(db,'legacy','Tester',true);
 assert.equal(domain.level,2);assert.equal(domain.completedQuests,5);
 assert.equal(sql.prepare("SELECT value FROM app_state WHERE key='player'").get().value,'original');
 assert.equal(domain.locations.FORGE,'LOCKED');assert.equal(domain.locations.SANCTUARY,'LOCKED');
 }finally{sql.close();}
});

test('domain keys separate player identities and unreadable records are never overwritten',async()=>{
 const sql=new DatabaseSync(':memory:');try{
 sql.exec('CREATE TABLE app_state(key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE quest_completions(quest_id TEXT PRIMARY KEY);');
 let writes=0;
 const db={getFirstAsync:async(q,...p)=>sql.prepare(q).get(...p),getAllAsync:async(q,...p)=>sql.prepare(q).all(...p),runAsync:async(q,...p)=>{writes++;return sql.prepare(q).run(...p);}};
 const {readDomain}=load();
 await readDomain(db,'a','A',true);await readDomain(db,'b','B',true);
 assert.equal(writes,2);
 await readDomain(db,'a','A',true);assert.equal(writes,2,'unchanged reads must not write');
 sql.prepare('UPDATE app_state SET value=? WHERE key=?').run('{broken','living_domain_v1:a');
 await assert.rejects(readDomain(db,'a','A',true),/Zachowano zapis/);
 assert.equal(sql.prepare('SELECT value FROM app_state WHERE key=?').get('living_domain_v1:a').value,'{broken');
 assert.equal((await readDomain(db,'b','B',true)).name,'Azyl B');
 }finally{sql.close();}
});
