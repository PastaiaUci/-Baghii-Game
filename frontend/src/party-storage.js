export function storePartyTete(scene) {
  if (!scene.partyTete || scene.partyTeteSleeping) return false;
  scene.partyTeteSleeping = true;
  scene.partyTete.setVelocity(0, 0).disableBody(true, true);
  scene.partyLabel.setVisible(false); scene.partyShadow.setVisible(false);
  scene.partyHealthBar?.setVisible(false); scene.partyBurp?.setVisible(false);
  updatePartyHud(scene);
  scene.partyPath = [];
  scene.updateInventoryList(); scene.updateHotbarState();
  return true;
}

export function installPartySleepButton(scene, hud) {
  const button = hud.querySelector('.party-sleep');
  const feedback = hud.querySelector('.party-feedback');
  const portrait = hud.querySelector('.party-portrait');
  hud.addEventListener('click', (event) => {
    event.stopPropagation();
    button.hidden = !button.hidden;
    portrait.setAttribute('aria-expanded', String(!button.hidden));
    feedback.textContent = '';
    updatePartyHud(scene);
  });
  hud.addEventListener('keydown', (event) => {
    if (event.target !== hud || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault(); hud.click();
  });
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    const house = scene.activeHouse;
    if (scene.npcDialogueOpen || house?.npcDialogueOpen || house?.dead || scene.chapterDialogueOpen || scene.levelTransitioning || scene.gameOver || scene.menuOpen || scene.statsOpen || scene.bookOpen) return;
    const success = scene.partyTeteSleeping ? deployPartyTete(scene) : storePartyTete(scene);
    feedback.textContent = success ? '' : scene.partyTeteHealth <= 0 ? 'Tete are nevoie de bere pentru a fi înviat.' : 'Nu este loc lângă tine pentru Summon.';
    if (success) { button.hidden = true; portrait.setAttribute('aria-expanded', 'false'); }
  });
}

export function updatePartyHud(scene) {
  const hud = scene.partyHud;
  if (!hud?.querySelector) return;
  hud.hidden = false;
  const button = hud.querySelector('.party-sleep');
  if (button) button.textContent = scene.partyTeteSleeping ? 'Summon' : 'La somn';
  hud.querySelector('span').textContent = `${scene.partyTeteHealth}/25 HP · ${scene.partyTeteSleeping ? 'La somn' : 'Te urmează'}`;
  hud.classList?.toggle('party-sleeping', Boolean(scene.partyTeteSleeping));
  const low = scene.partyTeteHealth > 0 && scene.partyTeteHealth <= 8;
  hud.classList?.toggle('party-low-health', low);
  const warning = hud.querySelector('.party-danger');
  if (warning) { warning.hidden = !low && scene.partyTeteHealth > 0; warning.textContent = scene.partyTeteHealth <= 0 ? 'Tete a căzut · Dă-i bere!' : 'Viață mică · Dă-i bere!'; }
}

export function deployPartyTete(scene, item) {
  const slot = scene.inventory.indexOf(item);
  if ((item && (slot < 0 || item.type !== 'party-tete')) || !scene.partyTeteSleeping || !scene.partyTete) return false;
  if (scene.partyTeteHealth <= 0) {
    const help = scene.inventoryUi?.querySelector('.inventory-help');
    if (help) help.textContent = 'Tete are 0 HP. Folosește o bere din inventar pentru a-l învia, apoi cheamă-l din nou.';
    return false;
  }
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
  if (slot >= 0) scene.inventory[slot] = { type: 'empty', label: `Slot ${slot + 1}`, key: String(slot + 1) };
  scene.partyLabel.setVisible(true); scene.partyShadow.setVisible(true);
  scene.partyHealthBar?.setVisible(true);
  updatePartyHud(scene);
  scene.partyNextPathAt = 0; scene.partyPath = [];
  scene.updateInventoryList(); scene.updateHotbarState();
  return true;
}
