import { showNpcDialogue } from './dialogue.js';
import { buyHelmet } from './armor.js';
import { drawShopBuilding } from './shop-art.js';
import { EXTRA_GEAR, buyGear } from './gear.js';
import { CONSUMABLES, buyConsumable } from './consumables.js';

function openShop(scene, owner) {
  showNpcDialogue(scene, 'Fekete Fasz', 'Bine ai venit la Mozaic! Eu sunt Fekete Fasz. Aici găsești echipament bun pentru drumuri grele.');
  scene.dialogBox.querySelector('.npc-dialog-kicker').textContent = 'MOZAIC · FEKETE FASZ';
  scene.dialogBox.classList.add('shop-modal');
  const panel = document.createElement('div'); panel.className = 'shop-offer';
  panel.innerHTML = '<header class="shop-catalog-header"><span>ECHIPAMENT & PROVIZII</span><strong class="shop-wallet"></strong></header><div class="shop-catalog" tabindex="0" aria-label="Produsele magazinului"></div><p class="shop-status" role="status"></p>';
  scene.dialogBox.querySelector('.shop-offer')?.remove();
  scene.dialogOkButton.before(panel);
  const render = () => {
    panel.querySelector('.shop-wallet').textContent = `${owner.gold} GOLD`;
    const helmet = { type: 'helmet', name: 'Cască de fier', price: 200, stat: '+5 puncte de armură', description: 'Absoarbe primele 5 puncte de damage înainte să-ți scadă viața.', details: ['Se echipează în slotul de cască.', 'Armura consumată nu se reface prin reechipare.'], icon: 'helmet-icon' };
    const products = [helmet, ...(owner.currentLevel === 2 ? [...Object.values(EXTRA_GEAR), ...Object.values(CONSUMABLES)] : [])].filter((item) => CONSUMABLES[item.type] || (item.type === 'helmet' ? !(owner.shopHelmetSold || owner.equippedHelmet || owner.inventory.some(({ type }) => type === 'helmet')) : !owner.shopGearSold?.[item.type]));
    const catalog = panel.querySelector('.shop-catalog');
    catalog.innerHTML = products.length ? products.map((item) => `<article class="shop-product"><div class="shop-product-art"><span class="${item.icon}">${item.type === 'revival-beer' ? '🍺' : item.type === 'health-potion' ? '+' : ''}</span><span class="shop-item-rarity">${CONSUMABLES[item.type] ? 'CONSUMABIL' : 'ECHIPAMENT'}</span></div><div class="shop-product-details"><small>MOZAIC · ${CONSUMABLES[item.type] ? 'CONSUMABILE' : 'ECHIPAMENT'}</small><h3>${item.name}</h3><span class="shop-stat">◆ ${item.stat}</span><p>${item.description}</p><ul>${item.details.map((detail) => `<li>${detail}</li>`).join('')}</ul><footer><strong>${item.price} <small>GOLD</small></strong><button type="button" data-buy="${item.type}">Cumpără</button></footer></div></article>`).join('') : '<div class="shop-empty"><span>◇</span><strong>Marfa s-a vândut!</strong><p>Ai cumpărat toate produsele disponibile.</p></div>';
    catalog.querySelectorAll('[data-buy]').forEach((button) => button.addEventListener('click', () => {
      panel.querySelector('.shop-status').textContent = CONSUMABLES[button.dataset.buy] ? buyConsumable(owner, button.dataset.buy) : button.dataset.buy === 'helmet' ? buyHelmet(owner) : buyGear(owner, button.dataset.buy);
      render();
    }));
  };
  render();
  scene.dialogOkButton.addEventListener('click', () => { panel.remove(); scene.dialogBox.classList.remove('shop-modal'); }, { once: true });
}

export function createShop(scene, owner = scene) {
  scene.openNearbyShop = () => openShop(scene, owner);
  const stall = scene.add.graphics();
  drawShopBuilding(stall);
  const label = scene.add.text(0, 0, 'MOZAIC', { fontFamily: 'Georgia', fontSize: '11px', fontStyle: 'bold', color: '#ffe4a3', stroke: '#282520', strokeThickness: 3 }).setOrigin(0.5);
  const merchantName = scene.add.text(0, 0, 'Fekete Fasz', { fontFamily: 'Arial', fontSize: '9px', color: '#e7dbf5', stroke: '#282520', strokeThickness: 3 }).setOrigin(0.5);
  const marker = scene.add.text(0, 0, '!', { fontSize: '12px', color: '#ffe4a3', stroke: '#282520', strokeThickness: 3 }).setOrigin(0.5);
  const zone = scene.add.zone(0, 0, 196, 160).setInteractive({ useHandCursor: true });
  const footprint = scene.add.zone(0, 0, 156, 60);
  scene.shopFootprint = footprint;
  scene.physics.add.existing(footprint, true);
  scene.physics.add.collider(scene.player, footprint, null, () => stall.visible);
  const update = () => {
    const interior = scene !== owner;
    const [x, y] = interior ? [790, 210] : owner.currentLevel === 2 ? [540, 570] : owner.bossRoomActive ? [1040, 485] : [850, 400];
    const scale = interior || owner.bossRoomActive ? 0.65 : 1;
    const visible = interior || (!owner.tavernActive && !owner.bossRoomActive);
    scene.shopLocation = { x, y, visible };
    stall.setPosition(x, y).setScale(scale).setDepth(10 + y / 100).setVisible(visible);
    label.setPosition(x, y - 80 * scale).setFontSize(`${9 * scale}px`).setDepth(stall.depth + 0.1).setVisible(visible);
    merchantName.setPosition(x, y - 70 * scale).setFontSize(`${9 * scale}px`).setDepth(stall.depth + 0.2).setVisible(visible);
    marker.setPosition(x, y - 166 * scale).setDepth(30).setVisible(visible);
    zone.setPosition(x, y - 75 * scale).setScale(scale);
    footprint.setPosition(x, y - 25 * scale).setScale(scale);
    footprint.body.updateFromGameObject(); footprint.body.enable = visible;
  };
  zone.on('pointerdown', (pointer) => {
    if (pointer.rightButtonDown()) return;
    if (!stall.visible || owner.menuOpen || scene.npcDialogueOpen || owner.gameOver || owner.bookOpen || owner.chapterDialogueOpen || owner.levelTransitioning || owner.inventoryUi && !owner.inventoryUi.classList.contains('hidden') || owner.introOverlay && !owner.introOverlay.classList.contains('hidden')) return;
    openShop(scene, owner);
  });
  scene.events.on('update', update); update();
  scene.events.once('shutdown', () => scene.events.off('update', update));
}
