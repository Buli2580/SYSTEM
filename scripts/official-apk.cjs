// One entry point for local and GitHub builds. No APK is taken from a shared folder.
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const os=require('node:os');
const {source,verifyConfig,publish}=require('./apk-provenance.cjs');
const root=path.resolve(__dirname,'..');
function run(command,args,cwd,env,capture=false) {
 const result=cp.spawnSync(command,args,{cwd,env,encoding:'utf8',stdio:capture?'pipe':'inherit',shell:process.platform==='win32'&&/\.(cmd|bat)$/.test(command)});
 if(result.error)throw result.error;
 if(result.status!==0)throw new Error(command+' failed ('+result.status+')');
 return result.stdout;
}
function main(){
 const expected=process.argv[process.argv.indexOf('--sha')+1];
 const identity=source(root,process.argv.includes('--sha')?expected:undefined);
 // Fail before downloading/building if update-compatible signing is unavailable.
 for(const name of ['SYSTEM_ANDROID_KEYSTORE','SYSTEM_ANDROID_KEY_ALIAS','SYSTEM_ANDROID_STORE_PASSWORD','SYSTEM_ANDROID_KEY_PASSWORD','SYSTEM_ANDROID_CERT_SHA256']) if(!process.env[name])throw new Error('Missing '+name+'; use the existing application signing identity, never a replacement key');
 const key=path.resolve(process.env.SYSTEM_ANDROID_KEYSTORE);
 if(!fs.existsSync(key))throw new Error('Signing keystore not found');
 const cert=process.env.SYSTEM_ANDROID_CERT_SHA256.replaceAll(':','').toLowerCase();
 if(!/^[a-f0-9]{64}$/.test(cert))throw new Error('Expected signing certificate SHA256 is required');
 const sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT;
 if(!sdk||!fs.existsSync(path.join(sdk,'build-tools')))throw new Error('Android SDK build tools missing');
 const tools=fs.readdirSync(path.join(sdk,'build-tools')).filter(v=>/^\d+\.\d+\.\d+$/.test(v)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).at(-1);
 if(!tools)throw new Error('No stable Android build tools');
 const runId=crypto.randomUUID(),builtAt=new Date().toISOString();
 // Keep native Windows build paths short while retaining the existing source checks.
 const work=process.platform==='win32'?path.join('E:\\','SB',runId):path.join(root,'.cache','official-apk',identity.sha+'-'+runId);
 const checkout=path.join(work,'source');fs.mkdirSync(checkout,{recursive:true});
 const archive=path.join(work,'source.tar');
 run('git',['archive','--format=tar','--output',archive,identity.sha],root,process.env);
 run('tar',['-xf',archive,'-C',checkout],root,process.env);
 const config=JSON.parse(fs.readFileSync(path.join(checkout,'app.json'),'utf8')).expo;
 const metadata={...identity,builtAt,version:config.version,versionCode:Math.max(config.android.versionCode+1,Math.floor(Date.now()/1000)-1577836800),runId};
 const manifest=path.join(work,'build.json');fs.writeFileSync(manifest,JSON.stringify(metadata));
 // Keep Windows Gradle transforms off an inherited external-drive cache. This is
 // scoped to this build; SYSTEM_ANDROID_GRADLE_HOME permits an explicit location.
 const gradleHome=process.env.SYSTEM_ANDROID_GRADLE_HOME?path.resolve(process.env.SYSTEM_ANDROID_GRADLE_HOME):(process.platform==='win32'?path.join(os.homedir(),'.gradle'):process.env.GRADLE_USER_HOME);
 const env={...process.env,...(gradleHome?{GRADLE_USER_HOME:gradleHome}:{}),SYSTEM_BUILD_MANIFEST:manifest,SYSTEM_EXPECTED_SHA:identity.sha,SYSTEM_ANDROID_KEYSTORE:key,CI:'1',EXPO_NO_TELEMETRY:'1'};
 console.log('Gradle cache: '+(env.GRADLE_USER_HOME||'Gradle default'));
 run(process.platform==='win32'?'npm.cmd':'npm',['ci','--no-audit','--no-fund'],checkout,env);
 run(process.execPath,[path.join(checkout,'node_modules/expo/bin/cli'),'prebuild','--platform','android','--no-install'],checkout,env);
 const appDir=path.join(checkout,'android','app');
 fs.writeFileSync(path.join(appDir,'system-signing.gradle'),`android {
 signingConfigs { systemOfficial {
  storeFile file(System.getenv('SYSTEM_ANDROID_KEYSTORE'))
  storePassword System.getenv('SYSTEM_ANDROID_STORE_PASSWORD')
  keyAlias System.getenv('SYSTEM_ANDROID_KEY_ALIAS')
  keyPassword System.getenv('SYSTEM_ANDROID_KEY_PASSWORD')
 } }
 buildTypes { release { signingConfig signingConfigs.systemOfficial } }
}\n`);
 fs.appendFileSync(path.join(appDir,'build.gradle'),"\napply from: 'system-signing.gradle'\n");
 run(process.platform==='win32'?'gradlew.bat':'./gradlew',[':app:assembleRelease','-PreactNativeArchitectures=arm64-v8a','--no-daemon','--console=plain'],path.join(checkout,'android'),env);
 const apk=path.join(appDir,'build','outputs','apk','release','app-release.apk');
 if(!fs.existsSync(apk))throw new Error('This build did not produce the expected release APK');
 const inspection=path.join(work,'inspection');fs.mkdirSync(inspection);
 run('jar',['xf',apk,'assets/app.config','assets/index.android.bundle'],inspection,env);
 const embedded=JSON.parse(fs.readFileSync(path.join(inspection,'assets','app.config'),'utf8'));
 verifyConfig(embedded,metadata);
 if(fs.statSync(path.join(inspection,'assets','index.android.bundle')).size===0)throw new Error('Release APK has no embedded application bundle');
 const toolDir=path.join(sdk,'build-tools',tools);
 const badging=run(path.join(toolDir,process.platform==='win32'?'aapt.exe':'aapt'),['dump','badging',apk],root,env,true);
 if(!badging.includes("name='pl.systemworld.app'")||!badging.includes("versionCode='"+metadata.versionCode+"'")||!badging.includes("versionName='"+metadata.version+"'"))throw new Error('Native APK identity/version mismatch');
 const signature=run(path.join(toolDir,process.platform==='win32'?'apksigner.bat':'apksigner'),['verify','--print-certs',apk],root,env,true);
 const actual=signature.match(/Signer #1 certificate SHA-256 digest:\s*([a-fA-F0-9]+)/)?.[1]?.toLowerCase();
 if(actual!==cert)throw new Error('APK signing certificate is not the existing application certificate');
 source(root,identity.sha); // Reject checkout changes during the build as well.
 const output=path.join(root,'dist','official',identity.sha+'-'+runId);fs.mkdirSync(output,{recursive:true});
 const name='SYSTEM-'+metadata.version+'-'+identity.sha.slice(0,12)+'-'+runId+'.apk';
 const destination=path.join(output,name);publish(apk,destination);
 const sha256=crypto.createHash('sha256').update(fs.readFileSync(destination)).digest('hex');
 fs.writeFileSync(destination+'.json',JSON.stringify({...metadata,sha256,signingCertificateSHA256:actual},null,2),{flag:'wx'});
 fs.writeFileSync(destination+'.sha256',sha256+'  '+name+'\n',{flag:'wx'});
 console.log('Verified APK: '+destination);
}
try{main();}catch(error){console.error('APK BUILD BLOCKED: '+error.message);process.exitCode=1;}
