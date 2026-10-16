import test from 'node:test';
import assert from 'node:assert/strict';
import { storePartyTete, deployPartyTete } from '../src/party-storage.js';

function setup() {
  const sprite = { active: true, visible: true, setVelocity() { return this; }, disableBody() { this.active = this.visible = false; return this; }, enableBody(_reset, x, y) { this.x = x; this.y = y; this.active = this.visible = true; return this; } };
  const visual = () => ({ setVisible() {} });
  return { partyTete: sprite, partyTeteHealth: 25, inventory: [{ type: 'empty' }], player: { x: 300, y: 300 },
    physics: { world: { bounds: { x: 0, y: 0, width: 800, height: 600 } } }, arenaSolids: { getChildren: () => [] },
    partyLabel: visual(), partyShadow: visual(), partyHud: {}, updateInventoryList() {}, updateHotbarState() {},
  };
}
test('sleep stores exactly one Tete; using the item restores the same companion and health', () => {
  const s = setup(), original = s.partyTete;
  assert.equal(storePartyTete(s), true);
  assert.equal(storePartyTete(s), false);
  assert.equal(s.partyTete.active, false); assert.equal(s.partyHud.hidden, true);
  const item = s.inventory[0]; assert.equal(item.type, 'party-tete');
  s.partyTeteHealth = 19;
  assert.equal(deployPartyTete(s, item), true);
  assert.equal(s.partyTete, original); assert.equal(s.partyTete.active, true);
  assert.equal(s.inventory[0].type, 'empty'); assert.equal(s.partyTeteHealth, 19);
  assert.equal(deployPartyTete(s, item), false);
});
test('full inventory and blocked deployment preserve the companion', () => {
  const s = setup(); s.inventory = [{ type: 'sword' }];
  assert.equal(storePartyTete(s), false); assert.equal(s.partyTete.active, true);
  s.inventory[0] = { type: 'empty' }; storePartyTete(s); const item = s.inventory[0];
  s.arenaSolids.getChildren = () => [{ body: { left: 0, right: 800, top: 0, bottom: 600 } }];
  assert.equal(deployPartyTete(s, item), false); assert.equal(s.inventory[0], item); assert.equal(s.partyTeteSleeping, true);
});
