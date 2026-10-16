import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseTeteTarget, updatePartyCombat } from '../src/party-combat.js';

test('Tete targets indoor enemies and beer applies damage through the house handler', () => {
  let damage = 0, destroyed = 0;
  const target = { alive: true, sprite: { x: 20, y: 0 } };
  const shot = { x: 15, y: 0, destroy() { destroyed++; } };
  const scene = {
    currentLevel: 2, partyTete: { active: true, visible: true, x: 0, y: 0 },
    partyTeteHealth: 25, companionEnemies: [target], metinMobs: [],
    inventoryUi: { classList: { contains: () => true } }, game: { loop: { delta: 16 } },
    partyBeerCooldown: 1000, partyBeerShots: [{ sprite: shot, target, life: 1000 }],
    damageCompanionTarget(mob, amount) { assert.equal(mob, target); damage += amount; },
  };
  assert.equal(chooseTeteTarget(scene), target);
  updatePartyCombat(scene);
  assert.equal(damage, 3); assert.equal(destroyed, 1);
  assert.equal(scene.partyBeerShots.length, 0);
  scene.partyTeteSleeping = true;
  assert.equal(chooseTeteTarget(scene), null);
});
