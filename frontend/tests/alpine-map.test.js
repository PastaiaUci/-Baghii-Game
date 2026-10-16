import test from 'node:test';
import assert from 'node:assert/strict';
import { ALPINE_GOLD, createAlpineMap, createAlpineGold } from '../src/alpine-map.js';
import { findPartyPath } from '../src/completion.js';

const graphics = () => {
  let g;
  g = new Proxy({}, { get: () => () => g });
  return g;
};
test('alpine map has 700 gold in eighteen pickups, reachable around its colliders', () => {
  const bodies = [];
  const scene = {
    add: { graphics, zone: (x, y, width, height) => ({ body: { left: x - width / 2, right: x + width / 2, top: y - height / 2, bottom: y + height / 2 } }) },
    physics: { add: { staticGroup: () => ({ add: ({ body }) => bodies.push(body) }) } },
    cameras: { main: { width: 960, height: 640, zoom: 1.4 } }, time: { now: 0 }, events: { on() {}, once() {} },
  };
  createAlpineMap(scene);
  assert.equal(ALPINE_GOLD.length, 18);
  assert.equal(ALPINE_GOLD.reduce((sum, { value }) => sum + value, 0), 700);
  for (const coin of ALPINE_GOLD) {
    assert.ok(!bodies.some((b) => coin.x > b.left - 10 && coin.x < b.right + 10 && coin.y > b.top - 10 && coin.y < b.bottom + 10), `Coin blocked at ${coin.x},${coin.y}`);
    assert.ok(findPartyPath({ x: 210, y: 600 }, coin, { x: 32, y: 44, width: 1536, height: 1124 }, bodies).length, `No route to ${coin.x},${coin.y}`);
  }
});
test('level two replaces old pickups without changing carried gold', () => {
  let destroyed = 0;
  const scene = { gold: 123, goldPickups: [{ sprite: { destroy() { destroyed += 1; } } }], tweens: { killTweensOf() {}, add() {} }, add: { sprite: graphics } };
  createAlpineGold(scene);
  assert.equal(destroyed, 1); assert.equal(scene.gold, 123);
  assert.equal(scene.goldPickups.length, 18);
  assert.ok(scene.goldPickups.every((pickup) => pickup.level === 2 && !pickup.collected));
});
