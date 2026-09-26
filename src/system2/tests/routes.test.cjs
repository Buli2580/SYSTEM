const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const routes = {index:'SystemHomeScreen',character:'CharacterScreen',explore:'WorldScreen',guardian:'FamilySchoolScreen',more:'SettingsScreen',move:'MoveScreen',quests:'QuestsScreen',social:'SocialScreen',story:'StoryScreen','system-log':'SystemLogScreen',world:'WorldScreen'};
for (const [route, screen] of Object.entries(routes)) {
  test('SYSTEM route /' + route + ' resolves to ' + screen, () => {
    const file = path.join(root, 'src/app', route + '.tsx');
    const source = fs.readFileSync(file, 'utf8');
    const target = '../system2/screens/' + screen;
    assert.ok(source.includes("'" + target + "'"), 'Route does not import or export ' + target);
    assert.ok(fs.existsSync(path.resolve(path.dirname(file), target + '.tsx')), 'Missing target screen: ' + target);
    assert.ok(!source.includes('docs.expo.dev'), 'Expo starter content leaked into SYSTEM route');
  });
}
test('quest route handles unknown quest IDs', () => {
  const source = fs.readFileSync(path.join(root, 'src/app/quest.tsx'), 'utf8');
  assert.match(source, /getQuest\(/);
  assert.match(source, /if \(!quest\)/);
  assert.match(source, /<QuestRunScreen\b/);
});
test('root layout mounts SYSTEM provider, boundary and session gate', () => {
  const source = fs.readFileSync(path.join(root, 'src/app/_layout.tsx'), 'utf8');
  for (const name of ['SystemBoundary', 'SystemProvider', 'SessionGate', 'Stack']) assert.ok(source.includes('<' + name), name + ' missing');
});
