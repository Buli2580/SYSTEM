const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const events = read('presentation/PresentationEvents.ts');
const audio = read('audio/PresentationAudioBridge.tsx');
const audioEngine = read('audio/AudioEngine.tsx');
const haptics = read('presentation/PresentationHapticsBridge.tsx');
const provider = read('state/SystemProvider.tsx');
const engine = read('presentation/PresentationEngine.tsx');
const worldTracking = read('world/useWorldTracking.ts');
const action = read('components/Action.tsx');
const bottomNavigation = read('components/BottomNavigation.tsx');

for (const event of [
  'UI_CONFIRM',
  'UI_NAVIGATE',
  'UI_TOGGLE',
  'QUEST_COMPLETE',
  'LEVEL_UP',
  'ACHIEVEMENT_UNLOCKED',
  'STREAK_MILESTONE',
  'BOSS_DAMAGE',
  'BOSS_PHASE_CHANGED',
  'BOSS_DEFEATED',
  'SYSTEM_WARNING',
  'SYSTEM_ERROR',
]) {
  assert.match(events, new RegExp("'" + event + "'"), event + ' missing from presentation contract');
}

assert.match(engine, /<PresentationAudioBridge\s*\/>/, 'audio bridge not mounted');
assert.match(engine, /<PresentationHapticsBridge\s*\/>/, 'haptics bridge not mounted');

for (const [event, sfx] of [
  ['UI_CLICK', 'UI_CLICK'],
  ['UI_CONFIRM', 'UI_CONFIRM'],
  ['UI_CANCEL', 'UI_CANCEL'],
  ['UI_NAVIGATE', 'UI_NAVIGATE'],
  ['UI_TOGGLE', 'UI_TOGGLE'],
  ['SYSTEM_READY', 'SYSTEM_READY'],
  ['QUEST_ACCEPTED', 'QUEST_ACCEPT'],
  ['QUEST_STARTED', 'QUEST_START'],
  ['QUEST_FAILED', 'QUEST_FAIL'],
  ['STREAK_MILESTONE', 'STREAK_MILESTONE'],
  ['SECTOR_DISCOVERED', 'SECTOR_DISCOVERED'],
  ['BOSS_APPEARED', 'BOSS_APPEAR'],
  ['BOSS_DAMAGE', 'BOSS_HIT'],
  ['BOSS_PHASE_CHANGED', 'BOSS_PHASE'],
]) {
  assert.match(audio, new RegExp("case '" + event + "': return '" + sfx + "'"), event + ' missing SFX route');
}

for (const asset of [
  'quest_accept.wav',
  'quest_start.wav',
  'quest_fail.wav',
  'warning.wav',
  'boss_appear.wav',
  'boss_hit.wav',
  'boss_phase.wav',
  'streak_milestone.wav',
  'sector_discovered.wav',
  'achievement_unlock.wav',
  'boss_defeated.wav',
  'ui_click.wav',
  'ui_confirm.wav',
  'ui_cancel.wav',
  'ui_navigate.wav',
  'ui_toggle.wav',
]) {
  assert.ok(fs.existsSync(path.join(root, '../../assets/audio/sfx', asset)), asset + ' missing');
  assert.match(audioEngine, new RegExp(asset.replace('.', '\\.') + "'"), asset + ' not wired into AudioEngine');
}

assert.match(audio, /case 'ACHIEVEMENT_UNLOCKED': return 'ACHIEVEMENT'/);
assert.match(audio, /case 'LEVEL_UP': return 'LEVEL_UP'/);
assert.match(audio, /case 'BOSS_DEFEATED': return 'BOSS_DEFEATED'/);
assert.match(audio, /case 'SYSTEM_WARNING'/);
assert.match(audioEngine, /duckMusic/, 'music ducking missing');
assert.match(audioEngine, /previousTrack\.source === track\.source/, 'seamless ambient transition missing');

assert.match(worldTracking, /PresentationEventPresets\.sectorDiscovered/, 'World sector discovery bypasses Presentation Engine');
assert.doesNotMatch(worldTracking, /identity\/feedback/, 'World still uses direct haptics');
assert.match(action, /PresentationEventPresets\.uiConfirm/, 'shared Action missing central UI feedback');
assert.match(bottomNavigation, /PresentationEventPresets\.uiNavigate/, 'bottom navigation missing central UI feedback');

assert.match(haptics, /case 'ACHIEVEMENT_UNLOCKED'/);
assert.match(haptics, /case 'STREAK_MILESTONE'/);
assert.match(haptics, /case 'BOSS_DAMAGE'/);
assert.match(haptics, /case 'BOSS_DEFEATED'/);
assert.match(haptics, /NotificationFeedbackType\.Error/);

assert.match(provider, /PresentationEventPresets\.achievementUnlocked/);
assert.match(provider, /PresentationEventPresets\.streakMilestone/);
assert.match(provider, /PresentationEventPresets\.bossDamage/);
assert.match(provider, /PresentationEventPresets\.bossPhaseChanged/);
assert.match(provider, /PresentationEventPresets\.bossDefeated/);
assert.match(provider, /PresentationEventPresets\.systemWarning/);
assert.match(provider, /PresentationEventPresets\.systemError/);

console.log('Presentation Engine 2.0 contract: PASS');
