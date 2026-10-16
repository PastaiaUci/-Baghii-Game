import { updatePlayerHealth } from './boss.js';
import { syncCharacterStats } from './character-stats.js';

export function buyHelmet(scene) {
  if (scene.shopHelmetSold || scene.equippedHelmet || scene.inventory.some((item) => item.type === 'helmet')) return 'Casca a fost vândută. Nu mai este în stoc.';
  if (scene.gold < 200) return 'Casca costă 200 gold. Nu ai destui bănuți.';
  const slot = scene.inventory.findIndex((item) => item.type === 'empty');
  if (slot < 0) return 'Inventarul este plin.';
  scene.gold -= 200;
  scene.shopHelmetSold = true;
  scene.inventory[slot] = { type: 'helmet', label: 'Cască de fier · 5 armură · Click pentru echipare', key: String(slot + 1), armorRemaining: 5 };
  scene.updateGoldHud(); scene.updateInventoryList(); scene.updateHotbarState();
  return 'Ai cumpărat casca! Deschide inventarul cu I și apasă pe ea ca să o echipezi.';
}

export function toggleHelmet(scene, item) {
  if (item?.type !== 'helmet') return false;
  if (scene.equippedHelmet === item) {
    const slot = scene.inventory.findIndex(({ type }) => type === 'empty');
    if (slot < 0) {
      const feedback = scene.inventoryUi?.querySelector('.inventory-help');
      if (feedback) feedback.textContent = 'Inventarul este plin. Eliberează un slot înainte să dai jos casca.';
      return false;
    }
    item.key = String(slot + 1);
    scene.inventory[slot] = item;
    scene.equippedHelmet = null;
  } else {
    const slot = scene.inventory.indexOf(item);
    if (slot < 0 || scene.equippedHelmet) return false;
    scene.inventory[slot] = { type: 'empty', label: `Slot ${slot + 1}`, key: String(slot + 1) };
    scene.equippedHelmet = item;
  }
  scene.updateInventoryList(); scene.updateHotbarState();
  syncCharacterStats(scene);
  updatePlayerHealth(scene);
  return true;
}

export function armorPoints(scene) {
  return scene.equippedHelmet?.armorRemaining || 0;
}

export function absorbArmorDamage(scene, damage) {
  const absorbed = Math.min(armorPoints(scene), damage);
  if (scene.equippedHelmet) scene.equippedHelmet.armorRemaining -= absorbed;
  return damage - absorbed;
}

export function drawHelmet(ctx, x, y, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = '#39434f'; ctx.fillRect(5, 1, 22, 8); ctx.fillRect(3, 7, 26, 3);
  ctx.fillStyle = '#a8b2bc'; ctx.fillRect(7, 2, 18, 5);
  ctx.fillStyle = '#dce3e2'; ctx.fillRect(9, 2, 5, 2);
  ctx.fillStyle = '#738492'; ctx.fillRect(5, 9, 3, 6); ctx.fillRect(24, 9, 3, 6);
  ctx.fillStyle = '#d7b777'; ctx.fillRect(15, 2, 2, 7);
  ctx.restore();
}

export function createHelmetVisual(scene, owner = scene) {
  if (!scene.textures.exists('gdolf-helmet')) {
    const texture = scene.textures.createCanvas('gdolf-helmet', 32, 40);
    drawHelmet(texture.getContext(), 0, 0); texture.refresh();
  }
  const helmet = scene.add.image(0, 0, 'gdolf-helmet').setVisible(false);
  const update = () => {
    const player = scene.player;
    helmet.setVisible(Boolean(owner.equippedHelmet && player?.visible && !scene.tavernActive));
    if (!player) return;
    const bob = player.texture.key === 'player-idle-breath' ? -1 : player.texture.key === 'player-walk-1' ? 1 : 0;
    helmet.setPosition(player.x, player.y + bob).setDepth(player.depth + 0.05);
  };
  scene.events.on('postupdate', update);
  scene.events.once('shutdown', () => scene.events.off('postupdate', update));
}
