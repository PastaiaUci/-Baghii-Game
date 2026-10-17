import test from 'node:test';
import assert from 'node:assert/strict';
import { startFirewoodQuest, chopSleigh, collectFirewood, deliverFirewood } from '../src/firewood-quest.js';

function farm() {
  return { mountainRescue: { status: 'delivered' }, player: { x: 435, y: 735 }, inventory: [{ type: 'sword' }, { type: 'empty' }], selectedWeapon: 'slot-1', setQuest() {}, updateInventoryList() {}, updateHotbarState() {} };
}
test('sleigh chopping is gated by Matei quest, sword, range and aim', () => {
  const s = farm();
  assert.equal(chopSleigh(s, 435, 790, 1), false);
  const quest = startFirewoodQuest(s); assert.equal(startFirewoodQuest(s), quest);
  s.player.x = 900; assert.equal(chopSleigh(s, 435, 790, 1), false);
  s.player.x = 435; assert.equal(chopSleigh(s, 435, 600, 1), false);
  s.selectedWeapon = 'slot-2'; assert.equal(chopSleigh(s, 435, 790, 1), false);
  s.selectedWeapon = 'slot-1';
  for (let i = 0; i < 4; i++) assert.equal(chopSleigh(s, 435, 790, 1), true);
  assert.equal(quest.stage, 'chopped'); assert.equal(quest.hp, 0);
  assert.equal(chopSleigh(s, 435, 790, 1), false);
});
test('full inventory preserves the wood drop and delivery consumes it exactly once', () => {
  const s = farm(); const q = startFirewoodQuest(s); chopSleigh(s, 435, 790, 4);
  s.inventory[1] = { type: 'coupon' };
  assert.equal(collectFirewood(s), true); assert.equal(q.stage, 'chopped');
  s.inventory[1] = { type: 'empty' }; s.player.x = 900;
  assert.equal(collectFirewood(s), false);
  s.player.x = 435; assert.equal(collectFirewood(s), true);
  assert.equal(s.inventory[1].quantity, 3); assert.equal(collectFirewood(s), false);
  assert.equal(deliverFirewood(s), true); assert.equal(q.stage, 'burning');
  assert.equal(s.inventory[1].type, 'empty'); assert.equal(deliverFirewood(s), false);
});
