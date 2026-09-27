const fs = require('node:fs');
module.exports = ({config}) => {
  if (process.env.EAS_BUILD || process.env.EAS_BUILD_PROFILE) throw new Error('Use the official-apk workflow / scripts/official-apk.cjs; direct EAS builds are retired.');
  const manifest = process.env.SYSTEM_BUILD_MANIFEST;
  const metadata = manifest ? JSON.parse(fs.readFileSync(manifest,'utf8')) : undefined;
  if (metadata && (metadata.branch !== 'integration/system-evening-build' || metadata.sha !== process.env.SYSTEM_EXPECTED_SHA || !/^[a-f0-9]{40}$/.test(metadata.sha))) throw new Error('Invalid official build provenance');
  return {...config,updates:{enabled:false},android:{...config.android,...(metadata?{versionCode:metadata.versionCode}:{})},extra:{...config.extra,...(metadata?{buildProvenance:metadata}:{})}};
};
