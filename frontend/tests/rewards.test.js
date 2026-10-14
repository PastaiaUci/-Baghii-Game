import test from 'node:test';
import assert from 'node:assert/strict';
import { AreaSkill, activateDeathBreath, activateFlashlight, updateRewards, slowMultiplier } from '../src/rewards.js';

const chain = () => {
  let proxy;
  proxy = new Proxy({}, { get: () => () => proxy });
  return proxy;
};

function setup() {
  return {
    time: { now: 0 }, player: { x: 0, y: 0, depth: 20 },
    introOverlay: { classList: { contains: () => true } },
    inventoryUi: { classList: { contains: () => true } },
    inventory: [{ type: 'empty' }], selectedWeapon: 'slot-1',
    deathBreath: new AreaSkill(), rewardAura: chain(), flashlightHeld: chain(),
    flashlightReadyAt: 0, npcs: [],
  };
}

test('Death Breath is locked before reward and lasts exactly three seconds', () => {
  const scene = setup();
  assert.equal(activateDeathBreath(scene), false);
  scene.hasDeathBreath = true;
  assert.equal(activateDeathBreath(scene), true);
  assert.equal(activateDeathBreath(scene), false);
  for (const now of [0, 500, 1000, 1500, 2000, 2500]) assert(scene.deathBreath.tick(now));
  assert.equal(scene.deathBreath.tick(3000), false);
  assert.equal(scene.deathBreath.activate(11999), false);
  assert.equal(scene.deathBreath.activate(12000), true);
});

test('Death Breath damages living enemies in range with six periodic ticks', () => {
  const scene = setup();
  const near = { npc: { x: 100, y: 0 }, alive: true };
  const far = { npc: { x: 131, y: 0 }, alive: true };
  const dead = { npc: { x: 0, y: 0 }, alive: false };
  scene.npcs = [near, far, dead];
  const hits = [];
  scene.damageVillager = (enemy, amount) => hits.push({ enemy, amount });
  scene.deathBreath.activate(0);
  for (const now of [0, 100, 500, 1000, 1500, 2000, 2500, 3000]) {
    scene.time.now = now;
    updateRewards(scene);
  }
  assert.equal(hits.length, 6);
  assert(hits.every(({ enemy, amount }) => enemy === near && amount === 1));
});

test('Flashlight requires ownership, slows nearby enemies for four seconds, and has cooldown', () => {
  const scene = setup();
  const near = { npc: { x: 100, y: 0 }, alive: true };
  const far = { npc: { x: 151, y: 0 }, alive: true };
  scene.npcs = [near, far];
  assert.equal(activateFlashlight(scene), false);
  scene.inventory[0] = { type: 'flashlight' };
  assert.equal(activateFlashlight(scene), true);
  assert.equal(slowMultiplier(near.npc, 3999), 0.5);
  assert.equal(slowMultiplier(near.npc, 4000), 1);
  assert.equal(slowMultiplier(far.npc, 0), 1);
  assert.equal(activateFlashlight(scene), false);
  scene.time.now = 10000;
  assert.equal(activateFlashlight(scene), true);
});

test('arena effects target the boss and do not affect hidden villagers', () => {
  const scene = setup();
  scene.inventory[0] = { type: 'flashlight' };
  scene.bossRoomActive = scene.bossFightActive = true;
  scene.boss = { x: 80, y: 0 };
  const hidden = { npc: { x: 20, y: 0 }, alive: true };
  scene.npcs = [hidden];
  activateFlashlight(scene);
  assert.equal(slowMultiplier(scene.boss, 0), 0.5);
  assert.equal(slowMultiplier(hidden.npc, 0), 1);
  scene.bossFightActive = false;
  hidden.npc.slowUntil = 0;
  scene.time.now = 10000;
  activateFlashlight(scene);
  assert.equal(slowMultiplier(hidden.npc, 10000), 1);
});
