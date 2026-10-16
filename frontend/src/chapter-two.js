import { createAlpineMap, createAlpineGold } from './alpine-map.js';
import { createEmperorLuis } from './emperor-luis.js';
import { createMetinStones } from './metin-stones.js';

export function showVictoryDialogue(scene) {
  scene.hidePrompt();
  scene.chapterDialogueOpen = true;
  scene.player.setVelocity(0, 0);
  scene.partyTete?.setVelocity(0, 0);
  // Let the Level 1 completion animation finish before focusing the conversation.
  scene.time.delayedCall(3200, () => {
    const overlay = document.createElement('div');
    overlay.className = 'chapter-dialogue';
    overlay.innerHTML = '<section role="dialog" aria-modal="true" aria-labelledby="victory-title"><img src="/assets/Tete.png" alt="Tete"><div><small>TETE · NOU MEMBRU ÎN PARTY</small><h2 id="victory-title">De acum mergem împreună</h2><p>M-ai învins, Gdolf! De acum sunt în party-ul tău și te voi urma în aventură.</p><p>Înainte să plecăm, poți alege unul dintre cele două lichide preferate ale mele: <strong>Bere</strong> sau <strong>Sperma</strong>. Alege unul singur.</p><button type="button">Să alegem →</button></div></section>';
    document.body.appendChild(overlay);
    const button = overlay.querySelector('button');
    button.focus();
    button.addEventListener('click', () => {
      scene.chapterDialogueOpen = false;
      overlay.remove();
    });
    scene.events.once('shutdown', () => overlay.remove());
  });
}

export function beginChapterDialogue(scene) {
  if (scene.chapterDialogueOpen || scene.chapterPortal || scene.currentLevel === 2) return;
  scene.hidePrompt();
  scene.chapterDialogueOpen = true;
  scene.player.setVelocity(0, 0);
  scene.partyTete?.setVelocity(0, 0);
  const overlay = document.createElement('div');
  overlay.className = 'chapter-dialogue';
  overlay.innerHTML = '<section role="dialog" aria-modal="true" aria-labelledby="chapter-title"><img src="/assets/Gdolf.png" alt="Gdolf"><div><small>GDOLF · GÂNDURI</small><h2 id="chapter-title">Pe urmele lui Bobiță</h2><p>Am aflat ce s-a întâmplat cu Bobiță… Mr. Grain s-a supărat teribil pe mine și a plecat în Austria.</p><p>Nu pot să las lucrurile așa. Trebuie să-l găsesc și să vorbesc cu el. Tete, hai cu mine. Plecăm în Austria!</p><button type="button">Deschide portalul →</button></div></section>';
  document.body.appendChild(overlay);
  const button = overlay.querySelector('button');
  button.focus();
  button.addEventListener('click', () => {
    if (!scene.chapterDialogueOpen) return;
    scene.chapterDialogueOpen = false;
    overlay.remove();
    createChapterPortal(scene);
  });
  scene.events.once('shutdown', () => overlay.remove());
}

export function createChapterPortal(scene) {
  if (scene.chapterPortal) return;
  const b = scene.bossRoomBounds;
  const x = b.x + b.width / 2, y = b.y + 110;
  const graphic = scene.add.graphics().setDepth(26);
  const label = scene.add.text(x, y + 52, 'Portal · Nivelul 2', {
    fontFamily: 'Arial', fontSize: '12px', color: '#e7dbff', stroke: '#202035', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(27);
  scene.chapterPortal = { x, y, graphic, label };
  scene.setQuest('Drumul spre Austria', 'Intră în portal pentru a-l căuta pe Bobiță, cunoscut și ca Mr. Grain.');
}

export function useChapterPortal(scene) {
  const portal = scene.chapterPortal;
  if (!portal || scene.chapterDialogueOpen || scene.bookOpen || scene.levelTransitioning ||
      !scene.inventoryUi.classList.contains('hidden') || Math.hypot(scene.player.x - portal.x, scene.player.y - portal.y) > 65) return false;
  scene.levelTransitioning = true;
  scene.player.setVelocity(0, 0);
  scene.partyTete?.setVelocity(0, 0);
  scene.cameras.main.fadeOut(450, 18, 16, 35);
  scene.time.delayedCall(450, () => {
    enterLevelTwo(scene);
    scene.cameras.main.fadeIn(650, 18, 16, 35);
    scene.levelTransitioning = false;
  });
  return true;
}

export function clickChapterPortal(scene, point) {
  const portal = scene.chapterPortal;
  if (!portal || Math.hypot(point.x - portal.x, point.y - portal.y) > 40) return false;
  useChapterPortal(scene);
  return true;
}

export function updateChapterPortal(scene) {
  const portal = scene.chapterPortal;
  if (!portal) return;
  const { x, y, graphic: g, label } = portal;
  const t = scene.time.now / 600;
  g.clear();
  g.fillStyle(0x9d78ff, 0.18).fillEllipse(x, y + 26, 96, 28);
  g.fillStyle(0x292050, 0.95).fillEllipse(x, y - 8, 62, 92);
  for (let i = 0; i < 5; i += 1) {
    g.lineStyle(2 + i % 2, i % 2 ? 0xbeb0ff : 0x7857d5, 0.4 + i * 0.1);
    g.strokeEllipse(x, y - 8, 62 - i * 10 + Math.sin(t + i) * 4, 92 - i * 12);
  }
  for (let i = 0; i < 14; i += 1) {
    const angle = t + i * Math.PI / 7;
    g.fillStyle(0xe2d9ff, 0.8).fillCircle(x + Math.cos(angle) * 35, y - 8 + Math.sin(angle) * 48, 2);
  }
  label.setText(Math.hypot(scene.player.x - x, scene.player.y - y) < 65 ? 'E · Austria — Nivelul 2' : 'Portal · Nivelul 2');
}

export function enterLevelTwo(scene) {
  if (scene.currentLevel === 2) return;
  scene.currentLevel = 2;
  scene.bossRoomActive = false;
  scene.bossRoomLayer.setVisible(false);
  scene.chapterPortal.graphic.destroy();
  scene.chapterPortal.label.destroy();
  scene.chapterPortal = null;
  scene.bossArenaColliders.forEach((collider) => collider.destroy());
  scene.bossArenaColliders = [];
  scene.partyCollider?.destroy();
  scene.arenaSolids.clear(true, true);
  scene.obstacles.getChildren().forEach(({ body }) => { if (body) body.enable = false; });
  if (scene.couponKeeper) {
    scene.couponKeeper.destroy(); scene.couponKeeper = null;
    scene.couponKeeperLabel.destroy(); scene.couponKeeperMarker.destroy();
  }
  scene.nearbyCouponKeeper = null;
  const width = 1600, height = 1200;
  scene.physics.world.setBounds(32, 44, width - 64, height - 76);
  scene.cameras.main.setBounds(0, 0, width, height);
  createAlpineMap(scene);
  createAlpineGold(scene);
  createEmperorLuis(scene);
  createMetinStones(scene);
  scene.physics.add.collider(scene.player, scene.level2Solids);
  if (scene.partyTete) scene.partyCollider = scene.physics.add.collider(scene.partyTete, scene.level2Solids);
  scene.player.setPosition(210, 600).setVelocity(0, 0);
  scene.partyTete?.setPosition(145, 600).setVelocity(0, 0);
  scene.partyPath = [];
  scene.partyNextPathAt = 0;
  scene.add.text(800, 275, 'AUSTRIA · NIVELUL 2', { fontFamily: 'Georgia', fontSize: '28px', color: '#344d53' }).setOrigin(0.5);
  scene.add.text(800, 318, 'Pe urmele lui Mr. Grain / Bobiță', { fontFamily: 'Arial', fontSize: '15px', color: '#415c60' }).setOrigin(0.5);
  scene.setQuest('Nivelul 2 · În căutarea lui Bobiță', 'Mr. Grain a plecat supărat în Austria. Explorează satul alpin împreună cu Tete.');
  showChapterTwoTitle(scene);
}

export function showChapterTwoTitle(scene) {
  const overlay = document.createElement('div');
  overlay.className = 'level-complete chapter-two-title';
  overlay.innerHTML = '<div class="complete-emblem">II</div><strong>Level 2 - Mr.GraiN</strong><span>Austria</span>';
  document.body.appendChild(overlay);
  scene.time.delayedCall(4000, () => overlay.remove());
  scene.events.once('shutdown', () => overlay.remove());
}
