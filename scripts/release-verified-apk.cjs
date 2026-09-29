// Single release entry point: verify source -> build -> verify artifact -> optional install.
// Usage: node scripts/release-verified-apk.cjs <full-sha> <branch> [--install] [--serial=device-id]
// Never scans a directory for a previous APK; consumes only the current build's output.
const cp=require('node:child_process');
const path=require('node:path');
const {check}=require('./verify-build-source.cjs');
const {verify}=require('./verify-official-artifact.cjs');
const {install}=require('./install-verified-apk.cjs');
function parse(args){
 const [sha,branch,...flags]=args;
 if(!/^[0-9a-f]{40}$/i.test(sha||'')||!branch||branch.startsWith('-'))throw new Error('Usage: release-verified-apk <full-sha> <branch> [--install] [--serial=device-id]');
 if(flags.some(f=>f!=='--install'&&!/^--serial=[A-Za-z0-9_.:-]+$/.test(f)))throw new Error('Unknown release argument');
 const serials=flags.filter(f=>f.startsWith('--serial='));
 if(serials.length>1||flags.filter(f=>f==='--install').length>1||serials.length&&!flags.includes('--install'))throw new Error('Invalid install options');
 return {sha,branch,installRequested:flags.includes('--install'),serial:serials[0]?.slice(9)};
}
function release(argv,deps={}){
 const options=parse(argv);
 const sourceCheck=deps.check||check, artifactCheck=deps.verify||verify, deviceInstall=deps.install||install;
 const spawn=deps.spawn||cp.spawnSync;
 const identity=sourceCheck(options.sha,options.branch);
 const script=path.join(__dirname,'official-apk.cjs');
 const result=spawn(process.execPath,[script,'--sha',identity.sha],{cwd:path.resolve(__dirname,'..'),encoding:'utf8',stdio:'pipe',maxBuffer:16*1024*1024,shell:false});
 if(result.stdout)process.stdout.write(result.stdout);
 if(result.stderr)process.stderr.write(result.stderr);
 if(result.error)throw result.error;
 if(result.status!==0)throw new Error('Official build failed; no install attempted');
 const matches=[...(result.stdout||'').matchAll(/^Verified APK: (.+\.apk)\r?$/gm)];
 if(matches.length!==1)throw new Error('Expected exactly one verified APK path from this build');
 const apk=matches[0][1];
 const proof=artifactCheck(apk,identity.sha);
 if(options.installRequested)deviceInstall([apk,identity.sha,...(options.serial?[options.serial]:[])]);
 console.log('RELEASE VERIFIED: '+JSON.stringify({apk,sha:proof.sha,runId:proof.runId,installed:options.installRequested}));
 return {apk,proof,installed:options.installRequested};
}
if(require.main===module){try{release(process.argv.slice(2));}catch(e){console.error('RELEASE BLOCKED: '+e.message);process.exitCode=1;}}
module.exports={parse,release};
