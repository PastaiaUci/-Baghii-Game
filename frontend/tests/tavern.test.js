import test from 'node:test';
import assert from 'node:assert/strict';
import { canEnterTavern, tryEnterTavern, clickTavernDoor, shiftVillageTimers } from '../src/tavern-access.js';

function setup() {
  return {
    player: { x: 430, y: 420, setVelocity() {} },
    introOverlay: { classList: { contains: () => true } },
    inventoryUi: { classList: { contains: () => true } },
    inventory: [{ type: 'coupon' }],
    scene: { launch() {}, pause() {} },
  };
}

test('entering tavern pauses the village and preserves inventory', () => {
  const s = setup();
  const inventory = s.inventory;
  let launched = 0, paused = 0;
  s.scene.launch = (name, data) => { assert.equal(name, 'TavernScene'); assert.equal(data.farm, s); launched += 1; };
  s.scene.pause = () => { paused += 1; };
  assert.equal(tryEnterTavern(s), true);
  assert.equal(s.tavernActive, true);
  assert.equal(s.inventory, inventory);
  assert.equal(tryEnterTavern(s), false);
  assert.equal(launched, 1);
  assert.equal(paused, 1);
});

test('tavern requires proximity and is unavailable during dialogue or other maps', () => {
  const s = setup();
  assert.equal(canEnterTavern(s), true);
  s.player.x = 800;
  assert.equal(canEnterTavern(s), false);
  s.player.x = 430;
  for (const key of ['gameOver', 'npcDialogueOpen', 'chapterDialogueOpen', 'bookOpen', 'bossRoomActive']) {
    s[key] = true;
    assert.equal(canEnterTavern(s), false);
    s[key] = false;
  }
  s.currentLevel = 2;
  assert.equal(canEnterTavern(s), false);
});

test('clicking the door enters, clicking the roof does not', () => {
  const s = setup();
  assert.equal(clickTavernDoor(s, { x: 430, y: 260 }), false);
  assert.equal(clickTavernDoor(s, { x: 430, y: 380 }), true);
});

test('time spent inside cannot expire a village attack warning or arrow', () => {
  const arrow = { expiresAt: 5000 };
  const s = { villageEnraged: true, npcs: [{ nextAttackAt: 4000, windingUp: true, windupUntil: 4500 }], villagerArrows: { getChildren: () => [arrow] } };
  shiftVillageTimers(s, 30000);
  assert.equal(s.npcs[0].nextAttackAt, 34000);
  assert.equal(s.npcs[0].windupUntil, 34500);
  assert.equal(arrow.expiresAt, 35000);
});
