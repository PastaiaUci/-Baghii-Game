import test from 'node:test';
import assert from 'node:assert/strict';
import { damagePartyTete, consumeRevivalBeer } from '../src/party-health.js';
import { deployPartyTete } from '../src/party-storage.js';
import { chooseTeteTarget } from '../src/party-combat.js';

function setup() {
  const sprite = { active: true, visible: true, x: 300, y: 300, setVelocity() { return this; }, disableBody() { this.active = this.visible = false; return this; }, enableBody(_reset, x, y) { this.x = x; this.y = y; this.active = this.visible = true; return this; } };
  return { currentLevel: 2, partyTete: sprite, partyTeteHealth: 25, inventory: [{ type: 'empty' }, { type: 'empty' }], player: { x: 300, y: 300 }, partyLabel: { setVisible() {} }, partyShadow: { setVisible() {} }, physics: { world: { bounds: { x: 0, y: 0, width: 800, height: 600 } } }, arenaSolids: { getChildren: () => [] }, updateInventoryList() {}, updateHotbarState() {} };
}
test('defeated Tete returns to inventory and cannot deploy without consuming beer', () => {
  const s = setup(); damagePartyTete(s, 30);
  const companion = s.inventory[0]; assert.equal(companion.type, 'party-tete'); assert.equal(s.partyTeteHealth, 0);
  assert.equal(deployPartyTete(s, companion), false);
  const beer = { type: 'revival-beer', quantity: 2 }; s.inventory[1] = beer;
  assert.equal(consumeRevivalBeer(s, beer), true); assert.equal(beer.quantity, 1); assert.equal(s.partyTeteHealth, 3);
  assert.equal(deployPartyTete(s, companion), true); assert.equal(s.partyTete.active, true);
  s.partyTeteHealth = 25;
  assert.equal(consumeRevivalBeer(s, beer), false); assert.equal(beer.quantity, 1);
});
test('Tete is never lost when defeated with a full inventory', () => {
  const s = setup(); s.inventory = [{ type: 'sword' }, { type: 'coupon' }]; damagePartyTete(s, 25);
  assert.equal(s.inventory.length, 3); assert.equal(s.inventory[2].type, 'party-tete'); assert.equal(s.inventory[0].type, 'sword');
  assert.equal(damagePartyTete(s, 4), false);
});
test('Tete targets a nearby living mob and stops assisting when asleep or dead', () => {
  const s = setup(); const mob = (x, alive = true) => ({ alive, sprite: { x, y: 300 } });
  const near = mob(350); s.metinMobs = [mob(200), near, mob(320, false), mob(700)];
  assert.equal(chooseTeteTarget(s), near);
  s.partyTeteSleeping = true; assert.equal(chooseTeteTarget(s), null);
  s.partyTeteSleeping = false; s.partyTeteHealth = 0; assert.equal(chooseTeteTarget(s), null);
});
