const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '../../..');
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const eas = JSON.parse(fs.readFileSync(path.join(root, 'eas.json'), 'utf8'));
const settings = fs.readFileSync(path.join(root, 'src/system2/screens/SettingsScreen.tsx'), 'utf8');
const panel = fs.readFileSync(path.join(root, 'src/system2/updates/SystemUpdatePanel.tsx'), 'utf8');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/publish-preview-ota.yml'), 'utf8');

assert.ok(pkg.dependencies['expo-updates'], 'expo-updates dependency missing');
assert.deepEqual(app.expo.runtimeVersion, { policy: 'appVersion' });
assert.equal(app.expo.updates.url, 'https://u.expo.dev/385bb189-f33b-4603-b0d3-c57b17035e2a');
assert.equal(app.expo.updates.requestHeaders['expo-channel-name'], 'preview');
assert.equal(app.expo.updates.checkAutomatically, 'ON_LOAD');
assert.equal(app.expo.updates.fallbackToCacheTimeout, 0);
assert.equal(eas.build['device-test'].channel, 'preview');
assert.equal(eas.build['play-internal'].channel, 'production');
assert.match(panel, /Updates\.checkForUpdateAsync\(\)/);
assert.match(panel, /Updates\.fetchUpdateAsync\(\)/);
assert.match(panel, /Updates\.reloadAsync\(\)/);
assert.match(settings, /<SystemUpdatePanel\s*\/>/);
assert.match(workflow, /EXPO_TOKEN/);
assert.match(workflow, /--channel preview/);

console.log('OTA update contract: PASS');
