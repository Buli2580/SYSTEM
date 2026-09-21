const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const test = require('node:test');
const assert = require('node:assert/strict');

const file = path.resolve(__dirname, '../heroes/catalog.ts');
const source = fs.readFileSync(file, 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;

const moduleBox = { exports: {} };
vm.runInNewContext(output, {
  module: moduleBox,
  exports: moduleBox.exports,
  require,
}, { filename: file });

const {
  HERO_CARDS,
  DEFAULT_HERO_ID,
  getUnlockedHeroIds,
  isHeroUnlocked,
} = moduleBox.exports;

function progress(patch = {}) {
  return {
    level: 1,
    streak: 0,
    verifiedQuestCount: 0,
    skillLevels: { STR: 1, VIT: 1, INT: 1, WIL: 1, CHA: 1, CRE: 1, RES: 1 },
    bossDefeated: false,
    worldLinkComplete: false,
    achievements: {},
    ...patch,
  };
}

test('Hero Cards catalog has unique ordered ids and one free starter', () => {
  assert.equal(HERO_CARDS.length, 9);
  assert.equal(new Set(HERO_CARDS.map(card => card.id)).size, HERO_CARDS.length);
  assert.equal(DEFAULT_HERO_ID, 'system_zero');
  assert.equal(Array.from(getUnlockedHeroIds(progress())).join(','), 'system_zero');
  assert.equal(Array.from(HERO_CARDS, card => card.order).join(','), '0,1,2,3,4,5,6,7,8');
});

test('Night Runner unlocks from either run achievement or verified quest count', () => {
  const card = HERO_CARDS.find(card => card.id === 'night_runner');
  assert.equal(isHeroUnlocked(card, progress()), false);
  assert.equal(isHeroUnlocked(card, progress({ achievements: { run_5km: 'UNLOCKED' } })), true);
  assert.equal(isHeroUnlocked(card, progress({ verifiedQuestCount: 10 })), true);
});

test('Iron Titan requires both player level and STR skill level', () => {
  const card = HERO_CARDS.find(card => card.id === 'iron_titan');
  assert.equal(isHeroUnlocked(card, progress({ level: 10, skillLevels: { STR: 4, VIT: 1, INT: 1, WIL: 1, CHA: 1, CRE: 1, RES: 1 } })), false);
  assert.equal(isHeroUnlocked(card, progress({ level: 10, skillLevels: { STR: 5, VIT: 1, INT: 1, WIL: 1, CHA: 1, CRE: 1, RES: 1 } })), true);
});

test('Pathfinder unlocks from World Link or Cartographer achievement', () => {
  const card = HERO_CARDS.find(card => card.id === 'pathfinder');
  assert.equal(isHeroUnlocked(card, progress({ worldLinkComplete: true })), true);
  assert.equal(isHeroUnlocked(card, progress({ achievements: { explorer_10: 'CLAIMED' } })), true);
});

test('Void Walker and Ash King require a real boss defeat', () => {
  const voidWalker = HERO_CARDS.find(card => card.id === 'void_walker');
  const ashKing = HERO_CARDS.find(card => card.id === 'ash_king');
  assert.equal(isHeroUnlocked(voidWalker, progress({ level: 50 })), false);
  assert.equal(isHeroUnlocked(voidWalker, progress({ level: 10, bossDefeated: true })), true);
  assert.equal(isHeroUnlocked(ashKing, progress({ streak: 30 })), false);
  assert.equal(isHeroUnlocked(ashKing, progress({ streak: 30, bossDefeated: true })), true);
});

test('System Ascendant remains a true Mythic long-term unlock', () => {
  const card = HERO_CARDS.find(card => card.id === 'system_ascendant');
  assert.equal(isHeroUnlocked(card, progress({ level: 50, streak: 60, verifiedQuestCount: 49 })), false);
  assert.equal(isHeroUnlocked(card, progress({ level: 50, streak: 60, verifiedQuestCount: 50 })), true);
});
