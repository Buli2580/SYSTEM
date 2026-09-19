const fs=require('node:fs'); const assert=require('node:assert/strict');
const catalog=fs.readFileSync(require.resolve('../achievements/catalog.ts'),'utf8');
const engine=fs.readFileSync(require.resolve('../achievements/engine.ts'),'utf8');
assert.match(catalog,/discipline_30/); assert.match(catalog,/distance_100k/);
assert.match(engine,/newlyUnlocked/); assert.match(engine,/verifiedQuestCount/);
console.log('achievement contract smoke: PASS');
