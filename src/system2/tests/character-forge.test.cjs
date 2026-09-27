const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=process.env.SYSTEM_PROJECT_ROOT??path.resolve(__dirname,'../../..');
const ts=require(require.resolve('typescript',{paths:[root,process.cwd()]}));

function load(moduleName,mocks={}){
 const file=path.join(root,'src/system2',moduleName+'.ts');
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText;
 const module={exports:{}};
 vm.runInNewContext(source,{module,exports:module.exports,console,
  require:name=>{
   if(Object.hasOwn(mocks,name))return mocks[name];
   throw new Error('Unexpected runtime import: '+name);
  },
 },{filename:file});
 return module.exports;
}

test('Character Forge evolution follows actual REAL level/rank without changing XP',()=>{
 const {getEvolutionVisual}=load('identity/evolution');
 assert.equal(getEvolutionVisual(1,'E','CYBER').stage,0);
 assert.equal(getEvolutionVisual(10,'D','CYBER').stage,1);
 assert.equal(getEvolutionVisual(25,'B','DARK').stage,2);
 assert.equal(getEvolutionVisual(1,'ASCENDED','WARLORD').stage,4);
 assert.equal(getEvolutionVisual(99999,'ASCENDED','WARLORD').stage,4);
 assert.equal(getEvolutionVisual(1,'E','WARLORD').pulseMs>0,true);
});

test('Old saved profiles receive CYBER default and Forge preferences survive updates',()=>{
 const {parseSettings,mergeSettings}=load('identity/model',{
  '../daily/templates':{DEFAULT_ACTIVITIES:{walking:true,running:false,cycling:false}},
  '../core/progression':{SKILL_KEYS:['STR','VIT','INT','WIL','CHA','CRE','RES']},
 });
 const old=parseSettings(JSON.stringify({audio:true,haptics:true,ambientVolume:0.3}));
 assert.equal(old.avatarStyle,'CYBER');
 assert.equal(old.ambientVolume,0.3);
 const next=mergeSettings(old,{avatarStyle:'WARLORD'});
 assert.equal(next.avatarStyle,'WARLORD');
 assert.equal(next.ambientVolume,0.3);
 assert.equal(parseSettings(JSON.stringify({...next,avatarStyle:'INVALID'})).avatarStyle,'CYBER');
});
