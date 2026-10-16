import { getSelectedItem } from './inventory.js';

export function equipmentPanelMarkup() {
  const slot = (id, icon, label) => `<div class="equipment-slot" data-equipment="${id}" title="${label}: gol"><span class="equipment-symbol" aria-hidden="true">${icon}</span><span>${label}</span><small>Gol</small></div>`;
  return `<section class="equipment-panel" aria-label="Echipamentul lui Gdolf">
    <div class="equipment-column">${slot('helmet', '♜', 'Cască')}${slot('weapon', '⚔', 'Armă')}${slot('armor', '♙', 'Armură')}${slot('boots', '♟', 'Cizme')}</div>
    <div class="equipment-character"><span class="equipment-name">GDOLF</span><canvas width="192" height="240" aria-label="Gdolf cu echipamentul din mână"></canvas><span class="equipment-caption">Fără armă în mână</span></div>
    <div class="equipment-column">${slot('shield', '⬡', 'Scut')}${slot('necklace', '◇', 'Colier')}${slot('ring', '○', 'Inel')}${slot('pet', '♞', 'Pet')}</div>
  </section>`;
}

export function updateEquipmentPanel(scene) {
  const panel = scene.inventoryUi?.querySelector('.equipment-panel');
  if (!panel || !scene.textures.exists('player')) return;
  const swordEquipped = getSelectedItem(scene)?.type === 'sword';
  const weapon = panel.querySelector('[data-equipment="weapon"]');
  weapon.classList.toggle('equipped', swordEquipped);
  weapon.title = swordEquipped ? 'Armă: Sabie echipată' : 'Armă: gol';
  weapon.querySelector('small').textContent = swordEquipped ? 'Sabie' : 'Gol';
  panel.querySelector('.equipment-caption').textContent = swordEquipped ? 'Sabie echipată' : 'Fără armă în mână';
  const canvas = panel.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  const draw = (key, x, y, width, height) => {
    const frame = scene.textures.getFrame(key);
    ctx.drawImage(frame.source.image, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, x, y, width, height);
  };
  ctx.fillStyle = '#0005';
  ctx.beginPath(); ctx.ellipse(96, 217, 51, 10, 0, 0, Math.PI * 2); ctx.fill();
  draw('player', 32, 54, 128, 160);
  if (swordEquipped && scene.textures.exists('sword')) {
    ctx.save();
    ctx.translate(148, 165);
    ctx.rotate(0.2);
    draw('sword', -18, -100, 36, 126);
    ctx.restore();
  }
}
