import test from 'node:test';
import assert from 'node:assert/strict';
import { hitStoneState, damageMetinStone, METIN_LOCATIONS, METIN_TYPES } from '../src/metin-stones.js';
import { createAlpineMap, ALPINE_GOLD } from '../src/alpine-map.js';
import { findPartyPath } from '../src/completion.js';

const stone = (health = 18) => ({ health, maxHealth: 18, waves: 0, level: 1, broken: false });
function chain() {
  let object;
  object = new Proxy({ destroyed: false }, { get: (target, key) => key in target ? target[key] : key === 'destroy' ? () => { target.destroyed = true; } : () => object });
  return object;
}
test('stones spawn waves once at health thresholds and roll exactly 50% medallion chance', () => {
  const s = stone(); assert.equal(hitStoneState(s, 5).waves, 1);
  assert.equal(hitStoneState(s, 1).waves, 0); assert.equal(hitStoneState(s, 3).waves, 1);
  assert.equal(hitStoneState(s, 5).waves, 1);
  const result = hitStoneState(s, 4, () => 0.4999); assert.equal(result.medal, true); assert.equal(result.broken, true);
  assert.equal(hitStoneState(s, 1).broken, false);
  assert.equal(hitStoneState(stone(), 18, () => 0.5).medal, false);
  assert.equal(Array.from({ length: 100 }, (_, index) => hitStoneState(stone(), 18, () => index / 100)).filter(({ medal }) => medal).length, 50);
});
test('breaking a stone kills only its own mobs and scatters 25 gold per level once', () => {
  const s = { ...stone(1), x: 500, y: 500, level: 2, sprite: chain(), label: chain(), aura: chain(), body: { body: { enable: true } } };
  const mob = (owner) => ({ alive: true, stone: owner, sprite: chain(), label: chain(), shadow: chain(), warning: chain() });
  const mine = mob(s), other = mob({});
  const scene = { metinMobs: [mine, other], goldPickups: [], add: { sprite: chain, graphics: chain }, physics: { world: { bounds: { x: 0, y: 0, width: 1600, height: 1200 } } }, level2Solids: { getChildren: () => [] }, tweens: { add() {} } };
  damageMetinStone(scene, s, 1, () => 0.9);
  assert.equal(mine.alive, false); assert.equal(other.alive, true); assert.equal(s.body.body.enable, false);
  assert.equal(scene.goldPickups.reduce((sum, { value }) => sum + value, 0), 50);
  damageMetinStone(scene, s, 1); assert.equal(scene.goldPickups.length, 5);
});
test('ten varied stones and all base gold remain reachable around mountain obstacles', () => {
  assert.equal(METIN_LOCATIONS.length, 10); assert.equal(new Set(METIN_LOCATIONS.map((location) => location[2])).size, 3);
  assert.deepEqual(METIN_TYPES.map(({ name }) => name), ['Piatra Diavolului', 'Piatra Geloziei', 'Piatra Pulii']);
  assert.equal(new Set(METIN_TYPES.map(({ texture }) => texture)).size, 3);
  const bodies = [];
  createAlpineMap({ add: { graphics: chain, zone: (x, y, w, h) => ({ body: { left: x - w / 2, right: x + w / 2, top: y - h / 2, bottom: y + h / 2 } }) }, physics: { add: { staticGroup: () => ({ add: ({ body }) => bodies.push(body) }) } }, cameras: { main: {} }, time: {}, events: { on() {}, once() {} } });
  for (const [x, y] of METIN_LOCATIONS) {
    assert.ok(findPartyPath({ x: 210, y: 600 }, { x, y }, { x: 32, y: 44, width: 1536, height: 1124 }, bodies).length, `Unreachable stone ${x},${y}`);
    bodies.push({ left: x - 14, right: x + 14, top: y - 15, bottom: y + 7 });
  }
  for (const coin of ALPINE_GOLD) assert.ok(findPartyPath({ x: 210, y: 600 }, coin, { x: 32, y: 44, width: 1536, height: 1124 }, bodies).length, `Blocked coin ${coin.x},${coin.y}`);
});
