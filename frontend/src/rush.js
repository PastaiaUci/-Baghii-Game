import { mountSkillButton } from './skills.js';

export class RushSkill {
  constructor() {
    this.activeUntil = 0;
    this.readyAt = 0;
  }

  activate(now) {
    if (now < this.readyAt) return false;
    this.activeUntil = now + 5000;
    this.readyAt = now + 15000;
    return true;
  }

  state(now) {
    const active = now < this.activeUntil;
    return {
      active,
      speed: active ? 288 : 180,
      activeSeconds: Math.ceil(Math.max(0, this.activeUntil - now) / 1000),
      cooldownSeconds: Math.ceil(Math.max(0, this.readyAt - now) / 1000),
    };
  }
}

export function createRushSkill(scene) {
  scene.rushSkill = new RushSkill();
  scene.rushAura = scene.add.graphics().setVisible(false);
  const button = document.createElement('button');
  button.className = 'rush-skill';
  button.type = 'button';
  button.title = 'Q · Iureș: +60% viteză pentru 5 secunde. Cooldown: 15 secunde de la activare.';
  button.innerHTML = '<span class="rush-key">Q</span><span>Iureș</span><span class="rush-status">Pregătit</span>';
  // A skill click must not also swing the equipped weapon.
  button.addEventListener('pointerdown', (event) => event.stopPropagation());
  button.addEventListener('click', () => activateRush(scene));
  mountSkillButton(scene, button);
  scene.rushButton = button;
  scene.rushStatus = button.querySelector('.rush-status');
  scene.events.once('shutdown', () => button.remove());
}

export function activateRush(scene) {
  if (!scene.player || scene.menuOpen || scene.tavernActive || scene.gameOver || scene.bookOpen || scene.npcDialogueOpen || scene.chapterDialogueOpen || scene.levelTransitioning || !scene.introOverlay.classList.contains('hidden') ||
      !scene.inventoryUi.classList.contains('hidden')) return;
  scene.rushSkill.activate(scene.time.now);
}

export function updateRush(scene) {
  const state = scene.rushSkill.state(scene.time.now);
  const active = state.active && !scene.gameOver;
  scene.rushButton.classList.toggle('active', active);
  scene.rushButton.disabled = scene.gameOver || state.cooldownSeconds > 0;
  scene.rushStatus.textContent = active ? `Activ ${state.activeSeconds}s` :
    state.cooldownSeconds > 0 ? `${state.cooldownSeconds}s` : 'Pregătit';
  const aura = scene.rushAura;
  aura.setVisible(active);
  if (!active) return state.speed;
  aura.clear();
  aura.setPosition(scene.player.x, scene.player.y + 13);
  aura.setDepth(scene.player.depth + 0.01);
  const phase = scene.time.now / 130;
  const pulse = Math.sin(phase) * 3;
  aura.fillStyle(0xf02438, 0.12);
  aura.fillEllipse(0, -10, 56 + pulse, 64 + pulse);
  aura.fillStyle(0xe31330, 0.22);
  aura.fillEllipse(0, 2, 50 + pulse, 19);
  aura.lineStyle(2, 0xff4050, 0.8);
  aura.strokeEllipse(0, 2, 49 + pulse, 18);
  aura.lineStyle(1, 0xffac80, 0.85);
  aura.strokeEllipse(0, 2, 38 - pulse, 12);
  // Spiralling sparks rise around the character, like a red whirlwind.
  for (let i = 0; i < 12; i += 1) {
    const progress = (scene.time.now / 800 + i / 12) % 1;
    const angle = phase * 0.65 + i * 2.4;
    const radius = 21 * (1 - progress * 0.45);
    const x = Math.cos(angle) * radius;
    const y = -progress * 52 + Math.sin(angle) * 7;
    aura.lineStyle(2, i % 3 ? 0xff354a : 0xffa37b, 1 - progress * 0.7);
    aura.lineBetween(x, y, x + Math.sin(angle) * 5, y + 7);
  }
  return state.speed;
}
