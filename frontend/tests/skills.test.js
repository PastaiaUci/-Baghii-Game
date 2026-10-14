import test from 'node:test';
import assert from 'node:assert/strict';
import { SwordAuraSkill, swordAuraBonus } from '../src/skills.js';

test('sword aura requires an equipped sword and lasts 5 seconds with 15 second cooldown', () => {
  const skill = new SwordAuraSkill();
  assert.equal(skill.activate(0, false), false);
  assert.equal(skill.readyAt, 0);
  assert.equal(skill.activate(0, true), true);
  assert.equal(skill.until, 5000);
  assert.equal(skill.activate(14999, true), false);
  assert.equal(skill.activate(15000, true), true);
});

test('active sword aura defeats a 4HP villager in two hits and deals 4 damage to boss', () => {
  const scene = { selectedWeapon: 'slot-1', inventory: [{ type: 'sword' }], time: { now: 100 }, swordAuraSkill: new SwordAuraSkill() };
  scene.swordAuraSkill.activate(100, true);
  assert.equal((1 + swordAuraBonus(scene, 'villager')) * 2, 4);
  assert.equal(2 + swordAuraBonus(scene, 'boss'), 4);
  scene.time.now = 5100;
  assert.equal(swordAuraBonus(scene, 'villager'), 0);
  assert.equal(swordAuraBonus(scene, 'boss'), 0);
});

test('sword aura does not buff other equipment while the timer is running', () => {
  const scene = { selectedWeapon: 'slot-2', inventory: [{ type: 'sword' }], time: { now: 100 }, swordAuraSkill: new SwordAuraSkill() };
  scene.swordAuraSkill.activate(0, true);
  assert.equal(swordAuraBonus(scene, 'boss'), 0);
  scene.selectedWeapon = 'slot-1';
  scene.inventory[0].type = 'empty';
  assert.equal(swordAuraBonus(scene, 'villager'), 0);
});
