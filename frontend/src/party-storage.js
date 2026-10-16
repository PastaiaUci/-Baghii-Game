import { showNpcDialogue, hideNpcDialogue } from './dialogue.js';

export function storePartyTete(scene) {
  if (!scene.partyTete || scene.partyTeteSleeping) return false;
  const slot = scene.inventory.findIndex(({ type }) => type === 'empty');
  if (slot < 0) return false;
  scene.inventory[slot] = { type: 'party-tete', label: 'Tete · La somn · Click pentru a-l chema', key: String(slot + 1) };
  scene.partyTeteSleeping = true;
  scene.partyTete.setVelocity(0, 0).disableBody(true, true);
  scene.partyLabel.setVisible(false); scene.partyShadow.setVisible(false);
  scene.partyHealthBar?.setVisible(false); scene.partyBurp?.setVisible(false);
  if (scene.partyHud) scene.partyHud.hidden = true;
  scene.partyPath = [];
  scene.updateInventoryList(); scene.updateHotbarState();
  return true;
}

export function deployPartyTete(scene, item) {
  const slot = scene.inventory.indexOf(item);
  if (slot < 0 || item?.type !== 'party-tete' || !scene.partyTeteSleeping || !scene.partyTete) return false;
  const bounds = scene.physics.world.bounds;
  const solids = (scene.level2Solids || scene.arenaSolids).getChildren().map(({ body }) => body).filter(Boolean);
  let position;
  // Find a clear footprint beside the player rather than spawning inside a wall.
  for (const radius of [45, 65, 85, 105]) {
    for (let step = 0; step < 12; step += 1) {
      const angle = step * Math.PI / 6;
      const x = scene.player.x + Math.cos(angle) * radius;
      const y = scene.player.y + Math.sin(angle) * radius;
      if (x < bounds.x + 30 || x > bounds.x + bounds.width - 30 || y < bounds.y + 40 || y > bounds.y + bounds.height - 40) continue;
      if (solids.some((b) => x > b.left - 25 && x < b.right + 25 && y > b.top - 35 && y < b.bottom + 35)) continue;
      position = { x, y }; break;
    }
    if (position) break;
  }
  if (!position) return false;
  scene.partyTete.enableBody(true, position.x, position.y, true, true).setVelocity(0, 0);
  scene.partyTeteSleeping = false;
  scene.inventory[slot] = { type: 'empty', label: `Slot ${slot + 1}`, key: String(slot + 1) };
  scene.partyLabel.setVisible(true); scene.partyShadow.setVisible(true);
  scene.partyHealthBar?.setVisible(true);
  if (scene.partyHud) scene.partyHud.hidden = false;
  scene.partyNextPathAt = 0; scene.partyPath = [];
  scene.updateInventoryList(); scene.updateHotbarState();
  return true;
}

export function clickPartyTete(scene, point) {
  const npc = scene.partyTete;
  if (!npc?.active || !npc.visible || scene.partyTeteSleeping || Math.abs(point.x - npc.x) > 31 || Math.abs(point.y - npc.y) > 38) return false;
  showNpcDialogue(scene, 'Tete', `Sunt aici, Gdolf! Viață: ${scene.partyTeteHealth}/25. Dacă vrei să mă odihnesc, trimite-mă la somn.`);
  const actions = document.createElement('div'); actions.className = 'party-actions';
  const button = document.createElement('button'); button.type = 'button'; button.textContent = 'La somn';
  const feedback = document.createElement('p'); feedback.setAttribute('role', 'status');
  actions.append(button, feedback); scene.dialogOkButton.before(actions);
  button.addEventListener('click', () => {
    if (!storePartyTete(scene)) { feedback.textContent = 'Inventarul este plin. Am nevoie de un slot liber!'; return; }
    actions.remove(); hideNpcDialogue(scene);
  });
  scene.dialogOkButton.addEventListener('click', () => actions.remove(), { once: true });
  return true;
}
