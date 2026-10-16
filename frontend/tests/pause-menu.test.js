import test from 'node:test';
import assert from 'node:assert/strict';
import { installPauseMenu, shiftMenuTimers, buildControlsHelp } from '../src/pause-menu.js';
import { setAudioVolume, updateGameAudio } from '../src/audio.js';

test('volume slider clamps values and updates the shared audio gain', () => {
  let gain = 1;
  const s = { gameAudio: { currentTime: 10 }, audioMaster: { gain: { setValueAtTime: (value) => { gain = value; } } } };
  setAudioVolume(s, 0.35);
  assert.equal(gain, 0.35);
  assert.equal(s.audioEnabled, true);
  setAudioVolume(s, 0);
  assert.equal(gain, 0);
  assert.equal(s.audioEnabled, false);
  setAudioVolume(s, 7);
  assert.equal(gain, 1);
});

test('standing still does not create periodic ambient sounds', () => {
  let tones = 0;
  updateGameAudio({ audioEnabled: true, gameAudio: { state: 'running', createOscillator: () => { tones += 1; } },
    time: { now: 60000 }, player: { body: { speed: 0 } }, nextAmbientSound: 0 });
  assert.equal(tones, 0);
});

test('pause preserves cooldowns, boss warnings, projectiles and dialogue timing', () => {
  const arrow = { expiresAt: 2000 };
  const s = { rushSkill: { activeUntil: 5000, readyAt: 15000 }, swordAuraSkill: { until: 0, readyAt: 0 },
    bossFightActive: true, nextBeerAt: 1500, nextPuddleAt: 2500, bossPuddles: [{ createdAt: 0 }],
    bossProjectiles: { getChildren: () => [arrow] }, npcDialogueOpen: true, npcDialogueStartedAt: 100 };
  shiftMenuTimers(s, 10000);
  assert.equal(s.rushSkill.activeUntil, 15000);
  assert.equal(s.rushSkill.readyAt, 25000);
  assert.equal(s.swordAuraSkill.until, 0);
  assert.equal(s.nextBeerAt, 11500);
  assert.equal(s.bossPuddles[0].createdAt, 10000);
  assert.equal(arrow.expiresAt, 12000);
  assert.equal(s.npcDialogueStartedAt, 10100);
});

class Element {
  constructor() { this.nodes = new Map(); this.listeners = {}; this.isConnected = true; }
  querySelector(selector) { if (!this.nodes.has(selector)) this.nodes.set(selector, new Element()); return this.nodes.get(selector); }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  remove() { this.removed = true; }
  focus() {}
}

test('Esc opens pause, Info shows controls, and Esc returns then resumes once', () => {
  const nodes = [], listeners = {};
  globalThis.window = {};
  globalThis.document = { activeElement: new Element(), body: { appendChild: (node) => nodes.push(node) },
    createElement: () => new Element(), addEventListener: (key, callback) => { listeners[key] = callback; }, removeEventListener() {} };
  let pauses = 0, resumes = 0;
  const s = { audioVolume: 0.7, audioEnabled: true, game: { loop: { now: 0 } }, events: { once() {} },
    input: { keyboard: { resetKeys() {} } }, scene: { isActive: () => false, pause: () => { pauses += 1; }, resume: () => { resumes += 1; } } };
  installPauseMenu(s);
  const escape = () => listeners.keydown({ key: 'Escape', repeat: false, preventDefault() {}, stopImmediatePropagation() {} });
  escape();
  assert.equal(s.menuOpen, true);
  assert.equal(pauses, 1);
  const overlay = nodes.find(({ className }) => className === 'pause-overlay');
  assert(overlay.innerHTML.includes('Aura Sabiei'));
  assert(!overlay.innerHTML.includes('Death Breath'));
  assert.equal(overlay.querySelector('#game-volume').value, '70');
  overlay.querySelector('.pause-info').listeners.click();
  assert.equal(overlay.querySelector('.pause-help').hidden, false);
  escape();
  assert.equal(s.menuOpen, true);
  assert.equal(resumes, 0);
  escape();
  assert.equal(s.menuOpen, false);
  assert.equal(resumes, 1);
  assert.equal(overlay.removed, true);
});

test('Info only describes unlocked reward abilities', () => {
  assert(!buildControlsHelp({ inventory: [] }).includes('Death Breath'));
  assert(!buildControlsHelp({ inventory: [] }).includes('Flashlight'));
  const beer = buildControlsHelp({ hasDeathBreath: true, inventory: [] });
  assert(beer.includes('Death Breath'));
  assert(!beer.includes('Flashlight'));
  const other = buildControlsHelp({ inventory: [{ type: 'flashlight' }] });
  assert(other.includes('Flashlight'));
  assert(!other.includes('Death Breath'));
});
