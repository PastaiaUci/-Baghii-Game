import { grantBossReward } from './rewards.js';

export function chooseReward(state, type) {
  if (state.consumed || !['beer', 'sperma'].includes(type)) return false;
  state.consumed = type;
  return true;
}

export function dropBossLoot(scene, x, y) {
  scene.bossLootState = { consumed: null };
  if (!scene.textures.exists('boss-white-drop')) {
    const g = scene.make.graphics();
    g.fillStyle(0x8c99a8);
    g.fillRoundedRect(5, 8, 18, 23, 5);
    g.fillStyle(0xe9f0ef);
    g.fillRoundedRect(7, 10, 14, 19, 4);
    g.fillStyle(0xffffff);
    g.fillRect(9, 16, 10, 11);
    g.fillStyle(0xc4a3b4);
    g.fillRect(9, 3, 10, 7);
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(9, 11, 2, 12);
    g.generateTexture('boss-white-drop', 28, 34);
    g.destroy();
  }
  const b = scene.bossRoomBounds;
  // Keep the pair clear of corner barrels and inside the arena.
  x = Math.max(b.x + 140, Math.min(b.x + b.width - 140, x));
  y = Math.max(b.y + 115, Math.min(b.y + b.height - 80, y));
  scene.bossLoot = [
    { type: 'beer', name: 'Bere', texture: 'boss-beer', offset: -38 },
    { type: 'sperma', name: 'Sperma', texture: 'boss-white-drop', offset: 38 },
  ].map((item) => {
    const glow = scene.add.ellipse(x + item.offset, y + 10, 40, 18, 0xffdf9f, 0.25).setDepth(4);
    const sprite = scene.add.image(x + item.offset, y, item.texture).setDepth(27).setInteractive({ useHandCursor: true });
    const label = scene.add.text(sprite.x, y - 27, item.name, {
      fontFamily: 'Arial', fontSize: '11px', color: '#fff1d7', stroke: '#24202b', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(28);
    return { ...item, sprite, label, glow };
  });
  scene.setQuest('Recompensa lui Tete', 'Alege un singur lichid · Apropie-te și apasă E / click.');
  scene.showPrompt('Tete, The Gooner', 'M-ai învins, Gdolf! Poți alege unul dintre cele două lichide preferate ale mele. Berea îți oferă Death Breath: damage în jurul tău timp de 3 secunde. Sperma îți oferă Flashlight: un item care încetinește inamicii.', undefined, undefined, true);
  scene.events.once('shutdown', () => clearBossLoot(scene));
}

function distanceTo(scene, item) {
  return Math.hypot(scene.player.x - item.sprite.x, scene.player.y - item.sprite.y);
}

function consume(scene, item) {
  if (item.type === 'sperma' && !scene.inventory.some(({ type }) => type === 'empty')) return false;
  if (!scene.inventoryUi.classList.contains('hidden') || distanceTo(scene, item) > 60 ||
      !chooseReward(scene.bossLootState, item.type)) return false;
  const x = scene.player.x, y = scene.player.y;
  clearBossLoot(scene);
  scene.hidePrompt();
  grantBossReward(scene, item.type);
  const flash = scene.add.circle(x, y + 10, 20, item.type === 'beer' ? 0xffcb65 : 0xffffff, 0.45).setDepth(28);
  scene.tweens.add({ targets: flash, scale: 2.5, alpha: 0, duration: 500, onComplete: () => flash.destroy() });
  return true;
}

export function consumeNearbyBossLoot(scene) {
  const nearest = scene.bossLoot?.slice().sort((a, b) => distanceTo(scene, a) - distanceTo(scene, b))[0];
  return nearest ? consume(scene, nearest) : false;
}

export function clickBossLoot(scene, point) {
  const item = scene.bossLoot?.find(({ sprite }) => Math.hypot(point.x - sprite.x, point.y - sprite.y) < 24);
  if (!item) return false;
  consume(scene, item);
  return true;
}

export function updateBossLoot(scene) {
  scene.bossLoot?.forEach((item) => {
    const nearby = distanceTo(scene, item) <= 60;
    item.label.setText(nearby ? `${item.name} · E` : item.name);
    item.glow.setAlpha(nearby ? 0.55 : 0.25);
  });
}

export function clearBossLoot(scene) {
  scene.bossLoot?.forEach(({ sprite, label, glow }) => { sprite.destroy(); label.destroy(); glow.destroy(); });
  scene.bossLoot = [];
}
