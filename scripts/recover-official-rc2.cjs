const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const os = require('node:os');
const crypto = require('node:crypto');

const root = 'C:\\SYSTEM\\SYSTEM-RC2';
const work = 'C:\\system-apk\\b-4QhTJd';
const apk = path.join(work,'source','android','app','build','outputs','apk','release','app-release.apk');
const manifest = path.join(work,'build.json');
const archive = path.join(work,'source.tar');

const {validateSource,verifyConfig,publish} =
  require(path.join(root,'scripts','apk-provenance.cjs'));

function run(cmd,args,cwd=root) {
  const r = cp.spawnSync(cmd,args,{
    cwd,
    encoding:'utf8',
    stdio:'pipe',
    shell:process.platform==='win32' && /\.(cmd|bat)$/i.test(cmd)
  });
  if(r.error || r.status!==0)
    throw new Error(cmd+': '+(r.error?.message||r.stderr||r.stdout));
  return r.stdout||'';
}

function sha(file) {
  return crypto.createHash('sha256')
    .update(fs.readFileSync(file)).digest('hex');
}

function check(ok,message) {
  if(!ok) throw new Error(message);
  console.log('PASS: '+message);
}

let inspection;
let output;

try {
  check(fs.existsSync(apk),'Existing APK found');
  check(fs.existsSync(manifest),'Original manifest found');
  check(fs.existsSync(archive),'Original source archive found');

  const metadata = JSON.parse(fs.readFileSync(manifest,'utf8'));

  validateSource({
    branch:metadata.branch,
    sha:metadata.sha,
    expectedSha:'845475a8122421fcfcca38c7f5007e2a19401b1d',
    dirty:false
  });

  check(
    run('git',['rev-parse','HEAD']).trim()===metadata.sha,
    'Original Git commit'
  );

  check(
    run('git',['branch','--show-current']).trim()===metadata.branch,
    'Original Git branch'
  );

  // Independently reproduce the source archive from the recorded commit.
  inspection=fs.mkdtempSync(path.join(os.tmpdir(),'system-rc2-recovery-'));
  const comparison=path.join(inspection,'source-comparison.tar');

  run('git',[
    'archive','--format=tar',
    '--output',comparison,
    metadata.sha
  ]);

  check(
    sha(comparison)===sha(archive),
    'Original build source archive matches Git commit'
  );

  // Inspect files embedded in the APK.
  run('jar',[
    'xf',apk,
    'assets/app.config',
    'assets/index.android.bundle'
  ],inspection);

  const embedded=JSON.parse(
    fs.readFileSync(path.join(inspection,'assets','app.config'),'utf8')
  );

  verifyConfig(embedded,metadata);
  console.log('PASS: Embedded provenance, package, version and OTA');

  check(
    fs.statSync(
      path.join(inspection,'assets','index.android.bundle')
    ).size>0,
    'Embedded application bundle'
  );

  const sdk=process.env.ANDROID_HOME||
    process.env.ANDROID_SDK_ROOT||
    path.join(process.env.LOCALAPPDATA,'Android','Sdk');

  const versions=fs.readdirSync(path.join(sdk,'build-tools'))
    .filter(v=>/^\d+\.\d+\.\d+$/.test(v))
    .sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));

  check(versions.length>0,'Android Build Tools available');

  const tools=path.join(sdk,'build-tools',versions.at(-1));
  console.log('Using Build Tools: '+versions.at(-1));

  const badging=run(
    path.join(tools,'aapt.exe'),
    ['dump','badging',apk]
  );

  check(
    badging.includes("name='pl.systemworld.app'") &&
    badging.includes("versionCode='"+metadata.versionCode+"'") &&
    badging.includes("versionName='"+metadata.version+"'"),
    'Native APK package and version'
  );

  const signature=run(
    path.join(tools,'apksigner.bat'),
    ['verify','--print-certs',apk]
  );

  const matches=[...signature.matchAll(
    /(?:Signer #\d+|V[234](?:\.1)? Signer):? certificate SHA-256 digest:\s*([a-fA-F0-9]{64})/gi
  )];

  const actual=matches[0]?.[1]?.toLowerCase();

  const expected=
    '2A:55:45:BC:E5:D1:BE:B2:4C:7D:16:24:57:B3:02:46:08:D3:ED:32:2E:3B:E7:6C:E9:9A:04:A1:26:F4:F1:B3'
    .replaceAll(':','').toLowerCase();

  check(
    matches.length===1 && actual===expected,
    'APK cryptographic signature and original SYSTEM certificate'
  );

  // Publish only after every verification has passed.
  output=path.join(
    root,'dist','official',
    metadata.sha+'-'+metadata.runId
  );

  check(!fs.existsSync(output),'Official destination is unused');
  fs.mkdirSync(output,{recursive:true});

  const name='SYSTEM-'+metadata.version+'-'+
    metadata.sha.slice(0,12)+'-'+metadata.runId+'.apk';

  const destination=path.join(output,name);

  publish(apk,destination);

  const digest=sha(destination);

  check(digest===sha(apk),'Published APK SHA-256 integrity');

  fs.writeFileSync(
    destination+'.json',
    JSON.stringify({
      ...metadata,
      sha256:digest,
      signingCertificateSHA256:actual
    },null,2),
    {flag:'wx'}
  );

  fs.writeFileSync(
    destination+'.sha256',
    digest+'  '+name+'\n',
    {flag:'wx'}
  );

  console.log('\n================================');
  console.log('RC2 RECOVERY VERIFIED: PASS');
  console.log('APK: '+destination);
  console.log('SHA256: '+digest);
  console.log('================================');

} catch(e) {
  console.error('\nRC2 RECOVERY BLOCKED: '+e.message);
  if(output && fs.existsSync(output))
    fs.rmSync(output,{recursive:true,force:true});
  process.exitCode=1;
} finally {
  if(inspection && fs.existsSync(inspection))
    fs.rmSync(inspection,{recursive:true,force:true});
}