const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.SYSTEM_PROJECT_ROOT ?? path.resolve(__dirname, '../../..');
const ts = require(require.resolve('typescript', { paths: [root, process.cwd()] }));

function loader() {
  const cache = new Map();
  function load(file) {
    const resolved = [file, file + '.ts', path.join(file, 'index.ts')]
      .find(p => fs.existsSync(p) && fs.statSync(p).isFile());
    if (!resolved) throw new Error('Missing module: ' + file);
    if (cache.has(resolved)) return cache.get(resolved).exports;
    const module = { exports: {} };
    cache.set(resolved, module);
    const source = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const requireMock = name => {
      if (name.startsWith('.')) return load(path.resolve(path.dirname(resolved), name));
      if (name === '@react-native-async-storage/async-storage') return { default: {} };
      if (name === 'expo-secure-store') return {};
      if (name === 'react-native') return { Platform: { OS: 'web' } };
      throw new Error('Unexpected dependency: ' + name);
    };
    vm.runInNewContext(source, {
      module, exports: module.exports, require: requireMock, console, Date, Set, Math, JSON, Intl,
      AbortController, Headers, fetch,
    }, { filename: resolved });
    return module.exports;
  }
  return relative => load(path.join(root, 'src/system2', relative));
}

function validResponse() {
  return {
    quests: [{
      key: 'focus-1', title: 'Focus Sprint', description: 'Pracuj nad jednym ważnym zadaniem.',
      category: 'productivity', difficulty: 'easy', verification: 'timer', estimatedMinutes: 20,
      templateHint: 'focus_priority', target: { kind: 'minutes', value: 20 },
      reason: 'Pasuje do aktywnego celu.', expiresInHours: 18, tags: ['focus','daily'],
    }],
    director: { mode: 'normal', difficultyBias: 0, headline: 'DAILY DIRECTIVE', message: 'SYSTEM przygotował misję.' },
    briefing: 'Krótki briefing.', source: 'ai', model: 'test-model',
  };
}

test('AI response validation accepts a bounded canonical proposal', () => {
  const { validateAIGameMasterResponse } = loader()('ai/validate');
  const result = validateAIGameMasterResponse(validResponse(), []);
  assert.equal(result?.source, 'ai');
  assert.equal(result?.quests[0].target.kind, 'minutes');
});

test('AI response validation rejects missing reason and malformed tags', () => {
  const { validateAIGameMasterResponse } = loader()('ai/validate');
  const missingReason = validResponse(); delete missingReason.quests[0].reason;
  assert.equal(validateAIGameMasterResponse(missingReason, []), null);
  const badTags = validResponse(); badTags.quests[0].tags = [42];
  assert.equal(validateAIGameMasterResponse(badTags, []), null);
});

test('AI response validation rejects verification-target mismatch', () => {
  const { validateAIGameMasterResponse } = loader()('ai/validate');
  const value = validResponse(); value.quests[0].verification = 'gps'; value.quests[0].target = { kind: 'minutes', value: 20 };
  assert.equal(validateAIGameMasterResponse(value, []), null);
});

test('AI response validation rejects unsafe and repeated proposals', () => {
  const { validateAIGameMasterResponse } = loader()('ai/validate');
  const unsafe = validResponse(); unsafe.quests[0].description = 'Nie śpij całą noc i wykonuj zadanie.';
  assert.equal(validateAIGameMasterResponse(unsafe, []), null);
  const repeated = validResponse();
  assert.equal(validateAIGameMasterResponse(repeated, ['Focus Sprint Pracuj nad jednym ważnym zadaniem.']), null);
});

test('AI response validation enforces locally adapted difficulty bounds', () => {
  const { validateAIGameMasterResponse } = loader()('ai/validate');
  const hard = validResponse(); hard.quests[0].difficulty = 'hard';
  assert.equal(validateAIGameMasterResponse(hard, [], ['easy', 'medium']), null);
  assert.equal(validateAIGameMasterResponse(validResponse(), [], ['easy', 'medium'])?.quests[0].difficulty, 'easy');
});

test('difficulty adapts conservatively after recent quest failures', () => {
  const { difficultyBias, allowedDifficulties } = loader()('ai/difficulty');
  const context = { player: { completionRate7d: 0.95, streak: 8, systemDebt: 0 }, recentQuests: [
    { failed: true }, { failed: false }, { failed: true }, { failed: false }, { failed: true },
  ] };
  assert.equal(difficultyBias(context), -1);
  assert.deepEqual(Array.from(allowedDifficulties(-1)), ['easy', 'medium']);
});

test('difficulty only considers the four most recent quest outcomes', () => {
  const { difficultyBias } = loader()('ai/difficulty');
  const context = { player: { completionRate7d: 0.9, streak: 6, systemDebt: 0 }, recentQuests: [
    { failed: false }, { failed: false }, { failed: false }, { failed: false }, { failed: true }, { failed: true },
  ] };
  assert.equal(difficultyBias(context), 1);
});

test('AI context prioritizes active goals and preserves planning metadata', () => {
  const { buildAIGameMasterContext } = loader()('ai/runtime');
  const snapshot = {
    player: { realLevel: 4, rank: 'E', streak: 2 }, systemDebt: 0, recentActivity: [],
    goals: [
      { id: 'low', title: 'Czytaj', description: 'Czytaj regularnie', target: '12 książek', targetDate: '2026-12-31', priority: 1, status: 'ACTIVE' },
      { id: 'done', title: 'Stary cel', description: 'Nie planuj go', target: '1', targetDate: '2026-01-01', priority: 3, status: 'COMPLETED' },
      { id: 'high', title: 'Niemiecki', description: 'Codzienna nauka', target: 'B1', targetDate: '2027-03-01', priority: 3, status: 'ACTIVE' },
    ],
  };
  const context = buildAIGameMasterContext(snapshot);
  assert.deepEqual(Array.from(context.goals, goal => goal.id), ['high', 'low']);
  assert.match(context.goals[0].description, /Docelowy rezultat: B1/);
  assert.match(context.goals[0].description, /Termin: 2027-03-01/);
  assert.match(context.goals[0].description, /Priorytet: 3\/3/);
});

test('SYSTEM debt is bounded and recovery clears it', () => {
  const { consequenceForFailedDaily, consequenceForRecoverySuccess } = loader()('ai/consequences');
  assert.equal(consequenceForFailedDaily(0, 1).systemDebt, 1);
  assert.equal(consequenceForFailedDaily(2, 8).systemDebt, 3);
  assert.equal(consequenceForRecoverySuccess().systemDebt, 0);
});

test('legacy campaign preview never carries authoritative XP', () => {
  const { buildStarterCampaign } = loader()('gameMaster/planner');
  const { validateCampaign } = loader()('gameMaster/guardrails');
  const { campaignToGeneratedQuests } = loader()('gameMaster/questBridge');
  const campaign = buildStarterCampaign('nauczyć się niemieckiego');
  assert.equal(validateCampaign(campaign).ok, true);
  assert.equal(Object.hasOwn(campaign.daily[0], 'xp'), false);
  const generated = campaignToGeneratedQuests(campaign);
  assert.equal(Object.hasOwn(generated[0], 'xp'), false);
  assert.equal(generated[0].source, 'GAME_MASTER_PREVIEW');
});
