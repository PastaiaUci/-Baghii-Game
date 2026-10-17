import { rescueHint } from './mountain-rescue.js';
import { getSelectedItem } from './inventory.js';

export const SLEIGH = { x: 435, y: 790 };
export function startFirewoodQuest(farm) {
  if (farm.mountainRescue?.status !== 'delivered') return null;
  return farm.mountainRescue.firewood ||= { stage: 'needed', hp: 4 };
}
export function chopSleigh(farm, x, y, damage) {
  const q = farm.mountainRescue?.firewood;
  if (q?.stage !== 'needed' || getSelectedItem(farm)?.type !== 'sword' || damage <= 0) return false;
  const dx = SLEIGH.x - farm.player.x, dy = SLEIGH.y - farm.player.y;
  const ax = x - farm.player.x, ay = y - farm.player.y, len = Math.hypot(ax, ay) || 1;
  if (Math.hypot(dx, dy) > 85 || (dx * ax + dy * ay) / len < -8) return false;
  q.hp = Math.max(0, q.hp - damage);
  if (!q.hp) q.stage = 'chopped';
  rescueHint(farm); farm.saveProgress?.(); return true;
}
export function collectFirewood(farm) {
  const q = farm.mountainRescue?.firewood;
  if (q?.stage !== 'chopped' || Math.hypot(farm.player.x - SLEIGH.x, farm.player.y - SLEIGH.y) > 85) return false;
  const slot = farm.inventory.findIndex(({ type }) => type === 'empty');
  if (slot < 0) { farm.setQuest('Inventarul este plin', 'Eliberează un slot pentru lemnele lui F0ngel.'); return true; }
  farm.inventory[slot] = { type: 'firewood', label: 'Lemne de foc ×3 · Pentru F0ngel', key: String(slot + 1), quantity: 3 };
  q.stage = 'collected'; farm.updateInventoryList(); farm.updateHotbarState(); rescueHint(farm); farm.saveProgress?.(); return true;
}
export function deliverFirewood(farm) {
  const q = farm.mountainRescue?.firewood;
  if (q?.stage !== 'collected') return false;
  const slot = farm.inventory.findIndex(({ type, quantity }) => type === 'firewood' && quantity >= 3);
  if (slot < 0) return false;
  farm.inventory[slot] = { type: 'empty', label: `Slot ${slot + 1}`, key: String(slot + 1) };
  q.stage = 'burning'; farm.updateInventoryList(); farm.updateHotbarState(); rescueHint(farm); farm.saveProgress?.(); return true;
}
export function createFirewoodWorld(scene) {
  const art = scene.add.graphics().setPosition(SLEIGH.x, SLEIGH.y).setDepth(20);
  const label = scene.add.text(SLEIGH.x, SLEIGH.y - 76, '', { fontSize: '11px', color: '#ffe6b5', stroke: '#344657', strokeThickness: 3 }).setOrigin(0.5).setDepth(30);
  const update = () => {
    const q = scene.mountainRescue?.firewood, broken = q && q.stage !== 'needed';
    scene.santaSleighArt.setVisible(!broken);
    if (scene.santaSleighCollider.body) scene.santaSleighCollider.body.enable = !broken;
    label.setText(q?.stage === 'needed' ? `Sania · ${Math.ceil(q.hp)}/4 · Lovește cu sabia` : q?.stage === 'chopped' ? 'Lemne de foc ×3 · E / click' : '');
    art.clear();
    if (q?.stage === 'chopped') {
      art.fillStyle(0xffd992, 0.16).fillEllipse(0, 7, 90, 35);
      for (let i = 0; i < 3; i++) {
        const x = -25 + i * 18, y = i % 2 * 10;
        art.fillStyle(0x6c4534).fillRoundedRect(x, y, 38, 12, 4);
        art.fillStyle(0xb78351).fillRect(x + 5, y + 2, 28, 3);
        art.fillStyle(0xd9b47d).fillEllipse(x + 2, y + 6, 9, 12);
        art.lineStyle(1, 0x92613e).strokeEllipse(x + 2, y + 6, 4, 7);
      }
    }
  };
  scene.events.on('update', update); update();
  scene.events.once('shutdown', () => scene.events.off('update', update));
}
