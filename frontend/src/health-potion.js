import { updatePlayerHealth } from './boss.js';
import { getSelectedItem } from './inventory.js';
import { addConsumable, consumeOne } from './consumables.js';

export function createPotionHeld(scene) {
  const g = scene.make.graphics();
  g.fillStyle(0x774630).fillRoundedRect(8, 1, 9, 5, 1);
  g.fillStyle(0xf0d6b3).fillRect(7, 5, 11, 6);
  g.fillStyle(0x8b3955).fillRoundedRect(3, 10, 19, 21, 6);
  g.fillStyle(0xd94765).fillRoundedRect(5, 13, 15, 16, 4);
  g.fillStyle(0xffb4b2, 0.8).fillRect(6, 14, 3, 11);
  g.fillStyle(0xfff0d4).fillRect(11, 17, 3, 10).fillRect(8, 20, 9, 3);
  g.lineStyle(1, 0xf1d3c8).strokeRoundedRect(3, 10, 19, 21, 6);
  g.generateTexture('health-potion-held', 25, 33); g.destroy();
  scene.potionHeld = scene.add.image(0, 0, 'health-potion-held').setScale(0.72).setRotation(0.12).setVisible(false);
}

export function updatePotionHeld(scene) {
  if (!scene.potionHeld) return;
  const item = getSelectedItem(scene);
  scene.potionHeld.setVisible(item?.type === 'health-potion' && !scene.gameOver && !scene.tavernActive);
  scene.potionHeld.setPosition(scene.player.x + 15, scene.player.y + 8).setDepth(scene.player.depth + 0.03);
}

export function grantHealthPotion(scene) {
  if (!addConsumable(scene, 'health-potion')) return false;
  scene.updateInventoryList(); scene.updateHotbarState();
  return true;
}

export function applyHealthPotion(scene, slot) {
  if (scene.inventory[slot]?.type !== 'health-potion' || scene.playerHealth >= scene.maxPlayerHealth || scene.playerHealth <= 0) return 0;
  const before = scene.playerHealth;
  scene.playerHealth = Math.min(scene.maxPlayerHealth, before + 10);
  consumeOne(scene, slot, 'health-potion');
  return scene.playerHealth - before;
}

export function useHealthPotion(scene, slot) {
  if (scene.houseActive) return scene.activeHouse?.usePotion(slot) || false;
  if (scene.menuOpen || scene.tavernActive || scene.gameOver || scene.bookOpen || scene.npcDialogueOpen || scene.chapterDialogueOpen || scene.levelTransitioning) return false;
  if (scene.inventory[slot]?.type !== 'health-potion') return false;
  const restored = applyHealthPotion(scene, slot);
  const text = scene.add.text(scene.player.x, scene.player.y - 58, restored ? `+${restored} HP` : 'Viață maximă', {
    fontFamily: 'Arial', fontSize: '12px', color: '#bef2b0', stroke: '#1d2d25', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(50);
  scene.tweens.add({ targets: text, y: text.y - 20, alpha: 0, duration: 950, onComplete: () => text.destroy() });
  if (!restored) return false;
  updatePotionHeld(scene);
  scene.updateInventoryList(); scene.updateHotbarState();
  scene.updatePlayerHeadHealth(); updatePlayerHealth(scene); scene.updateHealthHud();
  return true;
}
