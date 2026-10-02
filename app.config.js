const fs = require('node:fs');
const RC1_BRANCH = 'integration/game-loop-home-gm-4';
const RC1_SHA = 'bac48bda2dfc6cef993bc11ad7b245802fe94178';
const OFFICIAL_BRANCH = 'integration/system-evening-build';
const RC2_BRANCH = 'fix/rc2-build-readiness';
module.exports = ({config}) => {
  if (process.env.EAS_BUILD || process.env.EAS_BUILD_PROFILE) throw new Error('Use the official-apk workflow / scripts/official-apk.cjs; direct EAS builds are retired.');
  const manifest = process.env.SYSTEM_BUILD_MANIFEST;
  const metadata = manifest ? JSON.parse(fs.readFileSync(manifest,'utf8')) : undefined;
  if (metadata) {
    const shaValid = /^[a-f0-9]{40}$/.test(metadata.sha) && metadata.sha === process.env.SYSTEM_EXPECTED_SHA;
    const branchValid = metadata.branch === OFFICIAL_BRANCH || (metadata.branch === RC1_BRANCH && metadata.sha === RC1_SHA) || metadata.branch === RC2_BRANCH;
    if (!shaValid || !branchValid) throw new Error('Invalid official build provenance');
  }
  return {...config,updates:{enabled:false},android:{...config.android,...(metadata?{versionCode:metadata.versionCode}:{})},extra:{...config.extra,...(metadata?{buildProvenance:metadata}:{})}};
};
