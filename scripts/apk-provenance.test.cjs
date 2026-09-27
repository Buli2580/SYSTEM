const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {BRANCH,validateSource,verifyConfig,publish}=require('./apk-provenance.cjs');
const sha='a'.repeat(40);
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
});
