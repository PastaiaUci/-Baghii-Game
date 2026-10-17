import test from 'node:test';
import assert from 'node:assert/strict';
import { collectLuisMedallion, completeLuisQuest, startLuisQuest } from '../src/luis-quest.js';

const scene = () => ({ luisQuest: { status: 'active', count: 0 }, inventory: [{ type: 'empty' }], tweens: { killTweensOf() {} }, updateInventoryList() {}, updateHotbarState() {}, setQuest() {} });
const drop = () => ({ sprite: { destroy() {} }, glow: { destroy() {} }, collected: false });
test('three unique medallions stack in inventory and are exchanged exactly once', () => {
  const s = scene();
  assert.equal(completeLuisQuest(s), false);
  for (let i = 0; i < 3; i += 1) {
    const item = drop(); assert.equal(collectLuisMedallion(s, item), true);
    assert.equal(collectLuisMedallion(s, item), false);
  }
  assert.equal(s.inventory[0].quantity, 3); assert.equal(s.luisQuest.count, 3);
  assert.equal(completeLuisQuest(s), true); assert.equal(s.inventory[0].type, 'empty');
  assert.equal(s.luisQuest.status, 'completed'); assert.equal(completeLuisQuest(s), false);
  assert.equal(s.characterLevel, 2); assert.equal(s.characterXp, 0); assert.equal(s.statPoints, 2);
});
test('full inventory leaves the medallion available for later pickup', () => {
  const s = scene(); s.inventory[0] = { type: 'sword' }; const item = drop();
  assert.equal(collectLuisMedallion(s, item), false); assert.equal(item.collected, false); assert.equal(s.luisQuest.count, 0);
});
test('medallions can stack before accepting the quest; Luis consumes only three', () => {
  const s = scene(); delete s.luisQuest;
  for (let i = 0; i < 6; i += 1) assert.equal(collectLuisMedallion(s, drop()), true);
  assert.equal(s.inventory[0].quantity, 6);
  startLuisQuest(s); assert.equal(s.luisQuest.count, 3);
  assert.equal(completeLuisQuest(s), true); assert.equal(s.inventory[0].quantity, 3);
  collectLuisMedallion(s, drop()); assert.equal(s.inventory[0].quantity, 4);
});
