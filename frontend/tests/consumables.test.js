import test from 'node:test';
import assert from 'node:assert/strict';
import { addConsumable, buyConsumable } from '../src/consumables.js';
import { applyHealthPotion } from '../src/health-potion.js';
import { consumeRevivalBeer } from '../src/party-health.js';

const scene = () => ({ currentLevel: 2, gold: 100, inventory: [{ type: 'empty' }], updateGoldHud() {}, updateInventoryList() {}, updateHotbarState() {} });
test('map two consumables have repeatable purchases and stack even when inventory has no empty slots', () => {
  const s = scene(); buyConsumable(s, 'health-potion'); buyConsumable(s, 'health-potion');
  assert.equal(s.gold, 60); assert.equal(s.inventory[0].quantity, 2);
  buyConsumable(s, 'revival-beer'); assert.equal(s.gold, 60);
  const village = scene(); village.currentLevel = 1; buyConsumable(village, 'health-potion'); assert.equal(village.gold, 100);
  const poor = scene(); poor.gold = 9; buyConsumable(poor, 'revival-beer'); assert.equal(poor.inventory[0].type, 'empty');
});
test('potion restores 10, consumes exactly one and preserves the last empty slot', () => {
  const s = scene(); addConsumable(s, 'health-potion', 3); s.maxPlayerHealth = 40; s.playerHealth = 15;
  assert.equal(applyHealthPotion(s, 0), 10); assert.equal(s.inventory[0].quantity, 2);
  s.time = { now: 3000 };
  assert.equal(applyHealthPotion(s, 0), 10); assert.equal(s.inventory[0].quantity, 1);
  s.time.now = 6000;
  assert.equal(applyHealthPotion(s, 0), 5); assert.equal(s.inventory[0].type, 'empty');
  addConsumable(s, 'health-potion'); assert.equal(applyHealthPotion(s, 0), 0); assert.equal(s.inventory[0].quantity, 1);
});

test('potions share a three-second cooldown and failed use never consumes an item', () => {
  const s = scene(); s.game = { loop: { now: 1000 } };
  addConsumable(s, 'health-potion', 3); s.maxPlayerHealth = 40; s.playerHealth = 5;
  assert.equal(applyHealthPotion(s, 0), 10);
  assert.equal(applyHealthPotion(s, 0), 0); assert.equal(s.inventory[0].quantity, 2);
  s.game.loop.now = 3999; assert.equal(applyHealthPotion(s, 0), 0);
  s.game.loop.now = 4000; assert.equal(applyHealthPotion(s, 0), 10);
  assert.equal(s.inventory[0].quantity, 1); assert.equal(s.playerHealth, 25);
  s.game.loop.now = 7000; s.playerHealth = 40;
  assert.equal(applyHealthPotion(s, 0), 0); assert.equal(s.potionReadyAt, 7000);
});
test('beer restores 3 HP to Tete and caps at 25 without wasting beer at full health', () => {
  const s = scene(); addConsumable(s, 'revival-beer', 3); s.partyTete = {}; s.partyTeteHealth = 21;
  const beer = s.inventory[0]; consumeRevivalBeer(s, beer); assert.equal(s.partyTeteHealth, 24); assert.equal(beer.quantity, 2);
  consumeRevivalBeer(s, beer); assert.equal(s.partyTeteHealth, 25); assert.equal(beer.quantity, 1);
  assert.equal(consumeRevivalBeer(s, beer), false); assert.equal(beer.quantity, 1);
});
