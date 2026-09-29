const test=require('node:test');
const assert=require('node:assert/strict');
const {parse,release}=require('../release-verified-apk.cjs');
const sha='a'.repeat(40),branch='integration/system-evening-build';
test('requires exact source identity',()=>assert.throws(()=>parse(['HEAD',branch]),/Usage/));
test('serial requires install flag',()=>assert.throws(()=>parse([sha,branch,'--serial=abc']),/Invalid/));
test('rejects unknown options',()=>assert.throws(()=>parse([sha,branch,'--latest']),/Unknown/));
function harness(stdout,status=0){let installed=false,verified=false,postchecked=false;const deps={testSpawn:()=>({status:0}),check:(s,b)=>{assert.equal(s,sha);assert.equal(b,branch);return {sha:s,branch:b};},spawn:(cmd,args)=>{assert.equal(args.at(-1),sha);return {status,stdout,stderr:''};},verify:(apk,s)=>{verified=true;assert.equal(apk,'/tmp/new.apk');assert.equal(s,sha);return {sha,runId:'new'};},install:()=>{installed=true;},checkInstalled:()=>{postchecked=true;return {sourceSha:sha};}};return {deps,get installed(){return installed;},get verified(){return verified;},get postchecked(){return postchecked;}};}
test('build failure never installs',()=>{const h=harness('',1);assert.throws(()=>release([sha,branch,'--install'],h.deps),/build failed/);assert.equal(h.installed,false);assert.equal(h.postchecked,false);});
test('no fresh output never installs',()=>{const h=harness('old build finished\n');assert.throws(()=>release([sha,branch,'--install'],h.deps),/exactly one/);assert.equal(h.installed,false);});
test('only fresh output is verified and installed',()=>{const h=harness('Verified APK: /tmp/new.apk\n');assert.equal(release([sha,branch,'--install'],h.deps).installed,true);assert.equal(h.verified,true);assert.equal(h.installed,true);assert.equal(h.postchecked,true);});
test('no install unless requested',()=>{const h=harness('Verified APK: /tmp/new.apk\n');assert.equal(release([sha,branch],h.deps).installed,false);assert.equal(h.installed,false);});

test('post-install mismatch blocks success',()=>{const h=harness('Verified APK: /tmp/new.apk\n');h.deps.checkInstalled=()=>({sourceSha:'b'.repeat(40)});assert.throws(()=>release([sha,branch,'--install'],h.deps),/Post-install provenance mismatch/);});
test('post-install ADB error blocks success',()=>{const h=harness('Verified APK: /tmp/new.apk\n');h.deps.checkInstalled=()=>{throw new Error('ADB package inspection failed');};assert.throws(()=>release([sha,branch,'--install'],h.deps),/ADB package inspection failed/);});

test('failed safety tests block build and install',()=>{const h=harness('Verified APK: /tmp/new.apk\n');let buildCalled=false;h.deps.testSpawn=()=>({status:1});h.deps.spawn=()=>{buildCalled=true;throw new Error('must not build');};assert.throws(()=>release([sha,branch,'--install'],h.deps),/safety tests failed/);assert.equal(buildCalled,false);assert.equal(h.installed,false);});
test('test runner error blocks build',()=>{const h=harness('Verified APK: /tmp/new.apk\n');h.deps.testSpawn=()=>({error:new Error('node unavailable')});assert.throws(()=>release([sha,branch],h.deps),/node unavailable/);assert.equal(h.installed,false);});
