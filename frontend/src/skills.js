import { getSelectedItem } from './inventory.js';
import { spellDamage } from './character-stats.js';

export function mountSkillButton(scene, button) {
  (scene.skillbarSlots || document.body).appendChild(button);
}

export function hasSwordInHand(scene) {
  return getSelectedItem(scene)?.type === 'sword';
}

export function swordAuraBonus(scene, target) {
  if (!hasSwordInHand(scene) || scene.time.now >= scene.swordAuraSkill.until) return 0;
  return spellDamage(scene, target === 'boss' ? 2 : 1);
}

export class SwordAuraSkill {
  constructor() { this.until = 0; this.readyAt = 0; }
  activate(now, equipped) {
    if (!equipped || now < this.readyAt) return false;
    this.until = now + 5000;
    this.readyAt = now + 15000;
    return true;
  }
}

export function createSkillbar(scene) {
  const bar = document.createElement('div');
  bar.className = 'skillbar';
  bar.innerHTML = '<span class="skillbar-label">ABILITĂȚI</span><div class="skillbar-slots"></div>';
  document.body.appendChild(bar);
  scene.skillbarSlots = bar.querySelector('.skillbar-slots');
  scene.events.once('shutdown', () => bar.remove());
}

export function createSwordAura(scene) {
  scene.swordAuraSkill = new SwordAuraSkill();
  scene.swordAura = scene.add.graphics().setVisible(false);
  const button = document.createElement('button');
  button.className = 'rush-skill sword-aura-skill';
  button.type = 'button';
  button.title = 'F · Aura Sabiei: 5 secunde, +1 damage la săteni / +2 la boss. Necesită sabia echipată. Cooldown: 15 secunde.';
  button.innerHTML = '<span class="rush-key">F</span><span>Aura Sabiei</span><span class="rush-status">Echipează sabia</span>';
  button.addEventListener('pointerdown', (event) => event.stopPropagation());
  button.addEventListener('click', () => activateSwordAura(scene));
  mountSkillButton(scene, button);
  scene.swordAuraButton = button;
  scene.swordAuraStatus = button.querySelector('.rush-status');
}

export function activateSwordAura(scene) {
  if (scene.houseActive && scene.activeHouse) return activateSwordAura(scene.activeHouse);
  if (scene.menuOpen || scene.tavernActive || scene.gameOver || scene.bookOpen || scene.npcDialogueOpen || scene.chapterDialogueOpen || scene.levelTransitioning || !scene.introOverlay.classList.contains('hidden') || !scene.inventoryUi.classList.contains('hidden')) return false;
  return scene.swordAuraSkill.activate(scene.time.now, hasSwordInHand(scene));
}

export function updateSwordAura(scene) {
  const now = scene.time.now;
  const skill = scene.swordAuraSkill;
  const equipped = hasSwordInHand(scene);
  const active = !scene.gameOver && now < skill.until;
  const cooldown = Math.ceil(Math.max(0, skill.readyAt - now) / 1000);
  scene.swordAuraButton.disabled = scene.gameOver || cooldown > 0 || !equipped;
  scene.swordAuraButton.classList.toggle('active', active);
  scene.swordAuraStatus.textContent = active ? `Activ ${Math.ceil((skill.until - now) / 1000)}s` :
    cooldown ? `${cooldown}s` : equipped ? 'Pregătit' : 'Echipează sabia';
  const aura = scene.swordAura;
  aura.setVisible(active && equipped && scene.playerWeapon.visible);
  if (!active || !equipped) return;
  const sword = scene.playerWeapon;
  aura.clear().setPosition(sword.x, sword.y).setRotation(sword.rotation).setScale(sword.scaleX, sword.scaleY).setDepth(sword.depth + 0.005);
  const pulse = 0.6 + Math.sin(now / 90) * 0.15;
  aura.fillStyle(0x56dfff, 0.14).fillEllipse(0, -25, 21, 48);
  aura.lineStyle(7, 0x58cfff, 0.15).lineBetween(0, -41, 0, -6);
  aura.lineStyle(3, 0xffcf75, pulse).lineBetween(-3, -40, -3, -8);
  aura.lineBetween(3, -40, 3, -8);
  aura.lineStyle(1, 0xfff6cb, 0.9).lineBetween(0, -42, 0, -7);
  for (let i = 0; i < 12; i += 1) {
    const progress = (now / 550 + i / 12) % 1;
    const y = -7 - progress * 39;
    const x = Math.sin(now / 110 + i * 1.7) * (3 + (1 - progress) * 5);
    aura.fillStyle(i % 3 ? 0xffd884 : 0x9aeaff, (1 - progress) * 0.85);
    aura.fillTriangle(x - 2, y + 5, x + 2, y + 5, x + Math.sin(i) * 3, y - 5);
  }
}
