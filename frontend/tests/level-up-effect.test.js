import test from 'node:test';
import assert from 'node:assert/strict';
import { playLevelUp } from '../src/level-up-effect.js';

function setup() {
  const listeners = new Map(); let destroyed = 0;
  const art = () => {
    let item;
    item = new Proxy({}, { get: (_target, key) => key === 'destroy' ? () => destroyed++ : () => item });
    return item;
  };
  return {
    player: { x: 100, y: 200, depth: 12 }, characterLevel: 2,
    add: { graphics: art, text: art }, game: { loop: { delta: 50 } },
    events: { on: (key, handler) => listeners.set(key, handler), once: (key, handler) => listeners.set(key, handler), off: (key, handler) => { if (listeners.get(key) === handler) listeners.delete(key); } },
    listeners, destroyed: () => destroyed,
  };
}

test('level-up pauses for dialogue, follows the active house and cleans its objects and listeners', () => {
  const owner = setup(), house = setup();
  owner.houseActive = true; owner.activeHouse = house;
  playLevelUp(owner);
  assert.equal(owner.levelUpEffect, undefined); assert.ok(house.levelUpEffect);
  const tick = house.listeners.get('update');
  house.npcDialogueOpen = true;
  for (let i = 0; i < 60; i++) tick(0, 50);
  assert.equal(house.destroyed(), 0);
  house.npcDialogueOpen = false; house.player.x = 250;
  for (let i = 0; i < 42; i++) tick(0, 50);
  assert.equal(house.destroyed(), 4); assert.equal(house.levelUpEffect, null);
  assert.equal(house.listeners.size, 0);
});

test('another level-up replaces the previous effect and shutdown removes the new one', () => {
  const scene = setup(); playLevelUp(scene); playLevelUp(scene, 2);
  assert.equal(scene.destroyed(), 4);
  scene.listeners.get('shutdown')();
  assert.equal(scene.destroyed(), 8); assert.equal(scene.listeners.size, 0);
});
