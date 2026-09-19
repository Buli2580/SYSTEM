const fs=require('node:fs'); const assert=require('node:assert/strict');
const catalog=fs.readFileSync(require.resolve('../achievements/catalog.ts'),'utf8');
const engine=fs.readFileSync(require.resolve('../achievements/engine.ts'),'utf8');
const reconcile=fs.readFileSync(require.resolve('../achievements/reconcile.ts'),'utf8');
assert.match(catalog,/streak_30/); assert.match(catalog,/walk_50km/); assert.match(catalog,/first_boss/);
assert.match(engine,/newlyUnlocked/); assert.match(engine,/totalDistanceMeters \/ 1000/); assert.match(engine,/requiredAchievements/);
assert.match(reconcile,/ACHIEVEMENT_UNLOCKED/); assert.match(reconcile,/TITLE_UNLOCKED/);
console.log('achievement contract smoke: PASS');
