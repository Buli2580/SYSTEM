const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function harness() {
  const players = [], intervals = new Map(), timeouts = new Map();
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../audio/engine.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, {
    module, exports: module.exports,
    setInterval(fn) { const id = {}; intervals.set(id, fn); return id; },
    clearInterval(id) { intervals.delete(id); },
    setTimeout(fn) { const id = {}; timeouts.set(id, fn); return id; },
    clearTimeout(id) { timeouts.delete(id); },
    require(name) {
      if (name === 'expo-audio') return { createAudioPlayer() {
        const player = { volume: 0, loop: false, removed: false, play() {}, remove() { this.removed = true; } };
        players.push(player); return player;
      } };
      if (name === './manifest') return { LEGACY_AUDIO_FALLBACKS: {
        music: { HOME: { source: 1, loop: true }, WORLD: { source: 2, loop: true } }, sfx: {}, cinematic: { layers: {}, events: {} },
      } };
      throw new Error('Unexpected dependency: ' + name);
    },
  });
  return { audio: module.exports, players, intervals, timeouts };
}

test('disabling audio during crossfade releases outgoing and current native players', () => {
  const h = harness();
  h.audio.configureAudioEngine({ enabled: true });
  h.audio.playMusic('HOME');
  h.audio.playMusic('WORLD');
  h.audio.configureAudioEngine({ enabled: false });
  assert.equal(h.players.length, 2);
  assert.ok(h.players.every(p => p.removed), 'outgoing crossfade player must also be removed');
  assert.equal(h.intervals.size, 0);
  assert.equal(h.timeouts.size, 0);
});

test('stopping all audio releases ambient and cinematic players already fading out', () => {
  const h = harness();
  h.audio.configureAudioEngine({ enabled: true });
  h.audio.playAmbient(1);
  h.audio.stopAmbient();
  h.audio.setCinematicLayer('WIND', 2);
  h.audio.clearCinematicLayer('WIND');
  h.audio.stopAllAudio();
  assert.ok(h.players.every(p => p.removed));
  assert.equal(h.intervals.size, 0);
});
