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
      throw new Error('Unexpected dependency: ' + name);
    };
    vm.runInNewContext(source, {
      module, exports: module.exports, require: requireMock, console, Date, Set, Math, JSON,
    }, { filename: resolved });
    return module.exports;
  }
  return relative => load(path.join(root, 'src/system2', relative));
}

function validResponse() {
  return {
    quests: [{
      key: 'focus-1',
      title: 'Focus Sprint',
      description: 'Pracuj nad jednym ważnym zadaniem.',
      category: 'productivity',
      difficulty: 'easy',
      verification: 'timer',
      estimatedMinutes: 20,
      templateHint: 'focus_priority',
      target: { kind: 'minutes', value: 20 },
      reason: 'Pasuje do aktywnego celu.',
      expiresInHours: 18,
      tags: ['focus','daily'],
    }],
    director: {
      mode: 'normal',
      difficultyBias: 0,
      headline: 'DAILY DIRECTIVE',
      message: 'SYSTEM przygotował misję.',
    },
    briefing: 'Krótki briefing.',
    source: 'ai',
    model: 'test-model',
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
  const missingReason = validResponse();
  delete missingReason.quests[0].reason;
  assert.equal(validateAIGameMasterResponse(missingReason, []), null);

  const badTags = validResponse();
  badTags.quests[0].tags = [42];
  assert.equal(validateAIGameMasterResponse(badTags, []), null);
});

test('AI response validation rejects verification-target mismatch', () => {
  const { validateAIGameMasterResponse } = loader()('ai/validate');
  const value = validResponse();
  value.quests[0].verification = 'gps';
  value.quests[0].target = { kind: 'minutes', value: 20 };
  assert.equal(validateAIGameMasterResponse(value, []), null);
});

test('AI response validation rejects unsafe and repeated proposals', () => {
  const { validateAIGameMasterResponse } = loader()('ai/validate');
  const unsafe = validResponse();
  unsafe.quests[0].description = 'Nie śpij całą noc i wykonuj zadanie.';
  assert.equal(validateAIGameMasterResponse(unsafe, []), null);

  const repeated = validResponse();
  assert.equal(
    validateAIGameMasterResponse(repeated, ['Focus Sprint Pracuj nad jednym ważnym zadaniem.']),
    null,
  );
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


test('AI context minimizes personal data and local identifiers', () => {
  const load = loader();
  const { createNewPlayer } = load('core');
  const { buildAIGameMasterContext } = load('ai/context');
  const player = createNewPlayer('SECRET PLAYER NAME');
  player.birthDate = '1990-01-02';
  player.avatarUri = 'file://private-avatar.jpg';
  player.realXp = 777;
  player.gameEnergy = 555;
  const snapshot = {
    player,
    systemDebt: 1,
    goals: [{
      id: 'local-db-id-987',
      category: 'LEARNING',
      title: 'Niemiecki B2',
      description: 'Ćwiczyć codziennie',
      priority: 2,
      createdAt: '2026-09-20T00:00:00.000Z',
      status: 'ACTIVE',
    }],
    recentActivity: [],
  };
  const context = buildAIGameMasterContext(snapshot);
  const serialized = JSON.stringify(context);
  assert.equal(context.goals[0].id, 'goal-1');
  assert.equal(context.player.systemDebt, 1);
  assert.ok(!serialized.includes('SECRET PLAYER NAME'));
  assert.ok(!serialized.includes('1990-01-02'));
  assert.ok(!serialized.includes('private-avatar'));
  assert.ok(!serialized.includes('local-db-id-987'));
  assert.ok(!serialized.includes('realXp'));
  assert.ok(!serialized.includes('gameEnergy'));
});
