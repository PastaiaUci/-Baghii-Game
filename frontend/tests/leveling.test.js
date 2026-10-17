import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeLevel, grantXp, xpForNextLevel, awardEnemyXp, characterName } from '../src/leveling.js';

test('starts at level one and carries excess XP while granting exactly two points per level', () => {
  const scene = {};
  initializeLevel(scene);
  assert.equal(characterName(scene), 'Lv. 1 · Gdolf');
  assert.equal(scene.characterXp, 0);
  assert.equal(grantXp(scene, 99), 0);
  assert.equal(grantXp(scene, 2), 1);
  assert.equal(scene.characterLevel, 2); assert.equal(scene.characterXp, 1); assert.equal(scene.statPoints, 2);
  assert.equal(grantXp(scene, 400), 2);
  assert.equal(scene.characterLevel, 4); assert.equal(scene.characterXp, 51); assert.equal(scene.statPoints, 6);
  assert.equal(xpForNextLevel(4), 250);
});

test('rewards are shared with owner in interiors, cannot duplicate, and preserve boss stat rewards', () => {
  const farm = { statPoints: 3 }, enemy = {};
  assert.equal(awardEnemyXp({ farm }, enemy, 100), true);
  assert.equal(awardEnemyXp({ farm }, enemy, 100), false);
  assert.equal(farm.statPoints, 5); assert.equal(farm.characterLevel, 2);
  initializeLevel(farm); assert.equal(farm.characterLevel, 2);
  for (const invalid of [-1, 0, 1.5, NaN, Infinity]) assert.equal(grantXp(farm, invalid), 0);
  assert.equal(farm.characterXp, 0);
});
