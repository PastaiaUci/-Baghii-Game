import test from 'node:test';
import assert from 'node:assert/strict';
import { grantBobitaRewards, consumeBobitaMedallion, damageBobita, healTeam } from '../src/bobita-rewards.js';
import { toggleGear } from '../src/gear.js';
import { derivedStats, physicalDamage } from '../src/character-stats.js';
import { buyConsumable } from '../src/consumables.js';

function farm() {
  return { mountainRescue: { status: 'delivered' }, inventory: Array.from({ length: 27 }, () => ({ type: 'empty' })), playerHealth: 30, maxPlayerHealth: 30, updateInventoryList() {}, updateHotbarState() {}, updateGoldHud() {} };
}
test('thawing grants both rewards and healer exactly once; full inventory preserves pending rewards', () => {
  const s = farm(); assert.equal(grantBobitaRewards(s), false);
  s.mountainRescue.status = 'thawed'; s.inventory.fill({ type: 'sword' });
  assert.equal(grantBobitaRewards(s), true); assert.equal(s.bobitaUnlocked, true); assert.equal(s.partyBobitaHealth, 25);
  s.inventory[0] = { type: 'empty' }; grantBobitaRewards(s); assert.equal(s.inventory[0].type, 'bobita-book');
  s.inventory[1] = { type: 'empty' }; grantBobitaRewards(s); assert.equal(s.inventory[1].type, 'gold-necklace');
  assert.equal(grantBobitaRewards(s), false);
  s.partyBobitaHealth = 0; grantBobitaRewards(s); assert.equal(s.partyBobitaHealth, 0);
});
test('necklace bonuses apply only while equipped and cannot heal by swapping', () => {
  const s = farm(); s.mountainRescue.status = 'thawed'; grantBobitaRewards(s);
  const necklace = s.inventory.find(i => i.type === 'gold-necklace');
  assert.equal(derivedStats(s).maxHealth, 30); toggleGear(s, necklace);
  assert.equal(s.inventory.some(i => i === necklace), false);
  assert.equal(derivedStats(s).values.strength, 14); assert.equal(physicalDamage(s, 1), 1.2);
  assert.equal(s.maxPlayerHealth, 48); assert.equal(s.playerHealth, 30);
  toggleGear(s, necklace); assert.equal(s.maxPlayerHealth, 30); assert.equal(physicalDamage(s, 1), 1);
});
test('team heal respects proximity, caps, sleep and does not revive dead party members', () => {
  const s = farm(); s.mountainRescue.status = 'thawed'; grantBobitaRewards(s);
  s.playerHealth = 29; s.partyTeteHealth = 22; s.partyBobitaHealth = 24;
  const actor = (x) => ({ active: true, x, y: 0 });
  const scene = { player: actor(0), partyTete: actor(90), partyBobita: actor(40) };
  const healed = healTeam(s, scene); assert.deepEqual(healed.map(h => h.amount), [1, 2, 1]);
  assert.equal(s.playerHealth, 30); assert.equal(s.partyTeteHealth, 24); assert.equal(s.partyBobitaHealth, 25);
  s.playerHealth = 20; scene.player.x = 1000; s.partyTeteHealth = 0;
  assert.deepEqual(healTeam(s, scene), []);
  s.partyBobitaSleeping = true; s.partyBobitaHealth = 10; assert.deepEqual(healTeam(s, scene), []);
});
test('Bobita dies to sleep and medallions heal or revive him without being consumed at full health', () => {
  const s = farm(); s.mountainRescue.status = 'thawed'; grantBobitaRewards(s);
  s.inventory[3] = { type: 'gold-medallion', quantity: 2 };
  const medals = s.inventory[3]; assert.equal(consumeBobitaMedallion(s, medals), false); assert.equal(medals.quantity, 2);
  assert.equal(damageBobita(s, 100), true); assert.equal(s.partyBobitaHealth, 0); assert.equal(s.partyBobitaSleeping, true);
  assert.equal(consumeBobitaMedallion(s, medals), true); assert.equal(s.partyBobitaHealth, 3); assert.equal(medals.quantity, 1);
  assert.equal(s.partyBobitaSleeping, true);
  consumeBobitaMedallion(s, medals); assert.equal(s.inventory[3].type, 'empty'); assert.equal(s.partyBobitaHealth, 6);
});
test('medallions enter shop economy only from map three', () => {
  const s = farm(); s.gold = 100; s.currentLevel = 2;
  buyConsumable(s, 'gold-medallion'); assert.equal(s.gold, 100);
  s.currentLevel = 3; buyConsumable(s, 'gold-medallion'); assert.equal(s.gold, 70);
  assert.equal(s.inventory[0].type, 'gold-medallion'); assert.equal(s.inventory[0].quantity, 1);
});
