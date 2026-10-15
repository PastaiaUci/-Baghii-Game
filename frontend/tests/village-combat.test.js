import test from 'node:test';
import assert from 'node:assert/strict';
import { VILLAGER_ROLES, enrageVillage, canVillagerHit, updateEnragedVillager, showVillageDeath } from '../src/village-combat.js';

function chain() {
  let value;
  value = new Proxy({}, { get: (target, key) => key in target ? target[key] : () => value });
  return value;
}

function setup() {
  const s = { time: { now: 0 }, hasCoupon: false, npcs: [], player: { x: 0, y: 0, body: { center: { x: 0, y: 13 } } } };
  s.npcs = VILLAGER_ROLES.map((role, index) => ({ alive: true, role, roleIndex: index, name: `Villager ${index}`, marker: chain(), label: chain(), weapon: chain(),
    npc: { x: 20, y: 0, depth: 15, body: { blocked: {}, center: { x: 20, y: 13 } }, setVelocity() {} } }));
  return s;
}

test('villagers enrage only after obtaining the coupon; one hit alerts all five', () => {
  const s = setup();
  assert.equal(enrageVillage(s), false);
  assert.equal(s.villageEnraged, undefined);
  s.hasCoupon = true;
  assert.equal(enrageVillage(s), true);
  assert(s.npcs.every((v) => v.nextAttackAt >= 900));
  assert.equal(new Set(s.npcs.map((v) => v.role.name)).size, 5);
  assert.equal(enrageVillage(s), false);
});

test('melee attacks give a warning and miss when Gdolf leaves their range', () => {
  const s = setup();
  s.hasCoupon = true;
  enrageVillage(s);
  const v = s.npcs[0];
  s.time.now = 1000;
  let damage = 0;
  s.damagePlayer = (amount) => { damage += amount; };
  updateEnragedVillager(s, v);
  assert.equal(v.windingUp, true);
  assert.equal(damage, 0);
  s.time.now = 1429;
  updateEnragedVillager(s, v);
  assert.equal(damage, 0);
  s.player.x = 100;
  s.time.now = 1430;
  updateEnragedVillager(s, v);
  assert.equal(damage, 0);
  assert.equal(v.windingUp, false);
  assert.equal(canVillagerHit(v, 1430, 20), true);
  v.alive = false;
  assert.equal(canVillagerHit(v, 1430, 20), false);
});

test('archer fires an aimed arrow after warning; melee deals its configured damage', () => {
  const s = setup();
  const arrows = [];
  s.hasCoupon = true;
  enrageVillage(s);
  s.physics = { add: { image: () => chain() } };
  s.villagerArrows = { add: (arrow) => arrows.push(arrow) };
  const archer = s.npcs[1];
  s.player.x = 160;
  s.time.now = 1200;
  updateEnragedVillager(s, archer);
  assert.equal(arrows.length, 0);
  s.time.now = 1800;
  updateEnragedVillager(s, archer);
  assert.equal(arrows.length, 1);
  assert.equal(arrows[0].expiresAt, 4200);
  const melee = s.npcs[2];
  let damage = 0;
  s.damagePlayer = (amount) => { damage += amount; };
  melee.windingUp = true;
  melee.windupUntil = 1800;
  s.player.x = 30;
  updateEnragedVillager(s, melee);
  assert.equal(damage, 3);
});

test('village defeat returns to spawn, preserves defeated villagers and clears aggression', () => {
  const s = setup();
  const button = { focus() {}, addEventListener: (_event, callback) => { button.click = callback; } };
  globalThis.document = { createElement: () => ({ querySelector: () => button, remove() {} }), body: { appendChild() {} } };
  let paused = false, arrowsCleared = false;
  s.physics = { world: { pause: () => { paused = true; }, resume: () => { paused = false; } } };
  s.events = { once() {} };
  s.villagerArrows = { clear: () => { arrowsCleared = true; } };
  s.maxPlayerHealth = 30;
  s.playerHealth = 0;
  s.player = { clearTint() { return this; }, setPosition(x, y) { this.x = x; this.y = y; return this; }, setVelocity() { return this; } };
  s.updatePlayerHeadHealth = s.showVillagerObjective = () => {};
  s.npcs.forEach((v) => { v.npc = chain(); v.maxHealth = 4; v.health = 1; v.homeX = 200; v.homeY = 200; });
  s.npcs[0].alive = false;
  s.hasCoupon = true;
  enrageVillage(s);
  showVillageDeath(s);
  assert.equal(s.gameOver, true);
  assert.equal(paused, true);
  button.click();
  assert.equal(s.gameOver, false);
  assert.equal(s.villageEnraged, false);
  assert.equal(s.playerHealth, 30);
  assert.equal(s.player.x, 180);
  assert.equal(s.player.y, 220);
  assert.equal(s.npcs[0].alive, false);
  assert.equal(s.npcs[1].health, 4);
  assert.equal(arrowsCleared, true);
  assert.equal(paused, false);
});
