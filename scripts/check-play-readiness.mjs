import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(readFileSync(resolve(root, 'app.json'), 'utf8')).expo;
const errors = [];
const warnings = [];
if (!config?.name || !config?.slug || !config?.version) errors.push('Expo name, slug and version are required');
if (!config?.android?.package) errors.push('Android package identifier is missing');
else if (!/^[a-z][a-z0-9_]*(?:\\.[a-z][a-z0-9_]*)+$/.test(config.android.package)) errors.push('Invalid Android package identifier');
else if (config.android.package.startsWith('com.anonymous.')) warnings.push('Placeholder Android package: choose a permanent identifier before Google Play release');
for (const key of ['icon', 'android.adaptiveIcon.foregroundImage']) {
  const file = key === 'icon' ? config.icon : config.android?.adaptiveIcon?.foregroundImage;
  if (!file || !existsSync(resolve(root, file))) errors.push('Missing image asset for ' + key + ': ' + file);
}
if (!existsSync(resolve(root, 'eas.json'))) warnings.push('No eas.json: Android build profiles are not configured in this branch');
for (const warning of warnings) console.warn('RELEASE WARNING: ' + warning);
for (const error of errors) console.error('CONFIG ERROR: ' + error);
if (errors.length) process.exitCode = 1;
else console.log('Android configuration check passed; release readiness is not certified.');
