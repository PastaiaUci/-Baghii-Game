import test from 'node:test';
import assert from 'node:assert/strict';
import { buyHelmet, toggleHelmet, absorbArmorDamage, armorPoints } from '../src/armor.js';

const scene = (gold = 200) => ({ gold, inventory: [{ type: 'empty' }, { type: 'empty' }], updateGoldHud() {}, updateInventoryList() {}, updateHotbarState() {} });
test('helmet costs 200, uses one inventory slot and cannot be bought twice', () => {
  const s = scene(); buyHelmet(s);
  assert.equal(s.gold, 0); assert.equal(s.inventory[0].type, 'helmet');
  s.gold = 200; buyHelmet(s); assert.equal(s.gold, 200);
  const poor = scene(199); buyHelmet(poor); assert.equal(poor.gold, 199); assert.equal(poor.inventory[0].type, 'empty');
  const full = scene(); full.inventory = [{ type: 'sword' }]; buyHelmet(full); assert.equal(full.gold, 200);
});
test('equipped helmet absorbs five damage, preserves wear through swapping and unequipping', () => {
  const s = scene(); buyHelmet(s); const helmet = s.inventory[0];
  assert.equal(absorbArmorDamage(s, 3), 3);
  toggleHelmet(s, helmet); assert.equal(armorPoints(s), 5);
  assert.equal(s.inventory.includes(helmet), false);
  assert.equal(s.inventory[0].type, 'empty');
  assert.equal(absorbArmorDamage(s, 3), 0); assert.equal(armorPoints(s), 2);
  toggleHelmet(s, helmet); toggleHelmet(s, helmet); assert.equal(armorPoints(s), 2);
  s.inventory.reverse(); assert.equal(absorbArmorDamage(s, 4), 2); assert.equal(armorPoints(s), 0);
});

test('unequipping returns the helmet to a free slot and cannot lose it in a full inventory', () => {
  const s = scene(); buyHelmet(s); const helmet = s.inventory[0]; toggleHelmet(s, helmet);
  s.gold = 1000; buyHelmet(s); assert.equal(s.gold, 1000); assert.equal(s.shopHelmetSold, true);
  s.inventory = [{ type: 'sword' }, { type: 'coupon' }];
  assert.equal(toggleHelmet(s, helmet), false); assert.equal(s.equippedHelmet, helmet);
  s.inventory[1] = { type: 'empty' };
  assert.equal(toggleHelmet(s, helmet), true);
  assert.equal(s.equippedHelmet, null); assert.equal(s.inventory[1], helmet); assert.equal(helmet.key, '2');
  buyHelmet(s); assert.equal(s.gold, 1000);
});
