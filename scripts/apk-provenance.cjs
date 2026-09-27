const fs = require('node:fs');
const cp = require('node:child_process');
const BRANCH = 'integration/system-evening-build';
const REPOSITORY = 'Buli2580/SYSTEM';

function validateSource({branch, sha, expectedSha, dirty, repository}) {
  if (branch !== BRANCH) throw new Error('Wrong APK branch: ' + branch);
  if (!/^[a-f0-9]{40}$/.test(expectedSha ?? '') || sha !== expectedSha) throw new Error('APK commit does not match the requested full SHA');
  if (dirty) throw new Error('APK requires a clean committed checkout');
  if (repository && repository !== REPOSITORY) throw new Error('Wrong GitHub repository');
}
function source(root, expectedSha, env = process.env) {
  const git = (...args) => cp.execFileSync('git', args, {cwd:root,encoding:'utf8'}).trim();
  const sha = git('rev-parse','HEAD');
  const branch = git('branch','--show-current') || (env.GITHUB_ACTIONS === 'true' ? env.GITHUB_REF_NAME : '');
  validateSource({branch,sha,expectedSha,dirty:git('status','--porcelain'),repository:env.GITHUB_REPOSITORY});
  if (env.GITHUB_ACTIONS === 'true' && (env.GITHUB_REF !== 'refs/heads/'+BRANCH || env.GITHUB_SHA !== sha)) throw new Error('GitHub event and checkout disagree');
  return {branch,sha};
}
function verifyConfig(config, metadata) {
  if (JSON.stringify(config.extra?.buildProvenance) !== JSON.stringify(metadata)) throw new Error('Embedded diagnostic metadata differs from source');
  if (config.android?.package !== 'pl.systemworld.app' || config.version !== metadata.version || config.android?.versionCode !== metadata.versionCode) throw new Error('APK application identity/version mismatch');
  if (config.updates?.enabled !== false) throw new Error('OTA must be disabled for the official APK');
}
function publish(apk, destination) { fs.copyFileSync(apk,destination,fs.constants.COPYFILE_EXCL); }
module.exports = {BRANCH,REPOSITORY,validateSource,source,verifyConfig,publish};
