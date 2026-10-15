import { mountSkillButton } from './skills.js';

export class AreaSkill {
  constructor() { this.until = 0; this.readyAt = 0; this.nextTick = 0; }
  activate(now) {
    if (now < this.readyAt) return false;
    this.until = now + 3000;
    this.readyAt = now + 12000;
    this.nextTick = now;
    return true;
  }
  tick(now) {
    if (now >= this.until || now < this.nextTick) return false;
    this.nextTick = now + 500;
    return true;
  }
}

export function slowMultiplier(enemy, now) {
  return now < (enemy.slowUntil || 0) ? 0.5 : 1;
}

function usable(scene) {
  return !scene.gameOver && !scene.bookOpen && !scene.npcDialogueOpen && !scene.chapterDialogueOpen && !scene.levelTransitioning && scene.introOverlay.classList.contains('hidden') && scene.inventoryUi.classList.contains('hidden');
}

function nearbyEnemies(scene, radius) {
  const enemies = scene.bossFightActive && scene.boss ? [scene.boss] :
    scene.bossRoomActive ? [] : scene.npcs.filter(({ alive }) => alive).map(({ npc }) => npc);
  return enemies.filter((enemy) => Math.hypot(enemy.x - scene.player.x, enemy.y - scene.player.y) <= radius);
}

export function createRewardSystem(scene) {
  scene.deathBreath = new AreaSkill();
  scene.rewardAura = scene.add.graphics().setDepth(26).setVisible(false);
  scene.flashlightReadyAt = 0;
  const g = scene.make.graphics();
  // A compact dark sleeve with a soft pink inset, drawn as a stylized item icon.
  g.fillStyle(0x242735).fillRoundedRect(3, 5, 19, 29, 6);
  g.fillStyle(0x626779).fillRoundedRect(6, 10, 4, 19, 2);
  g.fillStyle(0x151722).fillEllipse(12.5, 7, 19, 11);
  g.fillStyle(0xd69fac).fillEllipse(12.5, 7, 14, 8);
  g.fillStyle(0x754757).fillEllipse(12.5, 7, 5, 4);
  g.fillStyle(0x858a98).fillRect(6, 29, 13, 2);
  g.generateTexture('flashlight-item', 26, 38);
  g.destroy();
  scene.flashlightHeld = scene.add.image(0, 0, 'flashlight-item').setScale(0.7).setVisible(false);
  scene.events.once('shutdown', () => {
    scene.deathBreathButton?.remove();
    scene.flashlightButton?.remove();
  });
}

export function grantBossReward(scene, type) {
  if (type === 'beer') {
    scene.hasDeathBreath = true;
    const button = document.createElement('button');
    button.className = 'rush-skill death-breath-skill';
    button.type = 'button';
    button.innerHTML = '<span class="rush-key">R</span><span>Death Breath</span><span class="rush-status">Pregătit</span>';
    button.title = 'R · Damage în jurul tău timp de 3 secunde. Cooldown: 12 secunde.';
    button.addEventListener('pointerdown', (event) => event.stopPropagation());
    button.addEventListener('click', () => activateDeathBreath(scene));
    mountSkillButton(scene, button);
    scene.deathBreathButton = button;
    scene.deathBreathStatus = button.querySelector('.rush-status');
    scene.setQuest('Death Breath deblocat', 'Apasă R: damage în jurul tău timp de 3 secunde.');
  } else {
    const slot = scene.inventory.findIndex((item) => item.type === 'empty');
    scene.inventory[slot] = { type: 'flashlight', label: 'Flashlight · click: slow 50% pentru 4 secunde', key: String(slot + 1) };
    scene.updateInventoryList();
    scene.updateHotbarState();
    scene.selectWeapon(`slot-${slot + 1}`);
    const button = document.createElement('button');
    button.className = 'rush-skill flashlight-skill';
    button.type = 'button';
    button.innerHTML = '<span class="flashlight-icon"></span><span>Flashlight</span><span class="rush-status">Pregătit</span>';
    button.title = 'Slow 50% pentru 4 secunde în jurul tău. Cooldown: 10 secunde.';
    button.addEventListener('pointerdown', (event) => event.stopPropagation());
    button.addEventListener('click', () => activateFlashlight(scene));
    mountSkillButton(scene, button);
    scene.flashlightButton = button;
    scene.flashlightStatus = button.querySelector('.rush-status');
    scene.setQuest('Flashlight primit', `Slot ${slot + 1} · Click: încetinește inamicii din jur cu 50% pentru 4 secunde.`);
  }
}

export function activateDeathBreath(scene) {
  if (!scene.hasDeathBreath || !usable(scene)) return false;
  return scene.deathBreath.activate(scene.time.now);
}

export function activateFlashlight(scene) {
  if (!scene.inventory.some(({ type }) => type === 'flashlight') || !usable(scene) || scene.time.now < scene.flashlightReadyAt) return false;
  scene.flashlightReadyAt = scene.time.now + 10000;
  nearbyEnemies(scene, 150).forEach((enemy) => { enemy.slowUntil = scene.time.now + 4000; });
  scene.slowVisualUntil = scene.time.now + 700;
  return true;
}

export function updateRewards(scene) {
  const now = scene.time.now;
  const active = !scene.gameOver && now < scene.deathBreath.until;
  if (active && scene.deathBreath.tick(now)) {
    nearbyEnemies(scene, 130).forEach((enemy) => {
      if (enemy === scene.boss) scene.damageBoss(1);
      else scene.damageVillager(scene.npcs.find(({ npc }) => npc === enemy), 1);
    });
  }
  if (scene.deathBreathButton) {
    const seconds = Math.ceil(Math.max(0, scene.deathBreath.readyAt - now) / 1000);
    scene.deathBreathStatus.textContent = active ? `Activ ${Math.ceil((scene.deathBreath.until - now) / 1000)}s` : seconds ? `${seconds}s` : 'Pregătit';
    scene.deathBreathButton.disabled = scene.gameOver || seconds > 0;
    scene.deathBreathButton.classList.toggle('active', active);
  }
  if (scene.flashlightButton) {
    const seconds = Math.ceil(Math.max(0, scene.flashlightReadyAt - now) / 1000);
    scene.flashlightStatus.textContent = seconds ? `${seconds}s` : 'Pregătit';
    scene.flashlightButton.disabled = scene.gameOver || seconds > 0;
  }
  const aura = scene.rewardAura;
  const slow = now < (scene.slowVisualUntil || 0);
  aura.setVisible(active || slow);
  if (active || slow) {
    aura.clear().setPosition(scene.player.x, scene.player.y + 12).setDepth(scene.player.depth + 0.015);
    aura.fillStyle(active ? 0x82c65b : 0xdcc8f4, 0.12).fillEllipse(0, 0, active ? 260 : 300, 120);
    aura.lineStyle(2, active ? 0xc9ed7e : 0xf1e6ff, 0.55).strokeEllipse(0, 0, active ? 260 : 300, 120);
    for (let i = 0; i < 16; i += 1) {
      const angle = now / 650 + i * Math.PI / 8;
      const radius = 40 + (i % 4) * 22;
      aura.fillStyle(active ? 0x9bca63 : 0xe9d8ff, 0.3).fillCircle(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.45 - 12, 5 + i % 3);
    }
  }
  const selected = scene.inventory[Number(scene.selectedWeapon.replace('slot-', '')) - 1];
  const held = scene.flashlightHeld;
  held.setVisible(selected?.type === 'flashlight');
  held.setPosition(scene.player.x + 16, scene.player.y + 7).setDepth(scene.player.depth + 0.025);
}
