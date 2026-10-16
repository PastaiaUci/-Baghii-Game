import { createMountainPortal } from './mountain-portal.js';

export function startLuisQuest(scene) {
  if (scene.luisQuest) return;
  const owned = scene.inventory?.find(({ type }) => type === 'gold-medallion')?.quantity || 0;
  scene.luisQuest = { status: 'active', count: Math.min(3, owned) };
  scene.luisMedallions ||= [];
  updateLuisQuestHint(scene);
}

export function updateLuisQuestHint(scene) {
  const quest = scene.luisQuest;
  if (!quest || quest.status === 'completed') return;
  scene.setQuest('Cele 3 medalioane de aur', quest.count < 3 ? 'Sparge pietrele cu aură: 50% șansă de medalion. Adu-i lui Luis 3 medalioane. Spargerea pietrei elimină mobii ei.' : 'Ai toate medalioanele. Întoarce-te la Împăratul Luis al XIV-lea.', `${quest.count}/3 medalioane`);
}

export function collectLuisMedallion(scene, drop) {
  if (drop.collected) return false;
  let stack = scene.inventory.find(({ type }) => type === 'gold-medallion');
  if (!stack) {
    const slot = scene.inventory.findIndex(({ type }) => type === 'empty');
    if (slot < 0) {
      scene.setQuest('Inventarul este plin', 'Eliberează un slot pentru medalioanele lui Luis.');
      return false;
    }
    stack = { type: 'gold-medallion', label: 'Medalioane de aur · Pentru Luis', key: String(slot + 1), quantity: 0 };
    scene.inventory[slot] = stack;
  }
  stack.quantity += 1;
  stack.label = `Medalioane de aur ×${stack.quantity} · Pentru Luis`;
  if (scene.luisQuest?.status === 'active') scene.luisQuest.count = Math.min(3, stack.quantity);
  drop.collected = true;
  scene.tweens.killTweensOf(drop.sprite); drop.sprite.destroy(); drop.glow.destroy();
  scene.updateInventoryList(); scene.updateHotbarState(); updateLuisQuestHint(scene);
  return true;
}

export function clickMedallion(scene, point) {
  if (scene.currentLevel !== 2) return false;
  const drop = scene.luisMedallions?.find((item) => !item.collected && Math.hypot(point.x - item.sprite.x, point.y - item.sprite.y) < 22);
  if (!drop) return false;
  if (Math.hypot(scene.player.x - drop.sprite.x, scene.player.y - drop.sprite.y) <= 65) collectLuisMedallion(scene, drop);
  return true;
}

export function pickupNearbyMedallion(scene) {
  const drop = scene.currentLevel === 2 && scene.luisMedallions?.find((item) => !item.collected && Math.hypot(scene.player.x - item.sprite.x, scene.player.y - item.sprite.y) <= 55);
  return drop ? collectLuisMedallion(scene, drop) : false;
}

export function completeLuisQuest(scene) {
  if (scene.luisQuest?.status !== 'active' || scene.luisQuest.count < 3) return false;
  const slot = scene.inventory.findIndex(({ type, quantity }) => type === 'gold-medallion' && quantity >= 3);
  if (slot < 0) return false;
  if (scene.inventory[slot].quantity > 3) scene.inventory[slot].quantity -= 3;
  else scene.inventory[slot] = { type: 'empty', label: `Slot ${slot + 1}`, key: String(slot + 1) };
  scene.luisQuest.status = 'completed';
  if (scene.inventory[slot].type === 'gold-medallion') scene.inventory[slot].label = `Medalioane de aur ×${scene.inventory[slot].quantity}`;
  scene.updateInventoryList(); scene.updateHotbarState();
  return true;
}

export function revealBobitaTrail(scene) {
  if (scene.bobitaTrail) return;
  const g = scene.add.graphics().setDepth(1.5);
  const points = [[930, 610], [810, 610], [805, 480], [800, 330]];
  for (let i = 1; i < points.length; i += 1) {
    const [x, y] = points[i - 1], [tx, ty] = points[i];
    const length = Math.hypot(tx - x, ty - y);
    for (let step = 0; step < length; step += 17) {
      const t = step / length;
      g.fillStyle(0xe3b85a, 0.85).fillEllipse(x + (tx - x) * t - 3, y + (ty - y) * t, 4, 7);
      g.fillStyle(0xe3b85a, 0.65).fillEllipse(x + (tx - x) * t + 4, y + (ty - y) * t + 6, 4, 7);
    }
  }
  scene.add.text(800, 310, '↑ Pe aici a urcat Bobiță', { fontFamily: 'Arial', fontSize: '12px', color: '#ffe6a3', stroke: '#344756', strokeThickness: 3 }).setOrigin(0.5).setDepth(30);
  scene.bobitaTrail = g;
  createMountainPortal(scene);
  scene.setQuest('Traseul lui Bobiță', 'Urmează urmele aurii până la portalul din trecătoarea de nord. Portalul este momentan inactiv.');
}
