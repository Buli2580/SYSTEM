// Run from the project: node --test src/system2/tests/gameplay.test.cjs
// Uses installed TypeScript and Node's real in-memory SQLite; no new dependencies.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.SYSTEM_PROJECT_ROOT ?? path.resolve(__dirname, '../../..');
const ts = require(path.join(root, 'node_modules/typescript'));

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
      setTimeout, clearTimeout, setInterval, clearInterval,
      Date: class extends Date { static now() { return clock.now; } },
    }, { filename: resolved });
    return module.exports;
  }
  return relative => load(path.join(root, 'src/system2', relative));
}

function databaseHarness(t) {
  const sql = new DatabaseSync(':memory:');
  t.after(() => sql.close());
  const faults = { open: false, init: false, statement: '', commit: false, afterCommit: false };
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
      async runAsync(source, ...params) {
        assert.equal(transaction, inTransaction, 'writes must use the transaction handle');
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
  const load = loader({ 'expo-sqlite': { async openDatabaseAsync() {
    if (faults.open) { faults.open = false; throw new Error('open failed'); }
    return adapter;
  } } });
  return { db: load('storage/database'), faults, sql, load };
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
  const clock = { now: Date.now() };
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
    async completeVerifiedQuest(evidence) {
      awards++;
      assert.ok(evidence.distanceMeters >= 500);
      if (options.saveError) throw new Error('SQLite failed');
      return { awarded: true };
    },
  };
  const load = loader({
    react,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    'react-native': {
      AppState: { addEventListener: (_, listener) => {
        appStateListener = listener;
        return { remove() { appStateListener = undefined; } };
      } },
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
    '../storage/database': { isQuestCompleted: async () => false },
  }, clock);
  const Screen = load('screens/QuestRunScreen').default;
  function render() {
    cursor = 0;
    tree = Screen();
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
    starts: () => starts, removals: () => removals, awards: () => awards,
    leave: () => focusCleanup?.(),
    error: () => gpsError('GPS failed'),
    appState: state => appStateListener?.(state),
    fix(meters) { clock.now += 5000; callback(fix(clock.now, meters)); },
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
