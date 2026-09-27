import fs from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const readText = file => fs.readFileSync(resolve(root, file), 'utf8');

const readJson = path => JSON.parse(readText(path));
const must = (condition, message) => {
  if (!condition) {
    console.error('PLAY READINESS FAIL:', message);
    process.exitCode = 1;
  }
};

const app = readJson('app.json').expo;
const android = app.android ?? {};
must(app.name && app.slug && app.version, 'Expo name, slug and version are required.');
for (const [key, file] of [['icon', app.icon], ['android.adaptiveIcon.foregroundImage', android.adaptiveIcon?.foregroundImage]]) {
  must(typeof file === 'string' && fs.existsSync(resolve(root, file)), `Missing image asset for ${key}: ${file}`);
}
const eas = readJson('eas.json');

must(typeof android.package === 'string' && /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(android.package),
  'android.package must be a lowercase reverse-domain identifier.');
must(!String(android.package).includes('anonymous'), 'android.package must not use the Expo anonymous placeholder.');
must(Number.isInteger(android.versionCode) && android.versionCode > 0, 'android.versionCode must be a positive integer.');
must(Array.isArray(android.permissions) && android.permissions.includes('android.permission.ACCESS_BACKGROUND_LOCATION'),
  'background location permission is required for the active quest feature.');
must(Array.isArray(android.permissions) && android.permissions.includes('android.permission.FOREGROUND_SERVICE_LOCATION'),
  'FOREGROUND_SERVICE_LOCATION permission is required for the active quest service.');
must(eas?.build?.['play-internal']?.android?.buildType === 'app-bundle',
  'EAS play-internal profile must build an Android App Bundle.');

const disclosure = readText('src/system2/background/disclosure.ts');
must(disclosure.includes('lokalizacji') && disclosure.includes('w tle'),
  'prominent disclosure must explicitly mention location and background use.');

const hook = readText('src/system2/quests/useQuestRun.ts');
must(hook.includes('confirmBackgroundLocationDisclosure'),
  'movement quest flow must show the prominent disclosure before permission.');

const privacy = readText('landing/privacy.html');
must(privacy.includes('Polityka prywatności SYSTEM') && privacy.includes('Lokalizacja'),
  'public privacy page must describe the SYSTEM app and location use.');
must(!privacy.includes('name="robots" content="noindex"'),
  'privacy policy must remain publicly indexable/reachable for Google Play review.');

if (!process.exitCode) console.log('Android configuration and static Play checks: PASS; release readiness is not certified.');
