import test from 'node:test';
import assert from 'node:assert/strict';
import { startRescue, breakRescueStone, enterMountains, mountainPath, SUMMIT_STONES } from '../src/mountain-rescue.js';

test('one hidden stone is chosen once and discovery cannot be duplicated', () => {
  const farm = {}, quest = startRescue(farm, () => 0.5);
  assert.equal(startRescue(farm, () => 0), quest);
  assert.equal(quest.target, 11);
  assert.equal(breakRescueStone(quest, 0), false);
  assert.equal(breakRescueStone(quest, 0), false);
  assert.deepEqual(quest.broken, [0]);
  assert.equal(breakRescueStone(quest, quest.target), true);
  assert.equal(quest.status, 'found');
  assert.equal(breakRescueStone(quest, 1), false);
  assert.deepEqual(quest.broken, [0, 11]);
});

test('mountain entry requires the completed trail and equipped coat and cannot launch twice', () => {
  let launched = 0, paused = 0;
  const farm = { player: { setVelocity() {} }, scene: { launch(key, { farm: owner }) { assert.equal(key, 'MountainScene'); assert.equal(owner, farm); launched++; }, pause() { paused++; } } };
  assert.equal(enterMountains(farm), false);
  farm.equippedArmor = { type: 'winter-coat' };
  assert.equal(enterMountains(farm), false);
  farm.luisQuest = { status: 'completed' };
  assert.equal(enterMountains(farm), true);
  assert.equal(enterMountains(farm), false);
  assert.equal(launched, 1); assert.equal(paused, 1);
});

test('the winding climb remains connected between collider slices and opens onto the summit', () => {
  let previous = mountainPath(80);
  for (let y = 150; y < 4200; y += 70) {
    const path = mountainPath(y);
    const overlap = Math.min(previous.center + previous.half, path.center + path.half) - Math.max(previous.center - previous.half, path.center - path.half);
    assert.ok(overlap > 200, `passage at ${y}`);
    previous = path;
  }
  assert.equal(SUMMIT_STONES, 18);
  assert.ok(mountainPath(500).half > mountainPath(2000).half);
});
