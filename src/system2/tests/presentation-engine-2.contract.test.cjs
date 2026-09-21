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
const characterBackdrop = read('presentation/AnimatedCharacterBackdrop.tsx');
const systemPage = read('components/SystemPage.tsx');
const questRun = read('screens/QuestRunScreen.tsx');
const systemBoot = read('components/SystemBoot.tsx');
const awakening = read('components/AwakeningCelebration.tsx');
const heroCatalog = read('heroes/catalog.ts');
const heroProvider = read('heroes/provider.tsx');
const heroStore = read('heroes/store.ts');
const heroScreen = read('screens/HeroCardsScreen.tsx');
const heroTile = read('components/HeroCardTile.tsx');
const characterScreen = read('screens/CharacterScreen.tsx');
const heroRoute = fs.readFileSync(path.join(root, '../app/heroes.tsx'), 'utf8');

for (const event of [
  'UI_CONFIRM',
  'UI_NAVIGATE',
  'UI_TOGGLE',
  'QUEST_COMPLETE',
  'LEVEL_UP',
  'ACHIEVEMENT_UNLOCKED',
  'HERO_CARD_UNLOCKED',
  'HERO_CARD_EQUIPPED',
  'STREAK_MILESTONE',
  'BOSS_DAMAGE',
  'BOSS_PHASE_CHANGED',
  'BOSS_DEFEATED',
  'SYSTEM_WARNING',
  'SYSTEM_ERROR',
  'AWAKENING_STARTED',
  'AWAKENING_COMPLETE',
]) {
  assert.match(events, new RegExp("'" + event + "'"), event + ' missing from presentation contract');
}

assert.match(engine, /<PresentationAudioBridge\s*\/>/, 'audio bridge not mounted');
assert.match(engine, /<PresentationHapticsBridge\s*\/>/, 'haptics bridge not mounted');
assert.match(engine, /<HeroCardsProvider>/, 'Hero Cards provider not mounted');

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

assert.match(audio, /case 'ACHIEVEMENT_UNLOCKED':[\s\S]*HERO_CARD_UNLOCKED': return 'ACHIEVEMENT'/);
assert.match(audio, /case 'HERO_CARD_EQUIPPED': return 'UI_CONFIRM'/);
assert.match(audio, /case 'LEVEL_UP': return 'LEVEL_UP'/);
assert.match(audio, /case 'BOSS_DEFEATED': return 'BOSS_DEFEATED'/);
assert.match(audio, /case 'SYSTEM_WARNING'/);
assert.match(audioEngine, /duckMusic/, 'music ducking missing');
assert.match(audioEngine, /previousTrack\.source === track\.source/, 'seamless ambient transition missing');
for (const asset of [
  'system_boot.mp3',
  'home.mp3',
  'character.mp3',
  'explore.mp3',
  'quest.mp3',
  'field_quest.mp3',
  'warning.mp3',
  'boss.mp3',
  'victory.mp3',
  'ai_game_master.mp3',
  'awakening.mp3',
]) {
  assert.ok(fs.existsSync(path.join(root, '../../assets/audio/music', asset)), asset + ' missing');
  assert.match(audioEngine, new RegExp(asset.replace('.', '\\.') + "'"), asset + ' not wired into AudioEngine');
}

assert.match(audioEngine, /\| 'AI_GAME_MASTER'/, 'AI Game Master music state missing');
assert.match(audioEngine, /\| 'AWAKENING'/, 'awakening music state missing');
assert.match(audio, /pathname\.startsWith\('\/game-master'\).*AI_GAME_MASTER/, 'Game Master route missing dedicated soundtrack');
assert.match(audio, /case 'AWAKENING_STARTED': return 'AWAKENING'/, 'awakening soundtrack route missing');
assert.match(awakening, /PresentationEventPresets\.awakeningStarted/, 'awakening start event missing');
assert.match(awakening, /PresentationEventPresets\.awakeningComplete/, 'awakening completion event missing');
assert.doesNotMatch(awakening, /identity\/feedback/, 'awakening still uses direct haptics');


assert.match(worldTracking, /PresentationEventPresets\.sectorDiscovered/, 'World sector discovery bypasses Presentation Engine');
assert.doesNotMatch(worldTracking, /identity\/feedback/, 'World still uses direct haptics');
assert.match(action, /PresentationEventPresets\.uiConfirm/, 'shared Action missing central UI feedback');
assert.match(bottomNavigation, /PresentationEventPresets\.uiNavigate/, 'bottom navigation missing central UI feedback');
assert.match(characterBackdrop, /TRAINING_STRENGTH/, 'strength training scene missing');
assert.match(characterBackdrop, /TRAINING_CARDIO/, 'cardio training scene missing');
assert.match(characterBackdrop, /AI_GAME_MASTER/, 'AI Game Master scene missing');
assert.match(characterBackdrop, /BOSS/, 'boss character scene missing');
assert.match(characterBackdrop, /AWAKENING/, 'awakening character scene missing');
assert.match(characterBackdrop, /presentationEventBus\.onAny/, 'character backdrop is not reactive to presentation events');
assert.match(systemPage, /<AnimatedCharacterBackdrop/, 'SYSTEM pages missing character background');
assert.match(systemPage, /sceneForPath\(pathname\)/, 'SYSTEM pages do not resolve route character scene');
assert.match(questRun, /questCharacterScene/, 'quest screen missing dynamic character scene');
assert.match(questRun, /TRAINING_STRENGTH/, 'quest screen missing strength training routing');
assert.match(questRun, /TRAINING_CARDIO/, 'quest screen missing cardio training routing');
assert.match(systemBoot, /scene="AWAKENING"/, 'opening sequence missing hero character');

assert.match(characterBackdrop, /useHeroCards/, 'cinematic backdrop does not read equipped Hero Card');
assert.match(characterBackdrop, /DungeonTravelLayer/, 'dungeon travel layer missing');
assert.match(characterBackdrop, /combat\.value/, 'boss combat loop missing');
assert.match(characterBackdrop, /impactFlash/, 'boss impact feedback missing');
assert.match(characterBackdrop, /HERO_CARD_UNLOCKED/, 'hero unlock does not trigger cinematic reaction');

assert.match(heroCatalog, /SYSTEM ZERO/, 'starter Hero Card missing');
assert.match(heroCatalog, /SYSTEM ASCENDANT/, 'Mythic Hero Card missing');
assert.match(heroCatalog, /type HeroRarity = 'COMMON' \| 'RARE' \| 'EPIC' \| 'LEGENDARY' \| 'MYTHIC'/, 'Hero Card rarity contract missing');
assert.match(heroProvider, /SecureStore\.setItemAsync\(ACTIVE_KEY/, 'Hero Card equip is not persisted');
assert.match(heroProvider, /getUnlockedHeroIds/, 'Hero Card provider is not driven by progression');
assert.match(heroStore, /useHeroCards/, 'Hero Cards reactive store missing');
assert.match(heroScreen, /<HeroCardTile/, 'Hero Cards collection screen missing cards');
assert.match(heroScreen, /equipHero\(card\.id\)/, 'Hero Cards collection cannot equip characters');
assert.match(heroTile, /USTAW BOHATERA/, 'Hero Card equip UI missing');
assert.match(characterScreen, /HERO CARDS →/, 'Character screen missing Hero Cards entry');
assert.match(heroRoute, /HeroCardsScreen/, 'Hero Cards app route missing');



assert.match(haptics, /case 'ACHIEVEMENT_UNLOCKED'/);
assert.match(haptics, /case 'HERO_CARD_UNLOCKED'/);
assert.match(haptics, /case 'HERO_CARD_EQUIPPED'/);
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
