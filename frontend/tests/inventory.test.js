import test from 'node:test';
import assert from 'node:assert/strict';
import { swapInventorySlots, getSelectedItem } from '../src/inventory.js';
import { hasSwordInHand, swordAuraBonus } from '../src/skills.js';
import { gdolfMotionPose } from '../src/player-art.js';

function setup() {
  let inventoryUpdates = 0, hotbarUpdates = 0;
  return {
    selectedWeapon: 'slot-1',
    inventory: Array.from({ length: 10 }, (_, index) => ({ type: 'empty', key: String(index + 1), label: `Slot ${index + 1}` })),
    updateInventoryList() { inventoryUpdates += 1; }, updateHotbarState() { hotbarUpdates += 1; },
    updates: () => [inventoryUpdates, hotbarUpdates],
  };
}

test('moving inventory items swaps occupied slots and refreshes both views without loss', () => {
  const s = setup();
  s.inventory[0].type = 'sword';
  s.inventory[3].type = 'coupon';
  assert.equal(swapInventorySlots(s, 0, 3), true);
  assert.equal(s.inventory[0].type, 'coupon');
  assert.equal(s.inventory[3].type, 'sword');
  assert.equal(s.inventory[0].key, '1');
  assert.equal(s.inventory[3].key, '4');
  assert.deepEqual(s.updates(), [1, 1]);
  assert.deepEqual(s.inventory.slice(0, 5).map(({ type }) => type), ['coupon', 'empty', 'empty', 'sword', 'empty']);
});

test('items can be stored outside hotbar and restored in any of the first five slots', () => {
  const s = setup();
  s.inventory[0].type = 'sword';
  swapInventorySlots(s, 0, 8);
  assert.equal(hasSwordInHand(s), false);
  assert.equal(s.inventory[8].type, 'sword');
  swapInventorySlots(s, 8, 4);
  s.selectedWeapon = 'slot-5';
  assert.equal(getSelectedItem(s).type, 'sword');
  assert.equal(hasSwordInHand(s), true);
  s.time = { now: 100 };
  s.swordAuraSkill = { until: 5000 };
  assert.equal(swordAuraBonus(s, 'boss'), 2);
  assert.equal(swordAuraBonus(s, 'villager'), 1);
});

test('invalid moves and empty sources do not lose items or allow equipping reserve slots', () => {
  const s = setup();
  s.inventory[0].type = 'sword';
  for (const pair of [[0, -1], [0, 10], [0, 0], [0.5, 2], [2, 3]]) assert.equal(swapInventorySlots(s, ...pair), false);
  assert.equal(s.inventory[0].type, 'sword');
  assert.deepEqual(s.updates(), [0, 0]);
  s.inventory[8].type = 'sword'; s.selectedWeapon = 'slot-9';
  assert.equal(getSelectedItem(s), undefined);
  assert.equal(hasSwordInHand(s), false);
});

test('idle breathing loops continuously with anchored feet and small changes between poses', () => {
  assert.ok(Math.abs(gdolfMotionPose(0, false).bob - gdolfMotionPose(2400, false).bob) < 0.0001);
  assert.equal(gdolfMotionPose(1200, false).bob, -0.6);
  let previous = gdolfMotionPose(0, false).bob;
  for (let time = 40; time <= 2400; time += 40) {
    const pose = gdolfMotionPose(time, false);
    assert.ok(Math.abs(pose.bob - previous) < 0.04);
    assert.equal(pose.leftLift, 0); assert.equal(pose.rightLift, 0);
    previous = pose.bob;
  }
});
