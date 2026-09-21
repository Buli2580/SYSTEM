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

// Live GPS fixtures use wall time; freeze time only when a test explicitly injects a clock.
function loader(mocks, clock = { get now() { return Date.now(); } }) {
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
      // Native scheduling is outside Node; keep rendering the real components.
      if (name === 'react-native-reanimated') {
        const transition = { duration() { return this; }, delay() { return this; }, springify() { return this; } };
        return { default: { View: 'View', Text: 'Text' }, View: 'View', Text: 'Text',
          FadeInUp: transition, FadeIn: transition, FadeOut: transition,
          Easing: { inOut: x => x, ease: x => x, linear: x => x },
          useSharedValue: value => ({ value }), useAnimatedStyle: fn => fn(),
          withTiming: value => value, withRepeat: value => value, withSequence: (...v) => v.at(-1),
          cancelAnimation() {}, interpolate: (v, input, output) => output[0] };
      }
      if (name.startsWith('.')) return load(path.resolve(path.dirname(resolved), name));
      throw new Error('Unexpected dependency: ' + name);
    };
    vm.runInNewContext(source, {
      module, exports: module.exports, require: requireMock, console, Error, __DEV__: mocks.__DEV__ ?? false,
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

function databaseHarness(t, clock) {
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
  const load = loader(mocks, clock);
  return { db: load('storage/database'), faults, sql, load, reload: () => loader(mocks, clock)('storage/database'), reloadWorld: () => loader(mocks, clock)('storage/world') };
}
const evidence = { questId: 'first_movement_v1', verificationType: 'GPS_DISTANCE', verificationScore: 95, distanceMeters: 503.25, durationSeconds: 400 };

test('parallel completion awards once, persists one event and distance, preserves streak', async t => {
  const { db, sql } = databaseHarness(t);
  const initial = await db.loadOrCreatePlayer();
  initial.streak = 7;
  initial.totalRealXp = initial.realXp = 20;
  initial.totalDistanceMeters = 12;
  sql.prepare("UPDATE app_state SET value = ? WHERE key = 'player'").run(JSON.stringify(initial));
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
  let checkpoint = options.checkpoint ?? null;
  let backgroundSession = options.backgroundSession ?? null;
  let backgroundStarted = false;
  let disclosureCount = 0;
  let backgroundPermissionRequests = 0;
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
    ...startupFixture(),
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
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    'react-native': {
      AppState: appState,
      Alert: {
        alert(_title, _message, buttons = []) {
          disclosureCount++;
          const action = buttons.find(button => button?.text === 'KONTYNUUJ');
          action?.onPress?.();
        },
      },
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
      ActivityType: { Fitness: 1 },
      requestForegroundPermissionsAsync: () => options.permission?.promise ?? Promise.resolve({ status: 'granted' }),
      getBackgroundPermissionsAsync: () => Promise.resolve({ status: options.backgroundAlreadyGranted ? 'granted' : 'undetermined' }),
      requestBackgroundPermissionsAsync: () => {
        backgroundPermissionRequests++;
        return options.backgroundPermission?.promise ?? Promise.resolve({ status: 'granted' });
      },
      isBackgroundLocationAvailableAsync: async () => true,
      hasStartedLocationUpdatesAsync: async () => backgroundStarted,
      startLocationUpdatesAsync: async () => { backgroundStarted = true; },
      stopLocationUpdatesAsync: async () => { backgroundStarted = false; },
      hasServicesEnabledAsync: async () => true,
      async watchPositionAsync(_, onLocation, onError) {
        starts++; callback = onLocation; gpsError = onError;
        if (options.watch) await options.watch.promise;
        return { remove() { removals++; } };
      },
    },
    '../state/SystemProvider': { useSystem: () => context },
    '../storage/database': {
      getQuestAccess: async () => options.access ?? 'AVAILABLE',
      recordActivityAttempt: async () => {},
      beginQuestAttempt: async (_quest,id) => id,
      endQuestAttempt: async () => {},
      loadQuestCheckpoint: async () => checkpoint,
      saveQuestCheckpoint: async value => { checkpoint = JSON.parse(JSON.stringify(value)); },
      clearQuestCheckpoint: async () => { checkpoint = null; },
      loadBackgroundQuestSession: async () => backgroundSession,
      saveBackgroundQuestSession: async value => { backgroundSession = JSON.parse(JSON.stringify(value)); },
      updateBackgroundQuestSession: async (questId, patch) => {
        if (!backgroundSession || backgroundSession.questId !== questId) return null;
        backgroundSession = { ...backgroundSession, ...patch, updatedAt: new Date(clock.now).toISOString() };
        return backgroundSession;
      },
      clearBackgroundQuestSession: async questId => {
        if (!questId || backgroundSession?.questId === questId) backgroundSession = null;
      },
    },
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
  function button(label, node) {
    if (arguments.length < 2) node = tree;
    if (Array.isArray(node)) return node.map(n => button(label, n)).find(Boolean);
    if (!node || typeof node !== 'object') return undefined;
    if (typeof node.type === 'function' && node.type.name === 'MissionBriefing') return button(label, node.type(node.props));
    if (node.type === 'Pressable' && text(node).includes(label)) return node;
    return button(label, node.props?.children ?? null);
  }
  t.after(() => slots.forEach(slot => slot?.cleanup?.()));
  render();
  return {
    render, button,
    status: () => slots[0].value,
    distance: () => slots[2].value,
    starts: () => starts, removals: () => removals, awards: () => awards, checkpoint: () => checkpoint, backgroundSession: () => backgroundSession,
    disclosureCount: () => disclosureCount, backgroundPermissionRequests: () => backgroundPermissionRequests,
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
  const start = h.button('ROZPOCZNIJ MISJĘ').props.onPress;
  const first = start();
  await start();
  assert.equal(h.status(), 'STARTING');
  permission.resolve({ status: 'granted' });
  await first; await flush();
  assert.equal(h.starts(), 1);
  assert.equal(h.status(), 'STARTING');
  h.fix(0);
  assert.equal(h.status(), 'TRACKING');
});

test('late GPS subscription is removed after leaving; stale callbacks are ignored', async t => {
  const watch = deferred();
  const h = screenHarness(t, { watch });
  await flush(); h.render();
  const start = h.button('ROZPOCZNIJ MISJĘ').props.onPress();
  await flush();
  assert.equal(h.starts(), 1);
  h.leave();
  watch.resolve();
  await start; await flush();
  assert.equal(h.removals(), 1);
  h.fix(1000);
  assert.equal(h.awards(), 0);
});

test('GPS error removes the subscription and exits tracking', async t => {
  const h = screenHarness(t);
  await flush(); h.render();
  await h.button('ROZPOCZNIJ MISJĘ').props.onPress(); await flush();
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
    await h.button('ROZPOCZNIJ MISJĘ').props.onPress(); await flush();
    for (let meters = 0; meters <= 520; meters += 10) h.fix(meters);
    await flush();
    assert.equal(h.status(), saveError ? 'ERROR' : 'COMPLETED');
    assert.equal(h.awards(), 1);
    assert.equal(h.removals(), 1);
    h.fix(530);
    assert.equal(h.awards(), 1);
  });
}

test('background location disclosure is shown before the first background permission request', async t => {
  const h = screenHarness(t);
  await flush(); h.render();
  await h.button('ROZPOCZNIJ MISJĘ').props.onPress();
  await flush();
  assert.equal(h.disclosureCount(), 1);
  assert.equal(h.backgroundPermissionRequests(), 1);
});

test('already granted background location skips repeated disclosure', async t => {
  const h = screenHarness(t, { backgroundAlreadyGranted: true });
  await flush(); h.render();
  await h.button('ROZPOCZNIJ MISJĘ').props.onPress();
  await flush();
  assert.equal(h.disclosureCount(), 0);
  assert.equal(h.backgroundPermissionRequests(), 1);
});

test('permission dialog and transient AppState before GPS subscription do not stop STARTING', async t => {
  const permission = deferred();
  const watch = deferred();
  const h = screenHarness(t, { permission, watch });
  await flush(); h.render();
  const start = h.button('ROZPOCZNIJ MISJĘ').props.onPress();
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
  await start; await flush();
  assert.equal(h.status(), 'TRACKING');
  assert.equal(h.awards(), 0);
});

test('real background hands GPS off without failing and foreground can resume without remounting', async t => {
  const h = screenHarness(t);
  await flush(); h.render();
  await h.button('ROZPOCZNIJ MISJĘ').props.onPress(); await flush();
  h.fix(0);
  assert.equal(h.status(), 'TRACKING');
  h.appState('background');
  assert.equal(h.status(), 'TRACKING');
  assert.equal(h.removals(), 1);
  await flush();
  assert.equal(h.backgroundSession()?.mode, 'BACKGROUND');
  h.appState('active');
  await flush(); h.render();
  assert.equal(h.status(), 'READY');
  await h.button('ROZPOCZNIJ MISJĘ').props.onPress();
  assert.equal(h.starts(), 2);
  h.fix(0);
  assert.equal(h.status(), 'TRACKING');
});

test('background with a watcher but before the first fix hands off without fabricating distance', async t => {
  const h = screenHarness(t);
  await flush(); h.render();
  await h.button('ROZPOCZNIJ MISJĘ').props.onPress(); await flush();
  assert.equal(h.status(), 'STARTING');
  h.appState('background');
  assert.equal(h.status(), 'STARTING');
  assert.equal(h.removals(), 1);
  await flush();
  assert.equal(h.checkpoint(), null);
  assert.equal(h.backgroundSession()?.mode, 'BACKGROUND');
});

test('a second GPS quest cannot replace an active background quest after restart', async t => {
  const owner = {
    questId: 'daily:2026-09-18:walk_protocol_1',
    attemptId: 'background-owner',
    mode: 'BACKGROUND',
    extendedGoal: false,
    updatedAt: new Date().toISOString(),
  };
  const h = screenHarness(t, { backgroundSession: owner });
  await flush(); h.render();
  await h.button('ROZPOCZNIJ MISJĘ').props.onPress();
  await flush(); h.render();
  assert.equal(h.status(), 'ERROR');
  assert.equal(h.starts(), 0);
  assert.equal(h.backgroundSession()?.questId, owner.questId);
  assert.equal(h.backgroundSession()?.attemptId, owner.attemptId);
});

test('GPS distance checkpoint survives background and returns with the same meters', async t => {
  const h = screenHarness(t);
  await flush(); h.render();
  await h.button('ROZPOCZNIJ MISJĘ').props.onPress();
  h.fix(0);
  for (let meters = 10; meters <= 220; meters += 10) h.fix(meters);
  await flush();
  const savedBefore = h.distance();
  assert.ok(savedBefore >= 200 && savedBefore < 500);
  h.appState('background');
  await flush();
  assert.ok(h.checkpoint());
  assert.equal(Math.round(h.checkpoint().distanceMeters), Math.round(savedBefore));
  assert.equal(h.backgroundSession()?.mode, 'BACKGROUND');
  h.appState('active');
  await flush(); h.render();
  assert.equal(h.status(), 'READY');
  assert.equal(Math.round(h.distance()), Math.round(savedBefore));
  assert.ok(h.button('WZNÓW MISJĘ'));
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
  await h.button('ROZPOCZNIJ MISJĘ').props.onPress(); await flush();
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

test('focus timer keeps counting while the app is backgrounded', async t => {
  const h = screenHarness(t, { questId: 'focus_protocol_v1' });
  await flush(); h.render();
  await h.button('ROZPOCZNIJ MISJĘ').props.onPress(); await flush();
  h.render(); h.advance(599);
  h.appState('background');
  assert.equal(h.status(), 'TRACKING');
  h.advance(1);
  await flush();
  assert.equal(h.status(), 'COMPLETED');
  assert.equal(h.awards(), 1);
});

test('leaving focus screen cancels the timer without an award', async t => {
  const h = screenHarness(t, { questId: 'focus_protocol_v1' });
  await flush(); h.render();
  await h.button('ROZPOCZNIJ MISJĘ').props.onPress(); await flush();
  h.render(); h.advance(599); h.leave(); h.advance(10);
  await flush();
  assert.equal(h.awards(), 0);
});

test('background during focus STARTING prevents a delayed start', async t => {
  const h = screenHarness(t, { questId: 'focus_protocol_v1' });
  await flush(); h.render();
  const start = h.button('ROZPOCZNIJ MISJĘ').props.onPress();
  h.appState('background');
  await start; await flush();
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
      failure === 'chapter profile' ? source.startsWith('UPDATE app_state SET value = ?') && JSON.parse(params[0]).totalRealXp === 600 :
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
    assert.equal(h.button('ROZPOCZNIJ MISJĘ'), undefined);
    assert.equal(h.starts(), 0);
    assert.equal(h.awards(), 0);
  }
});

test('double click on focus START creates only one timer and one reward', async t => {
  const h = screenHarness(t, { questId: 'focus_protocol_v1' });
  await flush(); h.render();
  const start = h.button('ROZPOCZNIJ MISJĘ').props.onPress;
  await Promise.all([start(), start()]); await flush();
  h.render(); h.advance(600); await flush();
  assert.equal(h.awards(), 1);
});

test('MULTI waits for ten minutes after reaching 600 meters early', async t => {
  const h = screenHarness(t, { questId: 'final_trial_v1' });
  await flush(); h.render();
  await h.button('ROZPOCZNIJ MISJĘ').props.onPress(); await flush();
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
  await h.button('ROZPOCZNIJ MISJĘ').props.onPress(); await flush();
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

test('MULTI hands movement off on background or screen leave instead of invalidating the attempt', async t => {
  for (const interrupt of ['background', 'leave']) {
    const h = screenHarness(t, { questId: 'final_trial_v1' });
    await flush(); h.render();
    await h.button('ROZPOCZNIJ MISJĘ').props.onPress(); await flush();
    h.fix(0); h.render(); h.fix(10);
    if (interrupt === 'leave') h.leave(); else h.appState('background');
    await flush();
    assert.equal(h.awards(), 0);
    assert.equal(h.removals(), 1);
    assert.equal(h.backgroundSession()?.mode, 'BACKGROUND');
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
  Object.assign(context, { ...startupFixture(), refreshPlayer: async () => {}, ...context });
  const navigation = [];
  const jsx = (type, props) => typeof type === 'function' ? type(props) : ({ type, props });
  const load = loader({
    'react': { useState: value => [value, () => {}], useCallback: fn => fn },
    '../components/world/WorldMap': { __esModule: true, default: 'WorldMap' },
    '../components/world/DiscoveryToast': { __esModule: true, default: 'DiscoveryToast' },
    '../world/useWorldTracking': { useWorldTracking: () => ({ status: 'PAUSED', sectorIds: [], signal: null, fix: null }) },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { ScrollView: 'ScrollView', Pressable: 'Pressable', Text: 'Text', View: 'View', StyleSheet: { create: s => s } },
    'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView', useSafeAreaInsets: () => ({ top: 24, bottom: 0 }) },
    'expo-router': { useFocusEffect: fn => fn(), usePathname: () => '/', useRouter: () => ({ push: value => navigation.push(value), replace: value => navigation.push(value) }) },
    '../state/SystemProvider': { useSystem: () => context },
    '../components/SystemPage': { __esModule: true, default: 'SystemPage', pageStyles: {} },
  });
  return { load, navigation };
}

test('shared navigation connects all five real tabs without stacking pushes', () => {
  const { load, navigation } = uiHarness();
  const buttons = findButtons(load('components/BottomNavigation').default());
  assert.equal(buttons.length, 5);
  for (const button of buttons) {
    if (button.props.disabled) assert.match(treeText(button), /WKRÓTCE/);
    else button.props.onPress();
  }
  assert.deepEqual(navigation, ['/', '/quests', '/character', '/world', '/more']);
});

test('Quest list uses persisted completion IDs and locks subsequent cards', () => {
  const { load, navigation } = uiHarness({ completedQuestIds: ['first_movement_v1'], activeQuestId: null });
  const tree = load('screens/QuestsScreen').default();
  const buttons = findButtons(tree).filter(b => b.props.accessibilityLabel?.includes(' — '));
  assert.equal(buttons.length, 3);
  assert.match(treeText(buttons[0]), /COMPLETED/);
  assert.match(treeText(buttons[1]), /AVAILABLE/);
  assert.equal(buttons[2].props.disabled, true);
  buttons[1].props.onPress();
  assert.equal(navigation[0].params.questId, 'focus_protocol_v1');
});

test('World gates online content and displays real profile statistics only after unlock', () => {
  const context = { ready: true, worldUnlocked: false, player: { discoveredSectors: 0, totalDistanceMeters: 1103 } };
  const { load } = uiHarness(context);
  const Screen = load('screens/WorldScreen').default;
  assert.match(treeText(Screen()), /ŚWIAT ZABLOKOWANY/);
  assert.doesNotMatch(treeText(Screen()), /STATUS ŚWIATA: ONLINE/);
  context.worldUnlocked = true;
  const text = treeText(Screen());
  assert.match(text, /STATUS ŚWIATA: ONLINE/);
  assert.match(text, /1.10 KM/);
  assert.match(text, /URUCHOM ŚWIAT/);
  assert.doesNotMatch(text, /EKSPLORACJA ZABLOKOWANA/);
});

// SYSTEM WORLD regressions exercise the same real SQLite adapter and pure controller.
async function unlockWorld(h) {
  await h.db.loadSystemState();
  await h.db.completeVerifiedQuest(evidence);
  await h.db.completeVerifiedQuest(focusEvidence);
  await h.db.completeVerifiedQuest(multiEvidence);
  return h.load('storage/world');
}
const worldFix = (latitude = 52, longitude = 19, accuracy = 5) => ({ ...fix(Date.now(), 0, accuracy), coords: { ...fix(Date.now(), 0, accuracy).coords, latitude, longitude } });

test('sector IDs are stable, bounds invert, crossing boundary creates a new sector', () => {
  const s = loader({})('world/sectors');
  const origin = { latitude: 52, longitude: 19 };
  const id = s.locationToSector(origin);
  assert.equal(id, s.locationToSector({ ...origin }));
  const [w, south, e, n] = s.sectorToBounds(id);
  assert.equal(s.locationToSector({ latitude: (south + n) / 2, longitude: (w + e) / 2 }), id);
  assert.notEqual(s.locationToSector({ latitude: (south + n) / 2, longitude: e + 0.000001 }), id);
  assert.equal(s.getNearbySectors(id).length, 169);
  const width = (e - w) * Math.PI / 180 * 6371000 * Math.cos(52 * Math.PI / 180);
  assert.ok(width > 80 && width < 150);
  assert.throws(() => s.sectorToBounds('18/999999/0'));
  assert.throws(() => s.locationToSector({ latitude: NaN, longitude: 0 }));
});
test('sector grid wraps the dateline and clamps polar latitudes', () => {
  const s = loader({})('world/sectors');
  assert.equal(s.locationToSector({ latitude: 0, longitude: 180 }), s.locationToSector({ latitude: 0, longitude: -180 }));
  for (const lat of [-90, 90]) assert.equal(s.sectorToBounds(s.locationToSector({ latitude: lat, longitude: 0 })).length, 4);
  assert.equal(new Set(s.getNearbySectors('18/0/100')).size, 169);
});
test('fog reveals only nearby discovered sectors and keeps distant areas covered', () => {
  const load = loader({}); const s = load('world/sectors'); const f = load('world/fog');
  const id = s.locationToSector({ latitude: 52, longitude: 19 });
  const [w, south, e, n] = s.sectorToBounds(id);
  function covered(fog, x, y) { return fog.features.some(({ geometry }) => {
    const ring = geometry.coordinates[0]; return x > ring[0][0] && x < ring[1][0] && y > ring[0][1] && y < ring[2][1];
  }); }
  const fog = f.buildFog(id, new Set([id]));
  assert.equal(covered(fog, (w + e) / 2, (south + n) / 2), false);
  assert.equal(covered(f.buildFog(id, new Set()), (w + e) / 2, (south + n) / 2), true);
  assert.equal(covered(fog, 1, 1), true);
  assert.ok(fog.features.length < 200);
});
test('World GPS rejects stale, mock, poor accuracy and teleport but permits cars', () => {
  const { acceptWorldLocation: accept } = loader({})('world/location');
  const first = fix(Date.now());
  assert.equal(accept({ ...fix(first.timestamp + 1000, 35) }, first, first.timestamp + 1000), true);
  assert.equal(accept(fix(first.timestamp + 1000, 10000), first, first.timestamp + 1000), false);
  assert.equal(accept({ ...first, mocked: true }, null), false);
  assert.equal(accept(fix(first.timestamp, 0, 100), null), false);
  assert.equal(accept(fix(first.timestamp - 20000), null), false);
  assert.equal(accept(first, first), false);
});
test('locked World rejects discovery, scan and completion without any writes', async t => {
  const h = databaseHarness(t); await h.db.loadSystemState(); const w = h.load('storage/world');
  await assert.rejects(w.discoverSector(worldFix()));
  await assert.rejects(w.scanSignal(worldFix()));
  await assert.rejects(w.locateSignal(worldFix(), 0));
  assert.equal(h.sql.prepare('SELECT count(*) AS n FROM discovered_sectors').get().n, 0);
  assert.equal(h.sql.prepare('SELECT count(*) AS n FROM world_signals').get().n, 0);
});
test('parallel discovery inserts once and survives restart without XP or distance', async t => {
  const h = databaseHarness(t); const w = await unlockWorld(h); const before = await h.db.loadSystemState();
  const results = await Promise.all(Array.from({ length: 8 }, () => w.discoverSector(worldFix())));
  assert.equal(results.filter(r => r.discovered).length, 1);
  const after = await h.reload().loadSystemState();
  assert.equal(after.player.discoveredSectors, 1);
  assert.equal(after.player.totalRealXp, before.player.totalRealXp);
  assert.equal(after.player.totalDistanceMeters, before.player.totalDistanceMeters);
  assert.equal((await w.loadWorld()).sectorIds.length, 1);
});
test('discovery rollback is retryable; no writes after cancellation', async t => {
  const h = databaseHarness(t); const w = await unlockWorld(h);
  h.faults.commit = true; await assert.rejects(w.discoverSector(worldFix()));
  assert.equal((await w.loadWorld()).sectorIds.length, 0);
  await assert.rejects(w.discoverSector(worldFix(), () => false));
  assert.equal((await w.discoverSector(worldFix())).discovered, true);
});
test('signal scan persists 420m target, does not award, duplicate scan and relocation are controlled', async t => {
  const h = databaseHarness(t); const w = await unlockWorld(h); const before = await h.db.loadSystemState();
  assert.equal((await w.loadWorld()).signal, null);
  const origin = worldFix(); const signal = await w.scanSignal(origin);
  const meters = h.load('world/signals').signalDistance(origin, signal);
  assert.ok(meters > 419 && meters < 421);
  assert.deepEqual(JSON.parse(JSON.stringify((await h.reloadWorld().loadWorld()).signal)), JSON.parse(JSON.stringify(signal)));
  assert.deepEqual(JSON.parse(JSON.stringify(await w.scanSignal(origin))), JSON.parse(JSON.stringify(signal)));
  const relocated = await Promise.all([w.scanSignal(origin, true, 0), w.scanSignal(origin, true, 0)]);
  assert.ok(relocated.every(s => s.revision === 1));
  assert.notEqual(relocated[0].latitude, signal.latitude);
  assert.equal((await h.db.loadSystemState()).player.totalRealXp, before.player.totalRealXp);
});
test('signal rejects outside radius, stale and imprecise fixes; awards once inside and after restart', async t => {
  const h = databaseHarness(t); const w = await unlockWorld(h); const origin = worldFix();
  const signal = await w.scanSignal(origin); const before = await h.db.loadSystemState();
  assert.equal((await w.locateSignal(origin, signal.revision)).awarded, false);
  const near = worldFix(signal.latitude, signal.longitude);
  await assert.rejects(w.locateSignal({ ...near, timestamp: Date.now() - 30000 }, signal.revision));
  assert.equal((await w.locateSignal(worldFix(signal.latitude, signal.longitude, 35), signal.revision)).awarded, false);
  const results = await Promise.all(Array.from({ length: 8 }, () => w.locateSignal(near, signal.revision)));
  assert.equal(results.filter(r => r.awarded).length, 1);
  const after = await h.reload().loadSystemState();
  assert.equal(after.player.totalRealXp, before.player.totalRealXp + 50);
  assert.equal(after.player.stats.RES.totalXp, before.player.stats.RES.totalXp + 40);
  assert.equal(after.player.gameEnergy, before.player.gameEnergy + 5);
  assert.equal(after.player.totalDistanceMeters, before.player.totalDistanceMeters);
  assert.equal((await w.locateSignal(near, signal.revision)).awarded, false);
  assert.equal((await w.scanSignal(near, true, signal.revision)).status, 'LOCATED');
});
for (const failure of ['INSERT INTO verified_events', 'UPDATE app_state SET value = ?', 'UPDATE world_signals', 'COMMIT']) {
  test('signal atomic rollback at ' + failure, async t => {
    const h = databaseHarness(t); const w = await unlockWorld(h); const signal = await w.scanSignal(worldFix());
    const before = await h.db.loadSystemState(); const near = worldFix(signal.latitude, signal.longitude);
    if (failure === 'COMMIT') h.faults.commit = true; else h.faults.statement = failure;
    await assert.rejects(w.locateSignal(near, signal.revision));
    assert.equal((await h.db.loadSystemState()).player.totalRealXp, before.player.totalRealXp);
    assert.equal((await w.loadWorld()).signal.status, 'DETECTED');
    assert.equal(h.sql.prepare('SELECT count(*) AS n FROM verified_events WHERE id = ?').get(signal.id).n, 0);
    assert.equal((await w.locateSignal(near, signal.revision)).awarded, true);
  });
}
test('invalid stored signal can be explicitly relocated; old revision cannot complete new target', async t => {
  const h = databaseHarness(t); const w = await unlockWorld(h); const original = await w.scanSignal(worldFix());
  h.sql.prepare('UPDATE world_signals SET latitude = 999').run();
  assert.equal((await w.loadWorld()).signalError, true);
  await assert.rejects(w.locateSignal(worldFix(), 0));
  const repaired = await w.scanSignal(worldFix(), true, original.revision);
  assert.equal((await w.loadWorld()).signalError, false);
  assert.equal((await w.locateSignal(worldFix(repaired.latitude, repaired.longitude), 0)).awarded, false);
});
test('world schema and reward events do not retain raw player GPS samples or home', async t => {
  const h = databaseHarness(t); const w = await unlockWorld(h); const signal = await w.scanSignal(worldFix());
  await w.discoverSector(worldFix()); await w.locateSignal(worldFix(signal.latitude, signal.longitude), signal.revision);
  const columns = h.sql.prepare('PRAGMA table_info(discovered_sectors)').all().map(c => c.name);
  assert.deepEqual(columns, ['sector_id', 'first_discovered_at']);
  const event = JSON.parse(h.sql.prepare('SELECT payload FROM verified_events WHERE id = ?').get(signal.id).payload);
  assert.equal(event.latitude, undefined); assert.equal(event.longitude, undefined);
  const tables = h.sql.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(t => t.name);
  assert.deepEqual(tables.sort(), ['app_state', 'chapter_completions', 'discovered_sectors', 'quest_completions', 'verified_events', 'world_signals', 'daily_sets', 'daily_instances', 'protocol_bonuses', 'story_progress', 'quest_attempts', 'story_events', 'boss_progress', 'cloud_outbox', 'boss_contributions', 'daily_generation', 'daily_rerolls', 'journey_activity', 'journey_milestones', 'journey_quests', 'journeys', 'legacy_goal_imports', 'player_goals', 'progression_claims', 'progression_contributions', 'sqlite_sequence'].sort());
});
function worldTrackingHarness(t, options = {}) {
  const load = loader({}); const { WorldTracking } = load('world/tracking');
  let foreground = true, watcherCallback, watcherError, removals = 0, starts = 0, discoveries = 0;
  const state = { sectorIds: [], signal: null, signalError: false };
  const location = {
    requestForegroundPermissionsAsync: options.permission ?? (async () => ({ granted: true, canAskAgain: true })),
    hasServicesEnabledAsync: async () => true,
    getCurrentPositionAsync: options.initial ?? (async () => worldFix()),
    watchPositionAsync: async (_options, callback, error) => {
      starts++; watcherCallback = callback; watcherError = error;
      if (options.watch) await options.watch;
      return { remove: () => { removals++; } };
    },
  };
  const storage = {
    loadWorld: async () => state,
    discoverSector: async point => { discoveries++; return { sectorId: load('world/sectors').locationToSector(point.coords), discovered: true }; },
    scanSignal: async point => load('world/signals').generateSignal(point),
    locateSignal: async () => { throw new Error('not expected'); },
    ...options.storage,
  };
  const tracker = new WorldTracking({ location, storage, accuracy: 4, foreground: () => foreground,
    unlocked: () => options.unlocked !== false, changed: () => {}, rewarded: () => {}, feedback: () => {}, timeoutMs: options.timeoutMs });
  t.after(() => tracker.stop());
  return { tracker, location, storage, starts: () => starts, removals: () => removals, discoveries: () => discoveries,
    appState: state => { foreground = state === 'active'; tracker.onAppState(state); },
    fix: value => watcherCallback?.(value), fail: () => watcherError?.('failed') };
}
test('World permission dialog before watcher does not pause; double start creates one watcher', async t => {
  let resolve; const permission = new Promise(r => { resolve = r; });
  const h = worldTrackingHarness(t, { permission: () => permission });
  const starting = h.tracker.start(); await flush();
  h.appState('background'); assert.equal(h.tracker.state.status, 'STARTING');
  await h.tracker.start(); h.appState('active'); resolve({ granted: true }); await starting;
  assert.equal(h.tracker.state.status, 'ACTIVE'); assert.equal(h.starts(), 1);
});
test('World AppState pauses watcher, ignores late fixes, and can resume without restart', async t => {
  const h = worldTrackingHarness(t); await h.tracker.start();
  assert.equal(h.discoveries(), 1); h.appState('background');
  assert.equal(h.tracker.state.status, 'PAUSED'); assert.equal(h.removals(), 1);
  h.fix(worldFix(52.01, 19)); await flush(); assert.equal(h.discoveries(), 1);
  h.appState('active'); await h.tracker.start(); assert.equal(h.starts(), 2);
});
test('late World watcher is removed after leaving during STARTING', async t => {
  let resolve; const watch = new Promise(r => { resolve = r; });
  const h = worldTrackingHarness(t, { watch }); const starting = h.tracker.start(); await flush();
  h.tracker.stop(); resolve(); await starting;
  assert.equal(h.removals(), 1); assert.equal(h.discoveries(), 0);
});
test('World timeout clears STARTING and removes a watcher that resolves too late', async t => {
  let resolve; const watch = new Promise(r => { resolve = r; });
  const h = worldTrackingHarness(t, { watch, timeoutMs: 10 });
  await h.tracker.start(); assert.equal(h.tracker.state.status, 'ERROR');
  resolve(); await flush(); assert.equal(h.removals(), 1);
});
test('World permission denial is retryable and permanent denial is exposed', async t => {
  const h = worldTrackingHarness(t, { permission: async () => ({ granted: false, canAskAgain: false }) });
  await h.tracker.start(); assert.equal(h.tracker.state.status, 'DENIED'); assert.equal(h.tracker.state.permanentDenial, true);
  assert.equal(h.starts(), 0);
  h.location.requestForegroundPermissionsAsync = async () => ({ granted: true });
  await h.tracker.start(); assert.equal(h.tracker.state.status, 'ACTIVE');
});
test('World SQLite and watcher errors stop tracking and allow retry', async t => {
  const h = worldTrackingHarness(t); h.storage.discoverSector = async () => { throw new Error('disk full'); };
  await h.tracker.start(); assert.equal(h.tracker.state.status, 'ERROR'); assert.equal(h.removals(), 1);
  h.storage.discoverSector = async () => ({ sectorId: '18/0/0', discovered: true });
  await h.tracker.start(); assert.equal(h.tracker.state.status, 'ACTIVE');
  h.fail(); assert.equal(h.tracker.state.status, 'ERROR'); assert.equal(h.removals(), 2);
});
test('World scan failure leaves no infinite SCANNING and locked World starts no GPS', async t => {
  const locked = worldTrackingHarness(t, { unlocked: false }); await locked.tracker.start(); assert.equal(locked.starts(), 0);
  const h = worldTrackingHarness(t, { storage: { scanSignal: async () => { throw new Error('write failed'); } } });
  await h.tracker.start(); await h.tracker.scan();
  assert.equal(h.tracker.state.scanning, false); assert.equal(h.tracker.state.status, 'ERROR');
});
test('World screen has scan/relocate but no manual completion action', () => {
  const source = fs.readFileSync(path.join(root, 'src/system2/screens/WorldScreen.tsx'), 'utf8');
  assert.match(source, /SZUKAJ SYGNAŁU/); assert.match(source, /PRZENIEŚ SYGNAŁ/);
  assert.doesNotMatch(source, /locateSignal\(|JESTEM NA MIEJSCU/);
});

test('World tracking automatically locates a persisted signal from verified GPS, without a completion button', async t => {
  const h = databaseHarness(t); const w = await unlockWorld(h); const signal = await w.scanSignal(worldFix());
  const before = await h.db.loadSystemState();
  const tracking = worldTrackingHarness(t, { initial: async () => worldFix(signal.latitude, signal.longitude), storage: w });
  await tracking.tracker.start();
  assert.equal(tracking.tracker.state.signal.status, 'LOCATED');
  assert.equal((await h.db.loadSystemState()).player.totalRealXp, before.player.totalRealXp + 50);
  tracking.tracker.stop(); await tracking.tracker.start();
  assert.equal((await h.db.loadSystemState()).player.totalRealXp, before.player.totalRealXp + 50);
});
test('ambiguous signal commit can be retried after restart without a second award', async t => {
  const h = databaseHarness(t); const w = await unlockWorld(h); const signal = await w.scanSignal(worldFix());
  const near = worldFix(signal.latitude, signal.longitude); const before = await h.db.loadSystemState();
  h.faults.afterCommit = true; await assert.rejects(w.locateSignal(near, signal.revision));
  assert.equal((await h.reloadWorld().locateSignal(near, signal.revision)).awarded, false);
  assert.equal((await h.db.loadSystemState()).player.totalRealXp, before.player.totalRealXp + 50);
});
test('World initial fix timeout and GPS unavailable are recoverable errors', async t => {
  const h = worldTrackingHarness(t, { initial: () => new Promise(() => {}), timeoutMs: 10 });
  await h.tracker.start(); assert.equal(h.tracker.state.status, 'ERROR'); assert.equal(h.starts(), 0);
  h.location.getCurrentPositionAsync = async () => worldFix();
  h.location.hasServicesEnabledAsync = async () => false;
  await h.tracker.start(); assert.equal(h.tracker.state.status, 'ERROR');
  h.location.hasServicesEnabledAsync = async () => true;
  await h.tracker.start(); assert.equal(h.tracker.state.status, 'ACTIVE');
});
test('World scan timeout resets SCANNING; duplicate scan dispatches only once', async t => {
  let count = 0;
  const h = worldTrackingHarness(t, { timeoutMs: 10, storage: { scanSignal: () => { count++; return new Promise(() => {}); } } });
  await h.tracker.start(); const pending = h.tracker.scan(); await h.tracker.scan(); await pending;
  assert.equal(count, 1); assert.equal(h.tracker.state.scanning, false); assert.equal(h.tracker.state.status, 'ERROR');
});
test('background while native watcher is being established cancels startup and removes it', async t => {
  let resolve; const watch = new Promise(r => { resolve = r; });
  const h = worldTrackingHarness(t, { watch }); const pending = h.tracker.start(); await flush();
  h.appState('background'); resolve(); await pending;
  assert.equal(h.tracker.state.status, 'PAUSED'); assert.equal(h.removals(), 1); assert.equal(h.discoveries(), 0);
});
test('returning GPS updates in a known sector do not write discovery again', async t => {
  const h = worldTrackingHarness(t); await h.tracker.start(); const initial = h.tracker.state.fix;
  h.fix({ ...initial, timestamp: initial.timestamp + 1000 }); await flush();
  assert.equal(h.discoveries(), 1);
});

test('new user sees onboarding until identity is atomically saved; restart does not repeat it', async t => {
  const h = databaseHarness(t); const first = await h.db.loadSystemState();
  assert.equal(first.onboardingComplete, false); assert.equal(first.player.realLevel, 1);
  assert.equal(first.player.totalRealXp, 0); assert.ok(Object.values(first.player.stats).every(s => s.level === 1 && s.totalXp === 0));
  const results = await Promise.all([h.db.finishOnboarding('NOVA'), h.db.finishOnboarding('OTHER')]);
  assert.ok(results.every(s => s.onboardingComplete && s.player.displayName === 'NOVA'));
  const reloaded = await h.reload().loadSystemState();
  assert.equal(reloaded.onboardingComplete, true); assert.equal(reloaded.player.displayName, 'NOVA');
  assert.equal(reloaded.player.totalRealXp, 0);
});
test('legacy unversioned profile and verified history migrate without onboarding or progress reset', async t => {
  const h = databaseHarness(t);
  h.sql.exec(`CREATE TABLE app_state(key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE quest_completions(quest_id TEXT PRIMARY KEY, completed_at TEXT NOT NULL);
    CREATE TABLE verified_events(id TEXT PRIMARY KEY, quest_id TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL);`);
  const core = h.load('core'); const player = core.addRealXp(core.createNewPlayer('EXISTING'), 320);
  h.sql.prepare('INSERT INTO app_state VALUES (?, ?)').run('player', JSON.stringify(player));
  h.sql.prepare('INSERT INTO quest_completions VALUES (?, ?)').run(evidence.questId, new Date().toISOString());
  const migrated = await h.db.loadSystemState();
  assert.equal(migrated.onboardingComplete, true); assert.equal(migrated.player.totalRealXp, 320);
  assert.equal(migrated.player.id, player.id); assert.equal(migrated.player.displayName, 'EXISTING');
  assert.ok(migrated.completedQuestIds.includes(evidence.questId));
  assert.equal(h.sql.prepare('PRAGMA user_version').get().user_version,h.load('storage/migrations').SCHEMA_VERSION);
  assert.equal((await h.reload().loadSystemState()).player.totalRealXp, 320);
});
for (const version of [1, 2, 3, 4]) test('schema version ' + version + ' upgrades to canonical schema preserving World and profile', async t => {
  const h = databaseHarness(t); const w = await unlockWorld(h); await w.discoverSector(worldFix()); await w.scanSignal(worldFix());
  const before = await h.db.loadSystemState(); h.sql.exec('PRAGMA user_version = ' + version);
  if (version < 3) h.sql.prepare("DELETE FROM app_state WHERE key = 'onboarding_complete'").run();
  else h.sql.prepare("UPDATE app_state SET value='true' WHERE key='onboarding_complete'").run();
  const after = await h.reload().loadSystemState();
  assert.equal(after.onboardingComplete, true); assert.equal(after.player.totalRealXp, before.player.totalRealXp);
  assert.equal(after.player.discoveredSectors, 1); assert.ok((await h.reloadWorld().loadWorld()).signal);
  assert.equal(h.sql.prepare('PRAGMA user_version').get().user_version,h.load('storage/migrations').SCHEMA_VERSION);
});
test('failed migration rolls back version and retries; future schema is not downgraded', async t => {
  const h = databaseHarness(t); h.faults.commit = true;
  await assert.rejects(h.db.loadSystemState()); assert.equal(h.sql.prepare('PRAGMA user_version').get().user_version, 0);
  await h.db.loadSystemState(); h.sql.exec('PRAGMA user_version = 99');
  await assert.rejects(h.reload().loadSystemState()); assert.equal(h.sql.prepare('PRAGMA user_version').get().user_version, 99);
});
test('identity updates preserve concurrent reward XP and persist avatar/name', async t => {
  const h = databaseHarness(t); await h.db.loadSystemState();
  await Promise.all([h.db.updateIdentity({ displayName: 'NOVA', avatarUri: 'file:///app/system2-avatars/avatar.jpg' }), h.db.completeVerifiedQuest(evidence)]);
  let state = await h.reload().loadSystemState(); assert.equal(state.player.displayName, 'NOVA');
  assert.equal(state.player.avatarUri, 'file:///app/system2-avatars/avatar.jpg'); assert.equal(state.player.totalRealXp, 100);
  await h.db.updateIdentity({ avatarUri: null }); state = await h.db.loadSystemState(); assert.equal(state.player.avatarUri, undefined);
  await assert.rejects(h.db.updateIdentity({ avatarUri: 'https://example.com/private.jpg' }));
  await assert.rejects(h.db.updateIdentity({ displayName: ' ' }));
});
test('Title unlocks follow real milestones and selection survives restart', async t => {
  const h = databaseHarness(t); await h.db.loadSystemState();
  await assert.rejects(h.db.updateIdentity({ currentTitle: 'AWAKENED' }));
  const w = await unlockWorld(h); assert.ok((await h.db.loadSystemState()).titles.includes('AWAKENED'));
  await h.db.updateIdentity({ currentTitle: 'AWAKENED' }); assert.equal((await h.reload().loadSystemState()).player.currentTitle, 'AWAKENED');
  await assert.rejects(h.db.updateIdentity({ currentTitle: 'SIGNAL HUNTER' }));
  const signal = await w.scanSignal(worldFix()); await w.locateSignal(worldFix(signal.latitude, signal.longitude), signal.revision);
  await h.db.updateIdentity({ currentTitle: 'SIGNAL HUNTER' }); assert.equal((await h.reload().loadSystemState()).player.currentTitle, 'SIGNAL HUNTER');
});
test('dominant skill uses total XP; origin is balanced and tied leaders remain mixed', () => {
  const load = loader({}); const core = load('core'); const { dominantSkill } = load('identity/model');
  let player = core.createNewPlayer(); assert.equal(dominantSkill(player), 'BALANCED ORIGIN');
  player = core.addSkillXp(player, 'VIT', 80); assert.equal(dominantSkill(player), 'VIT');
  player = core.addSkillXp(player, 'WIL', 80); assert.equal(dominantSkill(player), 'MIXED BUILD');
});
test('Evolution thresholds and Rank promotion use one progression service', () => {
  const core = loader({})('core');
  assert.equal(core.evolutionForLevel(1), 0); assert.equal(core.evolutionForLevel(9), 0);
  assert.equal(core.evolutionForLevel(10), 1); assert.equal(core.evolutionForLevel(24), 1); assert.equal(core.evolutionForLevel(25), 2);
  assert.equal(core.rankForLevel(9), 'E'); assert.equal(core.rankForLevel(10), 'D');
});
test('reward receipt detects multi-level jump and Rank promotion from before/after', () => {
  const load = loader({}); const core = load('core'); const { rewardReceipt, hasLevelUp } = load('core/rewards');
  const before = core.createNewPlayer();
  let xp = 0; for (let level = 1; level < 12; level++) xp += core.xpNeededForRealLevel(level);
  const after = core.addRealXp(before, xp); const receipt = rewardReceipt('test', before, after);
  assert.equal(receipt.afterLevel, 12); assert.equal(receipt.beforeRank, 'E'); assert.equal(receipt.afterRank, 'D');
  assert.equal(hasLevelUp(receipt), true); assert.equal(hasLevelUp(rewardReceipt('none', after, after)), false);
});
test('quest receipt includes actual chapter bonus, skill awards and World unlock; retry has no new receipt', async t => {
  const h = databaseHarness(t); await h.db.loadSystemState(); await h.db.completeVerifiedQuest(evidence); await h.db.completeVerifiedQuest(focusEvidence);
  const result = await h.db.completeVerifiedQuest(multiEvidence);
  assert.equal(result.receipt.realXp, 420); assert.equal(result.receipt.energy, 15);
  assert.equal(result.receipt.skillXp.VIT, 60); assert.equal(result.receipt.skillXp.WIL, 60);
  assert.equal(result.receipt.distanceMeters, multiEvidence.distanceMeters); assert.equal(result.receipt.worldUnlocked, true);
  assert.ok(result.receipt.newTitles.includes('AWAKENED'));
  assert.ok(result.receipt.skillLevels.some(s => s.key === 'VIT'));
  assert.equal((await h.db.completeVerifiedQuest(multiEvidence)).receipt, undefined);
});
test('World signal receipt comes from the committed reward without quest distance', async t => {
  const h = databaseHarness(t); const w = await unlockWorld(h); const signal = await w.scanSignal(worldFix());
  const result = await w.locateSignal(worldFix(signal.latitude, signal.longitude), 0);
  assert.equal(result.receipt.realXp, 50); assert.equal(result.receipt.skillXp.RES, 40); assert.equal(result.receipt.energy, 5);
  assert.equal(result.receipt.distanceMeters, 0); assert.ok(result.receipt.newTitles.includes('SIGNAL HUNTER'));
});
test('System Log returns the latest 50 events and resolves missing catalog entries safely', async t => {
  const h = databaseHarness(t); await unlockWorld(h);
  const event = (await h.db.loadSystemLog())[0];
  for (let i = 0; i < 55; i++) {
    const entry = { ...event, id: 'old_' + i, questId: 'removed_quest', createdAt: new Date(Date.UTC(2030, 0, 1, 0, i)).toISOString() };
    h.sql.prepare('INSERT INTO verified_events VALUES (?, ?, ?, ?)').run(entry.id, entry.questId, JSON.stringify(entry), entry.createdAt);
  }
  const log = await h.db.loadSystemLog(); assert.equal(log.length, 50); assert.equal(log[0].id, 'old_54');
  const { activityName } = h.load('identity/history'); assert.equal(activityName('removed_quest'), 'ZDARZENIE SYSTEMU');
  assert.equal(activityName('first_world_signal_v1'), 'NIEZNANY SYGNAŁ'); assert.equal(activityName(evidence.questId), 'PIERWSZY RUCH');
});
test('settings persist across reload without changing gameplay data', async t => {
  const h = databaseHarness(t); await h.db.loadSystemState(); await h.db.completeVerifiedQuest(evidence);
  await h.db.saveSettings({ haptics: false, audio: true }); const next = await h.reload().loadSystemState();
  assert.equal(next.settings.haptics, false); assert.equal(next.settings.audio, true); assert.equal(next.player.totalRealXp, 100);
  await assert.rejects(async () => h.db.saveSettings({ haptics: 'yes', audio: false }));
});
test('all feedback calls respect Haptics OFF, then resume when enabled', async () => {
  let calls = 0;
  const feedback = loader({ 'expo-haptics': { ImpactFeedbackStyle: { Light: 1 }, NotificationFeedbackType: { Success: 1 }, impactAsync: async () => { calls++; }, notificationAsync: async () => { calls++; } } })('identity/feedback');
  feedback.configureHaptics(false); await feedback.impactAsync(); await feedback.notificationAsync(); assert.equal(calls, 0);
  feedback.configureHaptics(true); await feedback.impactAsync(); await feedback.notificationAsync(); assert.equal(calls, 2);
});
test('simple corrupt derived fields are repaired from XP totals; canonical corruption is not reset', async t => {
  const h = databaseHarness(t); await h.db.loadSystemState(); await h.db.completeVerifiedQuest(evidence);
  const player = (await h.db.loadSystemState()).player;
  player.realLevel = 0; player.rank = 'S'; player.realXp = -1; player.stats.VIT.level = 0; player.avatarEvolution = 2;
  h.sql.prepare("UPDATE app_state SET value = ? WHERE key='player'").run(JSON.stringify(player));
  const fixed = (await h.reload().loadSystemState()).player;
  assert.equal(fixed.realLevel, 1); assert.equal(fixed.realXp, 100); assert.equal(fixed.rank, 'E'); assert.equal(fixed.avatarEvolution, 0); assert.equal(fixed.stats.VIT.level, 1);
  fixed.gameEnergy = -3; const corrupt = JSON.stringify(fixed);
  h.sql.prepare("UPDATE app_state SET value = ? WHERE key='player'").run(corrupt);
  await assert.rejects(h.reload().loadSystemState()); assert.equal(h.sql.prepare("SELECT value FROM app_state WHERE key='player'").get().value, corrupt);
});
test('reset requires both confirmation stages and exact text, cancelling invalidates confirmation', () => {
  const guard = loader({})('identity/reset').createResetConfirmation();
  assert.throws(() => guard.confirmErase('RESET')); guard.begin(); assert.throws(() => guard.confirmErase('RESET'));
  guard.confirmWarning(); assert.throws(() => guard.confirmErase('reset')); guard.cancel(); assert.throws(() => guard.confirmErase('RESET'));
  guard.begin(); guard.confirmWarning(); assert.equal(guard.confirmErase('RESET'), true); assert.throws(() => guard.confirmErase('RESET'));
});
test('full reset removes SYSTEM progress, identity, World, preferences and history atomically', async t => {
  const h = databaseHarness(t); const w = await unlockWorld(h); await w.discoverSector(worldFix()); await w.scanSignal(worldFix());
  await h.db.updateIdentity({ avatarUri: 'file:///app/system2-avatars/test.jpg', displayName: 'OLD' }); await h.db.saveSettings({ audio: true, haptics: false });
  await assert.rejects(h.db.resetSystemData(false)); const next = await h.db.resetSystemData(true);
  assert.equal(next.player.totalRealXp, 0); assert.equal(next.player.totalDistanceMeters, 0); assert.equal(next.player.avatarUri, undefined);
  assert.equal(next.onboardingComplete, false); assert.equal(next.worldUnlocked, false); assert.equal(next.completedQuestIds.length, 0); assert.equal(next.settings.haptics, true);
  for (const table of ['verified_events','quest_completions','chapter_completions','discovered_sectors','world_signals']) assert.equal(h.sql.prepare(`SELECT count(*) AS n FROM ${table}`).get().n, 0);
  assert.equal(await h.db.hasAvatarCleanupPending(), true); await h.db.acknowledgeAvatarCleanup(); assert.equal(await h.db.hasAvatarCleanupPending(), false);
  assert.equal((await h.reload().loadSystemState()).onboardingComplete, false);
});
test('reset failure rolls back existing user data and settings', async t => {
  const h = databaseHarness(t); await unlockWorld(h); const before = await h.db.loadSystemState();
  h.faults.statement = 'DELETE FROM world_signals'; await assert.rejects(h.db.resetSystemData(true));
  const after = await h.db.loadSystemState(); assert.equal(after.player.totalRealXp, before.player.totalRealXp); assert.equal(after.worldUnlocked, true);
});
test('avatar copies to persistent app documents and cleanup never deletes gallery originals', async () => {
  const entries = new Set(['file:///gallery/original.png']);
  class Directory {
    constructor(...parts) { this.uri = parts.map(p => typeof p === 'string' ? p.replace(/\/$/, '') : p.uri.replace(/\/$/, '')).join('/') + '/'; }
    get exists() { return entries.has(this.uri); } create() { entries.add(this.uri); }
    delete() { for (const entry of [...entries]) if (entry.startsWith(this.uri)) entries.delete(entry); }
  }
  class File {
    constructor(...parts) { this.uri = parts.map(p => typeof p === 'string' ? p : p.uri.replace(/\/$/, '')).join('/'); }
    get exists() { return entries.has(this.uri); } async copy(target) { await flush(); assert.ok(this.exists); entries.add(target.uri); } delete() { entries.delete(this.uri); }
  }
  const avatar = loader({ 'expo-file-system': { Directory, File, Paths: { document: new Directory('file:///documents') } } })('identity/avatar');
  const uri = await avatar.persistAvatar('file:///gallery/original.png'); assert.ok(uri.startsWith('file:///documents/system2-avatars/')); assert.ok(entries.has(uri));
  avatar.removeOwnedAvatar('file:///gallery/original.png'); assert.ok(entries.has('file:///gallery/original.png'));
  avatar.removeOwnedAvatar(uri); assert.equal(entries.has(uri), false);
  const again = await avatar.persistAvatar('file:///gallery/original.png'); avatar.removeAllAvatars(); assert.equal(entries.has(again), false); assert.ok(entries.has('file:///gallery/original.png'));
});

// MVP 90: deterministic classifier, actual aggregation, protocol transactions and native-effect routing.
const activityLoad = loader({});
const classify = activityLoad('activity/classifier').classifyActivity;
function features(patch = {}) {
 return { distanceMeters: 1500, durationSeconds: 600, averageSpeedMps: 2.5, medianSpeedMps: 2.5,
 maxSpeedMps: 4, speedVariance: .3, accelerationChanges: 0, stops: 0, movingSeconds: 600, stationarySeconds: 0,
 gpsGaps: 0, rejectedSamples: 0, teleportCount: 0, sampleCount: 120, meanAccuracy: 5, maxAccuracy: 5, mocked: false, ...patch };
}
for (const [name, expected, patch, sensors, verdict, detected] of [
 ['normal walking','WALK',{ medianSpeedMps:1.4 },{},'VERIFIED','WALK'],
 ['fast walking','WALK',{ medianSpeedMps:2.3 },{steps:1100,cadence:120},'VERIFIED','WALK'],
 ['slow running','RUN',{ medianSpeedMps:2 },{steps:1400,cadence:140},'VERIFIED','RUN'],
 ['normal running','RUN',{ medianSpeedMps:3.2 },{},'VERIFIED','RUN'],
 ['fast running','RUN',{ medianSpeedMps:6, maxSpeedMps:8 },{steps:1800,cadence:180,motion:'PERIODIC'},'VERIFIED','RUN'],
 ['slow cycling','BIKE',{ medianSpeedMps:2.8 },{steps:0},'VERIFIED','BIKE'],
 ['normal cycling','BIKE',{ medianSpeedMps:7,speedVariance:.04 },{},'VERIFIED','BIKE'],
 ['vehicle','RUN',{ medianSpeedMps:15,averageSpeedMps:13,maxSpeedMps:22 },{},'REJECTED','VEHICLE'],
 ['stationary','WALK',{ distanceMeters:0,movingSeconds:0 },{},'REJECTED','STATIONARY'],
 ['teleports','RUN',{ teleportCount:5 },{},'REJECTED','RUN'],
 ['poor GPS','RUN',{ meanAccuracy:45 },{},'SUSPICIOUS','RUN'],
 ['GPS gaps','RUN',{ gpsGaps:12 },{},'SUSPICIOUS','RUN'],
 ['no steps running','RUN',{}, {steps:0},'REJECTED','BIKE'],
 ['steps running','RUN',{}, {steps:1500,cadence:150},'VERIFIED','RUN'],
 ['bike zero steps','BIKE',{ medianSpeedMps:6 },{steps:0},'VERIFIED','BIKE'],
 ['insufficient','RUN',{sampleCount:3,durationSeconds:10},{},'SUSPICIOUS','RUN'],
 ['bike 10 kmh as run','RUN',{ medianSpeedMps:10/3.6,speedVariance:.01 },{},'SUSPICIOUS','UNKNOWN'],
 ['bike 15 kmh as run','RUN',{ medianSpeedMps:15/3.6,speedVariance:.01 },{},'SUSPICIOUS','UNKNOWN'],
 ['slow car','RUN',{ medianSpeedMps:4,speedVariance:.02 },{},'SUSPICIOUS','UNKNOWN'],
 ['stationary phone fake GPS','RUN',{}, {motion:'STILL'},'REJECTED','RUN'],
 ['run single spike','RUN',{teleportCount:1,rejectedSamples:1},{},'VERIFIED','RUN'],
 ['run short stop','RUN',{stops:1,stationarySeconds:10},{},'VERIFIED','RUN'],
 ['run walk intervals','RUN',{stops:3,speedVariance:1.2,medianSpeedMps:2.8},{steps:1400,cadence:140},'VERIFIED','RUN'],
]) test('activity classifier: ' + name, () => {
 const e = classify(expected, features(patch), sensors);
 assert.equal(e.verdict, verdict); assert.equal(e.activityTypeDetected, detected);
 assert.ok(e.verificationScore >= 0 && e.verificationScore <= 100);
 if (verdict !== 'VERIFIED') assert.ok(e.reasonCodes.length);
 assert.equal(e.additionalProofRequired, verdict === 'SUSPICIOUS');
});
test('GPS cap, strong cap, missing watch and STRICT capability gating', () => {
 assert.equal(classify('RUN',features()).verificationScore,87);
 assert.equal(classify('RUN',features(),{steps:1500,cadence:150,motion:'PERIODIC'}).verificationScore,98);
 const c = activityLoad('activity/capabilities');
 assert.equal(c.supportsStrength('STANDARD'),true); assert.equal(c.supportsStrength('STRICT'),false);
 assert.equal(c.supportsStrength('ENHANCED'),false);
});
test('classifier reason codes, invalid aggregates and privacy projection', () => {
 assert.ok(classify('RUN',features({mocked:true})).reasonCodes.includes('MOCK_LOCATION'));
 assert.ok(classify('RUN',features({teleportCount:8})).reasonCodes.includes('GPS_TELEPORT'));
 assert.equal(classify('RUN',features({medianSpeedMps:NaN})).verdict,'REJECTED');
 const e=classify('RUN',features({rawRoute:[{latitude:52}],latitude:52}),{rawMotion:[1]});
 assert.equal(e.features.rawRoute,undefined); assert.equal(e.features.latitude,undefined); assert.equal(e.sensors.rawMotion,undefined);
});
test('GPS aggregate rejects spike without poisoning anchor and tracks pauses and gaps', () => {
 const w = activityLoad('activity/features').createActivityWindow(); let now=100000;
 for (let i=0;i<30;i++) { now+=5000; w.add(fix(now,i*10),now); }
 const before=w.features().distanceMeters;
 w.add(fix(now+1000,100000),now+1000); now+=5000; w.add(fix(now,300),now);
 assert.ok(w.features().distanceMeters > before); assert.equal(w.features().teleportCount,1);
 now+=10000; w.add(fix(now,300),now); assert.ok(w.features().stationarySeconds>=10);
 now+=30000; w.add(fix(now,340),now); assert.equal(w.features().gpsGaps,1);
 assert.ok(w.features().stops>=1);
 assert.equal(JSON.stringify(w.features()).includes('latitude'),false);
});
test('activity window memory and serialized aggregate remain bounded over long sessions', () => {
 const w=activityLoad('activity/features').createActivityWindow();
 for(let i=0;i<20000;i++) w.add(fix(100000+i*5000,i*7),100000+i*5000);
 assert.ok(JSON.stringify(w.features()).length<1000); assert.equal(w.features().sampleCount,20000);
});
const calendar=activityLoad('daily/calendar');
for (const [day,week] of [['2021-01-01','2020-W53'],['2021-01-04','2021-W01'],['2026-09-18','2026-W38'],['2024-12-30','2025-W01']]) test('ISO week '+day,()=>assert.equal(calendar.weekKey(day),week));
test('daily seed stable, preference pool curated, next day changes instance IDs',()=>{
 const {generateDaily}=activityLoad('daily/templates'); const prefs={walking:true,running:false,cycling:false};
 const a=generateDaily('player','2026-09-18',prefs),b=generateDaily('player','2026-09-18',prefs),c=generateDaily('player','2026-09-19',prefs);
 assert.equal(JSON.stringify(a),JSON.stringify(b)); assert.equal(a.length,3);
 assert.ok(a.every(q=>q.activityType!=='BIKE'&&q.activityType!=='RUN'));
 assert.ok(c.every(q=>!a.some(x=>x.id===q.id)));
 assert.ok(generateDaily('p','2026-09-18',{walking:false,running:false,cycling:false}).every(q=>q.verification.type==='TIMER'));
});
function dailyEvidence(h,id) {
 const q=h.load('quests/catalog').getQuest(id);
 if(q.verification.type==='TIMER') return {questId:id,verificationType:'TIMER',durationSeconds:q.verification.minimumDurationSeconds,verificationScore:100};
 const activity=classify(q.activityType,features({distanceMeters:q.verification.minimumDistanceMeters,medianSpeedMps:1.5}));
 return {questId:id,verificationType:'GPS_DISTANCE',durationSeconds:activity.features.durationSeconds,distanceMeters:activity.features.distanceMeters,verificationScore:activity.verificationScore,activity};
}
async function dailyHarness(t) {
 const clock={now:new Date(2026,8,18,10).getTime()}; const h=databaseHarness(t,clock); await unlockWorld(h); return {...h,clock};
}
test('daily parallel claims + clear atomic once, restart stable, next day + streak',async t=>{
 const h=await dailyHarness(t); const first=await h.db.loadSystemState(); const ids=first.daily.questIds;
 assert.equal(JSON.stringify((await h.reload().loadSystemState()).daily.questIds),JSON.stringify(ids));
 for(const id of ids) {
   const results=await Promise.all(Array.from({length:5},()=>h.db.completeVerifiedQuest(dailyEvidence(h,id))));
   assert.equal(results.filter(r=>r.awarded).length,1);
 }
 let s=await h.db.loadSystemState(); assert.equal(s.daily.completed,3); assert.equal(s.daily.clear,true);assert.equal(s.player.streak,1);
 assert.equal(h.sql.prepare("SELECT COUNT(*) AS n FROM protocol_bonuses WHERE kind='daily_clear'").get().n,1);
 const total=first.player.totalRealXp+ids.reduce((n,id)=>n+h.load('quests/catalog').getQuest(id).rewards.realXp,0)+75+200; // fifth direct quest also claims Weekly Quest Master
 assert.equal(h.sql.prepare("SELECT COUNT(*) AS n FROM progression_claims WHERE claim_key LIKE '%weekly_quest_master'").get().n,1);
 assert.equal(s.player.totalRealXp,total);
 await h.db.completeVerifiedQuest(dailyEvidence(h,ids[0]));assert.equal((await h.db.loadSystemState()).player.streak,1);
 h.clock.now+=86400000;s=await h.db.loadSystemState();assert.ok(s.daily.questIds.every(id=>!ids.includes(id)));
 for(const id of s.daily.questIds) await h.db.completeVerifiedQuest(dailyEvidence(h,id));
 s=await h.db.loadSystemState(); assert.equal(s.player.streak,2); assert.equal(s.daily.weeklyCompleted,6);assert.equal(s.daily.weeklyClear,true);
 assert.equal(h.sql.prepare("SELECT COUNT(*) AS n FROM protocol_bonuses WHERE kind='weekly_complete'").get().n,1);
 h.clock.now+=2*86400000;s=await h.db.loadSystemState();assert.equal(s.player.streak,0);assert.equal(s.daily.weeklyCompleted,0);
 for(const id of s.daily.questIds) await h.db.completeVerifiedQuest(dailyEvidence(h,id));
 s=await h.db.loadSystemState();assert.equal(s.player.streak,1);
 assert.equal(h.sql.prepare('SELECT COUNT(*) AS n FROM daily_instances').get().n,9);
});
test('clock rollback preserves daily and refuses reward; preferences cannot reroll same day',async t=>{
 const h=await dailyHarness(t);const before=await h.db.loadSystemState();
 await h.db.saveSettings({haptics:true,audio:false,activities:{walking:false,running:true,cycling:true}});
 assert.equal(JSON.stringify((await h.db.loadSystemState()).daily.questIds),JSON.stringify(before.daily.questIds));
 h.clock.now-=86400000;const after=await h.db.loadSystemState();assert.equal(after.daily.clockAnomaly,true);
 assert.equal(JSON.stringify(after.daily.questIds),JSON.stringify(before.daily.questIds));
 await assert.rejects(h.db.completeVerifiedQuest(dailyEvidence(h,before.daily.questIds[0])));
 assert.equal((await h.db.loadSystemState()).player.totalRealXp,before.player.totalRealXp);
 h.clock.now+=86400000;assert.equal((await h.db.loadSystemState()).daily.clockAnomaly,false);
});
for(const failure of ['INSERT INTO protocol_bonuses','INSERT INTO verified_events','UPDATE app_state','COMMIT']) test('Daily Clear rollback: '+failure,async t=>{
 const h=await dailyHarness(t);const ids=(await h.db.loadSystemState()).daily.questIds;
 for(const id of ids.slice(0,2)) await h.db.completeVerifiedQuest(dailyEvidence(h,id));
 const before=await h.db.loadSystemState();
 if(failure==='COMMIT') h.faults.commit=true;else h.faults.statement=failure;
 await assert.rejects(h.db.completeVerifiedQuest(dailyEvidence(h,ids[2])));
 const after=await h.db.loadSystemState();assert.equal(after.player.totalRealXp,before.player.totalRealXp);assert.equal(after.daily.completed,2);assert.equal(after.daily.clear,false);
 await h.db.completeVerifiedQuest(dailyEvidence(h,ids[2]));assert.equal((await h.db.loadSystemState()).daily.clear,true);
});
test('unassigned/stale daily and fabricated movement verdict cannot award',async t=>{
 const h=await dailyHarness(t); const s=await h.db.loadSystemState();
 await assert.rejects(h.db.completeVerifiedQuest(dailyEvidence(h,'daily:2026-09-17:focus_session')));
 const id=s.daily.questIds.find(id=>id.includes('walk_'));const e=dailyEvidence(h,id);
 e.activity.features.mocked=true;e.activity.verdict='VERIFIED';e.verificationScore=100;
 await assert.rejects(h.db.completeVerifiedQuest(e));assert.equal((await h.db.loadSystemState()).daily.completed,0);
});
test('activity daily session shares watcher, keeps checkpoint in background and resumes to completion',async t=>{
 const h=screenHarness(t,{questId:'daily:2026-09-18:walk_protocol_1'});await flush();h.render();await h.button('ROZPOCZNIJ MISJĘ').props.onPress();
 h.fix(0);h.render();h.fix(10);h.appState('background');h.render();assert.equal(h.removals(),1);assert.equal(h.awards(),0);
 await flush();assert.ok(h.checkpoint()?.distanceMeters>0);assert.equal(h.backgroundSession()?.mode,'BACKGROUND');
 h.appState('active');await flush();h.render();assert.equal(h.status(),'READY');await h.button('WZNÓW MISJĘ').props.onPress();await flush();h.fix(10);h.render();
 for(let meters=17;meters<=1522;meters+=7) h.fix(meters);
 await flush();assert.equal(h.awards(),1, `status=${h.status()} distance=${h.distance()}`);assert.equal(h.removals(),2);
});
for(const [name,on,time,granted,clear,expected] of [
 ['OFF',false,'19:00',true,false,0],['ON',true,'19:00',true,false,7],['denied',true,'19:00',false,false,0],['clear suppression',true,'19:00',true,true,6],
]) test('notification plan '+name,()=>{
 const plan=activityLoad('notifications/planner').reminderPlan(on,time,granted,clear,new Date(2026,8,18,10).getTime());assert.equal(plan.length,expected);
 if(clear) assert.ok(plan.every(n=>calendar.dayKey(n)!=='2026-09-18'));
});
test('notification rejects invalid times; DST uses local calendar not fixed 24 hours',()=>{
 const plan=activityLoad('notifications/planner').reminderPlan;
 for(const time of ['24:00','19:60','x','1:00']) assert.throws(()=>plan(true,time,true,false));
 assert.ok(plan(true,'19:00',true,false,new Date(2026,2,28,10).getTime()).every(n=>new Date(n).getHours()===19));
});
test('audio rewards prioritize one level-up, OFF prevents native player creation',()=>{
 let created=0;
 const load=loader({'expo-audio':{createAudioPlayer(){created++;return{play(){},remove(){}};}}});
 const a=load('identity/audio');a.configureAudio(false);a.playFeedback('QUEST_COMPLETE');assert.equal(created,0);
 assert.equal(a.rewardSound({beforeLevel:1,afterLevel:2,skillLevels:[]}), 'LEVEL_UP');
 assert.equal(a.rewardSound({beforeLevel:1,afterLevel:1,skillLevels:[]}), 'QUEST_COMPLETE');
 a.configureAudio(true);a.playFeedback('QUEST_START');assert.equal(created,0);a.stopAudio();
});


test('suspicious/rejected attempts persist aggregate verdict with zero reward and retry remains available',async t=>{
 const h=await dailyHarness(t);const before=await h.db.loadSystemState();const id=before.daily.questIds.find(id=>id.includes('walk_'));
 const e=classify('WALK',features({medianSpeedMps:3,speedVariance:.01}));assert.equal(e.verdict,'SUSPICIOUS');
 await h.db.recordActivityAttempt(id,e);let state=await h.reload().loadSystemState();
 assert.equal(state.player.totalRealXp,before.player.totalRealXp);assert.equal(state.daily.completed,0);assert.ok(state.daily.suspiciousQuestIds.includes(id));
 assert.equal(await h.db.getQuestAccess(id),'AVAILABLE');
 const entry=(await h.db.loadSystemLog()).find(e=>e.id==='attempt_'+id);assert.equal(entry.verified,false);assert.equal(entry.realXpAwarded,0);
 await h.db.completeVerifiedQuest(dailyEvidence(h,id));assert.equal((await h.db.loadSystemState()).daily.completed,1);
});
test('fifth weekly completion and bonus roll back together and retry exactly once',async t=>{
 const h=await dailyHarness(t);let state=await h.db.loadSystemState();
 for(const id of state.daily.questIds) await h.db.completeVerifiedQuest(dailyEvidence(h,id));
 h.clock.now+=86400000;state=await h.db.loadSystemState();await h.db.completeVerifiedQuest(dailyEvidence(h,state.daily.questIds[0]));
 const id=state.daily.questIds[1], before=await h.db.loadSystemState();assert.equal(before.daily.weeklyCompleted,4);
 h.faults.failWhen=(source,params)=>source.includes('INSERT INTO verified_events')&&String(params[0]).startsWith('weekly_complete:');
 await assert.rejects(h.db.completeVerifiedQuest(dailyEvidence(h,id)));
 state=await h.db.loadSystemState();assert.equal(state.daily.weeklyCompleted,4);assert.equal(state.player.totalRealXp,before.player.totalRealXp);
 await h.db.completeVerifiedQuest(dailyEvidence(h,id));state=await h.db.loadSystemState();assert.equal(state.daily.weeklyCompleted,5);assert.equal(state.daily.weeklyClear,true);
 await h.db.completeVerifiedQuest(dailyEvidence(h,id));assert.equal(h.sql.prepare("SELECT COUNT(*) AS n FROM protocol_bonuses WHERE kind='weekly_complete'").get().n,1);
});
test('genuine v3 migration adds tables without resetting profile or onboarding',async t=>{
 const h=databaseHarness(t);await h.db.loadSystemState();await h.db.finishOnboarding('BETA');await h.db.completeVerifiedQuest(evidence);
 h.sql.exec('DROP TABLE daily_instances; DROP TABLE daily_sets; DROP TABLE protocol_bonuses; PRAGMA user_version=3;');
 const before=h.sql.prepare("SELECT value FROM app_state WHERE key='player'").get().value;
 const state=await h.reload().loadSystemState();assert.equal(state.player.displayName,'BETA');assert.equal(state.onboardingComplete,true);
 assert.equal(h.sql.prepare("SELECT value FROM app_state WHERE key='player'").get().value,before);assert.equal(h.sql.prepare('PRAGMA user_version').get().user_version,h.load('storage/migrations').SCHEMA_VERSION);
});
test('settings notification and preferences persist with backward compatible defaults',async t=>{
 const h=databaseHarness(t);await h.db.loadSystemState();await h.db.saveSettings({haptics:false,audio:true,activities:{walking:true,running:true,cycling:false},dailyReminder:true,reminderTime:'20:30'});
 const s=(await h.reload().loadSystemState()).settings;assert.equal(s.reminderTime,'20:30');assert.equal(s.activities.running,true);
 await assert.rejects(async()=>h.db.saveSettings({...s,reminderTime:'25:00'}));assert.equal((await h.db.loadSystemState()).settings.reminderTime,'20:30');
});
test('notification service only manages its own IDs and serializes clear/OFF changes',async()=>{
 const scheduled=new Map([['legacy-reminder',{}]]);const calls=[];
 const notifications={
  getAllScheduledNotificationsAsync:async()=>[...scheduled.keys()].map(identifier=>({identifier})),
  cancelScheduledNotificationAsync:async id=>{calls.push(['cancel',id]);scheduled.delete(id);},
  getPermissionsAsync:async()=>({granted:true}),
  scheduleNotificationAsync:async n=>{calls.push(['add',n.identifier]);scheduled.set(n.identifier,n);return n.identifier;},
  SchedulableTriggerInputTypes:{DATE:'date'},
 };
 const service=loader({'expo-notifications':notifications,'react-native':{Platform:{OS:'android'}}},{now:new Date(2026,8,18,10).getTime()})('notifications/service');
 await service.syncReminders({dailyReminder:true,reminderTime:'19:00'},false,true);assert.equal(scheduled.size,8);
 await service.syncReminders({dailyReminder:true,reminderTime:'19:00'},true,true);assert.equal(scheduled.size,7);
 await Promise.all([service.syncReminders({dailyReminder:true,reminderTime:'20:00'},false,true),service.syncReminders({dailyReminder:false},false,true)]);
 assert.equal(scheduled.size,1);assert.ok(scheduled.has('legacy-reminder'));
});
test('activity with fabricated unsupported native sensors cannot claim enhanced XP confidence',async t=>{
 const h=await dailyHarness(t);const id=(await h.db.loadSystemState()).daily.questIds.find(id=>id.includes('walk_'));
 const e=dailyEvidence(h,id);e.activity.sensors={steps:1500,cadence:100};e.verificationScore=93;
 await assert.rejects(h.db.completeVerifiedQuest(e));assert.equal((await h.db.loadSystemState()).daily.completed,0);
});

test('ambiguous run ends without XP, removes GPS and can retry',async t=>{
 const h=screenHarness(t,{questId:'daily:2026-09-18:run_protocol_1'});await flush();h.render();await h.button('ROZPOCZNIJ MISJĘ').props.onPress(); await flush();
 h.fix(0);h.render();for(let m=15;m<=1020;m+=15) h.fix(m);await flush();h.render();
 assert.equal(h.status(),'ERROR');assert.equal(h.awards(),0);assert.equal(h.removals(),1);assert.ok(h.button('SPRÓBUJ PONOWNIE'));
});
test('repeatable daily timer verifies only full foreground duration and never starts GPS',async t=>{
 const h=screenHarness(t,{questId:'daily:2026-09-18:focus_session'});await flush();h.render();await h.button('ROZPOCZNIJ MISJĘ').props.onPress(); await flush();h.render();
 h.advance(899);await flush();assert.equal(h.awards(),0);h.advance(1);await flush();assert.equal(h.awards(),1);assert.equal(h.starts(),0);
});

for (const source of ['content://gallery/image/42','file:///cache/camera.jpg']) test('avatar waits for actual native copy: '+source,async()=>{
 const gate=deferred(), entries=new Set([source]);let destination;
 class Directory { constructor(...parts){this.uri=parts.map(p=>typeof p==='string'?p.replace(/\/$/,''):p.uri.replace(/\/$/,'')).join('/')+'/';} create(){} }
 class File {
  constructor(...parts){this.uri=parts.map(p=>typeof p==='string'?p:p.uri.replace(/\/$/,'')).join('/');}
  get exists(){return entries.has(this.uri);}
  async copy(target){destination=target.uri;await gate.promise;entries.add(target.uri);}
  delete(){entries.delete(this.uri);}
 }
 const mocks={'expo-file-system':{Directory,File,Paths:{document:new Directory('file:///documents')}}};
 const avatar=loader(mocks)('identity/avatar');let published=false;
 const pending=avatar.persistAvatar(source).then(uri=>{published=true;return uri;});await flush();
 assert.equal(published,false);assert.equal(entries.has(destination),false);
 gate.resolve();const uri=await pending;assert.ok(uri.startsWith('file:///documents/system2-avatars/'));assert.ok(entries.has(uri));assert.ok(entries.has(source));
 // Module recreation must not remove or recopy a persisted image.
 const reloaded=loader(mocks)('identity/avatar');assert.equal(reloaded.isOwnedAvatar(uri,'file:///documents/system2-avatars/'),true);assert.ok(entries.has(uri));
});
test('avatar native rejection preserves cause, removes partial destination, never deletes original',async()=>{
 const entries=new Set(['content://gallery/original']);const nativeError=new Error('Native copy denied');let dest;
 class Directory { constructor(...parts){this.uri=parts.map(p=>typeof p==='string'?p.replace(/\/$/,''):p.uri.replace(/\/$/,'')).join('/')+'/';}create(){} }
 class File {constructor(...parts){this.uri=parts.map(p=>typeof p==='string'?p:p.uri.replace(/\/$/,'')).join('/');}get exists(){return entries.has(this.uri);}async copy(target){dest=target.uri;entries.add(dest);await flush();throw nativeError;}delete(){entries.delete(this.uri);}}
 const avatar=loader({'expo-file-system':{Directory,File,Paths:{document:new Directory('file:///documents')}}})('identity/avatar');
 await assert.rejects(avatar.persistAvatar('content://gallery/original'),error=>error.cause===nativeError);
 assert.ok(entries.has('content://gallery/original'));assert.equal(entries.has(dest),false);
});
test('avatar ownership rejects outside files, traversal, encoded paths and unknown filenames',()=>{
 const {isOwnedAvatar}=loader({'expo-file-system':{}})('identity/avatar');const dir='file:///documents/system2-avatars/';
 assert.equal(isOwnedAvatar(dir+'avatar-123-abc.jpg',dir),true);
 for(const uri of [undefined,'file:///gallery/avatar-123.jpg',dir+'../original.jpg',dir+'%2e%2e%2foriginal.jpg',dir+'nested/avatar-123.jpg',dir+'original.jpg',dir+'avatar-123.jpg?x=1','content://gallery/avatar-1.jpg']) assert.equal(isOwnedAvatar(uri,dir),false);
});
test('safe viewport encloses scroll content, excludes bottom inset handled by navigation',()=>{
 const {load}=uiHarness({ready:true});const screen=load('components/SystemScreen').default({style:{flex:1},children:'content'});
 assert.equal(screen.type,'SafeAreaView');assert.equal(JSON.stringify(screen.props.edges),JSON.stringify(['top','left','right']));
 const page=load('components/SystemPage').default({title:'POSTAĆ',subtitle:'SYSTEM',children:'body'});
 assert.equal(page.type,'SafeAreaView');
 const scroll=nodesOfType(page,'ScrollView')[0];assert.equal(scroll.props.contentContainerStyle[1].paddingTop,20);
});

const storyFix=(h,...args)=>({...worldFix(...args),timestamp:h.clock.now});
async function worldLinkHarness(t) {
 const h=await dailyHarness(t);const w=h.load('storage/world');
 for(const id of (await h.db.loadSystemState()).daily.questIds) await h.db.completeVerifiedQuest(dailyEvidence(h,id));
 for(let n=0;n<3;n++) await w.discoverSector(storyFix(h,52+n*.002,19));
 const signal=await w.scanSignal(storyFix(h,));await w.locateSignal(storyFix(h,signal.latitude,signal.longitude),signal.revision);
 return h;
}
test('Story recognizes Chapter 1 and locks World Link before Awakening',async t=>{
 const h=databaseHarness(t);let s=await h.db.loadSystemState();assert.equal(s.story.chapters[1].status,'LOCKED');assert.equal(s.story.chapters[0].status,'AVAILABLE');
 await unlockWorld(h);s=await h.db.loadSystemState();assert.equal(s.story.chapters[0].status,'COMPLETED');assert.equal(s.story.chapters[1].status,'AVAILABLE');
 assert.equal(s.story.worldLinkComplete,false);assert.ok(!s.titles.includes('PATHFINDER'));
 assert.equal(await h.db.getQuestAccess('wall_focus_v1'),'LOCKED');await assert.rejects(h.db.startBossProtocol());
});
test('World Link exact milestones, reward, title, event and Chronicle persist once',async t=>{
 const h=await dailyHarness(t);const w=h.load('storage/world');
 let s=await h.db.loadSystemState();const before=s.player.totalRealXp;
 // Unrelated verified events cannot satisfy a milestone.
 assert.equal(s.story.chapters[1].completed,0);
 for(let n=0;n<3;n++) await w.discoverSector(storyFix(h,52+n*.002,19));
 s=await h.db.loadSystemState();assert.equal(s.story.chapters[1].completed,1);assert.equal(s.player.totalRealXp,before);
 const signal=await w.scanSignal(storyFix(h,));await w.locateSignal(storyFix(h,signal.latitude,signal.longitude),signal.revision);
 s=await h.db.loadSystemState();assert.equal(s.story.chapters[1].completed,2);assert.ok(!s.titles.includes('PATHFINDER'));
 for(const id of s.daily.questIds) await h.db.completeVerifiedQuest(dailyEvidence(h,id));
 s=await h.db.loadSystemState();assert.equal(s.story.chapters[1].completed,3);assert.equal(s.story.worldLinkComplete,true);assert.ok(s.titles.includes('PATHFINDER'));
 const xp=s.player.totalRealXp;await Promise.all(Array.from({length:5},()=>h.db.loadSystemState()));assert.equal((await h.reload().loadSystemState()).player.totalRealXp,xp);
 const chronicle=await h.db.loadChronicle();assert.equal(chronicle.filter(e=>e.id==='world_link_chapter_2').length,1);assert.equal(chronicle.filter(e=>e.id==='title_pathfinder').length,1);
 await h.db.consumeStoryEvent('world_link_chapter_2');assert.ok(!(await h.db.loadSystemState()).story.pendingEvents.some(e=>e.id==='world_link_chapter_2'));
 assert.ok((await h.db.loadChronicle()).some(e=>e.id==='world_link_chapter_2'));
 await h.db.updateIdentity({currentTitle:'PATHFINDER'});assert.equal((await h.reload().loadSystemState()).player.currentTitle,'PATHFINDER');
});
for(const failure of ['INSERT INTO story_progress','INSERT INTO story_events','COMMIT']) test('World Link reward rolls back with last milestone: '+failure,async t=>{
 const h=await dailyHarness(t);const w=h.load('storage/world');for(let n=0;n<3;n++)await w.discoverSector(storyFix(h,52+n*.002,19));const signal=await w.scanSignal(storyFix(h,));await w.locateSignal(storyFix(h,signal.latitude,signal.longitude),signal.revision);
 const ids=(await h.db.loadSystemState()).daily.questIds;for(const id of ids.slice(0,2))await h.db.completeVerifiedQuest(dailyEvidence(h,id));const before=await h.db.loadSystemState();
 if(failure==='COMMIT')h.faults.commit=true;else h.faults.failWhen=(sql,params)=>sql.includes(failure)&&params[0]==='world_link_chapter_2';
 await assert.rejects(h.db.completeVerifiedQuest(dailyEvidence(h,ids[2])));const after=await h.db.loadSystemState();assert.equal(after.player.totalRealXp,before.player.totalRealXp);assert.equal(after.daily.completed,2);assert.equal(after.story.worldLinkComplete,false);
 await h.db.completeVerifiedQuest(dailyEvidence(h,ids[2]));assert.equal((await h.db.loadSystemState()).story.worldLinkComplete,true);
});
for(const [factor,qualifies] of [[1.24,false],[1.25,true]]) test('Extra Mile boundary '+factor,async t=>{
 const h=await dailyHarness(t);const id=(await h.db.loadSystemState()).daily.questIds.find(id=>id.includes('walk_'));const e=dailyEvidence(h,id);e.distanceMeters*=factor;e.activity.features.distanceMeters=e.distanceMeters;
 const before=await h.db.loadSystemState();await h.db.completeVerifiedQuest(e);let s=await h.db.loadSystemState();assert.equal(s.story.sideComplete,qualifies);assert.equal(s.player.stats.WIL.totalXp-before.player.stats.WIL.totalXp,qualifies?40:0);
 const xp=s.player.totalRealXp;await h.db.completeVerifiedQuest(e);assert.equal((await h.db.loadSystemState()).player.totalRealXp,xp);
});
test('Hidden/Rematch require real prior failure; repeated interrupts do not stack',async t=>{
 const h=await dailyHarness(t);const id=(await h.db.loadSystemState()).daily.questIds.find(id=>id.includes('focus_')||id.includes('learn_')||id.includes('create')||id.includes('organize'));
 for(let n=0;n<3;n++){await h.db.beginQuestAttempt(id,'fail-'+n);h.clock.now+=10000;await h.db.endQuestAttempt('fail-'+n,'INTERRUPTED','BACKGROUND',10,0);h.clock.now+=1000;}
 let s=await h.db.loadSystemState();assert.ok(s.story.rematchQuestIds.includes(id));assert.equal(s.story.hiddenComplete,false);
 await h.db.beginQuestAttempt(id,'success');const before=s.player;await h.db.completeVerifiedQuest({...dailyEvidence(h,id),attemptId:'success'});
 s=await h.db.loadSystemState();assert.equal(s.story.hiddenComplete,true);assert.ok(!s.story.rematchQuestIds.includes(id));
 const base=h.load('quests/catalog').getQuest(id).rewards.skillXp.WIL??0;assert.equal(s.player.stats.WIL.totalXp-before.stats.WIL.totalXp,base+50+15);
 const xp=s.player.totalRealXp;await h.db.completeVerifiedQuest({...dailyEvidence(h,id),attemptId:'success'});assert.equal((await h.db.loadSystemState()).player.totalRealXp,xp);
 assert.equal(h.sql.prepare("SELECT COUNT(*) AS n FROM story_progress WHERE id LIKE 'rematch:%'").get().n,1);
});
for(const reason of ['PERMISSION_DENIED','TECHNICAL_ERROR']) test('technical failure has no story rematch or hidden: '+reason,async t=>{
 const h=await dailyHarness(t);const id=(await h.db.loadSystemState()).daily.questIds[0];await h.db.beginQuestAttempt(id,'technical');h.clock.now+=10000;await h.db.endQuestAttempt('technical','FAILED',reason,10,0);h.clock.now+=1000;
 await h.db.beginQuestAttempt(id,'success');await h.db.completeVerifiedQuest({...dailyEvidence(h,id),attemptId:'success'});const s=await h.db.loadSystemState();assert.equal(s.story.hiddenComplete,false);assert.equal(h.sql.prepare("SELECT COUNT(*) AS n FROM story_progress WHERE id LIKE 'rematch:%'").get().n,0);
});
test('no previous failure and failure after successful attempt start cannot trigger rewards',async t=>{
 const h=await dailyHarness(t);const ids=(await h.db.loadSystemState()).daily.questIds;await h.db.beginQuestAttempt(ids[0],'ok');await h.db.completeVerifiedQuest({...dailyEvidence(h,ids[0]),attemptId:'ok'});assert.equal((await h.db.loadSystemState()).story.hiddenComplete,false);
 await h.db.beginQuestAttempt(ids[1],'in-progress');
 h.sql.prepare('INSERT INTO quest_attempts(attempt_id,quest_id,kind,started_at,ended_at,result,eligible) VALUES (?,?,?,?,?,?,1)').run('late',ids[1],h.load('story/catalog').attemptKind(h.load('quests/catalog').getQuest(ids[1])),new Date(h.clock.now+1000).toISOString(),new Date(h.clock.now+2000).toISOString(),'INTERRUPTED');
 h.clock.now+=3000;await h.db.completeVerifiedQuest({...dailyEvidence(h,ids[1]),attemptId:'in-progress'});assert.equal((await h.db.loadSystemState()).story.hiddenComplete,false);
});
test('abandoned attempt recovery has no XP and does not fabricate Rematch',async t=>{
 const h=await dailyHarness(t);const id=(await h.db.loadSystemState()).daily.questIds[0];const before=(await h.db.loadSystemState()).player.totalRealXp;await h.db.beginQuestAttempt(id,'killed');const db=h.reload();const s=await db.loadSystemState();
 assert.equal(s.player.totalRealXp,before);assert.equal((await db.listQuestAttempts())[0].result,'ABANDONED');assert.equal(s.story.rematchQuestIds.length,0);await db.beginQuestAttempt(id,'fresh');
});
test('local profile cloud binding cannot silently switch accounts and reset clears the binding',async t=>{
 const h=await dailyHarness(t);
 const userA='11111111-1111-4111-8111-111111111111';
 const userB='22222222-2222-4222-8222-222222222222';
 await h.db.ensureCloudUserBinding(userA);
 assert.equal(await h.db.getCloudUserBinding(),userA);
 await h.db.ensureCloudUserBinding(userA);
 await assert.rejects(()=>h.db.ensureCloudUserBinding(userB),/innym kontem SYSTEM CLOUD/);
 await h.db.resetSystemData(true);
 assert.equal(await h.db.getCloudUserBinding(),null);
 await h.db.ensureCloudUserBinding(userB);
 assert.equal(await h.db.getCloudUserBinding(),userB);
});

test('background quest attempt survives database reinitialization and remains resumable',async t=>{
 const h=await dailyHarness(t);const id=(await h.db.loadSystemState()).daily.questIds.find(id=>id.includes('walk_'));
 await h.db.beginQuestAttempt(id,'background-active');
 await h.db.saveBackgroundQuestSession({questId:id,attemptId:'background-active',mode:'BACKGROUND',extendedGoal:false,updatedAt:new Date(h.clock.now).toISOString()});
 const db=h.reload();await db.loadSystemState();
 const attempt=(await db.listQuestAttempts()).find(a=>a.attempt_id==='background-active');
 assert.ok(attempt);assert.equal(attempt.result,null);
 const session=await db.loadBackgroundQuestSession();assert.equal(session.attemptId,'background-active');assert.equal(session.mode,'BACKGROUND');
});
test('Boss staged progression survives restart; requires future day and awards exactly once',async t=>{
 const h=await worldLinkHarness(t);let s=await h.db.startBossProtocol();assert.ok(s.story.boss);assert.equal(await h.db.getQuestAccess('wall_walk_v1'),'LOCKED');
 await assert.rejects(h.db.completeVerifiedQuest({questId:'wall_walk_v1',verificationType:'GPS_DISTANCE',durationSeconds:1000,distanceMeters:2000,verificationScore:87}));
 await h.db.completeVerifiedQuest({questId:'wall_focus_v1',verificationType:'TIMER',durationSeconds:900,verificationScore:100});assert.equal(await h.db.getQuestAccess('wall_walk_v1'),'AVAILABLE');
 const activity=classify('WALK',features({distanceMeters:2000,medianSpeedMps:1.5}));
 await h.db.completeVerifiedQuest({questId:'wall_walk_v1',verificationType:'GPS_DISTANCE',durationSeconds:600,distanceMeters:2000,verificationScore:87,activity});
 assert.equal(await h.db.getQuestAccess('wall_run_v1'),'LOCKED');s=await h.reload().loadSystemState();assert.ok(s.story.boss.move_at);assert.equal(s.story.boss.discipline_at,null);assert.equal(s.story.bossComplete,false);
 h.clock.now+=86400000;s=await h.db.loadSystemState();const before=s.player;const id=s.daily.questIds[0];await h.db.completeVerifiedQuest(dailyEvidence(h,id));s=await h.db.loadSystemState();
 assert.equal(s.story.bossComplete,true);assert.ok(s.titles.includes('WALLBREAKER'));assert.equal(s.player.totalRealXp-before.totalRealXp,500+h.load('quests/catalog').getQuest(id).rewards.realXp);
 const xp=s.player.totalRealXp;await h.db.completeVerifiedQuest(dailyEvidence(h,id));await h.db.startBossProtocol();assert.equal((await h.db.loadSystemState()).player.totalRealXp,xp);
 assert.equal((await h.db.loadChronicle()).filter(e=>e.type==='BOSS_DEFEATED').length,1);
});
test('Boss stage3 does not consume same-day or earlier completed Daily',async t=>{
 const h=await worldLinkHarness(t);await h.db.startBossProtocol();
 h.sql.prepare('UPDATE boss_progress SET focus_at=?,move_at=?').run(new Date(h.clock.now).toISOString(),new Date(h.clock.now).toISOString());
 // Reset the test daily completion ONLY in the isolated fixture, never production.
 const id=(await h.db.loadSystemState()).daily.questIds[0];h.sql.prepare('DELETE FROM quest_completions WHERE quest_id=?').run(id);h.sql.prepare('DELETE FROM verified_events WHERE id=?').run('quest_'+id);
 await h.db.completeVerifiedQuest(dailyEvidence(h,id));assert.equal((await h.db.loadSystemState()).story.boss.discipline_at,null);
});
test('v4 migration preserves all existing data and recognizes old milestones without replaying base XP',async t=>{
 const h=await worldLinkHarness(t);const before=await h.db.loadSystemState();
 h.sql.exec('DROP TABLE quest_attempts; DROP TABLE story_events; DROP TABLE story_progress; DROP TABLE boss_progress; PRAGMA user_version=4;');
 // Simulate v4: remove only new reward from profile and new chapter marker.
 const player=JSON.parse(h.sql.prepare("SELECT value FROM app_state WHERE key='player'").get().value);player.totalRealXp-=400;player.stats.RES.totalXp-=100;player.gameEnergy-=25;
 h.sql.prepare("UPDATE app_state SET value=? WHERE key='player'").run(JSON.stringify(player));h.sql.prepare('DELETE FROM chapter_completions WHERE chapter_id=?').run('world_link_chapter_2');
 const migrated=await h.reload().loadSystemState();assert.equal(migrated.player.totalRealXp,before.player.totalRealXp);assert.equal(migrated.player.totalDistanceMeters,before.player.totalDistanceMeters);assert.equal(migrated.story.chapters[0].status,'COMPLETED');assert.equal(migrated.story.worldLinkComplete,true);
 assert.equal((await h.reload().loadSystemState()).player.totalRealXp,before.player.totalRealXp);assert.equal(h.sql.prepare('PRAGMA user_version').get().user_version,h.load('storage/migrations').SCHEMA_VERSION);
});

test('Extra Mile and base daily roll back together when story event fails',async t=>{
 const h=await dailyHarness(t);const id=(await h.db.loadSystemState()).daily.questIds.find(id=>id.includes('walk_'));const e=dailyEvidence(h,id);e.distanceMeters*=1.25;e.activity.features.distanceMeters=e.distanceMeters;const before=await h.db.loadSystemState();
 h.faults.failWhen=(sql,args)=>sql.includes('INSERT INTO story_events')&&args[0]==='extra_mile_v1';await assert.rejects(h.db.completeVerifiedQuest(e));const after=await h.db.loadSystemState();assert.equal(after.player.totalRealXp,before.player.totalRealXp);assert.equal(after.story.sideComplete,false);assert.equal(after.daily.completed,0);
 await h.db.completeVerifiedQuest(e);assert.equal((await h.db.loadSystemState()).story.sideComplete,true);
});
test('Hidden reward and attempt completion roll back together and retry cannot duplicate',async t=>{
 const h=await dailyHarness(t);const id=(await h.db.loadSystemState()).daily.questIds[0];await h.db.beginQuestAttempt(id,'fail');h.clock.now+=10000;await h.db.endQuestAttempt('fail','FAILED','VERIFICATION_REJECTED',10);h.clock.now+=1000;await h.db.beginQuestAttempt(id,'success');const before=await h.db.loadSystemState();
 h.faults.failWhen=(sql,args)=>sql.includes('INSERT INTO story_events')&&args[0]==='no_turning_back_v1';const e={...dailyEvidence(h,id),attemptId:'success'};await assert.rejects(h.db.completeVerifiedQuest(e));const after=await h.db.loadSystemState();assert.equal(after.player.totalRealXp,before.player.totalRealXp);assert.equal(after.story.hiddenComplete,false);assert.equal(h.sql.prepare('SELECT result FROM quest_attempts WHERE attempt_id=?').get('success').result,null);
 await h.db.completeVerifiedQuest(e);assert.equal((await h.db.loadSystemState()).story.hiddenComplete,true);
});
test('Boss final reward and Daily completion are one transaction on failure and retry',async t=>{
 const h=await worldLinkHarness(t);await h.db.startBossProtocol();h.sql.prepare('UPDATE boss_progress SET focus_at=?,move_at=?').run(new Date(h.clock.now).toISOString(),new Date(h.clock.now).toISOString());h.clock.now+=86400000;
 const s=await h.db.loadSystemState(),id=s.daily.questIds[0];h.faults.failWhen=(sql,args)=>sql.includes('INSERT INTO story_events')&&args[0]==='the_first_wall_v1';await assert.rejects(h.db.completeVerifiedQuest(dailyEvidence(h,id)));let after=await h.db.loadSystemState();assert.equal(after.story.bossComplete,false);assert.equal(after.story.boss.discipline_at,null);assert.equal(after.player.totalRealXp,s.player.totalRealXp);
 await h.db.completeVerifiedQuest(dailyEvidence(h,id));after=await h.db.loadSystemState();assert.equal(after.story.bossComplete,true);assert.ok(after.titles.includes('WALLBREAKER'));
});
test('extended Daily keeps the shared GPS running past base target until 125 percent',async t=>{
 const h=screenHarness(t,{questId:'daily:2026-09-18:walk_protocol_1'});await flush();h.render();h.button('CEL ROZSZERZONY 125%').props.onPress();h.render();await h.button('ROZPOCZNIJ MISJĘ').props.onPress(); await flush();h.fix(0);h.render();
 for(let m=7;m<=1512;m+=7)h.fix(m);await flush();assert.equal(h.awards(),0);assert.equal(h.removals(),0);
 for(let m=1519;m<=1890;m+=7)h.fix(m);await flush();assert.equal(h.awards(),1);assert.equal(h.removals(),1);
});
test('main objective follows real story and ends with unknown chapter, not fake content',()=>{
 const select=loader({})('story/selectors').mainStoryObjective;
 assert.equal(select(null,false).title,'PIERWSZE PRZEBUDZENIE');assert.equal(select(null,true).title,'POŁĄCZENIE ZE ŚWIATEM');
 assert.equal(select({worldLinkComplete:true,bossComplete:false,boss:null},true).title,'PIERWSZY MUR');assert.equal(select({worldLinkComplete:true,bossComplete:true},true).title,'SYGNAŁ HISTORII UTRACONY');
});
test('same-day completed attempt cannot be forged from a terminal failure record',async t=>{
 const h=await dailyHarness(t);const id=(await h.db.loadSystemState()).daily.questIds[0];await h.db.beginQuestAttempt(id,'closed');await h.db.endQuestAttempt('closed','INTERRUPTED','BACKGROUND',10);
 await assert.rejects(h.db.completeVerifiedQuest({...dailyEvidence(h,id),attemptId:'closed'}));assert.equal((await h.db.loadSystemState()).daily.completed,0);
});

// Domain contract: explicit time, immutable inputs, unchanged persisted progression curves.
for (const [label,levels,remainder] of [['normal XP',0,25],['exact threshold',1,0],['one level',1,7],['multiple levels',4,13]]) {
 test('domain progression: '+label,()=>{
  const core=loader({})('core/progression'); const before=core.createNewPlayer();
  const amount=Array.from({length:levels},(_,i)=>core.xpNeededForRealLevel(i+1)).reduce((a,b)=>a+b,0)+remainder;
  const saved=JSON.stringify(before); const now='2026-09-18T10:00:00.000Z';
  const after=core.addRealXp(before,amount,now);
  assert.equal(after.realLevel,1+levels); assert.equal(after.realXp,remainder); assert.equal(after.totalRealXp,amount);
  assert.equal(after.realXpToNextLevel,core.xpNeededForRealLevel(1+levels)); assert.equal(after.updatedAt,now);
  assert.equal(JSON.stringify(before),saved);
  const receipts=loader({})('core/rewards'); assert.equal(receipts.hasLevelUp(receipts.rewardReceipt('unit',before,after)),levels>0);
 });
}
for(const invalid of [NaN,Infinity,-1,0.5,Number.MAX_SAFE_INTEGER+1]) test('domain rejects invalid XP '+invalid,()=>{
 const core=loader({})('core/progression'),player=core.createNewPlayer();
 assert.throws(()=>core.addRealXp(player,invalid)); assert.throws(()=>core.addSkillXp(player,'WIL',invalid));
 assert.equal(player.totalRealXp,0);
});
test('domain zero reward, stat reward and multiple skill levels are deterministic',()=>{
 const load=loader({}),core=load('core/progression'),engine=load('core/questEngine');
 const player=core.createNewPlayer(),now='2026-09-18T10:00:00.000Z',saved=JSON.stringify(player);
 const skill=core.xpNeededForSkillLevel(1)+core.xpNeededForSkillLevel(2)+9;
 const reward={realXp:25,skillXp:{WIL:skill,STR:10},gameEnergy:8};
 const after=engine.applyQuestRewards(player,reward,now);
 assert.equal(after.stats.WIL.level,3); assert.equal(after.stats.WIL.xp,9); assert.equal(after.stats.STR.totalXp,10);
 assert.equal(after.gameEnergy,8); assert.equal(after.totalRealXp,25); assert.equal(after.streak,player.streak);
 assert.equal(after.verifiedQuestCount,0); assert.equal(JSON.stringify(player),saved);
 assert.equal(JSON.stringify(after),JSON.stringify(engine.applyQuestRewards(player,reward,now)));
 assert.equal(engine.applyQuestRewards(player,{realXp:0},now).totalRealXp,0);
});
test('domain rejects malformed rewards without mutating player',()=>{
 const load=loader({}),core=load('core/progression'),engine=load('core/questEngine'),player=core.createNewPlayer();
 const saved=JSON.stringify(player),now='2026-09-18T10:00:00.000Z';
 for(const reward of [{realXp:10,skillXp:{BAD:3}},{realXp:10,skillXp:{WIL:Infinity}},{realXp:10,gameEnergy:-1},{realXp:10,coins:1},{realXp:10,chest:'COMMON'}]) assert.throws(()=>engine.applyQuestRewards(player,reward,now));
 assert.throws(()=>engine.applyQuestRewards(player,{realXp:10},'invalid'));
 assert.throws(()=>core.addRealXp({...player,totalRealXp:Number.MAX_SAFE_INTEGER},1,now));
 assert.equal(JSON.stringify(player),saved);
});
test('domain verified completion returns profile, completed quest and event without side effects',()=>{
 const load=loader({}),core=load('core/progression'),engine=load('core/questEngine');
 const player=core.createNewPlayer(),now='2026-09-18T10:00:00.000Z';
 const evidence={questId:'first_movement_v1',verificationType:'GPS_DISTANCE',distanceMeters:500,durationSeconds:400,verificationScore:100};
 const saved=JSON.stringify({player,evidence}); const result=engine.completeQuest(player,evidence,'ACTIVE',now);
 assert.equal(result.quest.status,'COMPLETED'); assert.equal(result.quest.completedAt,now);
 assert.equal(result.player.totalRealXp,100); assert.equal(result.player.stats.VIT.totalXp,80);
 assert.equal(result.player.gameEnergy,10); assert.equal(result.player.verifiedQuestCount,1); assert.equal(result.player.totalDistanceMeters,500);
 assert.equal(result.event.realXpAwarded,100); assert.equal(result.event.questId,evidence.questId); assert.equal(result.event.createdAt,now);
 assert.equal(JSON.stringify({player,evidence}),saved);
 assert.throws(()=>engine.completeQuest(result.player,evidence,result.quest.status,now));
 for(const status of ['LOCKED','FAILED','VERIFYING']) assert.throws(()=>engine.completeQuest(player,evidence,status,now));
 assert.throws(()=>engine.completeQuest(player,{...evidence,distanceMeters:499},'ACTIVE',now));
});
test('domain timer completion adds no distance and no arbitrary streak',()=>{
 const load=loader({}),player=load('core/progression').createNewPlayer();player.streak=4;player.totalDistanceMeters=123;
 const result=load('core/questEngine').completeQuest(player,{questId:'focus_protocol_v1',verificationType:'TIMER',durationSeconds:600,verificationScore:100},'ACTIVE','2026-09-18T10:00:00.000Z');
 assert.equal(result.player.totalDistanceMeters,123);assert.equal(result.player.streak,4);assert.equal(result.player.stats.WIL.totalXp,70);
});

// Application contract tests use transactional ports; SQLite integration remains covered above.
function completionContractHarness(options={}) {
 const load=loader({});
 let state={player:load('core/progression').createNewPlayer(),completions:{},events:[]};
 let runs=0;const now='2026-09-18T12:00:00.000Z';
 const unit={async run(work){
   runs++;const draft=JSON.parse(JSON.stringify(state));
   const value=await work({
     players:{get:async()=>draft.player,save:async p=>{draft.player=p;}},
     quests:{get:async id=>load('quests/catalog').getQuest(id),
       availability:async()=>({status:options.status??'AVAILABLE',code:options.status??'AVAILABLE',canComplete:!options.status||['AVAILABLE','ACTIVE'].includes(options.status)}),
       claimCompletion:async(id,date)=>{if(draft.completions[id])return false;draft.completions[id]=date;return true;}},
     events:{has:async id=>draft.events.some(e=>e.id===id),append:async event=>{if(options.failEvent)throw Error('event failed');draft.events.push(event);}},
     idempotency:{find:async op=>draft.completions[op.questId]?{...op,state:'APPLIED',appliedAt:draft.completions[op.questId]}:null},
     effects:{apply:async p=>p,result:async awarded=>({awarded,player:draft.player})},
   });
   if(options.failCommit)throw Error('commit failed');
   state=draft;return value;
 }};
 const provider=options.provider??load('verification/localProvider').localQuestVerification;
 return {load,run:load('application/completeQuest').createQuestCompletion(unit,provider,()=>now),state:()=>state,runs:()=>runs};
}
test('contracts valid completion and repeated canonical operation produce exactly one event/reward',async()=>{
 const h=completionContractHarness();const key=h.load('repositories/contracts').completionOperation(h.state().player.id,evidence.questId).key;
 const first=await h.run({evidence,operationKey:key});const second=await h.run({evidence,operationKey:key});
 assert.equal(first.status,'APPLIED');assert.equal(second.status,'DUPLICATE');assert.equal(first.operation.key,second.operation.key);
 assert.equal(h.state().player.totalRealXp,100);assert.equal(h.state().events.length,1);assert.equal(Object.keys(h.state().completions).length,1);
});
for(const status of ['LOCKED','FAILED']) test('contracts '+status+' quest cannot complete',async()=>{
 const h=completionContractHarness({status});const result=await h.run({evidence});assert.equal(result.status,status);
 assert.equal(h.state().player.totalRealXp,0);assert.equal(h.state().events.length,0);assert.equal(Object.keys(h.state().completions).length,0);
});
for(const status of ['REJECTED','PENDING','UNAVAILABLE']) test('contracts verification '+status+' never enters a write transaction',async()=>{
 const h=completionContractHarness({provider:{id:'test',canHandle:()=>true,verify:async r=>({status,code:'TEST_'+status,reason:'test',checkedAt:r.requestedAt,providerId:'test'})}});
 assert.equal((await h.run({evidence})).status,status);assert.equal(h.runs(),0);assert.equal(h.state().player.totalRealXp,0);
});
test('contracts unsupported verifier and invalid local evidence grant no XP',async()=>{
 const h=completionContractHarness({provider:{id:'unsupported',canHandle:()=>false,verify:()=>{throw Error('must not run');}}});
 assert.equal((await h.run({evidence})).status,'UNAVAILABLE');assert.equal(h.runs(),0);
 const local=completionContractHarness();assert.equal((await local.run({evidence:{...evidence,distanceMeters:499}})).status,'REJECTED');assert.equal(local.runs(),0);
});
for(const fault of ['failEvent','failCommit']) test('contracts '+fault+' rolls back profile, completion and event',async()=>{
 const options={[fault]:true},h=completionContractHarness(options);await assert.rejects(h.run({evidence}));
 assert.equal(h.state().player.totalRealXp,0);assert.equal(h.state().events.length,0);assert.equal(Object.keys(h.state().completions).length,0);
 options[fault]=false;assert.equal((await h.run({evidence})).status,'APPLIED');assert.equal(h.state().events.length,1);
});
test('contracts operation identity cannot be reused for another player or quest',async()=>{
 const h=completionContractHarness();const operation=h.load('repositories/contracts').completionOperation;
 for(const key of [operation('other',evidence.questId).key,operation(h.state().player.id,'focus_protocol_v1').key]) await assert.rejects(h.run({evidence,operationKey:key}));
 assert.equal(h.state().player.totalRealXp,0);assert.equal(h.state().events.length,0);
 assert.notEqual(operation('a:b','c').key,operation('a','b:c').key);
});
test('contracts provider cannot change verification identity',async()=>{
 const h=completionContractHarness({provider:{id:'test',canHandle:()=>true,verify:async r=>({status:'VERIFIED',code:'TEST',checkedAt:r.requestedAt,providerId:'test',evidence:{...r.evidence,questId:'focus_protocol_v1'}})}});
 await assert.rejects(h.run({evidence}));assert.equal(h.runs(),0);
});
test('availability contract reuses prerequisite, active, failed, Daily and Boss rules',()=>{
 const load=loader({}),resolve=load('quests/availability').questAvailability;
 const empty={completedQuestIds:[]};assert.equal(resolve('unknown',empty).code,'UNKNOWN_QUEST');
 assert.equal(resolve('focus_protocol_v1',empty).status,'LOCKED');assert.equal(resolve(evidence.questId,empty).status,'AVAILABLE');
 assert.equal(resolve(evidence.questId,{...empty,failedQuestId:evidence.questId}).status,'FAILED');
 assert.equal(resolve(evidence.questId,{...empty,failedQuestId:evidence.questId,activeQuestId:evidence.questId}).status,'ACTIVE');
 assert.equal(resolve(evidence.questId,{completedQuestIds:[evidence.questId]}).status,'COMPLETED');
 const awakened={completedQuestIds:load('quests/catalog').AWAKENING_QUESTS.map(q=>q.id)};
 const boss=load('story/catalog').BOSS_FOCUS;assert.equal(resolve(boss,awakened).code,'BOSS_LOCKED');assert.equal(resolve(boss,{...awakened,bossAccessible:true}).status,'AVAILABLE');
 const templates=load('daily/templates');const id=templates.generateDaily('p','2026-09-18',templates.DEFAULT_ACTIVITIES)[0].id;
 assert.equal(resolve(id,awakened).code,'DAILY_UNAVAILABLE');assert.equal(resolve(id,{...awakened,daily:{questIds:[id],clockAnomaly:false}}).status,'AVAILABLE');
 assert.equal(resolve(id,{...awakened,daily:{questIds:[id],clockAnomaly:true}}).status,'LOCKED');
});
test('SQLite explicit operation key survives reload, parallel retries and mismatched replay',async t=>{
 const h=databaseHarness(t),initial=await h.db.loadSystemState();const key=h.load('repositories/contracts').completionOperation(initial.player.id,evidence.questId).key;
 const outcomes=await Promise.all(Array.from({length:6},()=>h.db.completeVerifiedQuest({...evidence,operationKey:key})));
 assert.equal(outcomes.filter(r=>r.awarded).length,1);assert.equal((await h.reload().completeVerifiedQuest({...evidence,operationKey:key})).awarded,false);
 await assert.rejects(h.db.completeVerifiedQuest({...evidence,operationKey:'foreign-operation'}));
 assert.equal(h.sql.prepare('SELECT COUNT(*) AS n FROM verified_events WHERE id=?').get('quest_'+evidence.questId).n,1);
 assert.equal((await h.db.loadSystemState()).player.totalRealXp,100);
});
test('SQLite completed Daily replay remains idempotent after its availability period',async t=>{
 const h=await dailyHarness(t),s=await h.db.loadSystemState(),ev=dailyEvidence(h,s.daily.questIds[0]);
 const key=h.load('repositories/contracts').completionOperation(s.player.id,ev.questId).key;
 await h.db.completeVerifiedQuest({...ev,operationKey:key});const before=(await h.db.loadSystemState()).player.totalRealXp;
 h.clock.now+=86400000;const replay=await h.reload().completeVerifiedQuest({...ev,operationKey:key});
 assert.equal(replay.awarded,false);assert.equal(replay.player.totalRealXp,before);
});


test('tester deterministic player defaults and catalog metadata',()=>{
 const load=loader({}),core=load('core/progression');const identity={id:'tester-fixed',createdAt:'2026-09-18T10:00:00.000Z'};
 const a=core.createNewPlayer('TESTER',identity),b=core.createNewPlayer('TESTER',identity);
 assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(a.realLevel,1);assert.equal(a.totalRealXp,0);assert.equal(a.gameEnergy,0);assert.equal(a.streak,0);
 assert.equal(core.SKILL_KEYS.length,7);assert.ok(core.SKILL_KEYS.every(k=>a.stats[k].level===1&&a.stats[k].totalXp===0));
 assert.throws(()=>core.createNewPlayer('TESTER',{id:'',createdAt:identity.createdAt}));
 assert.equal(load('quests/catalog').AWAKENING_QUESTS.length,3);
 assert.equal(load('quests/firstMovement').FIRST_MOVEMENT_QUEST.createdAt,'2026-09-17T00:00:00.000Z');
});
test('tester full first session: initialize, onboard, activate, verify, reward, level, log, reload',async t=>{
 const clock={now:new Date(2026,8,18,10).getTime()},h=databaseHarness(t,clock);
 const first=await h.db.loadSystemState();assert.equal(first.onboardingComplete,false);assert.equal(first.player.realLevel,1);
 assert.equal((await h.db.testerHealthCheck()).ok,true);
 assert.equal(JSON.stringify((await h.db.loadSystemState()).player),JSON.stringify(first.player));
 assert.equal((await h.db.finishOnboarding('TESTER')).onboardingComplete,true);
 assert.equal(await h.db.getQuestAccess(evidence.questId),'AVAILABLE');assert.equal(await h.db.getQuestAccess(focusEvidence.questId),'LOCKED');
 for(const [i,ev] of [evidence,focusEvidence,multiEvidence].entries()) {
   const attemptId='tester-session-'+i;await h.db.beginQuestAttempt(ev.questId,attemptId);
   assert.equal(h.sql.prepare('SELECT result FROM quest_attempts WHERE attempt_id=?').get(attemptId).result,null);
   clock.now+=ev.durationSeconds*1000;
   const before=(await h.db.loadSystemState()).player;
   const key=h.load('repositories/contracts').completionOperation(before.id,ev.questId).key;
   const complete=await h.db.completeVerifiedQuest({...ev,attemptId,operationKey:key});assert.equal(complete.awarded,true);
   const reward=h.load('quests/catalog').getQuest(ev.questId).rewards;
   assert.ok(complete.player.totalRealXp>=before.totalRealXp+reward.realXp);
   for(const [skill,xp] of Object.entries(reward.skillXp))assert.equal(complete.player.stats[skill].totalXp,before.stats[skill].totalXp+xp);
   if(i===1)assert.ok(complete.player.realLevel>=2);
   assert.equal((await h.db.completeVerifiedQuest({...ev,attemptId,operationKey:key})).awarded,false);
   const restored=await h.reload().loadSystemState();assert.equal(JSON.stringify(restored.player),JSON.stringify(complete.player));
   assert.ok(restored.completedQuestIds.includes(ev.questId));assert.equal(h.sql.prepare('SELECT result FROM quest_attempts WHERE attempt_id=?').get(attemptId).result,'COMPLETED');
 }
 const end=await h.reload().loadSystemState();assert.equal(end.player.totalRealXp,600);assert.equal(end.awakeningCompleted,true);assert.equal(end.daily.questIds.length,3);
 assert.equal((await h.db.loadSystemLog()).filter(e=>e.id.startsWith('quest_')).length,3);
 assert.equal((await h.db.testerHealthCheck()).ok,true);
});
test('tester returning user preserves partial Daily, rejects expired incomplete and replays completed safely',async t=>{
 const h=await dailyHarness(t),first=await h.db.loadSystemState();const [done,incomplete]=first.daily.questIds;
 await h.db.completeVerifiedQuest(dailyEvidence(h,done));const partial=await h.db.loadSystemState();
 const reload=await h.reload().loadSystemState();assert.equal(JSON.stringify(reload.daily),JSON.stringify(partial.daily));assert.equal(reload.player.streak,0);
 h.clock.now+=86400000;const next=await h.reload().loadSystemState();assert.equal(next.daily.completed,0);assert.equal(next.daily.clear,false);
 await assert.rejects(h.db.completeVerifiedQuest(dailyEvidence(h,incomplete)));assert.equal((await h.db.completeVerifiedQuest(dailyEvidence(h,done))).awarded,false);
 assert.equal((await h.db.loadSystemState()).player.totalRealXp,partial.player.totalRealXp);
 for(const id of next.daily.questIds)await h.db.completeVerifiedQuest(dailyEvidence(h,id));
 const clear=await h.reload().loadSystemState();assert.equal(clear.daily.clear,true);assert.equal(clear.player.streak,1);
 h.clock.now+=86400000;for(const id of (await h.db.loadSystemState()).daily.questIds)await h.db.completeVerifiedQuest(dailyEvidence(h,id));
 assert.equal((await h.reload().loadSystemState()).player.streak,2);assert.equal((await h.db.testerHealthCheck()).ok,true);
});
test('tester invalid and locked requests leave a valid first-run profile untouched',async t=>{
 const h=databaseHarness(t,{now:new Date(2026,8,18,10).getTime()}),first=await h.db.loadSystemState();
 await assert.rejects(h.db.completeVerifiedQuest({...evidence,distanceMeters:499}));await assert.rejects(h.db.completeVerifiedQuest(focusEvidence));
 assert.equal(JSON.stringify((await h.db.loadSystemState()).player),JSON.stringify(first.player));assert.equal((await h.db.loadSystemLog()).length,0);
 assert.equal((await h.db.testerHealthCheck()).ok,true);
});
test('tester completion rollback retains active attempt and healthy profile for retry',async t=>{
 const h=databaseHarness(t,{now:new Date(2026,8,18,10).getTime()});await h.db.loadSystemState();await h.db.beginQuestAttempt(evidence.questId,'tester-rollback');
 h.faults.statement='INSERT INTO verified_events';await assert.rejects(h.db.completeVerifiedQuest({...evidence,attemptId:'tester-rollback'}));
 assert.equal((await h.db.loadSystemState()).player.totalRealXp,0);assert.equal(h.sql.prepare('SELECT result FROM quest_attempts').get().result,null);
 assert.equal((await h.db.testerHealthCheck()).ok,true);assert.equal((await h.db.completeVerifiedQuest({...evidence,attemptId:'tester-rollback'})).awarded,true);
});
test('tester reset requires development build and exact confirmation before storage access',async()=>{
 let calls=0;const db={resetSystemData:async()=>{calls++;}};
 const prod=loader({'../storage/database':db,__DEV__:false})('tester/reset');await assert.rejects(prod.resetTesterProfile('RESET TESTER PROFILE'));assert.equal(calls,0);
 const dev=loader({'../storage/database':db,__DEV__:true})('tester/reset');await assert.rejects(dev.resetTesterProfile('RESET'));assert.equal(calls,0);
 await dev.resetTesterProfile('RESET TESTER PROFILE');assert.equal(calls,1);
});
test('tester development reset clears gameplay transactionally, creates new identity and reinitializes',async t=>{
 const h=await dailyHarness(t);const initial=await h.db.loadSystemState();await h.db.completeVerifiedQuest(dailyEvidence(h,initial.daily.questIds[0]));
 const reset=loader({'../storage/database':h.db,__DEV__:true})('tester/reset');
 h.faults.commit=true;await assert.rejects(reset.resetTesterProfile('RESET TESTER PROFILE'));
 assert.ok((await h.db.loadSystemState()).player.totalRealXp>0);
 const fresh=await reset.resetTesterProfile('RESET TESTER PROFILE');assert.equal(fresh.onboardingComplete,false);assert.equal(fresh.player.totalRealXp,0);assert.equal(fresh.player.realLevel,1);assert.equal(fresh.player.streak,0);assert.equal(fresh.daily,null);
 assert.notEqual(fresh.player.id,initial.player.id);
 for(const table of ['quest_attempts','story_events','story_progress','boss_progress','daily_instances','daily_sets','protocol_bonuses','verified_events','quest_completions','chapter_completions','discovered_sectors','world_signals'])assert.equal(h.sql.prepare('SELECT COUNT(*) AS n FROM '+table).get().n,0);
 const again=await h.reload().loadSystemState();assert.equal(again.player.id,fresh.player.id);assert.equal(await h.db.getQuestAccess(evidence.questId),'AVAILABLE');assert.equal((await h.db.testerHealthCheck()).ok,true);
 assert.equal(await h.db.hasAvatarCleanupPending(),true);
});
for(const [label,change,code] of [
 ['missing player',sql=>sql.prepare("DELETE FROM app_state WHERE key='player'").run(),'PLAYER_MISSING'],
 ['derived XP',sql=>{const p=JSON.parse(sql.prepare("SELECT value FROM app_state WHERE key='player'").get().value);p.realLevel=999;sql.prepare("UPDATE app_state SET value=? WHERE key='player'").run(JSON.stringify(p));},'PLAYER_PROGRESSION'],
 ['invalid stat',sql=>{const p=JSON.parse(sql.prepare("SELECT value FROM app_state WHERE key='player'").get().value);p.stats.WIL.totalXp=-1;sql.prepare("UPDATE app_state SET value=? WHERE key='player'").run(JSON.stringify(p));},'PLAYER_INVALID'],
 ['onboarding',sql=>sql.prepare("UPDATE app_state SET value='broken' WHERE key='onboarding_complete'").run(),'ONBOARDING_METADATA'],
 ['settings',sql=>sql.prepare("UPDATE app_state SET value='{}' WHERE key='settings'").run(),'SETTINGS_METADATA'],
 ['quest reference',sql=>sql.prepare("INSERT INTO quest_completions VALUES ('unknown','2026-09-18T10:00:00Z')").run(),'QUEST_REFERENCE'],
])test('tester health detects '+label+' without repairing the data',async t=>{
 const h=databaseHarness(t,{now:new Date(2026,8,18,10).getTime()});await h.db.loadSystemState();change(h.sql);
 const before=JSON.stringify(h.sql.prepare('SELECT * FROM app_state ORDER BY key').all());const result=await h.db.testerHealthCheck();assert.equal(result.ok,false);assert.ok(result.issues.some(i=>i.code===code));
 assert.equal(JSON.stringify(h.sql.prepare('SELECT * FROM app_state ORDER BY key').all()),before);
});
test('tester health detects missing/duplicate events and malformed Daily state',async t=>{
 const h=await dailyHarness(t);const event=h.sql.prepare("SELECT * FROM verified_events WHERE id='quest_first_movement_v1'").get();
 h.sql.prepare('INSERT INTO verified_events(id,quest_id,payload,created_at) VALUES (?,?,?,?)').run('quest_duplicate',event.quest_id,event.payload,event.created_at);
 h.sql.prepare("DELETE FROM verified_events WHERE id='quest_focus_protocol_v1'").run();h.sql.prepare('DELETE FROM daily_instances WHERE id=(SELECT id FROM daily_instances LIMIT 1)').run();
 const result=await h.db.testerHealthCheck();for(const code of ['DUPLICATE_COMPLETION_EVENT','COMPLETION_EVENT_MISSING','DAILY_SET_SIZE'])assert.ok(result.issues.some(i=>i.code===code));
});
test('tester health reports storage failure instead of throwing or resetting',async t=>{
 const h=databaseHarness(t);h.faults.open=true;const result=await h.db.testerHealthCheck();assert.equal(result.ok,false);assert.equal(result.issues[0].code,'STORAGE_UNAVAILABLE');
 await h.db.loadSystemState();assert.equal((await h.db.testerHealthCheck()).ok,true);
});


for(const [label,birth,today,expected] of [
 ['passed','2000-01-10',[2026,8,18],26],['later','2000-12-10',[2026,8,18],25],
 ['today','2000-09-18',[2026,8,18],26],['leap before','2000-02-29',[2025,1,28],24],
 ['leap after','2000-02-29',[2025,2,1],25],['leap birthday','2000-02-29',[2024,1,29],24],
 ['invalid','2001-02-29',[2026,8,18],null],['impossible','2000-04-31',[2026,8,18],null],
 ['future','2027-01-01',[2026,8,18],null],['bad format','18/09/2000',[2026,8,18],null],
])test('canonical age '+label,()=>{
 const age=loader({})('identity/age');assert.equal(age.calculateAge(birth,new Date(...today)),expected);
 if(expected===null)assert.throws(()=>age.validateBirthDate(birth,new Date(...today)));
});
function integrationUI(context,extra={}) {
 const slots=[];let cursor=0;const navigation=[];
 const react={useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},
 useRef(initial){const i=cursor++;return slots[i]??(slots[i]={current:initial});},useCallback:fn=>fn,useEffect:()=>{}};
 const jsx=(type,props)=>typeof type==='function'?type(props):({type,props});
 const load=loader({
  react,'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'Fragment'},
  'react-native':{Text:'Text',TextInput:'TextInput',View:'View',Pressable:'Pressable',ScrollView:'ScrollView',Modal:'Modal',Switch:'Switch',KeyboardAvoidingView:'KeyboardAvoidingView',Platform:{OS:'android'},StyleSheet:{create:s=>s},Linking:{openSettings:async()=>{}}},
  'expo-router':{useRouter:()=>({replace:p=>navigation.push(p),push:p=>navigation.push(p)}),useFocusEffect:()=>{}},
  'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:24,bottom:24})},
  '../components/SystemPage':{__esModule:true,default:'SystemPage',pageStyles:{}},
  '../background/locationService':{requestBackgroundLocationAccess:async()=>true},
  '../components/BetaSettings':{__esModule:true,default:'BetaSettings'},
  '../components/IdentityAvatar':{__esModule:true,default:'IdentityAvatar'},
  'expo-constants':{__esModule:true,default:{expoConfig:{version:'1.0.0',android:{versionCode:1}}}},
  'expo-location':{},'expo-image-picker':{},
  '../identity/avatar':{persistAvatar:async()=>'',removeOwnedAvatar:()=>{}},
  '../state/SystemProvider':{useSystem:()=>context},...extra,
 });
 return {navigation,render(file){cursor=0;return load(file).default();},load};
}
function nodesOfType(tree,type){if(Array.isArray(tree))return tree.flatMap(n=>nodesOfType(n,type));if(!tree||typeof tree!=='object')return [];return [...(tree.type===type?[tree]:[]),...nodesOfType(tree.props?.children,type)];}
test('real onboarding UI validates date, persists identity and skips onboarding after restart',async t=>{
 const clock={now:new Date(2026,8,18,10).getTime()},h=databaseHarness(t,clock);await h.db.loadSystemState();
 const ui=integrationUI({finishOnboarding:(name,birth)=>h.db.finishOnboarding(name,birth)});
 let tree;for(let i=0;i<3;i++){tree=ui.render('screens/OnboardingScreen');findButtons(tree).find(b=>treeText(b)==='DALEJ →').props.onPress();}
 tree=ui.render('screens/OnboardingScreen');const inputs=nodesOfType(tree,'TextInput');inputs[0].props.onChangeText('TESTER');inputs[1].props.onChangeText('2001-02-29');
 tree=ui.render('screens/OnboardingScreen');findButtons(tree).find(b=>treeText(b)==='WEJDŹ DO SYSTEMU').props.onPress();await flush();
 assert.equal((await h.db.loadSystemState()).onboardingComplete,false);assert.equal(ui.navigation.length,0);
 tree=ui.render('screens/OnboardingScreen');assert.match(treeText(tree),/prawidłową datę/);
 nodesOfType(tree,'TextInput')[1].props.onChangeText('2000-09-18');tree=ui.render('screens/OnboardingScreen');findButtons(tree).find(b=>treeText(b)==='WEJDŹ DO SYSTEMU').props.onPress();await flush();await flush();
 const saved=await h.reload().loadSystemState();assert.equal(saved.onboardingComplete,true);assert.equal(saved.player.displayName,'TESTER');assert.equal(saved.player.birthDate,'2000-09-18');
 assert.equal(ui.navigation[0],'/');assert.equal((await h.db.testerHealthCheck()).ok,true);
 await h.db.completeVerifiedQuest(evidence);await h.db.completeVerifiedQuest(focusEvidence);const restored=await h.reload().loadSystemState();
 assert.equal(restored.onboardingComplete,true);assert.equal(restored.player.birthDate,'2000-09-18');assert.equal(restored.player.totalRealXp,180);assert.equal(restored.player.realLevel,2);
 const log=await h.db.loadSystemLog();assert.ok(log.some(e=>e.levelAfter>e.levelBefore));assert.ok(log.every(e=>!('birthDate' in e)));
});
test('birth date edits reject invalid/future input without changing rewards; legacy profile remains valid',async t=>{
 const h=databaseHarness(t,{now:new Date(2026,8,18,10).getTime()});await h.db.loadSystemState();await h.db.finishOnboarding('OLD PLAYER');await h.db.completeVerifiedQuest(evidence);
 const original=(await h.db.loadSystemState()).player;assert.equal(original.birthDate,undefined);
 await assert.rejects(h.db.updateIdentity({birthDate:'3000-01-01'}));await assert.rejects(h.db.updateIdentity({birthDate:'2000-13-01'}));
 const updated=await h.db.updateIdentity({birthDate:'2000-01-01'});assert.equal(updated.player.totalRealXp,original.totalRealXp);assert.equal(updated.player.stats.VIT.totalXp,80);
 const replay=await h.db.finishOnboarding('CHANGED','1990-01-01');assert.equal(replay.player.displayName,'OLD PLAYER');assert.equal(replay.player.birthDate,'2000-01-01');
});
test('gameplay gate mounts children only for ready onboarded player',()=>{
 const ctx={ready:false,onboardingComplete:false};const ui=integrationUI(ctx);const Gate=ui.load('components/GameplayGate').default;
 assert.equal(Gate({children:'GAMEPLAY'}),null);ctx.ready=true;assert.equal(Gate({children:'GAMEPLAY'}),null);ctx.onboardingComplete=true;assert.equal(treeText(Gate({children:'GAMEPLAY'})),'GAMEPLAY');ctx.ready=false;assert.equal(Gate({children:'GAMEPLAY'}),null);
});
test('Character renders canonical name, birth date age and earned stats',()=>{
 const core=loader({})('core/progression'),player=core.addSkillXp(core.createNewPlayer('REAL TESTER'),'WIL',70);player.birthDate='2000-01-01';
 const ui=integrationUI({player,titles:['UNAWAKENED'],completedQuestIds:[],daily:null,activeQuestId:null,updateIdentity:async()=>{}});const tree=ui.render('screens/CharacterScreen');
 assert.match(treeText(tree),/REAL TESTER/);assert.match(treeText(tree),new RegExp('WIEK '+loader({})('identity/age').calculateAge(player.birthDate)));assert.match(treeText(tree),/70 \/ 117 XP/);
});
test('Settings hides destructive reset in production and preserves confirmation in development',()=>{
 const player=loader({})('core/progression').createNewPlayer(),ctx={player,settings:{audio:false,haptics:true},saveSettings:async()=>{},resetData:async()=>{}};
 const prod=integrationUI(ctx,{__DEV__:false}),dev=integrationUI(ctx,{__DEV__:true});
 assert.ok(!findButtons(prod.render('screens/SettingsScreen')).some(b=>treeText(b)==='RESET SYSTEM DATA // DEVELOPMENT'));
 const tree=dev.render('screens/SettingsScreen');findButtons(tree).find(b=>treeText(b)==='RESET SYSTEM DATA // DEVELOPMENT').props.onPress();
 assert.equal(nodesOfType(dev.render('screens/SettingsScreen'),'Modal')[0].props.visible,true);
});
test('Settings exposes AI Game Master entry point',()=>{
 const player=loader({})('core/progression').createNewPlayer(),ctx={player,settings:{audio:false,haptics:true},saveSettings:async()=>{},resetData:async()=>{}};
 const ui=integrationUI(ctx,{__DEV__:false}),tree=ui.render('screens/SettingsScreen');
 const button=findButtons(tree).find(b=>treeText(b)==='AI GAME MASTER →');
 assert.ok(button);button.props.onPress();assert.equal(ui.navigation.at(-1),'/game-master');
});
test('quest list shows persisted FAILED, offers retry and de-duplicates Daily cards',async t=>{
 const h=await dailyHarness(t),s=await h.db.loadSystemState(),id=s.daily.questIds[0];
 await h.db.beginQuestAttempt(id,'ui-failed');h.clock.now+=10000;await h.db.endQuestAttempt('ui-failed','INTERRUPTED','BACKGROUND',10,0);
 const state=await h.db.loadSystemState();assert.ok(state.failedQuestIds.includes(id));
 const ctx={...state,activeQuestId:null,daily:{...state.daily,questIds:[...state.daily.questIds,id]},refreshPlayer:async()=>{}};
 const ui=uiHarness(ctx),tree=ui.load('screens/QuestsScreen').default();assert.match(treeText(tree),/FAILED/);
 const q=h.load('quests/catalog').getQuest(id);assert.equal(findButtons(tree).filter(b=>treeText(b).includes(q.description)).length,1);
 assert.equal(await h.db.getQuestAccess(id),'AVAILABLE');
});
test('Android config retains release identity and background quest location permissions',()=>{
 const config=JSON.parse(fs.readFileSync(path.join(root,'app.json'),'utf8')).expo;
 assert.equal(config.name,'SYSTEM');assert.equal(config.android.package,'pl.systemworld.app');assert.ok(config.android.versionCode>=1);
 const location=config.plugins.find(p=>Array.isArray(p)&&p[0]==='expo-location')[1];assert.equal(location.isAndroidBackgroundLocationEnabled,true);assert.equal(location.isAndroidForegroundServiceEnabled,true);
 assert.ok(config.android.permissions.includes('android.permission.FOREGROUND_SERVICE_LOCATION'));assert.ok(config.android.permissions.includes('android.permission.ACCESS_BACKGROUND_LOCATION'));
});


function providerUI(db,dev=false,achievementMocks={}) {
 const slots=[],pending=[],cleanups=[],clock={now:Date.now(),intervals:new Map()};let cursor=0,value;
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>v===b[i]);
 const react={
  createContext:()=>({Provider:props=>{value=props.value;return props.children;}}),useContext:()=>value,
  useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v;}];},
  useRef(initial){const i=cursor++;return slots[i]??(slots[i]={current:initial});},
  useCallback(fn,deps){const i=cursor++;if(!slots[i]||!same(slots[i].deps,deps))slots[i]={deps,fn};return slots[i].fn;},
  useEffect(fn,deps){const i=cursor++;if(!slots[i]||!same(slots[i],deps)){slots[i]=deps;pending.push(fn);}},
 };
 const jsx=(type,props)=>typeof type==='function'?type(props):({type,props});
 const load=loader({react,'react/jsx-runtime':{jsx,jsxs:jsx},__DEV__:dev,
  'react-native':{AppState:{addEventListener:()=>({remove(){}}),currentState:'active'}},
  '../storage/database':db,
  '../cloud/sync':{flushCloudOutbox:async()=>({authenticated:false,sent:0,pending:0,failed:0})},
  '../ai':{requestDailyAIGameMaster:async()=>({
    quests:[],director:{mode:'normal',difficultyBias:0,headline:'DAILY DIRECTIVE',message:'TEST'},briefing:'',source:'fallback'
  })},
  '../background/locationService':{stopQuestBackgroundTracking:async()=>{}},
  '../achievements/reconcile':{reconcileAchievements:async()=>{}},
  '../achievements/storage':{loadAchievementsState:async()=>({}),loadTitlesState:async()=>({titles:{},activeTitleId:null})},
  ...achievementMocks,
  '../identity/audio':{configureAudio(){},playFeedback(){},rewardSound(){},stopAudio(){}},
  '../identity/feedback':{configureHaptics(){}},
  '../identity/avatar':{removeAllAvatars(){}},
  '../notifications/service':{syncReminders:async()=>{}},
 },clock);
 const Provider=load('state/SystemProvider').SystemProvider;
 return {render(){cursor=0;Provider({children:null});for(const fn of pending.splice(0)){const cleanup=fn();if(cleanup)cleanups.push(cleanup);}return value;},close(){for(const fn of cleanups)fn();}};
}
function startupFixture(){const player=loader({})('core').createNewPlayer('RETURNING');return {player,completedQuestIds:[],daily:null,story:null,onboardingComplete:true,awakeningCompleted:false,awakeningPending:false,worldUnlocked:false,settings:{haptics:true,audio:false},titles:['UNAWAKENED']};}
test('SystemProvider gates startup on health and blocks production reset',async()=>{
 const state=startupFixture();let healthy=false,resetCalls=0;
 const db={hasAvatarCleanupPending:async()=>false,loadSystemState:async()=>state,testerHealthCheck:async()=>({ok:healthy,issues:healthy?[]:[{code:'PLAYER_INVALID'}]}),resetSystemData:async()=>{resetCalls++;}};
 const h=providerUI(db);try {
  assert.equal(h.render().ready,false);await flush();let ctx=h.render();assert.equal(ctx.ready,false);assert.match(ctx.error,/PLAYER_INVALID/);
  healthy=true;await ctx.refreshPlayer();ctx=h.render();assert.equal(ctx.ready,true);assert.equal(ctx.onboardingComplete,true);assert.equal(ctx.player.id,state.player.id);
  await assert.rejects(ctx.resetData(true));assert.equal(resetCalls,0);
 }finally{h.close();}
});
test('SystemProvider late refresh cannot overwrite committed reward',async()=>{
 const state=startupFixture();let release;
 const rewarded={...state,player:loader({})('core').addRealXp(state.player,100),awarded:true};
 const db={hasAvatarCleanupPending:async()=>false,loadSystemState:async()=>state,testerHealthCheck:async()=>({ok:true,issues:[]}),completeVerifiedQuest:async()=>rewarded};
 const h=providerUI(db);try {
  h.render();await flush();let ctx=h.render();assert.equal(ctx.ready,true);
  db.loadSystemState=()=>new Promise(resolve=>{release=resolve;});const stale=ctx.refreshPlayer();await flush();
  await ctx.completeVerifiedQuest(evidence);ctx=h.render();assert.equal(ctx.player.totalRealXp,100);
  release(state);await stale;ctx=h.render();assert.equal(ctx.player.totalRealXp,100);
 }finally{h.close();}
});
test('SystemProvider reuses persisted AI Daily and manual refresh cannot replace accepted quests',async()=>{
 const player=loader({})('core').createNewPlayer('AI CACHE');
 const director={mode:'normal',difficultyBias:0,headline:'CACHED DAILY',message:'Persisted plan'};
 const state={...startupFixture(),player,systemDebt:0,awakeningCompleted:true,
  daily:{dayKey:'2026-09-20',weekKey:'2026-W38',questIds:[],suspiciousQuestIds:[],completed:0,weeklyCompleted:0,clear:false,weeklyClear:false,clockAnomaly:false},
  aiDaily:{dayKey:'2026-09-20',source:'ai',briefing:'cached briefing',director,generatedAt:'2026-09-20T10:00:00.000Z'}};
 let requests=0;
 const db={hasAvatarCleanupPending:async()=>false,loadSystemState:async()=>state,testerHealthCheck:async()=>({ok:true,issues:[]})};
 const h=providerUI(db,false,{'../ai':{requestDailyAIGameMaster:async()=>{requests++;throw new Error('must not regenerate');}}});
 try{
  h.render();await flush();await flush();let ctx=h.render();
  assert.equal(ctx.aiGameMaster.briefing,'cached briefing');assert.equal(requests,0);
  await ctx.refreshAIGameMaster();await flush();ctx=h.render();
  assert.equal(ctx.aiGameMaster.director.headline,'CACHED DAILY');assert.equal(requests,0);
 }finally{h.close();}
});

test('earned achievements remain unlocked after streak loss', () => {
  const load = loader({}), engine = load('achievements/engine');
  const player = load('core').createNewPlayer();
  const first = engine.evaluateAchievementState({...player, streak: 7}, {}, '2026-09-20');
  const next = engine.evaluateAchievementState(player, first.progress);
  assert.equal(next.progress.streak_7.state, 'UNLOCKED');
  assert.equal(next.progress.streak_7.currentProgress, 7);
  assert.equal(next.progress.streak_7.unlockedAt, '2026-09-20');
  assert.equal(next.newlyUnlocked.length, 0);
});

test('achievement reconciliation rolls back events and progress together', async t => {
  const h = databaseHarness(t); const player = await h.db.loadOrCreatePlayer();
  const reconcile = h.load('achievements/reconcile').reconcileAchievements;
  h.faults.statement = 'INSERT INTO achievement_events';
  await assert.rejects(reconcile({...player, verifiedQuestCount: 1}));
  await reconcile({...player, verifiedQuestCount: 1});
  assert.equal(h.sql.prepare("SELECT count(*) n FROM achievement_events WHERE achievement_id='first_quest' AND type='ACHIEVEMENT_UNLOCKED'").get().n, 1);
});

test('parallel achievement reconciliation is idempotent and reset clears all persisted state', async t => {
  const h = databaseHarness(t); const player = await h.db.loadOrCreatePlayer();
  const reconcile = h.load('achievements/reconcile').reconcileAchievements;
  await Promise.all(Array.from({length: 3}, () => reconcile({...player, verifiedQuestCount: 1})));
  assert.equal(h.sql.prepare("SELECT count(*) n FROM achievement_events WHERE achievement_id='first_quest' AND type='ACHIEVEMENT_UNLOCKED'").get().n, 1);
  await h.db.resetSystemData(true);
  for (const table of ['achievements', 'player_titles', 'achievement_events']) assert.equal(h.sql.prepare('SELECT count(*) n FROM '+table).get().n, 0);
  await reconcile({...player, verifiedQuestCount: 10});
  assert.equal(h.sql.prepare('SELECT count(*) n FROM achievements').get().n, 0);
});

test('SystemProvider does not gate startup on stalled achievement sync', async () => {
  const state=startupFixture(); const stalled=deferred();
  const db={hasAvatarCleanupPending:async()=>false,loadSystemState:async()=>state,testerHealthCheck:async()=>({ok:true,issues:[]})};
  const h=providerUI(db,false,{'../achievements/reconcile':{reconcileAchievements:()=>stalled.promise}});
  try { h.render(); await flush(); assert.equal(h.render().ready,true); }
  finally { stalled.resolve(); await flush(); h.close(); }
});

test('achievement claim survives stale progress and repeated unlock', async t => {
  const h=databaseHarness(t); await h.db.loadSystemState(); const s=h.load('achievements/storage');
  await s.updateAchievementProgress('quest_10',10,10); await s.claimAchievement('quest_10');
  const claimed=(await s.loadAchievementsState()).quest_10;
  await s.unlockAchievement('quest_10');
  await s.saveAchievementProgress('quest_10',{state:'IN_PROGRESS',currentProgress:2,maxProgress:10});
  assert.equal(JSON.stringify((await s.loadAchievementsState()).quest_10),JSON.stringify(claimed));
});

test('title activation requires an earned title and repeated unlock preserves selection', async t => {
  const h=databaseHarness(t); await h.db.loadSystemState(); const s=h.load('achievements/storage');
  await s.unlockTitle('awakened'); await s.setActiveTitle('awakened');
  const title=(await s.loadTitlesState()).titles.awakened;
  await assert.rejects(s.setActiveTitle('missing')); assert.equal(await s.getActiveTitle(),'awakened');
  await s.unlockTitle('awakened'); assert.equal(JSON.stringify((await s.loadTitlesState()).titles.awakened),JSON.stringify(title));
});

test('achievement reset rollback preserves gameplay and achievements together', async t => {
  const h=databaseHarness(t); const player=await h.db.loadOrCreatePlayer();
  await h.load('achievements/reconcile').reconcileAchievements({...player,verifiedQuestCount:1});
  h.faults.statement='DELETE FROM achievements'; await assert.rejects(h.db.resetSystemData(true));
  assert.equal((await h.db.loadOrCreatePlayer()).id,player.id);
  assert.equal((await h.load('achievements/storage').loadAchievementsState()).first_quest.state,'UNLOCKED');
});

test('SystemProvider ignores achievement reads from before reset and reports retryable sync errors', async () => {
  let state=startupFixture();const stale=deferred();let first=true,fail=false;
  const db={hasAvatarCleanupPending:async()=>false,loadSystemState:async()=>state,testerHealthCheck:async()=>({ok:true,issues:[]}),
    resetSystemData:async()=>{state={...startupFixture(),onboardingComplete:false};},acknowledgeAvatarCleanup:async()=>{}};
  const h=providerUI(db,true,{
    '../achievements/reconcile':{reconcileAchievements:async()=>{if(fail)throw new Error('offline');}},
    '../achievements/storage':{loadAchievementsState:async()=>{if(first){first=false;return stale.promise;}return {};},loadTitlesState:async()=>({titles:{},activeTitleId:null})},
  });
  try {
    h.render();await flush();await h.render().resetData(true);await flush();
    stale.resolve({old:{state:'UNLOCKED',currentProgress:1,maxProgress:1}});await flush();
    assert.equal(Object.keys(h.render().achievementState.achievements).length,0);
    fail=true;await h.render().refreshAchievements();assert.ok(h.render().achievementError);assert.equal(h.render().ready,true);
    fail=false;await h.render().refreshAchievements();assert.equal(h.render().achievementError,null);
  } finally {stale.resolve({});h.close();}
});

test('achievements reconcile persisted World signal and field completions', async t => {
  const h=await worldLinkHarness(t); const state=await h.db.loadSystemState();
  await h.load('achievements/reconcile').reconcileAchievements(state.player);
  const stored=await h.load('achievements/storage').loadAchievementsState();
  assert.equal(stored.first_signal.state,'UNLOCKED');
  assert.ok(stored.field_quest_10.currentProgress > 0);
});

test('walking totals cannot unlock a single-quest run achievement', () => {
  const load=loader({}), player={...load('core').createNewPlayer(),totalDistanceMeters:25000};
  const progress=load('achievements/engine').evaluateAchievementState(player).progress;
  assert.equal(progress.run_5km.state,'LOCKED');assert.equal(progress.walk_1km.state,'LOCKED');
});

test('cycling completion cannot unlock walking or running achievements', async t => {
  const h=databaseHarness(t);const player=await h.db.loadOrCreatePlayer();
  const id='daily:2026-09-20:ride_protocol_1', now='2026-09-20T12:00:00.000Z';
  h.sql.prepare('INSERT INTO quest_completions VALUES (?,?)').run(id,now);
  h.sql.prepare('INSERT INTO verified_events VALUES (?,?,?,?)').run(id,id,JSON.stringify({id,questId:id,playerId:player.id,createdAt:now,verified:true,realXpAwarded:100,skillXpAwarded:{VIT:80},distanceMeters:25000}),now);
  await h.load('achievements/reconcile').reconcileAchievements(player);
  const stored=await h.load('achievements/storage').loadAchievementsState();
  assert.equal(stored.walk_1km.state,'LOCKED');assert.equal(stored.run_5km.state,'LOCKED');
});

test('cloud backfill includes later daily bonuses and retries without duplicating events', async t => {
  const h=await dailyHarness(t);
  await h.db.backfillCloudOutbox();
  h.sql.prepare("INSERT OR REPLACE INTO app_state(key,value) VALUES('cloud_outbox_backfill_v1','true')").run();
  for(let day=0;day<2;day++) {
    const s=await h.db.loadSystemState();
    for(const id of s.daily.questIds) await h.db.completeVerifiedQuest(dailyEvidence(h,id));
    h.clock.now+=86400000;
  }
  await h.db.backfillCloudOutbox();
  const count=()=>h.sql.prepare('SELECT count(*) n FROM cloud_outbox').get().n;
  const n=count();
  assert.equal(n,h.sql.prepare('SELECT count(*) n FROM verified_events').get().n);
  assert.equal(h.sql.prepare("SELECT count(*) n FROM cloud_outbox WHERE entity_id LIKE 'daily_clear:%'").get().n,2);
  assert.equal(h.sql.prepare("SELECT count(*) n FROM cloud_outbox WHERE entity_id LIKE 'weekly_complete:%'").get().n,1);
  await h.db.backfillCloudOutbox();assert.equal(count(),n);
  const payload=JSON.parse(h.sql.prepare("SELECT payload FROM cloud_outbox WHERE entity_id LIKE 'daily_clear:%' LIMIT 1").get().payload);
  assert.equal(payload.verification_type,'MULTI');assert.equal(payload.realXpAwarded,undefined);
});

test('cloud outbox includes story completion claims without copying local rewards', async t => {
  const h=await dailyHarness(t);
  h.sql.prepare("INSERT INTO story_progress(id,completed_at) VALUES('extra_mile_v1','2026-09-18T12:00:00Z')").run();
  await h.db.backfillCloudOutbox();await h.db.backfillCloudOutbox();
  const rows=h.sql.prepare("SELECT * FROM cloud_outbox WHERE event_key='verified:story:extra_mile_v1'").all();
  assert.equal(rows.length,1);
  assert.deepEqual(JSON.parse(rows[0].payload),{quest_id:'extra_mile_v1',verification_type:'MULTI',verification_score:100});
});
