import test from 'node:test';
import assert from 'node:assert/strict';
import { WAKE_ROUNDS, getTavernQuest, answerWakeQuest, talkToTavernNpc, startSnikuWalk } from '../src/tavern-quest.js';
import { grantHealthPotion, applyHealthPotion } from '../src/health-potion.js';

test('all three replies are accepted and failure is evaluated only at the end', () => {
  const farm = {};
  const q = getTavernQuest(farm);
  assert.equal(answerWakeQuest(q, 'mall'), 'inactive');
  q.status = 'active';
  assert.equal(answerWakeQuest(q, 'mall'), 'next');
  assert.equal(answerWakeQuest(q, 'sleep'), 'next');
  assert.equal(q.step, 2);
  assert.equal(q.status, 'active');
  assert.equal(answerWakeQuest(q, 'daria'), 'failed');
  assert.equal(q.lastScore, 2);
  assert.equal(q.step, 0);
  assert.equal(answerWakeQuest(q, 'invalid'), 'invalid');
  WAKE_ROUNDS.forEach((round, index) => assert.equal(answerWakeQuest(q, round.answer), index === 2 ? 'awake' : 'next'));
  assert.equal(q.lastScore, 3);
  assert.equal(q.status, 'walking');
  assert.equal(answerWakeQuest(q, 'daria'), 'inactive');
});

test('potion reward uses an empty slot and heals 10 HP capped at maximum', () => {
  const s = { inventory: [{ type: 'empty' }, { type: 'empty' }], updateInventoryList() {}, updateHotbarState() {}, playerHealth: 12, maxPlayerHealth: 30 };
  assert.equal(grantHealthPotion(s), true);
  assert.equal(s.inventory[0].type, 'health-potion');
  assert.equal(s.inventory[1].type, 'empty');
  assert.equal(applyHealthPotion(s, 0), 10);
  assert.equal(s.playerHealth, 22);
  assert.equal(applyHealthPotion(s, 0), 0);
  grantHealthPotion(s);
  s.playerHealth = 27;
  assert.equal(applyHealthPotion(s, 0), 3);
  assert.equal(s.playerHealth, 30);
  grantHealthPotion(s);
  assert.equal(applyHealthPotion(s, 0), 0);
  assert.equal(s.inventory[0].type, 'health-potion');
});

function chain() {
  let object;
  object = new Proxy({}, { get: (target, key) => key in target ? target[key] : () => object });
  return object;
}

function setup() {
  const farm = { inventory: [{ type: 'sword' }, { type: 'empty' }], updateInventoryList() {}, updateHotbarState() {} };
  const s = { farm, dialogChoices: { replaceChildren() {} }, dialogOkButton: { focus() {} }, time: { now: 0, delayedCall() {} },
    dialogName: {}, dialogText: {}, physics: { world: { pause() {} } },
    dialogBox: { classList: { remove() {} }, querySelector: () => ({}) },
  };
  return s;
}

test('talking to either quest giver starts mission; only Haralamb rewards it once after beer order', () => {
  const s = setup();
  talkToTavernNpc(s, 'Chinezu', '');
  const q = getTavernQuest(s.farm);
  assert.equal(q.status, 'active');
  q.status = 'walking';
  talkToTavernNpc(s, 'Haralamb', '');
  assert.equal(s.farm.inventory[1].type, 'empty');
  q.status = 'ready';
  talkToTavernNpc(s, 'Chinezu', '');
  assert.equal(s.farm.inventory[1].type, 'empty');
  talkToTavernNpc(s, 'Haralamb', '');
  assert.equal(q.status, 'completed');
  assert.equal(s.farm.inventory[1].type, 'health-potion');
  applyHealthPotion({ ...s.farm, playerHealth: 10, maxPlayerHealth: 30 }, 1);
  talkToTavernNpc(s, 'Haralamb', '');
  assert.equal(s.farm.inventory[1].type, 'empty', 'reward cannot be farmed repeatedly');
});

test('full inventory keeps reward available for collection later', () => {
  const s = setup();
  s.farm.inventory[1] = { type: 'coupon' };
  const q = getTavernQuest(s.farm); q.status = 'ready';
  talkToTavernNpc(s, 'Haralamb', '');
  assert.equal(q.status, 'ready');
  assert.equal(s.farm.inventory[1].type, 'coupon');
  s.farm.inventory.push({ type: 'empty' });
  talkToTavernNpc(s, 'Haralamb', '');
  assert.equal(q.status, 'completed');
});

test('Sniku physically walks to bar before ordering beer and unlocking reward', () => {
  const s = setup();
  const q = getTavernQuest(s.farm); q.status = 'walking';
  const group = { x: 686, y: 442, setDepth() {}, add() {} };
  const zone = { setPosition() {}, body: { updateFromGameObject() {} } };
  s.tavernVisitors = { Sniku: { sprite: chain(), group, zone, label: chain() } };
  let movement;
  s.tweens = { killTweensOf() {}, add: (config) => { movement = config; } };
  s.add = { graphics: chain, text: chain };
  startSnikuWalk(s);
  assert.equal(q.status, 'walking');
  assert.equal(movement.x, 680);
  assert.equal(movement.y, 218);
  assert.equal(s.farm.inventory[1].type, 'empty');
  group.x = 680; group.y = 218;
  movement.onComplete();
  assert.equal(q.status, 'ready');
  assert.deepEqual(q.position, { x: 680, y: 218 });
  assert(s.tavernVisitors.Sniku.beer);
  assert.equal(s.farm.inventory[1].type, 'empty', 'player must return to Haralamb to claim');
});
