import test from 'node:test';
import assert from 'node:assert/strict';
import { showVictoryDialogue, beginChapterDialogue, useChapterPortal, enterLevelTwo } from '../src/chapter-two.js';

const chain = () => {
  let proxy;
  proxy = new Proxy({}, { get: () => () => proxy });
  return proxy;
};

function scene() {
  const overlays = [];
  globalThis.document = {
    body: { appendChild: (node) => overlays.push(node) },
    createElement: () => {
      const button = { focus() {}, addEventListener(event, callback) { this[event] = callback; } };
      return { querySelector: () => button, remove() { this.removed = true; }, button };
    },
  };
  const callbacks = [];
  return {
    overlays, callbacks, hidePrompt() {}, events: { once() {} }, setQuest() {},
    player: { x: 0, y: 0, setVelocity() { return this; }, setPosition(x, y) { this.x = x; this.y = y; return this; } },
    partyTete: { setVelocity() { return this; }, setPosition() { return this; } },
    bossRoomBounds: { x: 480, y: 340, width: 640, height: 400 },
    inventoryUi: { classList: { contains: () => true } },
    cameras: { main: { fadeOut() {}, fadeIn() {}, setBounds() {} } },
    time: { delayedCall: (_delay, callback) => callbacks.push(callback) },
    add: { graphics: chain, text: chain, zone: chain },
    physics: { world: { setBounds() {} }, add: { collider: chain, staticGroup: () => ({ add() {} }) } },
    bossRoomLayer: { setVisible() {} }, bossArenaColliders: [], arenaSolids: { clear() {} },
    obstacles: { getChildren: () => [{ body: { enable: true } }] },
  };
}

test('victory dialogue follows completion animation, announces party, and hides reward effects', () => {
  const s = scene();
  showVictoryDialogue(s);
  assert.equal(s.chapterDialogueOpen, true);
  assert.equal(s.overlays.length, 0);
  s.callbacks[0]();
  assert.equal(s.overlays.length, 1);
  assert(s.overlays[0].innerHTML.includes('party-ul tău'));
  assert(s.overlays[0].innerHTML.includes('Bere'));
  assert(s.overlays[0].innerHTML.includes('Sperma'));
  assert(!s.overlays[0].innerHTML.includes('Death Breath'));
  assert(!s.overlays[0].innerHTML.includes('Flashlight'));
  s.overlays[0].button.click();
  assert.equal(s.chapterDialogueOpen, false);
});

test('focused dialogue precedes the portal and cannot be opened twice', () => {
  const s = scene();
  beginChapterDialogue(s);
  beginChapterDialogue(s);
  assert.equal(s.overlays.length, 1);
  assert.equal(s.chapterDialogueOpen, true);
  assert.equal(s.chapterPortal, undefined);
  s.overlays[0].button.click();
  assert.equal(s.chapterDialogueOpen, false);
  assert(s.chapterPortal);
  assert.equal(s.overlays[0].removed, true);
});

test('portal requires proximity, waits for dialogue, and prevents double transitions', () => {
  const s = scene();
  s.chapterPortal = { x: 800, y: 450 };
  assert.equal(useChapterPortal(s), false);
  s.player.x = 800; s.player.y = 450;
  s.chapterDialogueOpen = true;
  assert.equal(useChapterPortal(s), false);
  s.chapterDialogueOpen = false;
  assert.equal(useChapterPortal(s), true);
  assert.equal(useChapterPortal(s), false);
  assert.equal(s.callbacks.length, 1);
});

test('level two preserves inventory, skills and companion while replacing arena', () => {
  const s = scene();
  const inventory = [{ type: 'coupon' }, { type: 'book' }, { type: 'flashlight' }];
  const companion = s.partyTete;
  s.inventory = inventory;
  s.hasDeathBreath = true;
  s.chapterPortal = { graphic: chain(), label: chain() };
  enterLevelTwo(s);
  assert.equal(s.currentLevel, 2);
  assert.equal(s.bossRoomActive, false);
  assert.equal(s.inventory, inventory);
  assert.equal(s.partyTete, companion);
  assert.equal(s.hasDeathBreath, true);
  assert.equal(s.player.x, 210);
  assert.equal(s.player.y, 600);
  assert(s.level2Solids);
  assert.equal(s.chapterPortal, null);
  enterLevelTwo(s);
  assert.equal(s.currentLevel, 2);
});
