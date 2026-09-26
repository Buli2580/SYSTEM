const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = process.env.SYSTEM_PROJECT_ROOT ?? path.resolve(__dirname, '../../..');
const ts = require(require.resolve('typescript', { paths: [root, process.cwd()] }));

function load(relative) {
  const file = path.join(root, 'src/system2', relative + '.ts');
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const requireModule = name => {
    if (/\.(mp3|wav)$/.test(name)) return name;
    if (name === 'expo-audio') return { createAudioPlayer() { throw new Error('Audio should remain disabled'); } };
    if (name.startsWith('.')) return load(path.relative(path.join(root, 'src/system2'), path.resolve(path.dirname(file), name)));
    return require(name);
  };
  vm.runInNewContext(source, { module, exports: module.exports, require: requireModule, console, Set, Math, JSON, setTimeout, clearTimeout, setInterval, clearInterval });
  return module.exports;
}

test('Home 2.0 priorities put active quest before daily and social', () => {
  const { homePriorities } = load('beta/home');
  const result = Array.from(homePriorities({ activeQuest: true, daily: 2, weekly: true, boss: true, world: true }));
  assert.deepEqual(result, ['ACTIVE_QUEST','DAILY','WEEKLY','BOSS','WORLD','SOCIAL']);
});

test('Home 2.0 still exposes social when gameplay queues are empty', () => {
  const { homePriorities } = load('beta/home');
  assert.deepEqual(Array.from(homePriorities({ activeQuest: false, daily: 0, weekly: false, boss: false, world: false })), ['SOCIAL']);
});

test('Quest Experience 2.0 maps runtime states to complete lifecycle', () => {
  const { questExperiencePhaseFromRun, activeQuestFlowStep } = load('beta/questFlow');
  const cases = [
    ['CHECKING','CHECKING','BRIEFING'],
    ['READY','READY','BRIEFING'],
    ['STARTING','STARTING','START'],
    ['TRACKING','ACTIVE','ACTIVE'],
    ['COMPLETING','VERIFYING','VERIFY'],
    ['COMPLETED','COMPLETE','REWARD'],
    ['ERROR','RECOVERY','BRIEFING'],
    ['DENIED','RECOVERY','BRIEFING'],
    ['LOCKED','LOCKED','BRIEFING'],
  ];
  for (const [runtime, phase, step] of cases) {
    assert.equal(questExperiencePhaseFromRun(runtime), phase);
    assert.equal(activeQuestFlowStep(phase), step);
  }
});

test('Quest Experience recovery copy never implies partial reward', () => {
  const { questExperienceMessage } = load('beta/questFlow');
  const text = questExperienceMessage('RECOVERY');
  assert.match(text, /spróbować ponownie/i);
  assert.doesNotMatch(text, /częściow.*XP|partial XP/i);
});


test('Quest Experience audio assets are valid RIFF/WAVE files', () => {
  for (const name of ['quest_start.wav','quest_error.wav']) {
    const file = path.join(root, 'assets/audio', name);
    const bytes = fs.readFileSync(file);
    assert.equal(bytes.subarray(0,4).toString('ascii'), 'RIFF');
    assert.equal(bytes.subarray(8,12).toString('ascii'), 'WAVE');
    assert.ok(bytes.length > 100);
  }
});

test('Canonical reward audio distinguishes level-up from normal completion', () => {
  const { rewardSound } = load('identity/audio');
  const base = { id:'r', realXp:10, skillXp:{}, energy:0, distanceMeters:0, beforeLevel:1, afterLevel:1, beforeRank:'E', afterRank:'E', skillLevels:[], newTitles:[], worldUnlocked:false };
  assert.equal(rewardSound(base), 'QUEST_COMPLETE');
  assert.equal(rewardSound({ ...base, afterLevel:2 }), 'LEVEL_UP');
});


test('Quest Experience exposes a non-empty message and CTA for every runtime phase', () => {
  const { questExperiencePhaseFromRun, questExperienceMessage, nextQuestCta } = load('beta/questFlow');
  for (const runtime of ['CHECKING','READY','STARTING','TRACKING','COMPLETING','COMPLETED','ERROR','DENIED','LOCKED']) {
    const phase = questExperiencePhaseFromRun(runtime);
    assert.ok(String(questExperienceMessage(phase)).trim().length > 0, runtime + ' message');
    assert.ok(String(nextQuestCta(phase)).trim().length > 0, runtime + ' CTA');
  }
});


test('reward presentation renders canonical unlocked titles', () => {
  const { presentationEventsFromReceipt } = load('presentation/events');
  const events = presentationEventsFromReceipt({
    id:'title-flow',realXp:400,skillXp:{RES:100},energy:25,distanceMeters:0,
    beforeLevel:4,afterLevel:5,beforeRank:'E',afterRank:'E',
    skillLevels:[],newTitles:['PATHFINDER','WALLBREAKER'],worldUnlocked:false,
  });
  assert.equal(events[0].kind,'QUEST_COMPLETE');
  assert.deepEqual(
    JSON.parse(JSON.stringify(events.filter(x=>x.kind==='TITLE_UNLOCKED').map(x=>x.title))),
    ['PATHFINDER','WALLBREAKER']
  );
});

test('reward presentation starts with quest completion before level/rank unlocks', () => {
  const { presentationEventsFromReceipt } = load('presentation/events');
  const events = presentationEventsFromReceipt({
    id:'reward-flow',realXp:120,skillXp:{WIL:30},energy:10,distanceMeters:0,
    beforeLevel:9,afterLevel:10,beforeRank:'E',afterRank:'D',
    skillLevels:[{key:'WIL',before:1,after:2}],newTitles:[],worldUnlocked:true,
  });
  assert.equal(events[0].kind,'QUEST_COMPLETE');
  assert.ok(events.findIndex(x=>x.kind==='LEVEL_UP')>0);
  assert.ok(events.findIndex(x=>x.kind==='RANK_UP')>events.findIndex(x=>x.kind==='LEVEL_UP'));
});


test('settings patches preserve unrelated preferences', () => {
  const { mergeSettings } = load('identity/model');
  const start = {
    haptics: true,
    audio: false,
    activities: { walking: true, running: false, cycling: true },
    dailyReminder: true,
    reminderTime: '19:00',
  };
  const audio = mergeSettings(start, { audio: true });
  assert.equal(audio.haptics, true);
  assert.equal(audio.audio, true);
  assert.equal(audio.dailyReminder, true);
  assert.equal(audio.reminderTime, '19:00');
  assert.deepEqual(JSON.parse(JSON.stringify(audio.activities)), { walking: true, running: false, cycling: true });

  const activity = mergeSettings(audio, { activities: { running: true } });
  assert.deepEqual(JSON.parse(JSON.stringify(activity.activities)), { walking: true, running: true, cycling: true });
  assert.equal(activity.audio, true);

  const reminder = mergeSettings(activity, { reminderTime: '07:30' });
  assert.equal(reminder.reminderTime, '07:30');
  assert.equal(reminder.dailyReminder, true);
  assert.equal(reminder.haptics, true);
});
