import { storePartyTete } from './party-storage.js';
import { addConsumable, consumeOne } from './consumables.js';

export function damagePartyTete(scene, amount) {
  if (!scene.partyTete?.active || scene.partyTeteSleeping || scene.partyTeteHealth <= 0) return false;
  scene.partyTeteHealth = Math.max(0, scene.partyTeteHealth - amount);
  if (scene.partyHud) scene.partyHud.querySelector('span').textContent = `${scene.partyTeteHealth}/25 HP · Te urmează`;
  if (!scene.partyTeteHealth) {
    // Reserve an overflow slot if necessary: the companion must never be lost.
    if (!scene.inventory.some(({ type }) => type === 'empty')) {
      const index = scene.inventory.length;
      scene.inventory.push({ type: 'empty', label: `Slot ${index + 1}`, key: String(index + 1) });
    }
    storePartyTete(scene);
    const item = scene.inventory.find(({ type }) => type === 'party-tete');
    item.label = 'Tete · 0/25 HP · Are nevoie de bere pentru a fi înviat';
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
  if (scene.partyHud) scene.partyHud.querySelector('span').textContent = `${scene.partyTeteHealth}/25 HP · Te urmează`;
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
