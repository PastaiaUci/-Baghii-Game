import { findPartyPath } from './completion.js';
import { playSound } from './audio.js';
import { appendDeathSummary } from './death-summary.js';

export const VILLAGER_ROLES = [
  { name: 'Pumni', range: 43, damage: 2, cooldown: 1400, windup: 430 },
  { name: 'Arc', range: 310, damage: 2, cooldown: 2300, windup: 600 },
  { name: 'Furcă', range: 65, damage: 3, cooldown: 1800, windup: 600 },
  { name: 'Cuțit', range: 44, damage: 2, cooldown: 1200, windup: 400 },
  { name: 'Penis', range: 51, damage: 2, cooldown: 1700, windup: 550 },
];

export function canVillagerHit(villager, now, distance) {
  return villager.alive && now >= villager.windupUntil && distance <= villager.role.range;
}

export function createVillageCombat(scene) {
  for (let i = 0; i < 5; i += 1) {
    const g = scene.make.graphics();
    if (i === 0) {
      g.fillStyle(0x87523c).fillRoundedRect(9, 23, 15, 15, 4);
      g.fillStyle(0xe7b78e).fillRoundedRect(9, 16, 14, 14, 4).fillRect(7, 23, 5, 10);
      g.lineStyle(1, 0xa77558).lineBetween(13, 18, 13, 23).lineBetween(18, 18, 18, 23);
    } else if (i === 1) {
      g.lineStyle(3, 0x9f7744).beginPath().arc(12, 24, 18, -Math.PI / 2, Math.PI / 2).strokePath();
      g.lineStyle(1, 0xf2dcb2).lineBetween(12, 6, 12, 42);
    } else if (i === 2) {
      g.fillStyle(0x9a7149).fillRect(14, 16, 4, 30);
      g.fillStyle(0xc4d0cd).fillRect(7, 13, 18, 4).fillRect(7, 2, 3, 14).fillRect(14, 0, 3, 16).fillRect(22, 2, 3, 14);
    } else if (i === 3) {
      g.fillStyle(0xa9c3ce).fillTriangle(12, 27, 21, 27, 17, 5);
      g.fillStyle(0xf1f6e9).fillTriangle(13, 25, 17, 25, 17, 6);
      g.fillStyle(0x775039).fillRect(13, 28, 7, 15);
      g.fillStyle(0xc4a36c).fillRect(10, 26, 13, 3);
    } else {
      // Deliberately cartoonish pink novelty prop.
      g.fillStyle(0xd487a4).fillRoundedRect(11, 8, 11, 27, 5).fillEllipse(11, 37, 13, 12).fillEllipse(23, 37, 13, 12);
      g.fillStyle(0xf2b4cd).fillRoundedRect(13, 9, 4, 22, 2);
    }
    g.generateTexture(`villager-weapon-${i}`, 34, 48); g.destroy();
  }
  const arrow = scene.make.graphics();
  arrow.fillStyle(0xa6804e).fillRect(1, 3, 23, 2);
  arrow.fillStyle(0xd9e3dd).fillTriangle(21, 0, 28, 4, 21, 8);
  arrow.fillStyle(0xdbb99b).fillTriangle(0, 0, 7, 4, 0, 8);
  arrow.generateTexture('villager-arrow', 28, 8); arrow.destroy();
  scene.villagerArrows = scene.physics.add.group();
  scene.npcs.forEach((v, index) => {
    v.role = VILLAGER_ROLES[index];
    v.roleIndex = index;
    v.homeX = v.npc.x; v.homeY = v.npc.y;
    v.weapon = scene.add.image(v.npc.x, v.npc.y, `villager-weapon-${index}`).setOrigin(0.5, 0.8).setVisible(false);
  });
  scene.physics.add.collider(scene.villagerArrows, scene.obstacles, (arrow) => arrow.destroy());
  scene.physics.add.overlap(scene.player, scene.villagerArrows, (_player, arrow) => {
    if (!scene.villageEnraged || scene.gameOver || !arrow.active) return;
    const source = arrow.damageSource || { enemy: 'Sătean cu arc', attack: 'Săgeată' };
    arrow.destroy();
    scene.damagePlayer(2, source);
  });
}

export function enrageVillage(scene) {
  if (!scene.hasCoupon || scene.villageEnraged) return false;
  scene.villageEnraged = true;
  playSound(scene, 'rage');
  scene.npcs.forEach((v, index) => {
    if (!v.alive) return;
    v.nextAttackAt = scene.time.now + 900 + index * 180;
    v.windupUntil = 0;
    v.windingUp = false;
    v.path = [];
    v.nextPathAt = 0;
    v.marker.setVisible(true).setText('!').setColor('#ff7861');
    v.label.setText(v.name).setColor('#ffc4ae');
  });
  return true;
}

function chase(scene, v, dx, dy, distance) {
  let target = scene.player.body.center;
  const start = v.npc.body.center;
  if (v.npc.body.blocked.left || v.npc.body.blocked.right || v.npc.body.blocked.up || v.npc.body.blocked.down || v.path?.length) {
    if (scene.time.now >= v.nextPathAt) {
      v.nextPathAt = scene.time.now + 600;
      v.path = findPartyPath(start, target, scene.physics.world.bounds, scene.obstacles.getChildren().map(({ body }) => body).filter((body) => body?.enable));
    }
    while (v.path.length && Math.hypot(v.path[0].x - start.x, v.path[0].y - start.y) < 10) v.path.shift();
    target = v.path[0] || target;
    dx = target.x - start.x; dy = target.y - start.y; distance = Math.hypot(dx, dy) || 1;
  }
  const speed = v.roleIndex === 1 ? 85 : 105;
  const slow = scene.time.now < (v.npc.slowUntil || 0) ? 0.5 : 1;
  v.npc.setVelocity(dx / distance * speed * slow, dy / distance * speed * slow);
}

export function updateEnragedVillager(scene, v) {
  if (scene.gameOver) { v.npc.setVelocity(0, 0); return; }
  const now = scene.time.now;
  const dx = scene.player.x - v.npc.x, dy = scene.player.y - v.npc.y;
  const distance = Math.hypot(dx, dy) || 1;
  const archer = v.roleIndex === 1;
  v.weapon.setVisible(true).setPosition(v.npc.x + 12, v.npc.y + 10).setDepth(v.npc.depth + 0.02);
  v.weapon.setRotation(Math.atan2(dy, dx) + Math.PI / 2 + (v.windingUp ? Math.sin(now / 65) * 0.16 : 0));
  v.label.setText(`${v.name} ${v.health}/${v.maxHealth}`);
  if (v.windingUp) {
    v.npc.setVelocity(0, 0);
    if (now < v.windupUntil) return;
    v.windingUp = false;
    v.marker.setText('!');
    v.nextAttackAt = now + v.role.cooldown;
    if (archer) {
      const angle = Math.atan2(scene.player.body.center.y - (v.npc.y + 10), scene.player.body.center.x - v.npc.x);
      const arrow = scene.physics.add.image(v.npc.x, v.npc.y + 10, 'villager-arrow');
      scene.villagerArrows.add(arrow);
      arrow.setDepth(26).setRotation(angle).setCircle(3, 11, 1).setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
      arrow.expiresAt = now + 2400;
      arrow.damageSource = { enemy: v.name, attack: 'Săgeată' };
      playSound(scene, 'arrow');
    } else if (canVillagerHit(v, now, distance)) scene.damagePlayer(v.role.damage, { enemy: v.name, attack: `Lovitură · ${v.role.name}` });
    return;
  }
  if (distance > (archer ? 210 : v.role.range - 5)) chase(scene, v, dx, dy, distance);
  else if (archer && distance < 100) v.npc.setVelocity(-dx / distance * 60, -dy / distance * 60);
  else v.npc.setVelocity(0, 0);
  if (distance <= v.role.range && now >= v.nextAttackAt) {
    v.windingUp = true;
    v.windupUntil = now + v.role.windup;
    v.marker.setText('⚠').setVisible(true);
  }
}

export function updateVillageCombat(scene) {
  scene.npcs.forEach((v) => {
    if (!v.alive || !scene.villageEnraged || scene.bossRoomActive || scene.currentLevel === 2) v.weapon.setVisible(false);
  });
  scene.villagerArrows.getChildren().slice().forEach((arrow) => {
    if (!scene.villageEnraged || scene.bossRoomActive || scene.time.now >= arrow.expiresAt) arrow.destroy();
  });
}

export function showVillageDeath(scene) {
  scene.gameOver = true;
  scene.physics.world.pause();
  scene.player.setVelocity(0, 0);
  const overlay = document.createElement('div');
  overlay.className = 'chapter-dialogue';
  overlay.innerHTML = '<section role="dialog" aria-modal="true" aria-label="Ai fost învins"><img src="/assets/Gdolf.png" alt="Gdolf"><div><small>GDOLF · AI MURIT</small><h2>Satul s-a răsculat</h2><p>Sătenii m-au pus la pământ. Mă întorc și mai încerc o dată!</p><button type="button">Înapoi în sat →</button></div></section>';
  appendDeathSummary(overlay, scene);
  document.body.appendChild(overlay);
  const button = overlay.querySelector('button'); button.focus();
  button.addEventListener('click', () => {
    if (!scene.gameOver) return;
    scene.villageEnraged = false;
    scene.villagerArrows.clear(true, true);
    scene.npcs.forEach((v) => {
      if (!v.alive) return;
      v.health = v.maxHealth;
      v.windingUp = false;
      v.path = [];
      v.npc.clearTint().setPosition(v.homeX, v.homeY).setVelocity(0, 0);
      v.weapon.setVisible(false); v.marker.setVisible(false);
      v.label.setText(v.name).setColor('#f5f5f5');
    });
    scene.playerHealth = scene.maxPlayerHealth;
    scene.player.clearTint().setPosition(180, 220).setVelocity(0, 0);
    scene.nextVillagerDamageAt = scene.time.now + 1200;
    scene.gameOver = false;
    scene.updatePlayerHeadHealth();
    scene.showVillagerObjective();
    scene.physics.world.resume();
    overlay.remove();
  });
  scene.events.once('shutdown', () => overlay.remove());
}
