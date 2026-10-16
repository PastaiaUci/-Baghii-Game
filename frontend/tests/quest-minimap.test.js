import test from 'node:test';
import assert from 'node:assert/strict';
import { questMapInfo, questMapTargets } from '../src/quest-minimap.js';
import { createMountainPortal } from '../src/mountain-portal.js';

test('village markers follow coupon, Lavinia and tavern quest progress', () => {
  const s = { gold: 100, couponKeeper: { visible: true, x: 260, y: 320 } };
  assert.equal(questMapTargets(s).find(({ id }) => id === 'keeper').status, 'ready');
  s.hasCoupon = true; s.abgNpc = { visible: true, x: 760, y: 650 };
  assert.ok(!questMapTargets(s).some(({ id }) => id === 'keeper'));
  assert.ok(questMapTargets(s).some(({ id }) => id === 'lavinia'));
  s.abgPicked = true; s.tavernQuest = { status: 'ready' };
  assert.equal(questMapTargets(s).find(({ id }) => id === 'han').status, 'ready');
});
test('interior minimap points to Sniku then to Haralamb for the potion', () => {
  const s = { farm: { tavernQuest: { status: 'active' } }, tavernVisitors: { Sniku: { group: { x: 686, y: 442 } }, Haralamb: { group: { x: 340, y: 294 } } } };
  assert.equal(questMapTargets(s)[0].name, 'Sniku');
  s.farm.tavernQuest.status = 'ready'; assert.equal(questMapTargets(s)[0].name, 'Haralamb');
  s.farm.tavernQuest.status = 'completed'; assert.equal(questMapTargets(s).length, 0);
  assert.equal(questMapInfo(s).width, 800);
});
test('level two marks Luis until completion and then marks the mountain portal', () => {
  const s = { currentLevel: 2, emperorLuis: { visible: true, x: 930, y: 550 } };
  assert.equal(questMapTargets(s)[0].status, 'available');
  s.luisQuest = { status: 'active', count: 3 }; assert.equal(questMapTargets(s)[0].status, 'ready');
  s.luisQuest.status = 'completed'; assert.equal(questMapTargets(s).length, 0);
  s.mountainPortal = { x: 800, y: 330 }; assert.equal(questMapTargets(s)[0].id, 'mountain-portal');
});
test('boss map uses arena bounds and shows reward and portal targets', () => {
  const s = { bossRoomActive: true, bossRoomBounds: { x: 480, y: 340, width: 640, height: 400 }, bossFightActive: true, boss: { x: 900, y: 500 } };
  assert.equal(questMapInfo(s).width, 640); assert.equal(questMapTargets(s)[0].id, 'tete');
  s.bossFightActive = false; s.bossDefeated = true; s.chapterPortal = { x: 800, y: 450 };
  assert.equal(questMapTargets(s)[0].id, 'portal');
});
test('mountain portal appears once after quest completion and has no interaction handler', () => {
  const calls = { on: 0 };
  const chain = () => { let value; value = new Proxy({}, { get: (_, key) => key === 'setInteractive' ? () => { throw new Error('Portal must be decorative'); } : () => value }); return value; };
  const s = { luisQuest: { status: 'active' }, add: { graphics: chain, text: chain }, time: { now: 0 }, events: { on() { calls.on += 1; }, once() {} } };
  assert.equal(createMountainPortal(s), false);
  s.luisQuest.status = 'completed'; assert.equal(createMountainPortal(s), true); assert.equal(createMountainPortal(s), false);
  assert.equal(calls.on, 1); assert.equal(s.mountainPortal.x, 800);
});
