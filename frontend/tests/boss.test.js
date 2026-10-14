import test from 'node:test';
import assert from 'node:assert/strict';
import { createBoss, clearBossAttacks, updatePlayerHealth, puddleState, BEER_INTERVAL_MS } from '../src/boss.js';
import { chooseReward, dropBossLoot, consumeNearbyBossLoot, clickBossLoot } from '../src/boss-loot.js';

function object(x = 0, y = 0) {
  const target = { x, y, active: true, destroyed: false, body: {} };
  const value = new Proxy(target, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === 'destroy') return () => { target.active = false; target.destroyed = true; };
      return () => value;
    },
  });
  target.body.setSize = target.body.setOffset = () => target.body;
  return value;
}

function setup() {
  const value = { textContent: '' }, fill = { style: {} };
  const hud = { classList: { toggle() {} }, remove() {}, addEventListener() {}, querySelector: (selector) => selector.endsWith('value') ? value : fill };
  globalThis.document = { createElement: () => hud, body: { appendChild() {} } };
  const scene = {
    textures: { exists: () => true }, events: { once() {} }, time: { now: 100 },
    bossRoomBounds: { x: 480, y: 340, width: 640, height: 400 },
    player: object(), playerHealth: 30, maxPlayerHealth: 30, bossFightActive: true,
    add: { text: (x, y) => object(x, y), image: (x, y) => object(x, y), graphics: () => object(), ellipse: (x, y) => object(x, y) },
    bossProjectiles: { isParent: true, clear() {} }, arenaSolids: {},
    physics: { add: {
      sprite: (x, y) => object(x, y), collider: () => object(),
      overlap: (first, second, callback) => {
        scene.overlap = { first, second, callback };
        return object();
      },
    } },
    damagePlayer(amount) {
      this.playerHealth = Math.max(0, this.playerHealth - amount);
      updatePlayerHealth(this);
      if (!this.playerHealth) { this.bossFightActive = false; clearBossAttacks(this); }
    },
    inventory: [{ type: 'empty' }],
    setQuest() {}, showPrompt() {}, hidePrompt() {},
    updateInventoryList() {}, updateHotbarState() {}, selectWeapon() {},
  };
  createBoss(scene);
  return scene;
}

test('beer overlap destroys the beer, preserves Gdolf, and updates health', () => {
  const scene = setup();
  assert.equal(scene.overlap.first, scene.player);
  assert.equal(scene.overlap.second, scene.bossProjectiles);
  const beer = object();
  scene.overlap.callback(scene.player, beer);
  assert.equal(beer.destroyed, true);
  assert.equal(scene.player.destroyed, false);
  assert.equal(scene.playerHealth, 26);
  assert.equal(scene.playerHealthValue.textContent, '26/30');
  assert.equal(scene.playerHealthFill.style.width, `${26 / 30 * 100}%`);
  scene.overlap.callback(scene.player, beer);
  assert.equal(scene.playerHealth, 26, 'a consumed projectile cannot hit twice');
});

test('lethal beer hit cleans attacks without destroying Gdolf', () => {
  const scene = setup();
  scene.playerHealth = 4;
  scene.overlap.callback(scene.player, object());
  assert.equal(scene.playerHealth, 0);
  assert.equal(scene.playerHealthValue.textContent, '0/30');
  assert.equal(scene.playerHealthFill.style.width, '0%');
  assert.equal(scene.player.destroyed, false);
  assert.equal(scene.bossArenaColliders.length, 0);
});

test('beer starts after 3.5 seconds and puddles retain warning and expiry', () => {
  const scene = setup();
  assert.equal(BEER_INTERVAL_MS, 3500);
  assert.equal(scene.nextBeerAt, scene.time.now + 3500);
  const puddle = { x: 100, y: 100, createdAt: 0 };
  assert.equal(puddleState(puddle, 799, 100, 100).touching, false);
  assert.equal(puddleState(puddle, 800, 100, 100).touching, true);
  assert.equal(puddleState(puddle, 6800, 100, 100).expired, true);
});

test('victory preserves the player collider and removes attack colliders', () => {
  const scene = setup();
  const colliders = scene.bossArenaColliders.slice();
  clearBossAttacks(scene, true);
  assert.equal(scene.bossArenaColliders[0], colliders[0]);
  assert.equal(colliders[0].destroyed, false);
  assert(colliders.slice(1).every((collider) => collider.destroyed));
});

test('either reward can be selected exactly once', () => {
  for (const type of ['beer', 'sperma']) {
    const state = { consumed: null };
    assert.equal(chooseReward(state, 'invalid'), false);
    assert.equal(chooseReward(state, type), true);
    assert.equal(chooseReward(state, 'beer'), false);
    assert.equal(chooseReward(state, 'sperma'), false);
    assert.equal(state.consumed, type);
  }
});

test('drops require proximity; consuming one removes both drops', () => {
  const scene = setup();
  scene.questHud = { textContent: '' };
  scene.inventoryUi = { classList: { contains: () => true } };
  scene.tweens = { add() {} };
  scene.add.image = scene.add.circle = (x, y) => object(x, y);
  dropBossLoot(scene, 800, 550);
  const drops = scene.bossLoot.slice();
  assert.equal(drops.length, 2);
  assert.equal(consumeNearbyBossLoot(scene), false);
  assert.equal(clickBossLoot(scene, drops[1].sprite), true);
  assert.equal(scene.bossLootState.consumed, null);
  scene.player.x = drops[1].sprite.x;
  scene.player.y = drops[1].sprite.y;
  assert.equal(clickBossLoot(scene, drops[1].sprite), true);
  assert.equal(scene.bossLootState.consumed, 'sperma');
  assert.equal(scene.inventory[0].type, 'flashlight');
  assert.equal(scene.bossLoot.length, 0);
  assert(drops.every(({ sprite, label, glow }) => sprite.destroyed && label.destroyed && glow.destroyed));
  assert.equal(consumeNearbyBossLoot(scene), false);
});
