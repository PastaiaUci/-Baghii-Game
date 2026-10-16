import test from 'node:test';
import assert from 'node:assert/strict';
import { buyGear, toggleGear, movementMultiplier, absorbShieldDamage } from '../src/gear.js';

const scene = () => ({ currentLevel: 2, gold: 1000, inventory: [{ type: 'empty' }, { type: 'empty' }], input: { activePointer: { rightButtonDown: () => true } }, updateGoldHud() {}, updateInventoryList() {}, updateHotbarState() {} });
test('map two sells boots for 350 and shield for 300 once; other maps cannot buy', () => {
  const s = scene(); buyGear(s, 'wind-boots'); assert.equal(s.gold, 650);
  buyGear(s, 'shield'); assert.equal(s.gold, 350); assert.equal(s.inventory[1].durability, 50);
  buyGear(s, 'shield'); assert.equal(s.gold, 350);
  const village = scene(); village.currentLevel = 1; buyGear(village, 'shield'); assert.equal(village.gold, 1000);
});
test('boots move into equipment and speed bonus disappears on unequip', () => {
  const s = scene(); buyGear(s, 'wind-boots'); const boots = s.inventory[0];
  toggleGear(s, boots); assert.equal(s.inventory[0].type, 'empty'); assert.equal(movementMultiplier(s), 1.25);
  toggleGear(s, boots); assert.equal(s.inventory[0], boots); assert.equal(movementMultiplier(s), 1);
});
test('shield consumes only blocked damage and breaks at 50 with excess damage preserved', () => {
  const s = scene(); buyGear(s, 'shield'); const shield = s.inventory[0]; toggleGear(s, shield);
  s.input.activePointer.rightButtonDown = () => false;
  assert.equal(absorbShieldDamage(s, 8), 8); assert.equal(shield.durability, 50);
  s.input.activePointer.rightButtonDown = () => true;
  assert.equal(absorbShieldDamage(s, 35), 0); assert.equal(shield.durability, 15);
  toggleGear(s, shield); toggleGear(s, shield); assert.equal(shield.durability, 15);
  assert.equal(absorbShieldDamage(s, 20), 5); assert.equal(s.equippedShield, null);
  assert.equal(s.inventory.some(({ type }) => type === 'shield'), false);
  assert.equal(absorbShieldDamage(s, 4), 4);
});
test('full inventory prevents purchase or unequipping and menus cannot block hits', () => {
  const s = scene(); buyGear(s, 'shield'); const shield = s.inventory[0]; toggleGear(s, shield);
  s.inventory = [{ type: 'book' }, { type: 'coupon' }]; assert.equal(toggleGear(s, shield), false);
  assert.equal(s.equippedShield, shield);
  s.menuOpen = true; assert.equal(absorbShieldDamage(s, 4), 4); assert.equal(shield.durability, 50);
  buyGear(s, 'wind-boots'); assert.equal(s.gold, 700);
});
