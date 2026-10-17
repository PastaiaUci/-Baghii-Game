import test from 'node:test';
import assert from 'node:assert/strict';
import { showDamage } from '../src/combat-feedback.js';
import { absorbShieldDamage } from '../src/gear.js';

function setup() {
  const messages = [], tweens = [];
  return { messages, tweens: { add: (tween) => tweens.push(tween) }, animations: tweens,
    player: { x: 100, y: 200 },
    add: { text(x, y, message, style) {
      const text = { x, y, message, style, setOrigin() { return this; }, setDepth() { return this; }, destroy() { this.destroyed = true; } };
      messages.push(text); return text;
    } },
  };
}

test('shield shows blocked damage including its final hit and preserves overflow damage', () => {
  const scene = setup(); scene.equippedShield = { durability: 5 };
  scene.inventory = []; scene.updateInventoryList = scene.updateHotbarState = () => {};
  assert.equal(absorbShieldDamage(scene, 8, true), 3);
  assert.equal(scene.messages.length, 1); assert.equal(scene.messages[0].message, 'Blocat · 5');
  assert.equal(scene.equippedShield, null);
  scene.animations[0].onComplete(); assert.equal(scene.messages[0].destroyed, true);
});

test('damage feedback uses the indoor avatar and does not show zero damage', () => {
  const owner = setup(), house = setup(); house.player.x = 450;
  owner.houseActive = true; owner.activeHouse = house;
  showDamage(owner, owner.player, 0); assert.equal(house.messages.length, 0);
  showDamage(owner, owner.player, 2.25);
  assert.equal(owner.messages.length, 0); assert.equal(house.messages[0].x, 450);
  assert.equal(house.messages[0].message, '-2.25');
});
