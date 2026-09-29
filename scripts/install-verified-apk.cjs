// Install only an explicitly selected, provenance-verified APK.
// Usage: node scripts/install-verified-apk.cjs <absolute-or-relative-apk-path> <40-char-commit-sha> [adb-serial]
// No folder scanning, latest-file heuristics, or fallback to cached APKs.
const cp = require('node:child_process');
const { verify } = require('./verify-official-artifact.cjs');
function plan(args, inspect = verify) {
  const [apk, sha, serial] = args;
  if (!apk || !/^[a-f0-9]{40}$/i.test(sha || '')) throw new Error('Usage: install-verified-apk <apk> <40-char-source-sha> [adb-serial]');
  if (serial !== undefined && (!serial || /^-/.test(serial))) throw new Error('Invalid adb serial');
  const provenance = inspect(apk, sha);
  const command = process.platform === 'win32' ? 'adb.exe' : 'adb';
  return { command, args: [...(serial ? ['-s', serial] : []), 'install', '-r', apk], provenance };
}
function install(args, spawn = cp.spawnSync, inspect = verify) {
  const job = plan(args, inspect);
  console.log('Installing verified source ' + job.provenance.sha + ' (build ' + job.provenance.runId + ')');
  const result = spawn(job.command, job.args, {stdio:'inherit', shell:false});
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('ADB installation failed (' + result.status + ')');
  return job.provenance;
}
if (require.main === module) {
  try { install(process.argv.slice(2)); }
  catch (error) { console.error('INSTALL BLOCKED: ' + error.message); process.exitCode = 1; }
}
module.exports = { plan, install };
