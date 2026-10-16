export const EXTRA_GEAR = {
  'wind-boots': { type: 'wind-boots', slot: 'boots', name: 'Papuci de Vânt', price: 350, stat: '+25% viteză de mișcare', description: 'Mai ușor pe drum, mai rapid în luptă. Bonusul se combină cu Iureș.', details: ['Se echipează în slotul de cizme.', 'Bonus activ doar cât sunt echipați.'], icon: 'boots-icon' },
  shield: { type: 'shield', slot: 'shield', name: 'Scut de fier', price: 300, stat: '50 puncte de rezistență', description: 'Ține apăsat click dreapta pentru a bloca damage. La 0 rezistență, scutul se sparge și dispare.', details: ['Absoarbe până la 50 damage în total.', 'Damage-ul care depășește rezistența trece mai departe.', 'Se echipează în slotul de scut.'], icon: 'shield-icon' },
};
export function buyGear(scene, type) {
  const gear = EXTRA_GEAR[type];
  if (!gear || scene.currentLevel !== 2) return 'Acest obiect este disponibil doar în mapa 2.';
  if (scene.shopGearSold?.[type]) return 'Acest obiect a fost deja vândut.';
  if (scene.gold < gear.price) return `Ai nevoie de ${gear.price} gold.`;
  const slot = scene.inventory.findIndex(({ type }) => type === 'empty');
  if (slot < 0) return 'Inventarul este plin.';
  scene.gold -= gear.price;
  scene.shopGearSold ||= {}; scene.shopGearSold[type] = true;
  scene.inventory[slot] = { type, key: String(slot + 1), label: `${gear.name} · ${gear.stat} · Click pentru echipare`, ...(type === 'shield' ? { durability: 50 } : {}) };
  scene.updateGoldHud(); scene.updateInventoryList(); scene.updateHotbarState();
  return `Ai cumpărat ${gear.name}. Îl poți echipa din inventar.`;
}
export function toggleGear(scene, item) {
  const gear = EXTRA_GEAR[item?.type];
  if (!gear) return false;
  const property = gear.slot === 'boots' ? 'equippedBoots' : 'equippedShield';
  if (scene[property] === item) {
    const slot = scene.inventory.findIndex(({ type }) => type === 'empty');
    if (slot < 0) {
      const help = scene.inventoryUi?.querySelector('.inventory-help');
      if (help) help.textContent = 'Inventarul este plin. Eliberează un slot înainte să dezechipezi obiectul.';
      return false;
    }
    item.key = String(slot + 1); scene.inventory[slot] = item; scene[property] = null;
  } else {
    const slot = scene.inventory.indexOf(item);
    if (slot < 0 || scene[property]) return false;
    scene.inventory[slot] = { type: 'empty', label: `Slot ${slot + 1}`, key: String(slot + 1) };
    scene[property] = item;
  }
  scene.updateInventoryList(); scene.updateHotbarState(); return true;
}
export function movementMultiplier(scene) { return scene.equippedBoots ? 1.25 : 1; }
export function isShieldBlocking(scene) {
  return Boolean(scene.equippedShield?.durability > 0 && !scene.menuOpen && !scene.npcDialogueOpen && !scene.bookOpen && !scene.chapterDialogueOpen && !scene.levelTransitioning && !scene.gameOver && !scene.tavernActive &&
    (!scene.inventoryUi || scene.inventoryUi.classList.contains('hidden')) && scene.input?.activePointer?.rightButtonDown());
}
export function absorbShieldDamage(scene, damage) {
  if (!isShieldBlocking(scene)) return damage;
  const shield = scene.equippedShield;
  const blocked = Math.min(damage, shield.durability);
  shield.durability -= blocked;
  if (shield.durability <= 0) {
    scene.equippedShield = null;
    scene.inventory = scene.inventory.map((item, index) => item === shield ? { type: 'empty', key: String(index + 1), label: `Slot ${index + 1}` } : item);
    scene.updateInventoryList(); scene.updateHotbarState();
  }
  return damage - blocked;
}
export function drawExtraGear(ctx, scene, x, y, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  if (scene.equippedBoots) {
    ctx.fillStyle = '#578e8e'; ctx.fillRect(8, 34, 8, 5); ctx.fillRect(17, 34, 8, 5);
    ctx.fillStyle = '#c5e8cf'; ctx.fillRect(9, 34, 5, 1); ctx.fillRect(18, 34, 5, 1);
  }
  if (scene.equippedShield) {
    ctx.fillStyle = '#485666'; ctx.beginPath(); ctx.moveTo(1, 20); ctx.lineTo(12, 20); ctx.lineTo(11, 32); ctx.lineTo(6, 37); ctx.lineTo(2, 32); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#c3a867'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#a5b6c4'; ctx.fillRect(5, 22, 2, 10);
  }
  ctx.restore();
}
export function createGearVisual(scene, owner = scene) {
  const textureKey = `${scene.sys.settings.key}-gear-overlay`;
  if (scene.textures.exists(textureKey)) scene.textures.remove(textureKey);
  const texture = scene.textures.createCanvas(textureKey, 32, 40);
  const visual = scene.add.image(0, 0, textureKey).setVisible(false);
  const status = scene.add.text(0, 0, '', { fontSize: '8px', color: '#dee6ef', stroke: '#26313d', strokeThickness: 2 }).setOrigin(0.5).setDepth(31);
  const update = () => {
    const player = scene.player;
    const visible = Boolean(player?.visible && !scene.tavernActive);
    const ctx = texture.getContext(); ctx.clearRect(0, 0, 32, 40); drawExtraGear(ctx, owner, 0, 0); texture.refresh();
    visual.setVisible(visible && Boolean(owner.equippedBoots || owner.equippedShield));
    if (!player) return;
    const blocking = isShieldBlocking(owner);
    visual.setPosition(player.x + (blocking ? 4 : 0), player.y).setDepth(player.depth + 0.06);
    status.setVisible(visible && Boolean(owner.equippedShield)).setPosition(player.x - 13, player.y + 22).setText(`◆ ${owner.equippedShield?.durability || 0}/50${blocking ? ' · BLOC' : ''}`);
  };
  scene.events.on('postupdate', update);
  scene.events.once('shutdown', () => scene.events.off('postupdate', update));
}
