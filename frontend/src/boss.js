import { slowMultiplier } from './rewards.js';

export const PUDDLE_WARNING_MS = 800;
export const PUDDLE_LIFETIME_MS = 6800;
export const BEER_INTERVAL_MS = 3500;

export function updateBossHealth(scene) {
  if (!scene.bossHealthHud) return;
  scene.bossHealthValue.textContent = `${scene.bossHealth}/${scene.maxBossHealth}`;
  scene.bossHealthFill.style.width = `${scene.bossHealth / scene.maxBossHealth * 100}%`;
}

function createBossHealth(scene) {
  const hud = document.createElement('div');
  hud.className = 'boss-health-hud';
  hud.innerHTML = '<img class="boss-health-portrait" src="/assets/Tete.png" alt="Tete" /><div class="boss-health-content"><div class="boss-health-heading"><strong>Tete, The Gooner</strong><span class="boss-health-value"></span></div><div class="boss-health-track"><div class="boss-health-fill"></div></div></div>';
  document.body.appendChild(hud);
  scene.bossHealthHud = hud;
  scene.bossHealthValue = hud.querySelector('.boss-health-value');
  scene.bossHealthFill = hud.querySelector('.boss-health-fill');
  updateBossHealth(scene);
  scene.events.once('shutdown', () => hud.remove());
}

export function updatePlayerHealth(scene) {
  if (!scene.playerHealthHud) return;
  const health = Math.max(0, scene.playerHealth);
  scene.playerHealthValue.textContent = `${health}/${scene.maxPlayerHealth}`;
  scene.playerHealthFill.style.width = `${health / scene.maxPlayerHealth * 100}%`;
  scene.playerHealthHud.classList.toggle('low', health <= scene.maxPlayerHealth / 3);
  if (scene.playerArmorTrack) {
    scene.playerArmorTrack.hidden = !scene.equippedHelmet;
    scene.playerArmorValue.textContent = `Armură ${scene.equippedHelmet?.armorRemaining || 0}/5`;
    scene.playerArmorFill.style.width = `${(scene.equippedHelmet?.armorRemaining || 0) / 5 * 100}%`;
  }
}

function createPlayerHealth(scene) {
  scene.playerHealthHud?.remove();
  const hud = document.createElement('div');
  hud.className = 'player-health-hud';
  hud.innerHTML = '<div class="player-armor" hidden><div class="player-armor-track"><div class="player-armor-fill"></div><span class="player-armor-value"></span></div></div><div class="player-health-heading"><span>Gdolf · Viață</span><strong class="player-health-value"></strong></div><div class="player-health-track"><div class="player-health-fill"></div></div>';
  document.body.appendChild(hud);
  scene.playerHealthHud = hud;
  scene.playerHealthValue = hud.querySelector('.player-health-value');
  scene.playerHealthFill = hud.querySelector('.player-health-fill');
  scene.playerArmorTrack = hud.querySelector('.player-armor');
  scene.playerArmorValue = hud.querySelector('.player-armor-value');
  scene.playerArmorFill = hud.querySelector('.player-armor-fill');
  updatePlayerHealth(scene);
  scene.events.once('shutdown', () => hud.remove());
}

export function puddleState(puddle, now, x, y) {
  const age = now - puddle.createdAt;
  const expired = age >= PUDDLE_LIFETIME_MS;
  const active = age >= PUDDLE_WARNING_MS && !expired;
  return { active, expired, touching: active && ((x - puddle.x) / 33) ** 2 + ((y - puddle.y) / 20) ** 2 <= 1 };
}

export function createArena(scene) {
  const { x, y, width: w, height: h } = scene.bossRoomBounds;
  scene.bossRoomLayer = scene.add.container().setDepth(2).setVisible(false);
  scene.arenaSolids = scene.physics.add.staticGroup();
  const g = scene.add.graphics();
  scene.bossRoomLayer.add(g);
  g.fillStyle(0x171820);
  g.fillRect(x - 200, y - 200, w + 400, h + 400);
  g.fillStyle(0x4c4350);
  g.fillRect(x + 20, y + 44, w - 40, h - 64);
  for (let row = y + 44; row < y + h - 20; row += 32) {
    for (let col = x + 20; col < x + w - 20; col += 32) {
      g.fillStyle((row + col) % 64 ? 0x574c56 : 0x514650);
      g.fillRect(col + 1, row + 1, 30, 30);
      g.lineStyle(1, 0x71646d, 0.35);
      g.lineBetween(col + 3, row + 3, col + 28, row + 3);
    }
  }
  // Thick stone walls align with the walkable physics bounds.
  [[x, y, w, 44], [x, y + h - 20, w, 20], [x, y + 44, 20, h - 64], [x + w - 20, y + 44, 20, h - 64]].forEach(([sx, sy, sw, sh]) => {
    g.fillStyle(0x292632);
    g.fillRect(sx, sy, sw, sh);
    g.lineStyle(2, 0x81727b, 0.5);
    g.strokeRect(sx + 2, sy + 2, sw - 4, sh - 4);
  });
  for (let col = x + 8; col < x + w - 10; col += 40) {
    g.lineStyle(2, 0x171820);
    g.lineBetween(col, y + 3, col, y + 24);
    g.lineBetween(col + 20, y + 24, col + 20, y + 42);
  }
  // A worn carpet and ritual ring are floor decoration, never invisible obstacles.
  g.fillStyle(0x6a293b, 0.65);
  g.fillRect(x + w / 2 - 75, y + 68, 150, h - 116);
  g.lineStyle(2, 0xba8e60, 0.5);
  g.strokeRect(x + w / 2 - 69, y + 74, 138, h - 128);
  g.lineStyle(2, 0xb98c82, 0.35);
  g.strokeEllipse(x + w / 2, y + h / 2 + 10, 180, 100);
  g.strokeEllipse(x + w / 2, y + h / 2 + 10, 150, 80);
  [[x + 50, y + 76], [x + w - 50, y + 76], [x + 50, y + h - 48], [x + w - 50, y + h - 48]].forEach(([sx, sy]) => {
    g.fillStyle(0x171820, 0.4);
    g.fillEllipse(sx + 4, sy + 8, 44, 18);
    g.fillStyle(0x765337);
    g.fillRoundedRect(sx - 16, sy - 27, 32, 35, 5);
    g.fillStyle(0xa17a4b);
    g.fillEllipse(sx, sy - 26, 32, 12);
    g.lineStyle(3, 0x34313a);
    g.lineBetween(sx - 16, sy - 19, sx + 16, sy - 19);
    g.lineBetween(sx - 16, sy + 1, sx + 16, sy + 1);
    const zone = scene.add.zone(sx, sy - 7, 32, 28);
    scene.arenaSolids.add(zone);
  });
  [x + 120, x + w - 120].forEach((sx) => {
    g.fillStyle(0xe37e37, 0.12);
    g.fillCircle(sx, y + 30, 30);
    g.fillStyle(0x211b21);
    g.fillRect(sx - 5, y + 22, 10, 18);
    g.fillStyle(0xe7803b);
    g.fillTriangle(sx - 7, y + 25, sx + 7, y + 25, sx + 2, y + 8);
    g.fillStyle(0xffce74);
    g.fillTriangle(sx - 3, y + 25, sx + 3, y + 25, sx, y + 14);
  });
}

function createTextures(scene) {
  if (!scene.textures.exists('tete-boss')) {
    const g = scene.make.graphics();
    // Broad silhouette: burgundy coat, metal shoulders, crown and beer tankard.
    g.fillStyle(0x321e2e);
    g.fillTriangle(5, 69, 63, 69, 34, 19);
    g.fillStyle(0x842e45);
    g.fillRect(17, 28, 34, 31);
    g.fillStyle(0xb95060);
    g.fillRect(20, 29, 5, 25);
    g.fillStyle(0x33303d);
    g.fillRect(21, 56, 10, 13);
    g.fillRect(39, 56, 10, 13);
    g.fillStyle(0x171820);
    g.fillRect(18, 67, 15, 5);
    g.fillRect(38, 67, 15, 5);
    g.fillStyle(0x8b929b);
    g.fillRoundedRect(10, 29, 14, 13, 3);
    g.fillRoundedRect(47, 29, 14, 13, 3);
    g.fillStyle(0xc5c9cc);
    g.fillRect(12, 30, 10, 3);
    g.fillRect(49, 30, 10, 3);
    g.fillStyle(0xdaa98b);
    g.fillRect(24, 11, 23, 22);
    g.fillRect(12, 42, 7, 11);
    g.fillRect(53, 41, 7, 12);
    g.fillStyle(0x352936);
    g.fillRect(22, 10, 27, 7);
    g.fillRect(24, 25, 23, 9);
    g.fillStyle(0xff706c);
    g.fillRect(27, 20, 5, 3);
    g.fillRect(39, 20, 5, 3);
    g.fillStyle(0xe6b863);
    g.fillRect(23, 7, 25, 5);
    g.fillTriangle(23, 9, 31, 9, 23, 1);
    g.fillTriangle(30, 9, 41, 9, 35, 0);
    g.fillTriangle(40, 9, 48, 9, 48, 1);
    g.fillRect(21, 49, 29, 5);
    g.fillStyle(0xffe0a0);
    g.fillRect(32, 48, 7, 7);
    g.fillStyle(0xc78524);
    g.fillRect(54, 43, 12, 17);
    g.lineStyle(3, 0xd9b66b);
    g.strokeRect(64, 46, 5, 10);
    g.fillStyle(0xfff0cc);
    g.fillRoundedRect(52, 40, 15, 6, 2);
    g.generateTexture('tete-boss', 72, 76);
    g.destroy();
  }
  if (!scene.textures.exists('boss-beer')) {
    const g = scene.make.graphics();
    g.fillStyle(0x654726);
    g.fillRoundedRect(3, 6, 15, 20, 3);
    g.fillStyle(0xe8a531);
    g.fillRect(5, 8, 11, 16);
    g.fillStyle(0xffd56b);
    g.fillRect(7, 10, 3, 12);
    g.lineStyle(3, 0xd5c29a);
    g.strokeRoundedRect(17, 10, 6, 12, 2);
    g.fillStyle(0xfff3de);
    g.fillRoundedRect(2, 3, 17, 7, 3);
    g.fillCircle(6, 4, 3);
    g.fillCircle(13, 3, 3);
    g.generateTexture('boss-beer', 26, 28);
    g.destroy();
  }
}

export function createBoss(scene) {
  createTextures(scene);
  createPlayerHealth(scene);
  const b = scene.bossRoomBounds;
  scene.boss = scene.physics.add.sprite(b.x + b.width - 170, b.y + 125, 'tete-boss');
  scene.boss.setScale(1.15).setDepth(20).setCollideWorldBounds(true);
  scene.boss.body.setSize(28, 14).setOffset(22, 56);
  createBossHealth(scene);
  scene.bossShadow = scene.add.ellipse(scene.boss.x, scene.boss.y + 37, 49, 15, 0x101019, 0.4).setDepth(3);
  scene.bossPuddles = [];
  scene.nextBeerAt = scene.time.now + BEER_INTERVAL_MS;
  scene.nextPuddleAt = scene.time.now + 2100;
  scene.nextPuddleDamageAt = 0;
  scene.bossArenaColliders = [
    scene.physics.add.collider(scene.player, scene.arenaSolids),
    scene.physics.add.collider(scene.boss, scene.arenaSolids),
    scene.physics.add.collider(scene.bossProjectiles, scene.arenaSolids, (beer) => beer.destroy()),
    // Phaser always passes the sprite first for sprite-versus-group overlaps.
    scene.physics.add.overlap(scene.player, scene.bossProjectiles, (_player, beer) => {
      if (!scene.bossFightActive || !beer.active) return;
      beer.destroy();
      scene.damagePlayer(4);
    }),
  ];
}

function addPuddle(scene, x, y) {
  const b = scene.bossRoomBounds;
  x = Math.max(b.x + 60, Math.min(b.x + b.width - 60, x));
  y = Math.max(b.y + 78, Math.min(b.y + b.height - 48, y));
  const graphic = scene.add.graphics().setPosition(x, y).setDepth(4);
  const label = scene.add.text(x, y - 24, 'sperma', {
    fontFamily: 'Arial', fontSize: '9px', color: '#fff4e7',
    stroke: '#665968', strokeThickness: 2,
  }).setOrigin(0.5).setDepth(5).setVisible(false);
  scene.bossPuddles.push({ x, y, createdAt: scene.time.now, graphic, label });
}

export function updateBoss(scene) {
  const now = scene.time.now;
  const boss = scene.boss;
  const dx = scene.player.x - boss.x, dy = scene.player.y - boss.y;
  const distance = Math.hypot(dx, dy) || 1;
  const speed = 42 * slowMultiplier(boss, now);
  boss.setVelocity(distance > 86 ? dx / distance * speed : 0, distance > 86 ? dy / distance * speed : 0);
  boss.setDepth(10 + (boss.y + 37) / 100);
  scene.bossShadow.setPosition(boss.x, boss.y + 37);
  if (now >= scene.nextBeerAt) {
    scene.nextBeerAt = now + BEER_INTERVAL_MS;
    const angle = Math.atan2(scene.player.y + 13 - boss.y, scene.player.x - boss.x);
    for (let i = -1; i <= 1; i += 1) {
      const direction = angle + i * 0.23;
      const beer = scene.physics.add.image(boss.x, boss.y, 'boss-beer');
      scene.bossProjectiles.add(beer);
      beer.setDepth(27).setCircle(8, 5, 6);
      beer.setVelocity(Math.cos(direction) * 210, Math.sin(direction) * 210);
      beer.expiresAt = now + 3000;
    }
  }
  if (now >= scene.nextPuddleAt) {
    scene.nextPuddleAt = now + 2700;
    addPuddle(scene, boss.x, boss.y + 37);
    addPuddle(scene, scene.player.x, scene.player.y + 13);
  }
  const bounds = scene.physics.world.bounds;
  scene.bossProjectiles.getChildren().slice().forEach((beer) => {
    if (now >= beer.expiresAt || !bounds.contains(beer.x, beer.y)) beer.destroy();
    else beer.rotation += scene.game.loop.delta * 0.006;
  });
  let touching = false;
  scene.bossPuddles = scene.bossPuddles.filter((puddle) => {
    const state = puddleState(puddle, now, scene.player.body.center.x, scene.player.body.center.y);
    if (state.expired) { puddle.graphic.destroy(); puddle.label.destroy(); return false; }
    puddle.label.setVisible(state.active);
    const g = puddle.graphic;
    g.clear();
    if (!state.active) {
      g.lineStyle(2, 0xffd4b1, 0.55 + Math.sin(now / 70) * 0.2);
      g.strokeEllipse(0, 0, 66, 40);
      g.fillStyle(0xf8eee3, 0.12);
      g.fillEllipse(0, 0, 66, 40);
    } else {
      g.setAlpha(Math.min(1, (PUDDLE_LIFETIME_MS - (now - puddle.createdAt)) / 1000));
      puddle.label.setAlpha(g.alpha);
      g.fillStyle(0xbbb8c4, 0.5).fillEllipse(2, 3, 68, 41);
      g.fillStyle(0xf6f3ee, 0.9).fillEllipse(0, 0, 66, 40);
      g.fillEllipse(-24, 9, 21, 14);
      g.fillEllipse(23, -10, 19, 13);
      g.fillStyle(0xffffff, 0.75).fillEllipse(-9, -5, 24, 9);
      g.fillCircle(14, 5, 3);
    }
    touching ||= state.touching;
    return true;
  });
  // Overlapping puddles share one damage tick, independent of frame rate.
  if (touching && now >= scene.nextPuddleDamageAt) {
    scene.nextPuddleDamageAt = now + 750;
    scene.damagePlayer(2);
  }
}

export function clearBossAttacks(scene, keepArenaCollision = false) {
  scene.boss?.setVelocity(0, 0);
  scene.bossProjectiles.clear(true, true);
  scene.bossPuddles?.forEach(({ graphic, label }) => { graphic.destroy(); label.destroy(); });
  scene.bossPuddles = [];
  scene.bossArenaColliders?.forEach((collider, index) => {
    if (!keepArenaCollision || index !== 0) collider.destroy();
  });
  scene.bossArenaColliders = keepArenaCollision ? scene.bossArenaColliders.slice(0, 1) : [];
  scene.bossHealthHud?.remove();
  scene.bossShadow?.destroy();
}

export function restartBossFight(scene) {
  if (!scene.gameOver || scene.bossDefeated) return;
  scene.deathScreen?.remove();
  scene.deathScreen = null;
  scene.hidePrompt();
  scene.boss?.destroy();
  scene.boss = null;
  scene.projectiles.clear(true, true);
  scene.playerHealth = scene.maxPlayerHealth;
  scene.bossHealth = scene.maxBossHealth;
  scene.gameOver = false;
  scene.bossFightActive = true;
  scene.bossRoomActive = true;
  scene.bossTransitioning = false;
  scene.isAttacking = false;
  scene.attackTimer = 0;
  scene.rushSkill.activeUntil = scene.rushSkill.readyAt = 0;
  scene.swordAuraSkill.until = scene.swordAuraSkill.readyAt = 0;
  scene.deathBreath.until = scene.deathBreath.readyAt = scene.deathBreath.nextTick = 0;
  scene.flashlightReadyAt = scene.slowVisualUntil = 0;
  scene.player.clearTint().setPosition(scene.bossRoomBounds.x + 150, scene.bossRoomBounds.y + 260).setVelocity(0, 0);
  createBoss(scene);
  scene.updatePlayerHeadHealth();
  scene.updateHealthHud();
  scene.cameras.main.flash(300, 210, 220, 235);
}
