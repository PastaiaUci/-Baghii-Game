import test from 'node:test';
import assert from 'node:assert/strict';
import { pickupVillageBobita, enterMateiHouse, MATEI_DOOR } from '../src/matei-quest.js';
import { journalQuests } from '../src/quest-journal.js';

function farm() {
  return { currentLevel: 2, player: { x: 960, y: 600, setVelocity() {} }, mountainRescue: { status: 'rescued', target: 8, broken: [8], calls: 4 }, inventoryUi: { classList: { contains: () => true } }, setQuest() {}, scene: { launch() {}, pause() {} } };
}
test('Bobita must be picked up nearby and carried to Matei before delivery', () => {
  const s = farm(); s.player.x = 200;
  assert.equal(pickupVillageBobita(s), false);
  Object.assign(s.player, MATEI_DOOR); assert.equal(enterMateiHouse(s), false);
  s.player.x = 960; s.player.y = 600;
  assert.equal(pickupVillageBobita(s), true); assert.equal(pickupVillageBobita(s), false);
  assert.equal(enterMateiHouse(s), false);
  Object.assign(s.player, MATEI_DOOR);
  let destination; s.scene.launch = (key) => { destination = key; };
  assert.equal(enterMateiHouse(s), true); assert.equal(destination, 'MateiHouseScene');
  assert.equal(s.mountainRescue.status, 'delivered'); assert.equal(enterMateiHouse(s), false);
});
test('delivered and thawed progress permits returning to the house without duplicating Bobita', () => {
  for (const status of ['delivered', 'thawed']) {
    const s = farm(); s.mountainRescue.status = status; Object.assign(s.player, MATEI_DOOR);
    assert.equal(enterMateiHouse(s), true); assert.equal(s.mountainRescue.status, status);
    assert.equal(pickupVillageBobita(s), false);
  }
});
test('journal keeps the thawing quest active until Bobita warms up', () => {
  const s = farm();
  for (const status of ['rescued', 'transporting', 'delivered', 'thawed']) {
    s.mountainRescue.status = status;
    const quests = journalQuests(s);
    assert.equal(quests.find(q => q.id === 'mountain-rescue').state, 'completed');
    assert.equal(quests.find(q => q.id === 'matei-thaw').state, status === 'thawed' ? 'completed' : 'active');
  }
});
