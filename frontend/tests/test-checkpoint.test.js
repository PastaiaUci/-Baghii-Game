import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareLevelTwoTestState } from '../src/test-checkpoint.js';

test('test checkpoint grants required progression and preserves exclusive reward choice', () => {
  for (const reward of ['beer', 'sperma']) {
    const s = { maxPlayerHealth: 30, gold: 5, playerHealth: 10 };
    assert.equal(prepareLevelTwoTestState(s, reward), true);
    assert.equal(s.hasCoupon, true); assert.equal(s.abgPicked, true);
    assert.equal(s.gold, 1000); assert.equal(s.playerHealth, 30);
    assert.deepEqual(s.inventory.slice(0, 3).map(({ type }) => type), ['sword', 'coupon', 'health-potion']);
    assert.equal(s.equippedHelmet.armorRemaining, 5);
    assert.equal(s.equippedArmor.type, 'winter-coat');
    assert.equal(s.inventory[3].type, 'gold-medallion');
    assert.equal(s.inventory[3].quantity, 3);
    assert.equal(s.bossLootState.consumed, reward);
    assert.equal(s.shopHelmetSold, true);
  }
});
test('invalid choice does not change normal progression', () => {
  const s = { gold: 20, hasCoupon: false };
  assert.equal(prepareLevelTwoTestState(s, 'both'), false);
  assert.deepEqual(s, { gold: 20, hasCoupon: false });
});
