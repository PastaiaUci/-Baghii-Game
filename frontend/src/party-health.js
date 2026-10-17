import { storePartyTete, updatePartyHud } from './party-storage.js';
import { addConsumable, consumeOne } from './consumables.js';
import { showDamage } from './combat-feedback.js';

export function damagePartyTete(scene, amount) {
  if (!scene.partyTete?.active || scene.partyTeteSleeping || scene.partyTeteHealth <= 0) return false;
  showDamage(scene, scene.partyTete, Math.min(amount, scene.partyTeteHealth), '#ffb0a0');
  scene.partyTeteHealth = Math.max(0, scene.partyTeteHealth - amount);
  updatePartyHud(scene);
  if (!scene.partyTeteHealth) {
    storePartyTete(scene);
    scene.partyBeerShots?.forEach(({ sprite }) => sprite.destroy()); scene.partyBeerShots = [];
    scene.updateInventoryList(); scene.updateHotbarState();
  }
  return true;
}

export function consumeRevivalBeer(scene, item) {
  const slot = scene.inventory.indexOf(item);
  if (slot < 0 || item?.type !== 'revival-beer' || !scene.partyTete || scene.partyTeteHealth >= 25) return false;
  scene.partyTeteHealth = Math.min(25, (scene.partyTeteHealth || 0) + 3);
  consumeOne(scene, slot, 'revival-beer');
  const companion = scene.inventory.find(({ type }) => type === 'party-tete');
  if (companion) companion.label = `Tete · ${scene.partyTeteHealth}/25 HP · Click pentru a-l chema`;
  updatePartyHud(scene);
  scene.updateInventoryList(); scene.updateHotbarState();
  return true;
}

export function dropRevivalBeer(scene, x, y) {
  scene.partyBeerDrops ||= [];
  const sprite = scene.add.image(x, y, 'boss-beer').setScale(0.75).setDepth(24);
  const glow = scene.add.ellipse(x, y + 9, 30, 12, 0xf4c36d, 0.3).setDepth(1);
  scene.partyBeerDrops.push({ sprite, glow });
}

export function updateRevivalBeerDrops(scene) {
  if (scene.currentLevel !== 2 || scene.npcDialogueOpen || scene.bookOpen || scene.gameOver || !scene.inventoryUi.classList.contains('hidden')) return;
  scene.partyBeerDrops = (scene.partyBeerDrops || []).filter((drop) => {
    if (Math.hypot(scene.player.x - drop.sprite.x, scene.player.y - drop.sprite.y) > 28) return true;
    if (!addConsumable(scene, 'revival-beer')) return true;
    drop.sprite.destroy(); drop.glow.destroy();
    scene.updateInventoryList(); scene.updateHotbarState();
    return false;
  });
}
