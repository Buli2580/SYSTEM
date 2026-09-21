const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

const events = read('presentation/PresentationEvents.ts');
const audio = read('audio/PresentationAudioBridge.tsx');
const haptics = read('presentation/PresentationHapticsBridge.tsx');
const provider = read('state/SystemProvider.tsx');
const engine = read('presentation/PresentationEngine.tsx');

for (const event of [
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

assert.match(audio, /case 'ACHIEVEMENT_UNLOCKED': return 'ACHIEVEMENT'/);
assert.match(audio, /case 'LEVEL_UP': return 'LEVEL_UP'/);
assert.match(audio, /case 'BOSS_DEFEATED': return 'BOSS_DEFEATED'/);
assert.match(audio, /case 'SYSTEM_WARNING'/);

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
