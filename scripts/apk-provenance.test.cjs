const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {BRANCH,validateSource,verifyConfig,publish}=require('./apk-provenance.cjs');
const sha='a'.repeat(40);
for(const [platform,cacheOverride] of [['win32',null],['win32','C:/SYSTEM custom cache'],['linux',null]]) test('official Gradle invocation keeps cache selection and signing guards: '+platform+' '+(cacheOverride??'default'),()=>{
 const vm=require('node:vm');
 const calls=[];
 const env={SYSTEM_ANDROID_KEYSTORE:'existing.keystore',SYSTEM_ANDROID_KEY_ALIAS:'test-alias',SYSTEM_ANDROID_STORE_PASSWORD:'test-store-secret',SYSTEM_ANDROID_KEY_PASSWORD:'test-key-secret',SYSTEM_ANDROID_CERT_SHA256:'a'.repeat(64),ANDROID_HOME:'/sdk',GRADLE_USER_HOME:'E:/DEV/gradle',...(cacheOverride?{SYSTEM_ANDROID_GRADLE_HOME:cacheOverride}:{})};
 const fakeFs={existsSync:()=>true,readdirSync:()=>['36.0.0'],mkdirSync(){},writeFileSync(){},appendFileSync(){},readFileSync:()=>JSON.stringify({expo:{version:'1.0.1',android:{versionCode:2}}})};
 const processMock={platform,argv:['node','official-apk.cjs','--sha',sha],env,execPath:'node'};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'official-apk.cjs'),'utf8'),{
  __dirname,process:processMock,console:{log(){},error(){}},
  require(name){
   if(name==='node:fs')return fakeFs;
   if(name==='node:child_process')return {spawnSync(command,args,options){calls.push({command,args,options});return {status:/gradlew(?:\.bat)?$/.test(command)?1:0};}};
   if(name==='./apk-provenance.cjs')return {source:()=>({branch:BRANCH,sha})};
   return require(name);
  },
 });
 const gradle=calls.find(call=>/gradlew(?:\.bat)?$/.test(call.command));assert.ok(gradle);
 assert.ok(gradle.args.includes(':app:assembleRelease'));
 assert.equal(gradle.options.env.GRADLE_USER_HOME,cacheOverride?path.resolve(cacheOverride):platform==='win32'?path.join(os.homedir(),'.gradle'):env.GRADLE_USER_HOME);
 assert.equal(env.GRADLE_USER_HOME,'E:/DEV/gradle','cache selection must not change the parent environment');
 assert.ok(gradle.args.includes('--no-daemon'));assert.equal(gradle.options.env.SYSTEM_EXPECTED_SHA,sha);
 for(const secret of ['test-store-secret','test-key-secret'])assert.ok(!JSON.stringify(calls.map(call=>call.args)).includes(secret));
 assert.equal(processMock.exitCode,1,'a Gradle failure must still stop publication');
});
test('official source accepts only the exact branch, commit and clean tree',()=>{
 const valid={branch:BRANCH,sha,expectedSha:sha,dirty:'',repository:'Buli2580/SYSTEM'};
 assert.doesNotThrow(()=>validateSource(valid));
 for(const patch of [{branch:'master'},{sha:'b'.repeat(40)},{expectedSha:undefined},{dirty:' M app.json'},{repository:'other/SYSTEM'}]) assert.throws(()=>validateSource({...valid,...patch}));
});
test('verification rejects old embedded metadata, OTA and changed application identity',()=>{
 const m={sha,branch:BRANCH,builtAt:'2026-09-27T10:00:00Z',version:'1.0.1',versionCode:123};
 const config={extra:{buildProvenance:m},android:{package:'pl.systemworld.app',versionCode:123},version:m.version,updates:{enabled:false}};
 assert.doesNotThrow(()=>verifyConfig(config,m));
 assert.throws(()=>verifyConfig({...config,extra:{buildProvenance:{...m,sha:'old'}}},m));
 assert.throws(()=>verifyConfig({...config,updates:{enabled:true}},m));
 assert.throws(()=>verifyConfig({...config,android:{...config.android,package:'other.app'}},m));
});
test('publishing refuses to overwrite an existing APK',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'system-apk-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const input=path.join(dir,'new.apk'),out=path.join(dir,'output.apk');fs.writeFileSync(input,'new');fs.writeFileSync(out,'old');
 assert.throws(()=>publish(input,out));assert.equal(fs.readFileSync(out,'utf8'),'old');
});
test('Expo config carries generated diagnostics and blocks direct EAS builds',t=>{
 const configure=require('../app.config.js');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'system-config-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const saved={...process.env};t.after(()=>{for(const key of ['SYSTEM_BUILD_MANIFEST','SYSTEM_EXPECTED_SHA','EAS_BUILD','EAS_BUILD_PROFILE']) {if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key];}});
 delete process.env.EAS_BUILD;delete process.env.EAS_BUILD_PROFILE;
 const metadata={branch:BRANCH,sha,builtAt:new Date().toISOString(),version:'1.0.1',versionCode:321};
 process.env.SYSTEM_BUILD_MANIFEST=path.join(dir,'build.json');process.env.SYSTEM_EXPECTED_SHA=sha;fs.writeFileSync(process.env.SYSTEM_BUILD_MANIFEST,JSON.stringify(metadata));
 const config=configure({config:{version:'1.0.1',android:{package:'pl.systemworld.app'},extra:{}}});
 assert.doesNotThrow(()=>verifyConfig(config,metadata));
 process.env.SYSTEM_EXPECTED_SHA='b'.repeat(40);assert.throws(()=>configure({config:{}}));
 process.env.EAS_BUILD='true';assert.throws(()=>configure({config:{}}),/direct EAS builds are retired/);
});
test('legacy workflows cannot produce APK and the official checkout is pinned',()=>{
 const root=path.resolve(__dirname,'..');
 for(const name of ['android-test-apk.yml','system-nightly-ai-build.yml']) {
  const source=fs.readFileSync(path.join(root,'.github/workflows',name),'utf8');assert.doesNotMatch(source,/assemble|Copy-Item|cp .*apk|eas.*build/);assert.match(source,/exit 1/);
 }
 const official=fs.readFileSync(path.join(root,'.github/workflows/official-apk.yml'),'utf8');assert.match(official,/ref: \$\{\{ github.sha \}\}/);assert.match(official,/integration\/system-evening-build/);
 assert.doesNotMatch(official.split('    steps:')[0],/\$\{\{\s*runner\./,'runner context is unavailable in job env');
});
