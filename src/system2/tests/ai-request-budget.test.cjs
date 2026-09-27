const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.SYSTEM_PROJECT_ROOT ?? path.resolve(__dirname, '../../..');
const ts = require(require.resolve('typescript', { paths: [root, process.cwd()] }));

function loadBudget() {
  const file = path.join(root, 'src/system2/ai/requestBudget.ts');
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, require, Date, Number, Math });
  return module.exports;
}

test('AI retry budget allows first request and blocks immediate manual retry', () => {
  const { aiRetryRemainingMs, AI_RETRY_COOLDOWN_MS } = loadBudget();
  assert.equal(aiRetryRemainingMs(0, 1000), 0);
  assert.equal(aiRetryRemainingMs(1000, 1000), AI_RETRY_COOLDOWN_MS);
  assert.equal(aiRetryRemainingMs(1000, 31_000), 30_000);
  assert.equal(aiRetryRemainingMs(1000, 61_000), 0);
});

test('AI retry budget handles future or invalid clocks conservatively', () => {
  const { aiRetryRemainingMs, AI_RETRY_COOLDOWN_MS } = loadBudget();
  assert.equal(aiRetryRemainingMs(10_000, 9_000), AI_RETRY_COOLDOWN_MS);
  assert.equal(aiRetryRemainingMs(Number.NaN, 9_000), 0);
});
