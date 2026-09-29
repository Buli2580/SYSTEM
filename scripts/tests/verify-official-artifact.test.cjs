const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { verify } = require('../verify-official-artifact.cjs');
const apk = '/tmp/SYSTEM.apk';
const sha = 'a'.repeat(40);
const bytes = Buffer.from('fake-apk-for-provenance-unit-test');
const meta = {sha,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),runId:'run-1',builtAt:'2026-09-29T10:00:00Z',signingCertificateSHA256:'b'.repeat(64),version:'1.0.1'};
function io(sidecar=meta, apkBytes=bytes) {return {existsSync:p=>p===apk||p===apk+'.json',readFileSync:p=>p===apk?apkBytes:JSON.stringify(sidecar)};}
test('accepts matching provenance and exact commit',()=>assert.equal(verify(apk,sha,io()).sha,sha));
test('rejects wrong commit',()=>assert.throws(()=>verify(apk,'c'.repeat(40),io()),/does not match/));
test('rejects replaced APK',()=>assert.throws(()=>verify(apk,sha,io(meta,Buffer.from('old-apk'))),/checksum mismatch/));
test('rejects incomplete provenance',()=>assert.throws(()=>verify(apk,sha,io({...meta,runId:null})),/Incomplete/));
test('rejects missing sidecar',()=>assert.throws(()=>verify(apk,sha,{existsSync:p=>p===apk}),/missing/));
