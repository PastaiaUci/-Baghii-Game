import { grantStatPoints } from './character-stats.js';
import { playLevelUp } from './level-up-effect.js';

export function initializeLevel(scene) {
  scene.characterLevel ??= 1;
  scene.characterXp ??= 0;
}

export function xpForNextLevel(level) { return 100 + (level - 1) * 50; }

export function grantXp(scene, amount) {
  if (!Number.isSafeInteger(amount) || amount <= 0) return 0;
  initializeLevel(scene);
  scene.characterXp += amount;
  let gained = 0;
  while (scene.characterXp >= xpForNextLevel(scene.characterLevel)) {
    scene.characterXp -= xpForNextLevel(scene.characterLevel);
    scene.characterLevel++; gained++;
    grantStatPoints(scene, 2);
  }
  scene.refreshXpUi?.(gained);
  scene.refreshStatsUi?.();
  if (gained) playLevelUp(scene, gained);
  return gained;
}

export function awardEnemyXp(scene, enemy, amount) {
  if (!enemy || enemy.xpAwarded) return false;
  enemy.xpAwarded = true;
  grantXp(scene.farm || scene, amount);
  return true;
}

export function characterName(scene) {
  initializeLevel(scene);
  return `Lv. ${scene.characterLevel} · Gdolf`;
}

export function createInteriorName(scene) {
  const label = scene.add.text(0, 0, '', { fontFamily: 'Arial', fontSize: '9px', color: '#f5e5b7', stroke: '#20252b', strokeThickness: 3 }).setOrigin(0.5).setDepth(31);
  const update = () => label.setPosition(scene.player.x, scene.player.y - 27).setText(characterName(scene.farm));
  update(); scene.events.on('update', update);
  scene.events.once('shutdown', () => scene.events.off('update', update));
}

export function installXpHud(scene) {
  initializeLevel(scene);
  const hud = document.createElement('div'); hud.className = 'xp-hud';
  hud.innerHTML = '<div class="xp-heading"><strong></strong><span></span></div><div class="xp-track"><div class="xp-fill"></div></div><small class="xp-level-message" role="status"></small>';
  document.body.appendChild(hud);
  scene.refreshXpUi = (gained = 0) => {
    hud.querySelector('strong').textContent = `Gdolf · Lv. ${scene.characterLevel}`;
    hud.querySelector('span').textContent = `${scene.characterXp} / ${xpForNextLevel(scene.characterLevel)} XP`;
    hud.querySelector('.xp-fill').style.width = `${scene.characterXp / xpForNextLevel(scene.characterLevel) * 100}%`;
    if (gained) {
      hud.querySelector('small').textContent = `Nivel nou! +${gained * 2} puncte de status`;
      hud.classList.remove('xp-level-up'); void hud.offsetWidth; hud.classList.add('xp-level-up');
    }
  };
  scene.refreshXpUi();
  scene.events.once('shutdown', () => hud.remove());
}
