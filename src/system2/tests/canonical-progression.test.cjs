// Runs against real SQLite and the project's existing TypeScript compiler.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.SYSTEM_PROJECT_ROOT ?? path.resolve(__dirname, '../../..');
const sourceRoot = path.join(root, 'src/system2');
const ts = require(require.resolve('typescript', { paths: [process.env.SYSTEM_TYPESCRIPT_ROOT ?? root] }));
function loader() {
  const cache = new Map();
  function load(file) {
    const resolved = [file, file + '.ts', path.join(file, 'index.ts')].find(candidate => {
      const patch = process.env.SYSTEM_PROGRESSION_PATCH_ROOT && path.join(process.env.SYSTEM_PROGRESSION_PATCH_ROOT, path.relative(root, candidate));
      return (patch && fs.existsSync(patch) && fs.statSync(patch).isFile()) || (fs.existsSync(candidate) && fs.statSync(candidate).isFile());
    });
    if (!resolved) throw new Error('Missing module: ' + file);
    if (cache.has(resolved)) return cache.get(resolved).exports;
    const patched = process.env.SYSTEM_PROGRESSION_PATCH_ROOT && path.join(process.env.SYSTEM_PROGRESSION_PATCH_ROOT, path.relative(root, resolved));
    const actual = patched && fs.existsSync(patched) ? patched : resolved;
    const module = { exports: {} }; cache.set(resolved, module);
    const source = ts.transpileModule(fs.readFileSync(actual, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(source, {
      module, exports: module.exports, Date, console,
      require(name) {
        if (name.startsWith('.')) return load(path.resolve(path.dirname(resolved), name));
        throw new Error('Unexpected dependency: ' + name);
      },
    }, { filename: actual });
    return module.exports;
  }
  return name => load(path.join(sourceRoot, name));
}
function setup(t) {
  const load = loader(), api = load('storage/progression');
  const sql = new DatabaseSync(':memory:'); t.after(() => sql.close());
  sql.exec(`CREATE TABLE app_state(key TEXT PRIMARY KEY,value TEXT NOT NULL);
    CREATE TABLE protocol_bonuses(bonus_key TEXT PRIMARY KEY,kind TEXT,period_key TEXT,created_at TEXT,streak INTEGER);
    CREATE TABLE verified_events(id TEXT PRIMARY KEY,quest_id TEXT,payload TEXT,created_at TEXT);
    ${api.PROGRESSION_SCHEMA_SQL}`);
  const tx = {
    async getFirstAsync(q, ...p) { return sql.prepare(q).get(...p) ?? null; },
    async getAllAsync(q, ...p) { return sql.prepare(q).all(...p); },
    async runAsync(q, ...p) { return sql.prepare(q).run(...p); },
  };
  let player = load('core/progression').createNewPlayer('Tester', { id: 'player_test', createdAt: '2026-09-01T12:00:00.000Z' });
  sql.prepare('INSERT INTO app_state VALUES(?,?)').run('player', JSON.stringify(player));
  async function event(id, now, options = {}) {
    const quest = { id, category: options.daily ? 'DAILY' : 'STORY' };
    const evidence = { questId: id, verificationType: options.distance ? 'GPS_DISTANCE' : 'TIMER', distanceMeters: options.distance };
    sql.exec('BEGIN');
    try {
      const next = await api.applyProgression(tx, player, quest, evidence, 'quest_' + id, now);
      sql.prepare('UPDATE app_state SET value=? WHERE key=?').run(JSON.stringify(next), 'player');
      sql.exec('COMMIT'); player = next; return next;
    } catch (error) { sql.exec('ROLLBACK'); throw error; }
  }
  function clear(day, streak) {
    sql.prepare('INSERT INTO protocol_bonuses VALUES(?,?,?,?,?)').run('daily_clear:' + day, 'daily_clear', day, day + 'T12:00:00.000Z', streak);
  }
  return { sql, tx, api, event, clear, get player() { return player; } };
}
test('weekly quest and distance thresholds reward once, preserve reload state, and restart next week', async t => {
  const h = setup(t), day = '2026-09-14T12:00:00.000Z';
  for (let i = 0; i < 5; i++) await h.event('q' + i, day, { distance: 2000 });
  assert.equal(h.player.totalRealXp, 380); assert.equal(h.player.gameEnergy, 38);
  await h.event('q4', day, { distance: 2000 }); assert.equal(h.player.totalRealXp, 380);
  const reloaded = await loader()('storage/progression').readProgression(h.tx, day);
  assert.equal(reloaded.weeklyChallenges.find(x => x.id === 'weekly_quest_master').progress, 5);
  assert.equal(reloaded.weeklyChallenges.find(x => x.id === 'weekly_pathfinder').rewardClaimed, true);
  for (let i = 0; i < 5; i++) await h.event('next' + i, '2026-09-21T12:00:00.000Z');
  assert.equal(h.player.totalRealXp, 580);
  const nextWeek = await h.api.readProgression(h.tx, '2026-09-21T12:00:00.000Z');
  assert.equal(nextWeek.weeklyChallenges.find(x => x.id === 'weekly_pathfinder').progress, 0);
});
test('daily consistency uses distinct days; milestone claims survive streak loss', async t => {
  const h = setup(t);
  await h.event('d1', '2026-09-14T12:00:00.000Z', { daily: true });
  await h.event('d2', '2026-09-14T13:00:00.000Z', { daily: true });
  await h.event('d3', '2026-09-15T12:00:00.000Z', { daily: true });
  h.clear('2026-09-16', 3);
  await h.event('d4', '2026-09-16T12:00:00.000Z', { daily: true });
  assert.equal(h.player.totalRealXp, 200); // 150 weekly Daily + 50 milestone.
  const state = await h.api.readProgression(h.tx, '2026-09-19T12:00:00.000Z');
  assert.equal(state.streak.currentStreak, 0); assert.equal(state.streak.bestStreak, 3);
  assert.deepEqual(Array.from(state.claimedMilestones), [3]);
  h.clear('2026-09-22', 3); await h.event('later', '2026-09-22T12:00:00.000Z');
  assert.equal(h.player.totalRealXp, 200);
});
test('3/7/14/30 milestones use source rewards and seven-day streak reward is weekly', async t => {
  const h = setup(t); let xp = 0, energy = 0;
  const rewards = { 3: [50, 5], 7: [76, 8], 14: [108, 11], 30: [158, 16] };
  for (const [day, count] of [['2026-09-03', 3], ['2026-09-07', 7], ['2026-09-14', 14], ['2026-09-30', 30]]) {
    h.clear(day, count); await h.event('milestone' + count, day + 'T12:00:00.000Z');
    xp += rewards[count][0]; energy += rewards[count][1];
    if (count >= 7) { xp += 250; energy += 25; }
  }
  assert.equal(h.player.totalRealXp, xp); assert.equal(h.player.gameEnergy, energy);
  assert.deepEqual(Array.from((await h.api.readProgression(h.tx, '2026-09-30T12:00:00.000Z')).claimedMilestones), [3, 7, 14, 30]);
  await h.event('same_streak_week', '2026-09-30T13:00:00.000Z'); assert.equal(h.player.totalRealXp, xp);
  const later = await h.api.readProgression(h.tx, '2026-10-03T12:00:00.000Z');
  const earned = later.weeklyChallenges.find(x => x.id === 'weekly_streak_keeper');
  assert.equal(later.streak.currentStreak, 0); assert.equal(earned.status, 'COMPLETED');
  assert.equal(earned.progress, 7); assert.equal(earned.percentComplete, 100);
});
test('rollback clears contribution and claim so a retry rewards exactly once', async t => {
  const h = setup(t);
  for (let i = 0; i < 4; i++) await h.event('ok' + i, '2026-09-14T12:00:00.000Z');
  h.sql.exec("CREATE TRIGGER fail_reward BEFORE INSERT ON verified_events BEGIN SELECT RAISE(ABORT,'reward failed'); END");
  await assert.rejects(h.event('retry', '2026-09-14T12:00:00.000Z'), /reward failed/);
  assert.equal(h.sql.prepare('SELECT COUNT(*) n FROM progression_contributions').get().n, 4);
  assert.equal(h.sql.prepare('SELECT COUNT(*) n FROM progression_claims').get().n, 0);
  assert.equal(h.player.totalRealXp, 0);
  h.sql.exec('DROP TRIGGER fail_reward');
  await h.event('retry', '2026-09-14T12:00:00.000Z'); await h.event('retry', '2026-09-14T12:00:00.000Z');
  assert.equal(h.player.totalRealXp, 200);
});
test('mismatched identities, nonfinite distance and clock rollback cannot create contributions', async t => {
  const h = setup(t); await h.event('one', '2026-09-14T12:00:00.000Z');
  await assert.rejects(h.api.applyProgression(h.tx, h.player, { id: 'different', category: 'STORY' }, { questId: 'different', verificationType: 'TIMER' }, 'quest_one', '2026-09-14T12:00:00.000Z'), /identity/i);
  await assert.rejects(h.event('infinite', '2026-09-14T12:00:00.000Z', { distance: Infinity }), /distance/i);
  await assert.rejects(h.event('backdated', '2026-09-13T12:00:00.000Z'), /clock/i);
  assert.equal(h.sql.prepare('SELECT COUNT(*) n FROM progression_contributions').get().n, 1);
});
test('pure streak expiry, idempotent same-day calculation and ISO year boundary are deterministic', () => {
  const load = loader(), streak = load('daily/streak'), weekly = load('weekly/challenges');
  assert.equal(streak.calculateStreakState(7, 10, '2026-09-14', '2026-09-14', { clear: true }).currentStreak, 7);
  assert.equal(streak.calculateStreakState(7, 10, '2026-09-14', '2026-09-16', null).currentStreak, 0);
  assert.equal(streak.calculateStreakState(7, 10, '2026-09-14', '2026-09-13', null).clockAnomaly, true);
  const challenge = weekly.getActiveWeeklyChallenges('2026-W53')[0];
  assert.equal(weekly.getWeeklyChallengeStatus(challenge, '2027-W01', {}).status, 'EXPIRED');
  assert.equal(weekly.getWeeklyChallengeStatus(challenge, '2026-W52', {}).status, 'LOCKED');
});


