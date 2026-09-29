// Compare the installed Android package with an explicitly verified official APK.
// This checks native versionCode/versionName, NOT the installed JS bundle SHA.
// Usage: node scripts/check-installed-apk.cjs <apk> <full-source-sha> [adb-serial]
const fs=require('node:fs');
const cp=require('node:child_process');
const path=require('node:path');
const {verify}=require('./verify-official-artifact.cjs');
const PACKAGE='pl.systemworld.app';
function parsePackageDump(output){
 const code=output.match(/(?:^|\s)versionCode=(\d+)(?=\s|$)/m)?.[1];
 const name=output.match(/(?:^|\s)versionName=([^\s]+)/m)?.[1];
 if(!code||!name)throw new Error('Cannot read installed package version; wrong device or package missing');
 return {versionCode:Number(code),versionName:name};
}
function check(argv,deps={}){
 const [apk,sha,serial]=argv;
 if(!apk||!/^[a-f0-9]{40}$/i.test(sha||''))throw new Error('Usage: check-installed-apk <apk> <full-source-sha> [adb-serial]');
 if(serial!==undefined&&!/^[A-Za-z0-9_.:-]+$/.test(serial))throw new Error('Invalid adb serial');
 const proof=(deps.verify||verify)(apk,sha);
 const meta=JSON.parse((deps.fs||fs).readFileSync(path.resolve(apk)+'.json','utf8'));
 if(!Number.isSafeInteger(meta.versionCode)||meta.versionCode<=0||typeof meta.version!=='string')throw new Error('Invalid version in APK provenance');
 const run=deps.spawn||cp.spawnSync;
 const cmd=process.platform==='win32'?'adb.exe':'adb';
 const result=run(cmd,[...(serial?['-s',serial]:[]),'shell','dumpsys','package',PACKAGE],{encoding:'utf8',shell:false});
 if(result.error)throw result.error;
 if(result.status!==0)throw new Error('ADB package inspection failed');
 const installed=parsePackageDump(result.stdout||'');
 if(installed.versionCode!==meta.versionCode||installed.versionName!==meta.version)throw new Error('Installed app differs from verified APK: installed '+JSON.stringify(installed)+' expected '+JSON.stringify({versionCode:meta.versionCode,versionName:meta.version}));
 return {installed,sourceSha:proof.sha,buildRunId:proof.runId,package:PACKAGE};
}
if(require.main===module){try{console.log('DEVICE VERSION MATCH: '+JSON.stringify(check(process.argv.slice(2))));}catch(e){console.error('DEVICE CHECK FAILED: '+e.message);process.exitCode=1;}}
module.exports={check,parsePackageDump};
