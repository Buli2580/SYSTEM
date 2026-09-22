const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.SYSTEM_PROJECT_ROOT ?? path.resolve(__dirname, '../../..');
const ts = require(require.resolve('typescript', { paths: [root, process.cwd()] }));

function load(relative) {
  const file = path.join(root, 'src/system2', relative + '.ts');
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, { module, exports: module.exports, require, console, Date, Set, Math, JSON });
  return module.exports;
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

test('mandatory first-goal gate only blocks the intended first-run state', () => {
  const { firstGoalGatePending } = load('beta/experience');
  assert.equal(firstGoalGatePending({ready:false,onboardingComplete:false,awakeningCompleted:false,goalCount:0}),false);
  assert.equal(firstGoalGatePending({ready:true,onboardingComplete:false,awakeningCompleted:false,goalCount:0}),false);
  assert.equal(firstGoalGatePending({ready:true,onboardingComplete:true,awakeningCompleted:false,goalCount:0}),true);
  assert.equal(firstGoalGatePending({ready:true,onboardingComplete:true,awakeningCompleted:false,goalCount:1}),false);
  assert.equal(firstGoalGatePending({ready:true,onboardingComplete:true,awakeningCompleted:true,goalCount:0}),false);
});

test('every literal expo-router destination points to a real app route', () => {
  const appDir = path.join(root, 'src/app');
  const routeFiles = walk(appDir).filter(file => file.endsWith('.tsx'));
  const routes = new Set(routeFiles.map(file => {
    const relative = path.relative(appDir, file).replace(/\\/g, '/').replace(/\.tsx$/, '');
    return relative === 'index' ? '/' : '/' + relative;
  }));

  const sources = [
    ...walk(path.join(root, 'src/system2/screens')),
    ...walk(path.join(root, 'src/system2/components')),
  ].filter(file => /\.(ts|tsx)$/.test(file));

  const missing = [];
  for (const file of sources) {
    const source = fs.readFileSync(file, 'utf8');
    const specs = [];
    for (const match of source.matchAll(/router\.(?:push|replace)\(\s*['"]([^'"]+)['"]/g)) specs.push(match[1]);
    for (const match of source.matchAll(/pathname\s*:\s*['"]([^'"]+)['"]/g)) specs.push(match[1]);
    for (const route of specs) {
      if (!route.startsWith('/')) continue;
      const clean = route.split('?')[0];
      if (!routes.has(clean)) missing.push(path.relative(root, file) + ' -> ' + clean);
    }
  }
  assert.deepEqual(missing, []);
});

test('critical completion and cloud screens do not depend on router.back recovery', () => {
  const files = [
    'src/system2/screens/QuestRunScreen.tsx',
    'src/app/quest.tsx',
    'src/system2/screens/AccountScreen.tsx',
    'src/system2/screens/PrivacyScreen.tsx',
  ];
  for (const relative of files) {
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    assert.doesNotMatch(source, /router\.back\(\)/, relative);
  }
});


test('Next Action never exposes an uncleareable manual achievement claim', () => {
  const source = fs.readFileSync(path.join(root, 'src/system2/quests/nextAction.ts'), 'utf8');
  assert.doesNotMatch(source, /CLAIM ACHIEVEMENTS/);
  assert.match(source, /Achievements unlock automatically/);
});


test('superseded provider refresh always releases the in-flight promise', () => {
  const source = fs.readFileSync(path.join(root, 'src/system2/state/SystemProvider.tsx'), 'utf8');
  assert.match(source, /if \(refreshRef\.current === operation\) refreshRef\.current = null/);
  assert.doesNotMatch(source, /if \(epoch === generation\.current\) refreshRef\.current = null/);
});


test('Next Action guards against /quest directives without a quest id', () => {
  const source = fs.readFileSync(path.join(root, 'src/system2/quests/nextAction.ts'), 'utf8');
  assert.match(source, /directive\.route === '\/quest' && !directive\.questId/);
  assert.match(source, /REFRESH QUEST PROTOCOL/);
});


test('Daily ignores corrupt non-authoritative attempt payloads', () => {
  const { attemptWasSuspicious } = load('daily/attempt');
  assert.equal(attemptWasSuspicious('{"activity":{"verdict":"SUSPICIOUS"}}'), true);
  assert.equal(attemptWasSuspicious('{"activity":{"verdict":"VERIFIED"}}'), false);
  assert.equal(attemptWasSuspicious('{broken'), false);
});

test('background task stops locked or completed quests after rollover', () => {
  const source = fs.readFileSync(path.join(root, 'src/system2/background/locationTask.ts'), 'utf8');
  assert.match(source, /getQuestAccess\(session\.questId\)/);
  assert.match(source, /access === 'LOCKED' \|\| access === 'COMPLETED'/);
  assert.match(source, /stopOrphanedLocationTask\(\)/);
});


test('provider clears stale background sessions before exposing an active quest', () => {
  const source = fs.readFileSync(path.join(root, 'src/system2/state/SystemProvider.tsx'), 'utf8');
  assert.match(source, /getQuestAccess\(backgroundQuest\.questId\)/);
  assert.match(source, /access === 'LOCKED' \|\| access === 'COMPLETED'/);
  assert.match(source, /stopQuestBackgroundTracking\(backgroundQuest\.questId\)/);
});
