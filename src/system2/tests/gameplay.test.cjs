// Run from the project: node --test src/system2/tests/gameplay.test.cjs
// Uses installed TypeScript and Node's real in-memory SQLite; no new dependencies.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.SYSTEM_PROJECT_ROOT ?? path.resolve(__dirname, '../../..');
const ts = require(require.resolve('typescript', { paths: [root, process.cwd()] }));

function loader(mocks, clock = { now: Date.now() }) {
  const cache = new Map();
  function load(file) {
    const resolved = [file, file + '.ts', file + '.tsx', path.join(file, 'index.ts')]
      .find(p => fs.existsSync(p) && fs.statSync(p).isFile());
    if (!resolved) throw new Error('Missing module: ' + file);
    if (cache.has(resolved)) return cache.get(resolved).exports;
    const module = { exports: {} };
    cache.set(resolved, module);
    const source = ts.transpileModule(fs.readFileSync(resolved, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const requireMock = name => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith('.')) return load(path.resolve(path.dirname(resolved), name));
      throw new Error('Unexpected dependency: ' + name);
    };
    vm.runInNewContext(source, {
      module, exports: module.exports, require: requireMock, console,
      setTimeout, clearTimeout,
      setInterval: clock.intervals ? fn => { const id = {}; clock.intervals.set(id, fn); return id; } : setInterval,
      clearInterval: clock.intervals ? id => clock.intervals.delete(id) : clearInterval,
      performance: { now: () => clock.monotonic ?? clock.now },
      Date: class extends Date { static now() { return clock.now; } },
    }, { filename: resolved });
    return module.exports;
  }
  return relative => load(path.join(root, 'src/system2', relative));
}

function databaseHarness(t) {
  const sql = new DatabaseSync(':memory:');
  t.after(() => sql.close());
  const faults = { open: false, init: false, statement: '', commit: false, afterCommit: false, failWhen: null };
  let transaction = false;
  function query(inTransaction) {
    return {
      async execAsync(source) {
        if (faults.init) { faults.init = false; throw new Error('init failed'); }
        sql.exec(source);
      },
      async getFirstAsync(source, ...params) {
        assert.equal(transaction, inTransaction, 'queries must use the transaction handle');
        return sql.prepare(source).get(...params) ?? null;
      },
      async getAllAsync(source, ...params) {
        assert.equal(transaction, inTransaction);
        return sql.prepare(source).all(...params);
      },
      async runAsync(source, ...params) {
        assert.equal(transaction, inTransaction, 'writes must use the transaction handle');
        if (faults.failWhen?.(source, params)) {
          faults.failWhen = null;
          throw new Error('injected chapter failure');
        }
        if (faults.statement && source.includes(faults.statement)) {
          faults.statement = '';
          throw new Error('write failed');
        }
        return sql.prepare(source).run(...params);
      },
    };
  }
  const adapter = {
    ...query(false),
    async withExclusiveTransactionAsync(task) {
      sql.exec('BEGIN'); transaction = true;
      try {
        await task(query(true));
        if (faults.commit) { faults.commit = false; throw new Error('commit failed'); }
        sql.exec('COMMIT');
      } catch (error) {
        sql.exec('ROLLBACK');
        throw error;
      } finally { transaction = false; }
      if (faults.afterCommit) { faults.afterCommit = false; throw new Error('connection close failed after commit'); }
    },
  };
  const mocks = { 'expo-sqlite': { async openDatabaseAsync() {
    if (faults.open) { faults.open = false; throw new Error('open failed'); }
    return adapter;
  } } };
  const load = loader(mocks);
  return { db: load('storage/database'), faults, sql, load, reload: () => loader(mocks)('storage/database') };
}
const evidence = { questId: 'first_movement_v1', verificationType: 'GPS_DISTANCE', verificationScore: 95, distanceMeters: 503.25, durationSeconds: 400 };

test('parallel completion awards once, persists one event and distance, preserves streak', async t => {
  const { db, sql } = databaseHarness(t);
  const initial = await db.loadOrCreatePlayer();
  initial.streak = 7;
  initial.totalRealXp = initial.realXp = 20;
  initial.totalDistanceMeters = 12;
  sql.prepare('UPDATE app_state SET value = ?').run(JSON.stringify(initial));
  const results = await Promise.all(Array.from({ length: 12 }, () => db.completeVerifiedQuest(evidence)));
  assert.equal(results.filter(r => r.awarded).length, 1);
  const player = await db.loadOrCreatePlayer();
  assert.equal(player.totalRealXp, 120);
  assert.equal(player.stats.VIT.totalXp, 80);
  assert.equal(player.totalDistanceMeters, 515.25);
  assert.equal(player.verifiedQuestCount, 1);
  assert.equal(player.gameEnergy, 10);
  assert.equal(player.streak, 7);
  assert.equal(sql.prepare('SELECT count(*) AS n FROM verified_events').get().n, 1);
  assert.equal(sql.prepare('SELECT count(*) AS n FROM quest_completions').get().n, 1);
  assert.equal((await db.completeVerifiedQuest(evidence)).awarded, false);
});

for (const failure of ['INSERT INTO quest_completions', 'UPDATE app_state', 'INSERT INTO verified_events', 'COMMIT']) {
  test('rollback and retry after failure at ' + failure, async t => {
    const { db, faults, sql } = databaseHarness(t);
    const initial = await db.loadOrCreatePlayer();
    if (failure === 'COMMIT') faults.commit = true;
    else faults.statement = failure;
    await assert.rejects(db.completeVerifiedQuest(evidence));
    assert.equal(JSON.stringify(await db.loadOrCreatePlayer()), JSON.stringify(initial));
    assert.equal(await db.isQuestCompleted(evidence.questId), false);
    assert.equal(sql.prepare('SELECT count(*) AS n FROM verified_events').get().n, 0);
    assert.equal((await db.completeVerifiedQuest(evidence)).awarded, true);
  });
}

test('ambiguous success after commit is safe to retry', async t => {
  const { db, faults } = databaseHarness(t);
  await db.loadOrCreatePlayer();
  faults.afterCommit = true;
  await assert.rejects(db.completeVerifiedQuest(evidence));
  assert.equal(await db.isQuestCompleted(evidence.questId), true);
  assert.equal((await db.completeVerifiedQuest(evidence)).awarded, false);
  assert.equal((await db.loadOrCreatePlayer()).totalRealXp, 100);
});

test('open/init failures are retryable; corrupt profile is not silently reset', async t => {
  const { db, faults, sql } = databaseHarness(t);
  faults.open = true;
  await assert.rejects(db.loadOrCreatePlayer());
  faults.init = true;
  await assert.rejects(db.loadOrCreatePlayer());
  await db.loadOrCreatePlayer();
  sql.prepare('UPDATE app_state SET value = ?').run('{broken');
  await assert.rejects(db.loadOrCreatePlayer());
  await assert.rejects(db.completeVerifiedQuest(evidence));
  assert.equal(sql.prepare('SELECT value FROM app_state').get().value, '{broken');
  assert.equal(await db.isQuestCompleted(evidence.questId), false);
});

test('insufficient or invalid GPS evidence cannot award a quest', async t => {
  const { db } = databaseHarness(t);
  await db.loadOrCreatePlayer();
  for (const invalid of [{ distanceMeters: 499.99 }, { distanceMeters: NaN }, { verificationScore: 79 },
    { verificationScore: Infinity }, { durationSeconds: 0 }, { questId: 'other' }, { verificationType: 'NONE' }]) {
    await assert.rejects(db.completeVerifiedQuest({ ...evidence, ...invalid }));
  }
  assert.equal((await db.loadOrCreatePlayer()).totalRealXp, 0);
});

function fix(time, meters = 0, accuracy = 5) {
  return { timestamp: time, coords: { latitude: meters / 111195, longitude: 0, accuracy, altitude: null, altitudeAccuracy: null, heading: null, speed: null } };
}
test('GPS rejects poor, mock, stale, reversed, teleport and noisy fixes', () => {
  const gps = loader({})('verification/gps');
  const now = Date.now();
  assert.equal(gps.isUsableLocation(fix(now), now), true);
  for (const point of [fix(now, 0, null), fix(now, 0, 51), fix(now - 16000), { ...fix(now), mocked: true }]) {
    assert.equal(gps.isUsableLocation(point, now), false);
  }
  assert.equal(gps.verificationScoreForAccuracy(null), 0);
  assert.equal(gps.verifiedSegment(fix(now), fix(now + 2000, 1)), 0);
  assert.equal(gps.verifiedSegment(fix(now), fix(now - 1, 10)), 0);
  assert.equal(gps.verifiedSegment(fix(now), fix(now + 1000, 50)), 0);
  assert.equal(gps.verifiedSegment(fix(now), fix(now + 16000, 10)), 0);
  assert.ok(gps.verifiedSegment(fix(now), fix(now + 5000, 10)) > 9.9);
});

test('UI deadline rejects stalled operation without cancelling eventual completion', async () => {
  const { awaitWithTimeout } = loader({})('storage/awaitWithTimeout');
  let resolve;
  const operation = new Promise(r => { resolve = r; });
  await assert.rejects(awaitWithTimeout(operation, 5));
  resolve('committed');
  assert.equal(await operation, 'committed');
});

const flush = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return { promise, resolve };
}

// Minimal hook host exercises this screen's async handlers and cleanup. It does
// not replace a native React/navigation/GPS integration test on a phone.
function screenHarness(t, options = {}) {
  const clock = { now: Date.now(), monotonic: 0, intervals: new Map() };
  const slots = [];
  let cursor = 0;
  let pending = [];
  let tree;
  let focusCleanup;
  let callback;
  let gpsError;
  let appStateListener;
  let removals = 0;
  let starts = 0;
  let awards = 0;
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => v === b[i]);
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, value => { slots[index].value = value; }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ??= { current: initial };
    },
    useCallback(fn, deps) {
      const index = cursor++;
      if (!same(slots[index]?.deps, deps)) slots[index] = { fn, deps };
      return slots[index].fn;
    },
    useEffect(fn, deps) {
      const index = cursor++;
      if (!same(slots[index]?.deps, deps)) {
        pending.push(() => {
          slots[index]?.cleanup?.();
          slots[index] = { deps, cleanup: fn() };
        });
      }
    },
  };
  const context = {
    ready: true, error: null, refreshPlayer: async () => {},
    setActiveQuestId() {},
    async completeVerifiedQuest(evidence) {
      awards++;
      if (evidence.verificationType !== 'TIMER') assert.ok(evidence.distanceMeters >= (evidence.verificationType === 'MULTI' ? 600 : 500));
      if (evidence.verificationType !== 'GPS_DISTANCE') assert.ok(evidence.durationSeconds >= 600);
      if (options.saveError) throw new Error('SQLite failed');
      return { awarded: true };
    },
  };
  const appState = { currentState: 'active', addEventListener: (_, listener) => {
    appStateListener = listener;
    return { remove() { appStateListener = undefined; } };
  } };
  const load = loader({
    react,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    'react-native': {
      AppState: appState,
      Pressable: 'Pressable', ScrollView: 'ScrollView', Text: 'Text', View: 'View', StyleSheet: { create: s => s },
    },
    'expo-router': {
      useRouter: () => ({ back() { focusCleanup?.(); } }),
      useFocusEffect(fn) { react.useEffect(() => { focusCleanup = fn(); return focusCleanup; }, [fn]); },
    },
    'expo-haptics': {
      ImpactFeedbackStyle: { Medium: 1 }, NotificationFeedbackType: { Success: 1 },
      impactAsync: async () => {}, notificationAsync: async () => {},
    },
    'expo-location': {
      Accuracy: { BestForNavigation: 1 },
      requestForegroundPermissionsAsync: () => options.permission?.promise ?? Promise.resolve({ status: 'granted' }),
      hasServicesEnabledAsync: async () => true,
      async watchPositionAsync(_, onLocation, onError) {
        starts++; callback = onLocation; gpsError = onError;
        if (options.watch) await options.watch.promise;
        return { remove() { removals++; } };
      },
    },
    '../state/SystemProvider': { useSystem: () => context },
    '../storage/database': { getQuestAccess: async () => options.access ?? 'AVAILABLE' },
  }, clock);
  const Screen = load('screens/QuestRunScreen').default;
  function render() {
    cursor = 0;
    tree = Screen({ quest: options.questId ? load('quests/catalog').getQuest(options.questId) : undefined });
    const effects = pending;
    pending = [];
    effects.forEach(fn => fn());
  }
  function text(node) {
    if (Array.isArray(node)) return node.map(text).join('');
    if (node && typeof node === 'object') return text(node.props?.children);
    return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
  }
  function button(label, node = tree) {
    if (Array.isArray(node)) return node.map(n => button(label, n)).find(Boolean);
    if (!node || typeof node !== 'object') return undefined;
    if (node.type === 'Pressable' && text(node).includes(label)) return node;
    return button(label, node.props?.children ?? null);
  }
  t.after(() => slots.forEach(slot => slot?.cleanup?.()));
  render();
  return {
    render, button,
    status: () => slots[0].value,
    distance: () => slots[2].value,
    starts: () => starts, removals: () => removals, awards: () => awards,
    leave: () => focusCleanup?.(),
    error: () => gpsError('GPS failed'),
    appState: state => { appState.currentState = state; appStateListener?.(state); },
    advance(seconds) {
      clock.monotonic += seconds * 1000;
      clock.now += seconds * 1000;
      [...clock.intervals.values()].forEach(fn => fn());
    },
    changeWallClock(seconds) { clock.now += seconds * 1000; },
    fix(meters) { clock.now += 5000; clock.monotonic += 5000; callback(fix(clock.now, meters)); },
  };
}

test('double start is blocked while awaiting the first GPS fix', async t => {
  const permission = deferred();
  const h = screenHarness(t, { permission });
  await flush(); h.render();
  const start = h.button('ROZPOCZNIJ QUEST').props.onPress;
  const first = start();
  await start();
  assert.equal(h.status(), 'STARTING');
  permission.resolve({ status: 'granted' });
  await first;
  assert.equal(h.starts(), 1);
  assert.equal(h.status(), 'STARTING');
  h.fix(0);
  assert.equal(h.status(), 'TRACKING');
});

test('late GPS subscription is removed after leaving; stale callbacks are ignored', async t => {
  const watch = deferred();
  const h = screenHarness(t, { watch });
  await flush(); h.render();
  const start = h.button('ROZPOCZNIJ QUEST').props.onPress();
  await flush();
  assert.equal(h.starts(), 1);
  h.leave();
  watch.resolve();
  await start;
  assert.equal(h.removals(), 1);
  h.fix(1000);
  assert.equal(h.awards(), 0);
});

test('GPS error removes the subscription and exits tracking', async t => {
  const h = screenHarness(t);
  await flush(); h.render();
  await h.button('ROZPOCZNIJ QUEST').props.onPress();
  h.fix(0); h.error();
  assert.equal(h.status(), 'ERROR');
  assert.equal(h.removals(), 1);
  h.fix(600);
  assert.equal(h.awards(), 0);
});

for (const saveError of [false, true]) {
  test('500 GPS meters automatically ' + (saveError ? 'surface SQLite failure' : 'complete once'), async t => {
    const h = screenHarness(t, { saveError });
    await flush(); h.render();
    await h.button('ROZPOCZNIJ QUEST').props.onPress();
    for (let meters = 0; meters <= 520; meters += 10) h.fix(meters);
    await flush();
    assert.equal(h.status(), saveError ? 'ERROR' : 'COMPLETED');
    assert.equal(h.awards(), 1);
    assert.equal(h.removals(), 1);
    h.fix(530);
    assert.equal(h.awards(), 1);
  });
}

test('permission dialog and transient AppState before GPS subscription do not stop STARTING', async t => {
  const permission = deferred();
  const watch = deferred();
  const h = screenHarness(t, { permission, watch });
  await flush(); h.render();
  const start = h.button('ROZPOCZNIJ QUEST').props.onPress();
  await flush();
  assert.equal(h.starts(), 0);
  h.appState('inactive');
  h.appState('background');
  assert.equal(h.status(), 'STARTING');
  h.appState('active');
  permission.resolve({ status: 'granted' });
  await flush();
  assert.equal(h.starts(), 1);
  h.fix(0); // A native fix arrives before watchPositionAsync returns its handle.
  h.appState('background');
  assert.equal(h.status(), 'STARTING');
  assert.equal(h.removals(), 0);
  h.appState('active');
  watch.resolve();
  await start;
  assert.equal(h.status(), 'TRACKING');
  assert.equal(h.awards(), 0);
});

test('real background removes an established GPS watcher and retry starts without remounting', async t => {
  const h = screenHarness(t);
  await flush(); h.render();
  await h.button('ROZPOCZNIJ QUEST').props.onPress();
  h.fix(0);
  assert.equal(h.status(), 'TRACKING');
  h.appState('background');
  assert.equal(h.status(), 'ERROR');
  assert.equal(h.removals(), 1);
  h.appState('background');
  assert.equal(h.removals(), 1);
  h.appState('active'); h.render();
  h.button('SPRÓBUJ PONOWNIE').props.onPress();
  await flush();
  assert.equal(h.starts(), 2);
  assert.equal(h.status(), 'STARTING');
  h.fix(0);
  assert.equal(h.status(), 'TRACKING');
  h.error();
  assert.equal(h.removals(), 2);
  assert.equal(h.status(), 'ERROR');
  h.appState('background');
  assert.equal(h.removals(), 2);
});

test('background with a watcher but before the first fix removes the watcher', async t => {
  const h = screenHarness(t);
  await flush(); h.render();
  await h.button('ROZPOCZNIJ QUEST').props.onPress();
  assert.equal(h.status(), 'STARTING');
  h.appState('background');
  assert.equal(h.status(), 'ERROR');
  assert.equal(h.removals(), 1);
  h.fix(0);
  assert.equal(h.status(), 'ERROR');
});

const focusEvidence = { questId: 'focus_protocol_v1', verificationType: 'TIMER', verificationScore: 100, durationSeconds: 600 };

test('both quests award once in parallel without overwriting XP or distance; progress survives reload', async t => {
  const { db, sql, load } = databaseHarness(t);
  await db.loadOrCreatePlayer();
  const results = await Promise.all([evidence, focusEvidence, focusEvidence, evidence].map(input => db.completeVerifiedQuest(input)));
  assert.equal(results.filter(r => r.awarded).length, 2);
  const snapshot = await db.loadSystemState();
  assert.equal(snapshot.player.totalRealXp, 180);
  assert.equal(snapshot.player.stats.VIT.totalXp, 80);
  assert.equal(snapshot.player.stats.WIL.totalXp, 70);
  assert.equal(snapshot.player.gameEnergy, 18);
  assert.equal(snapshot.player.totalDistanceMeters, evidence.distanceMeters);
  assert.equal(snapshot.player.verifiedQuestCount, 2);
  assert.equal(snapshot.completedQuestIds.length, 2);
  const progress = load('quests/catalog').getAwakeningProgress(snapshot.completedQuestIds);
  assert.equal(progress.completed, 2);
  assert.equal(progress.total, 3);
  assert.equal(progress.percent, 2 / 3 * 100);
  assert.equal(sql.prepare('SELECT count(*) AS n FROM verified_events').get().n, 2);
  const focusEvent = JSON.parse(sql.prepare('SELECT payload FROM verified_events WHERE quest_id = ?').get(focusEvidence.questId).payload);
  assert.equal(focusEvent.verificationType, 'TIMER');
  assert.equal(focusEvent.distanceMeters, undefined);
});

test('Awakening counts known quest IDs rather than all completions or duplicates', () => {
  const { getAwakeningProgress } = loader({})('quests/catalog');
  assert.equal(getAwakeningProgress([]).completed, 0);
  const progress = getAwakeningProgress(['first_movement_v1', 'first_movement_v1', 'unrelated_quest']);
  assert.equal(progress.completed, 1);
  assert.equal(progress.percent, 1 / 3 * 100);
});

test('focus evidence must meet 600 seconds with the TIMER verifier', async t => {
  const { db } = databaseHarness(t);
  await db.loadOrCreatePlayer();
  for (const invalid of [{ durationSeconds: 599.99 }, { durationSeconds: NaN }, { verificationScore: 99 },
    { verificationType: 'GPS_DISTANCE', distanceMeters: 500 }, { distanceMeters: 500 }]) {
    await assert.rejects(db.completeVerifiedQuest({ ...focusEvidence, ...invalid }));
  }
  assert.equal((await db.loadOrCreatePlayer()).totalRealXp, 0);
  await db.completeVerifiedQuest(evidence); // Chapter 1 now enforces quest order.
  assert.equal((await db.completeVerifiedQuest(focusEvidence)).awarded, true);
  assert.equal((await db.completeVerifiedQuest(focusEvidence)).awarded, false);
});

test('focus event failure rolls back reward and completion together', async t => {
  const { db, faults } = databaseHarness(t);
  await db.loadOrCreatePlayer();
  await db.completeVerifiedQuest(evidence);
  faults.statement = 'INSERT INTO verified_events';
  await assert.rejects(db.completeVerifiedQuest(focusEvidence));
  assert.equal(await db.isQuestCompleted(focusEvidence.questId), false);
  assert.equal((await db.loadOrCreatePlayer()).stats.WIL.totalXp, 0);
  assert.equal((await db.completeVerifiedQuest(focusEvidence)).awarded, true);
});

test('FOCUS PROTOCOL verifies automatically at 600 monotonic seconds, never at 599', async t => {
  const h = screenHarness(t, { questId: 'focus_protocol_v1' });
  await flush(); h.render();
  await h.button('ROZPOCZNIJ QUEST').props.onPress();
  h.render();
  assert.equal(h.status(), 'TRACKING');
  assert.equal(h.starts(), 0); // No GPS or permission required.
  h.advance(599);
  await flush();
  assert.equal(h.awards(), 0);
  h.changeWallClock(3600);
  h.advance(0);
  assert.equal(h.awards(), 0);
  h.advance(1);
  await flush();
  assert.equal(h.awards(), 1);
  assert.equal(h.status(), 'COMPLETED');
  h.advance(600);
  assert.equal(h.awards(), 1);
});

test('focus background invalidates progress and retry requires a fresh full ten minutes', async t => {
  const h = screenHarness(t, { questId: 'focus_protocol_v1' });
  await flush(); h.render();
  await h.button('ROZPOCZNIJ QUEST').props.onPress();
  h.render(); h.advance(599);
  h.appState('background');
  assert.equal(h.status(), 'ERROR');
  h.advance(1000);
  assert.equal(h.awards(), 0);
  h.appState('active'); h.render();
  h.button('SPRÓBUJ PONOWNIE').props.onPress();
  await flush(); h.render();
  assert.equal(h.status(), 'TRACKING');
  h.advance(599);
  assert.equal(h.awards(), 0);
  h.advance(1);
  await flush();
  assert.equal(h.status(), 'COMPLETED');
  assert.equal(h.awards(), 1);
});

test('leaving focus screen cancels the timer without an award', async t => {
  const h = screenHarness(t, { questId: 'focus_protocol_v1' });
  await flush(); h.render();
  await h.button('ROZPOCZNIJ QUEST').props.onPress();
  h.render(); h.advance(599); h.leave(); h.advance(10);
  await flush();
  assert.equal(h.awards(), 0);
});

test('background during focus STARTING prevents a delayed start', async t => {
  const h = screenHarness(t, { questId: 'focus_protocol_v1' });
  await flush(); h.render();
  const start = h.button('ROZPOCZNIJ QUEST').props.onPress();
  h.appState('background');
  await start;
  assert.equal(h.status(), 'ERROR');
  h.advance(600);
  assert.equal(h.awards(), 0);
});

const multiEvidence = { questId: 'final_trial_v1', verificationType: 'MULTI', verificationScore: 95, durationSeconds: 600, distanceMeters: 603 };

test('quest ordering is enforced in SQLite and existing completions survive a fresh module instance', async t => {
  const { db, reload } = databaseHarness(t);
  const initial = await db.loadOrCreatePlayer();
  assert.equal(initial.realLevel, 1);
  assert.equal(initial.rank, 'E');
  assert.ok(Object.values(initial.stats).every(skill => skill.level === 1));
  assert.equal(await db.getQuestAccess(evidence.questId), 'AVAILABLE');
  assert.equal(await db.getQuestAccess(focusEvidence.questId), 'LOCKED');
  await assert.rejects(db.completeVerifiedQuest(focusEvidence));
  await assert.rejects(db.completeVerifiedQuest(multiEvidence));
  await db.completeVerifiedQuest(evidence);
  const restarted = reload();
  assert.equal(await restarted.getQuestAccess(evidence.questId), 'COMPLETED');
  assert.equal(await restarted.getQuestAccess(focusEvidence.questId), 'AVAILABLE');
  assert.equal(await restarted.getQuestAccess(multiEvidence.questId), 'LOCKED');
  assert.equal((await restarted.completeVerifiedQuest(evidence)).awarded, false);
  assert.equal((await restarted.loadSystemState()).player.totalRealXp, 100);
});

test('Main Quest progresses 0/3 to 3/3; chapter XP and World unlock exactly once', async t => {
  const { db, sql, load, reload } = databaseHarness(t);
  const progress = load('quests/catalog').getAwakeningProgress;
  assert.equal(progress((await db.loadSystemState()).completedQuestIds).completed, 0);
  await assert.rejects(db.acknowledgeAwakening());
  await db.completeVerifiedQuest(evidence);
  assert.equal(progress((await db.loadSystemState()).completedQuestIds).completed, 1);
  await db.completeVerifiedQuest(focusEvidence);
  const before = await db.loadSystemState();
  assert.equal(progress(before.completedQuestIds).completed, 2);
  assert.equal(before.worldUnlocked, false);
  assert.equal(before.awakeningCompleted, false);
  const results = await Promise.all(Array.from({ length: 10 }, () => db.completeVerifiedQuest(multiEvidence)));
  assert.equal(results.filter(r => r.awarded).length, 1);
  assert.equal(results.filter(r => r.awakeningAwarded).length, 1);
  const final = await db.loadSystemState();
  assert.equal(progress(final.completedQuestIds).completed, 3);
  assert.equal(final.player.totalRealXp, 600);
  assert.equal(final.player.gameEnergy, 33);
  assert.equal(final.player.stats.VIT.totalXp, 140);
  assert.equal(final.player.stats.WIL.totalXp, 130);
  assert.equal(final.player.verifiedQuestCount, 3);
  assert.equal(final.player.totalDistanceMeters, evidence.distanceMeters + multiEvidence.distanceMeters);
  assert.equal(final.worldUnlocked, true);
  assert.equal(final.awakeningPending, true);
  assert.equal(sql.prepare('SELECT count(*) AS n FROM chapter_completions').get().n, 1);
  assert.equal(sql.prepare('SELECT count(*) AS n FROM verified_events').get().n, 4);
  const restarted = reload();
  const afterRestart = await restarted.loadSystemState();
  assert.equal(afterRestart.player.totalRealXp, 600);
  assert.equal(afterRestart.worldUnlocked, true);
  await Promise.all([restarted.acknowledgeAwakening(), restarted.acknowledgeAwakening()]);
  assert.equal((await restarted.loadSystemState()).awakeningPending, false);
  assert.equal((await restarted.completeVerifiedQuest(multiEvidence)).player.totalRealXp, 600);
});

for (const failure of ['chapter marker', 'chapter profile', 'chapter event', 'commit']) {
  test('final quest and Main Quest roll back together at ' + failure, async t => {
    const { db, faults, sql } = databaseHarness(t);
    await db.loadSystemState();
    await db.completeVerifiedQuest(evidence);
    await db.completeVerifiedQuest(focusEvidence);
    if (failure === 'commit') faults.commit = true;
    else faults.failWhen = (source, params) =>
      failure === 'chapter marker' ? source.startsWith('INSERT INTO chapter_completions') :
      failure === 'chapter profile' ? source.startsWith('UPDATE app_state') && JSON.parse(params[0]).totalRealXp === 600 :
      source.startsWith('INSERT INTO verified_events') && params[0] === 'chapter_awakening_chapter_1';
    await assert.rejects(db.completeVerifiedQuest(multiEvidence));
    const state = await db.loadSystemState();
    assert.equal(state.player.totalRealXp, 180);
    assert.equal(state.player.gameEnergy, 18);
    assert.equal(state.worldUnlocked, false);
    assert.equal(state.completedQuestIds.length, 2);
    assert.equal(sql.prepare('SELECT count(*) AS n FROM chapter_completions').get().n, 0);
    assert.equal((await db.completeVerifiedQuest(multiEvidence)).player.totalRealXp, 600);
  });
}

test('reconciling previously completed quests grants Main Quest once even with parallel loads', async t => {
  const { db, sql } = databaseHarness(t);
  await db.loadSystemState();
  // Represents a valid older save with quest rewards already paid, but no chapter table entry.
  for (const id of [evidence.questId, focusEvidence.questId, multiEvidence.questId]) {
    sql.prepare('INSERT INTO quest_completions VALUES (?, ?)').run(id, '2026-09-17');
  }
  const results = await Promise.all(Array.from({ length: 8 }, () => db.loadSystemState()));
  assert.ok(results.every(state => state.worldUnlocked && state.player.totalRealXp === 300));
  assert.equal(sql.prepare('SELECT count(*) AS n FROM chapter_completions').get().n, 1);
});

test('MULTI cannot award for only distance or only time or the wrong verifier', async t => {
  const { db } = databaseHarness(t);
  await db.loadSystemState();
  await db.completeVerifiedQuest(evidence);
  await db.completeVerifiedQuest(focusEvidence);
  for (const invalid of [{ distanceMeters: 599.99 }, { durationSeconds: 599.99 },
    { distanceMeters: NaN }, { verificationScore: 79 }, { verificationType: 'GPS_DISTANCE' }]) {
    await assert.rejects(db.completeVerifiedQuest({ ...multiEvidence, ...invalid }));
  }
  assert.equal((await db.loadSystemState()).worldUnlocked, false);
});

test('completed or locked quests never start GPS or TIMER when entered directly', async t => {
  for (const access of ['LOCKED', 'COMPLETED']) {
    const h = screenHarness(t, { questId: 'final_trial_v1', access });
    await flush(); h.render();
    assert.equal(h.status(), access);
    assert.equal(h.button('ROZPOCZNIJ QUEST'), undefined);
    assert.equal(h.starts(), 0);
    assert.equal(h.awards(), 0);
  }
});

test('double click on focus START creates only one timer and one reward', async t => {
  const h = screenHarness(t, { questId: 'focus_protocol_v1' });
  await flush(); h.render();
  const start = h.button('ROZPOCZNIJ QUEST').props.onPress;
  await Promise.all([start(), start()]);
  h.render(); h.advance(600); await flush();
  assert.equal(h.awards(), 1);
});

test('MULTI waits for ten minutes after reaching 600 meters early', async t => {
  const h = screenHarness(t, { questId: 'final_trial_v1' });
  await flush(); h.render();
  await h.button('ROZPOCZNIJ QUEST').props.onPress();
  h.fix(0); h.render();
  for (let meters = 10; meters <= 610; meters += 10) h.fix(meters);
  assert.equal(h.awards(), 0);
  // Keep valid stationary fixes flowing while the foreground timer continues.
  for (let i = 0; i < 58; i++) { h.fix(610); h.advance(0); }
  assert.equal(h.awards(), 0); // 595 seconds since the first fix.
  h.fix(610); h.advance(0); await flush();
  assert.equal(h.status(), 'COMPLETED');
  assert.equal(h.awards(), 1);
  assert.equal(h.removals(), 1);
});

test('MULTI waits for 600 meters after time is satisfied with only 450 meters', async t => {
  const h = screenHarness(t, { questId: 'final_trial_v1' });
  await flush(); h.render();
  await h.button('ROZPOCZNIJ QUEST').props.onPress();
  h.fix(0); h.render();
  for (let meters = 10; meters <= 450; meters += 10) h.fix(meters);
  for (let i = 0; i < 75; i++) { h.fix(450); h.advance(0); }
  assert.equal(h.awards(), 0);
  assert.ok(h.distance() > 449 && h.distance() < 451);
  // Resuming after a pause can discard an anchor segment; use accepted distance.
  for (let meters = 460; meters <= 650 && h.awards() === 0; meters += 10) h.fix(meters);
  assert.ok(h.distance() >= 600);
  await flush();
  assert.equal(h.awards(), 1);
  assert.equal(h.status(), 'COMPLETED');
});

test('MULTI background or leaving the screen cancels both measurements', async t => {
  for (const interrupt of ['background', 'leave']) {
    const h = screenHarness(t, { questId: 'final_trial_v1' });
    await flush(); h.render();
    await h.button('ROZPOCZNIJ QUEST').props.onPress();
    h.fix(0); h.render(); h.fix(10);
    if (interrupt === 'leave') h.leave(); else h.appState('background');
    h.advance(1000); h.fix(610); await flush();
    assert.equal(h.awards(), 0);
    assert.equal(h.removals(), 1);
  }
});

function treeText(node) {
  if (Array.isArray(node)) return node.map(treeText).join('');
  if (node && typeof node === 'object') return treeText(node.props?.children);
  return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
}
function findButtons(node) {
  if (Array.isArray(node)) return node.flatMap(findButtons);
  if (!node || typeof node !== 'object') return [];
  return [...(node.type === 'Pressable' ? [node] : []), ...findButtons(node.props?.children)];
}
function uiHarness(context = {}) {
  const navigation = [];
  const jsx = (type, props) => typeof type === 'function' ? type(props) : ({ type, props });
  const load = loader({
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { Pressable: 'Pressable', Text: 'Text', View: 'View', StyleSheet: { create: s => s } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 0 }) },
    'expo-router': { usePathname: () => '/', useRouter: () => ({ push: value => navigation.push(value), replace: value => navigation.push(value) }) },
    '../state/SystemProvider': { useSystem: () => context },
    '../components/SystemPage': { __esModule: true, default: 'SystemPage', pageStyles: {} },
  });
  return { load, navigation };
}

test('shared navigation connects SYSTEM, QUESTY, WORLD and disables unfinished sections', () => {
  const { load, navigation } = uiHarness();
  const buttons = findButtons(load('components/BottomNavigation').default());
  assert.equal(buttons.length, 5);
  for (const button of buttons) {
    if (button.props.disabled) assert.match(treeText(button), /WKRÓTCE/);
    else button.props.onPress();
  }
  assert.deepEqual(navigation, ['/', '/quests', '/world']);
});

test('Quest list uses persisted completion IDs and locks subsequent cards', () => {
  const { load, navigation } = uiHarness({ completedQuestIds: ['first_movement_v1'], activeQuestId: null });
  const tree = load('screens/QuestsScreen').default();
  const buttons = findButtons(tree);
  assert.equal(buttons.length, 3);
  assert.match(treeText(buttons[0]), /COMPLETED/);
  assert.match(treeText(buttons[1]), /AVAILABLE/);
  assert.equal(buttons[2].props.disabled, true);
  buttons[1].props.onPress();
  assert.equal(navigation[0].params.questId, 'focus_protocol_v1');
});

test('World gates online content and displays real profile statistics only after unlock', () => {
  const context = { worldUnlocked: false, player: { discoveredSectors: 0, totalDistanceMeters: 1103 } };
  const { load } = uiHarness(context);
  const Screen = load('screens/WorldScreen').default;
  assert.match(treeText(Screen()), /WORLD STATUS: LOCKED/);
  assert.doesNotMatch(treeText(Screen()), /WORLD STATUS: ONLINE/);
  context.worldUnlocked = true;
  const text = treeText(Screen());
  assert.match(text, /WORLD STATUS: ONLINE/);
  assert.match(text, /1103/);
  assert.match(text, /EXPLORATION LOCKED/);
});
