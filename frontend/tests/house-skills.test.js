import test from 'node:test';
import assert from 'node:assert/strict';
import { createHouseSkills, activateHouseSkill, updateHouseSkills } from '../src/house-skills.js';
import { RushSkill, activateRush } from '../src/rush.js';
import { SwordAuraSkill, activateSwordAura, swordAuraBonus } from '../src/skills.js';
import { AreaSkill, activateDeathBreath, activateFlashlight } from '../src/rewards.js';
import { transferSkillState, shiftSkillTimers } from '../src/skill-state.js';

const art = () => { let result; result = new Proxy({}, { get: () => () => result }); return result; };
const hidden = { classList: { contains: () => true } };
function setup() {
  const ui = () => ({ classList: { toggle() {} } });
  const owner = {
    houseActive: true, time: { now: 10000 }, inventory: [{ type: 'sword' }, { type: 'flashlight' }], selectedWeapon: 'slot-1',
    introOverlay: hidden, hasDeathBreath: true, rushSkill: new RushSkill(), swordAuraSkill: new SwordAuraSkill(), deathBreath: new AreaSkill(),
    rushButton: ui(), rushStatus: {}, swordAuraButton: ui(), swordAuraStatus: {}, deathBreathButton: ui(), deathBreathStatus: {}, flashlightButton: ui(), flashlightStatus: {},
  };
  const house = {
    farm: owner, time: { now: 1000 }, game: { loop: { delta: 16 } }, currentLevel: 2,
    inventory: owner.inventory, selectedWeapon: owner.selectedWeapon, inventoryUi: hidden,
    player: { x: 100, y: 100, depth: 10 }, playerWeapon: { visible: true, x: 110, y: 110, depth: 11 },
    add: { graphics: art, image: art }, blocked() { return Boolean(this.npcDialogueOpen); }, mobs: [],
    damageIndoorMob(mob, amount) { mob.hp -= amount; },
  };
  owner.activeHouse = house; createHouseSkills(house);
  return { owner, house };
}

test('house skillbar routes Q/F/R and slow to the indoor scene with real combat effects', () => {
  const { owner, house } = setup();
  const enemy = { alive: true, hp: 10, sprite: { x: 120, y: 100 } }; enemy.sprite.houseMob = enemy; house.mobs.push(enemy);
  activateRush(owner); assert.equal(house.rushSkill.activeUntil, 6000); assert.equal(owner.rushSkill.activeUntil, 0);
  assert.equal(activateSwordAura(owner), true); assert.equal(swordAuraBonus(house, 'villager'), 1);
  assert.equal(activateDeathBreath(owner), true);
  assert.equal(activateFlashlight(owner), true); assert.equal(enemy.sprite.slowUntil, 5000);
  assert.equal(updateHouseSkills(house), 288); assert.equal(enemy.hp, 9);
  house.npcDialogueOpen = true; assert.equal(activateHouseSkill(house, 'q'), false);
});

test('remaining skill durations survive scene clock changes, dialogue and return outside', () => {
  const { owner, house } = setup();
  activateSwordAura(owner); activateDeathBreath(owner);
  house.time.now += 1000;
  shiftSkillTimers(house, 2000); house.time.now += 2000;
  transferSkillState(house, owner, house.time.now, 20000);
  assert.equal(owner.swordAuraSkill.until, 24000);
  assert.equal(owner.swordAuraSkill.readyAt, 34000);
  assert.equal(owner.deathBreath.until, 22000);
  assert.ok(owner.swordAuraSkill instanceof SwordAuraSkill);
  transferSkillState(owner, house, 40000, 50000);
  assert.equal(house.swordAuraSkill.until, 0); assert.equal(house.swordAuraSkill.readyAt, 0);
});
