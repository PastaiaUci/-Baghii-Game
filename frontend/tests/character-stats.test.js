import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_STATS, initializeStats, derivedStats, physicalDamage, spellDamage, grantStatPoints, spendStatPoint, syncCharacterStats } from '../src/character-stats.js';
import { swordAuraBonus } from '../src/skills.js';

test('baseline preserves current combat and movement values', () => {
  const s = {}; initializeStats(s); const stats = derivedStats(s);
  assert.deepEqual(s.characterStats, BASE_STATS); assert.equal(s.statPoints, 0);
  assert.equal(stats.walkSpeed, 180); assert.equal(stats.attackMs, 160); assert.equal(stats.maxHealth, 30);
  assert.equal(physicalDamage(s, 1), 1); assert.equal(spellDamage(s, 2), 2); assert.equal(stats.rushBonus, 0.6);
});
test('each allocated attribute changes its intended effect and spends only available points', () => {
  const s = { playerHealth: 30 }; assert.equal(spendStatPoint(s, 'speed'), false);
  assert.equal(grantStatPoints(s, 5), true);
  for (const stat of Object.keys(BASE_STATS)) assert.equal(spendStatPoint(s, stat), true);
  const stats = derivedStats(s);
  assert.ok(stats.walkSpeed > 180); assert.ok(stats.attackMs < 160); assert.equal(stats.maxHealth, 33);
  assert.ok(physicalDamage(s, 1) > 1); assert.ok(spellDamage(s, 1) > 1); assert.ok(stats.rushBonus > 0.6);
  assert.equal(s.statPoints, 0); assert.equal(spendStatPoint(s, 'strength'), false); assert.equal(s.playerHealth, 30);
});
test('only equipped item bonuses count; removing vitality clamps health without free healing', () => {
  const item = { statBonuses: { speed: 5, intelligence: 5, vitality: 5 } };
  const s = { inventory: [item], playerHealth: 30 };
  assert.equal(derivedStats(s).walkSpeed, 180);
  s.equippedHelmet = item; syncCharacterStats(s);
  assert.equal(derivedStats(s).walkSpeed, 207); assert.equal(s.maxPlayerHealth, 45); assert.equal(s.playerHealth, 30);
  s.playerHealth = 43; s.equippedHelmet = null; syncCharacterStats(s); assert.equal(s.playerHealth, 30);
  s.equippedBoots = {}; assert.equal(derivedStats(s).walkSpeed, 225);
});
test('intelligence increases actual sword aura bonus; invalid grants and attributes are rejected', () => {
  const s = { characterStats: { ...BASE_STATS, intelligence: 20 }, selectedWeapon: 'slot-1', inventory: [{ type: 'sword' }], time: { now: 100 }, swordAuraSkill: { until: 1000 } };
  assert.equal(swordAuraBonus(s, 'boss'), 3.2); assert.equal(swordAuraBonus(s, 'villager'), 1.6);
  assert.equal(grantStatPoints(s, -1), false); assert.equal(grantStatPoints(s, 1.5), false);
  grantStatPoints(s, 2); assert.equal(spendStatPoint(s, 'fake'), false); assert.equal(s.statPoints, 2);
});
