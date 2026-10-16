import test from 'node:test';
import assert from 'node:assert/strict';
import { createVillageGoldLayout, VILLAGE_GOLD_TOTAL } from '../src/village-gold.js';

test('village contains exactly 350 gold and no coins inside lion enclosure', () => {
  for (const random of [() => 0, () => 0.1, () => 0.5, Math.random]) {
    const coins = createVillageGoldLayout([], random);
    assert.equal(coins.length, 18);
    assert.equal(coins.reduce((sum, coin) => sum + coin.value, 0), VILLAGE_GOLD_TOTAL);
    assert.ok(coins.every(({ x, y }) => !(x > 45 && x < 380 && y > 44 && y < 204)));
  }
});
test('relocation also avoids buildings and pond footprints', () => {
  const obstacles = [{ left: 240, right: 280, top: 400, bottom: 450 }];
  const coins = createVillageGoldLayout(obstacles, () => 0);
  assert.ok(coins.every(({ x, y }) => !(x > 222 && x < 298 && y > 382 && y < 478)));
  assert.equal(coins.reduce((sum, coin) => sum + coin.value, 0), 350);
});
