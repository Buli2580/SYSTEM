// Validate a freshly produced official APK against its sidecar, without trusting filenames alone.
// Usage: node scripts/verify-official-artifact.cjs <path-to-apk> [expected-commit-sha]
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
function verify(apk, expectedSha, io = fs) {
  if (!apk || !/\.apk$/i.test(apk)) throw new Error('Provide an APK path');
  const file = path.resolve(apk);
  const sidecar = file + '.json';
  if (!io.existsSync(file) || !io.existsSync(sidecar)) throw new Error('APK or provenance sidecar missing; reject stale/unverified artifact');
  const info = JSON.parse(io.readFileSync(sidecar, 'utf8'));
  if (!/^[0-9a-f]{40}$/i.test(info.sha || '')) throw new Error('Invalid source SHA in provenance');
  if (expectedSha && info.sha.toLowerCase() !== expectedSha.toLowerCase()) throw new Error('APK source SHA does not match requested commit');
  if (!/^[0-9a-f]{64}$/i.test(info.sha256 || '')) throw new Error('Invalid APK checksum in provenance');
  const digest = crypto.createHash('sha256').update(io.readFileSync(file)).digest('hex');
  if (digest !== info.sha256.toLowerCase()) throw new Error('APK checksum mismatch: artifact replaced or corrupted');
  if (!info.runId || !info.builtAt || !info.signingCertificateSHA256) throw new Error('Incomplete official build provenance');
  return { sha: info.sha, sha256: digest, version: info.version, runId: info.runId, builtAt: info.builtAt };
}
if (require.main === module) {
  try {
    const result = verify(process.argv[2], process.argv[3]);
    console.log('VERIFIED OFFICIAL APK: ' + JSON.stringify(result));
  } catch (error) {
    console.error('APK REJECTED: ' + error.message);
    process.exitCode = 1;
  }
}
module.exports = { verify };
