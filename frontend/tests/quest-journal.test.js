import test from 'node:test';
import assert from 'node:assert/strict';
import { journalQuests } from '../src/quest-journal.js';
import { portalWindStrength } from '../src/mountain-portal.js';

test('journal follows village progression without exposing alpine quests before that map', () => {
  const farm = { gold: 42, npcs: Array.from({ length: 5 }, () => ({ alive: true })) };
  let quests = journalQuests(farm);
  assert.match(quests.find(q => q.id === 'coupon').objective, /42\/100/);
  assert.equal(quests.some(q => q.id === 'luis'), false);
  farm.hasCoupon = true; farm.npcs[0].alive = false;
  quests = journalQuests(farm);
  assert.equal(quests.find(q => q.id === 'coupon').state, 'completed');
  assert.match(quests.find(q => q.id === 'villagers').objective, /1\/5/);
  farm.npcs.forEach(npc => npc.alive = false);
  assert.equal(journalQuests(farm).find(q => q.id === 'lavinia').state, 'active');
});

test('secondary quest tracks service and reward collection separately', () => {
  const farm = { tavernQuest: { status: 'serving' } };
  assert.match(journalQuests(farm).find(q => q.id === 'sniku').objective, /Barmanul/);
  farm.tavernQuest.status = 'ready';
  assert.match(journalQuests(farm).find(q => q.id === 'sniku').objective, /Haralamb/);
  farm.tavernQuest.status = 'completed';
  assert.equal(journalQuests(farm).find(q => q.id === 'sniku').state, 'completed');
});

test('journal rebuilds alpine and winter stages directly from persisted quest state', () => {
  const farm = { currentLevel: 2, hasCoupon: true, abgPicked: true, bossDefeated: true, bossLootState: { consumed: 'beer' }, luisQuest: { status: 'active', count: 2 } };
  assert.match(journalQuests(farm).find(q => q.id === 'luis').objective, /2\/3/);
  assert.equal(journalQuests(farm).some(q => q.id === 'winter'), false);
  farm.luisQuest.status = 'completed'; farm.winterQuest = { status: 'ointment-found' };
  assert.match(journalQuests(farm).find(q => q.id === 'winter').objective, /Du-o lui Miganul/);
  farm.winterQuest.status = 'coat-owned';
  assert.equal(journalQuests(farm).find(q => q.id === 'winter').state, 'completed');
  assert.match(journalQuests(farm).find(q => q.id === 'winter').objective, /Echipeaz-o/);
});

test('portal wind increases with proximity and winter gear while staying bounded', () => {
  assert.ok(portalWindStrength(0) > portalWindStrength(100));
  assert.ok(portalWindStrength(100, true) > portalWindStrength(100));
  assert.equal(portalWindStrength(0, true), 1);
  assert.equal(portalWindStrength(500), portalWindStrength(180));
});
