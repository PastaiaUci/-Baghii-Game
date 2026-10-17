import test from 'node:test';
import assert from 'node:assert/strict';
import { storePartyTete, deployPartyTete, installPartySleepButton, updatePartyHud } from '../src/party-storage.js';

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
  assert.equal(s.partyTete.active, false); assert.equal(s.inventory[0].type, 'empty');
  const item = undefined;
  s.partyTeteHealth = 19;
  assert.equal(deployPartyTete(s, item), true);
  assert.equal(s.partyTete, original); assert.equal(s.partyTete.active, true);
  assert.equal(s.inventory[0].type, 'empty'); assert.equal(s.partyTeteHealth, 19);
  assert.equal(deployPartyTete(s, item), false);
});
test('full inventory and blocked deployment preserve the companion', () => {
  const s = setup(); s.inventory = [{ type: 'sword' }];
  assert.equal(storePartyTete(s), true); assert.equal(s.inventory[0].type, 'sword');
  const item = undefined;
  s.arenaSolids.getChildren = () => [{ body: { left: 0, right: 800, top: 0, bottom: 600 } }];
  assert.equal(deployPartyTete(s, item), false); assert.equal(s.inventory[0].type, 'sword'); assert.equal(s.partyTeteSleeping, true);
});

test('portrait toggles sleep/summon menu without using inventory slots', () => {
  const s = setup();
  const node = () => ({ hidden: true, textContent: '', listeners: {}, addEventListener(event, handler) { this.listeners[event] = handler; }, setAttribute() {} });
  const button = node(), portrait = node(), feedback = node(), status = node();
  const hud = { listeners: {}, addEventListener(event, handler) { this.listeners[event] = handler; }, querySelector: (selector) => ({ '.party-sleep': button, '.party-portrait': portrait, '.party-feedback': feedback, span: status })[selector] };
  s.partyHud = hud; s.inventory = [{ type: 'sword' }];
  installPartySleepButton(s, hud);
  const event = { stopPropagation() {} };
  hud.listeners.click(event); assert.equal(button.hidden, false); assert.equal(button.textContent, 'La somn');
  button.listeners.click(event); assert.equal(s.partyTeteSleeping, true); assert.equal(button.hidden, true);
  assert.equal(hud.hidden, false); assert.equal(s.inventory.length, 1); assert.equal(s.inventory[0].type, 'sword');
  hud.listeners.click(event); assert.equal(button.textContent, 'Summon');
  button.listeners.click(event); assert.equal(s.partyTeteSleeping, false); assert.equal(s.partyTete.active, true);
  assert.equal(button.hidden, true); assert.equal(s.inventory[0].type, 'sword');
});

test('low-health warning appears at eight HP and clears after healing', () => {
  const s = setup(), warning = {}, classes = new Map();
  s.partyHud = { classList: { toggle(name, value) { classes.set(name, value); } }, querySelector: (key) => key === '.party-danger' ? warning : {} };
  s.partyTeteHealth = 8; updatePartyHud(s);
  assert.equal(warning.hidden, false); assert.equal(classes.get('party-low-health'), true);
  s.partyTeteHealth = 11; updatePartyHud(s);
  assert.equal(warning.hidden, true); assert.equal(classes.get('party-low-health'), false);
  s.partyTeteHealth = 0; updatePartyHud(s);
  assert.equal(warning.hidden, false); assert.match(warning.textContent, /căzut/);
});
