import { createMetinTextures } from './metin-art.js';
import { showNpcDialogue, hideNpcDialogue } from './dialogue.js';
import { damagePartyTete, dropRevivalBeer } from './party-health.js';
import { updatePlayerHealth } from './boss.js';
import { collectLuisMedallion } from './luis-quest.js';

export const METIN_LOCATIONS = [
  [260, 900, 1], [600, 1010, 1], [1320, 670, 2], [1040, 760, 2], [550, 740, 1],
  [940, 1040, 3], [1360, 1070, 3], [550, 350, 2], [1250, 380, 3], [230, 490, 1],
];
export const MEDALLION_DROP_CHANCE = 0.5;
export const METIN_TYPES = [
  { name: 'Piatra Diavolului', texture: 'metin-stone', color: 0xe96b74 },
  { name: 'Piatra Geloziei', texture: 'metin-jealous-stone', color: 0x65dfa9 },
  { name: 'Piatra Pulii', texture: 'metin-penis-stone', color: 0xca8bde },
];

export function hitStoneState(stone, amount, random = Math.random) {
  if (stone.broken || amount <= 0) return { waves: 0, broken: false };
  stone.health = Math.max(0, Math.round((stone.health - amount) * 100) / 100);
  const waveCount = stone.health > 0 ? Math.floor((1 - stone.health / stone.maxHealth) * 4) : 3;
  const waves = Math.max(0, Math.min(3, waveCount) - stone.waves);
  stone.waves += waves;
  if (stone.health > 0) return { waves, broken: false };
  stone.broken = true;
  return { waves: 0, broken: true, medal: random() < MEDALLION_DROP_CHANCE, gold: 25 * (stone.level || 1) };
}

function isClear(scene, x, y, margin = 16) {
  const b = scene.physics.world.bounds;
  return x > b.x + margin && x < b.x + b.width - margin && y > b.y + margin && y < b.y + b.height - margin &&
    !scene.level2Solids.getChildren().some(({ body }) => body && body.enable !== false && x > body.left - margin && x < body.right + margin && y > body.top - margin && y < body.bottom + margin);
}

function removeMob(mob) {
  mob.alive = false; mob.sprite.destroy(); mob.label.destroy(); mob.shadow.destroy(); mob.warning.destroy();
}

function spawnMob(scene, stone, index) {
  const kind = ['plague', 'yeti', 'walker'][(stone.index + index) % 3];
  let position;
  for (const radius of [52, 72, 95]) {
    for (let step = 0; step < 12; step += 1) {
      const angle = (step + index * 3) * Math.PI / 6;
      const x = stone.x + Math.cos(angle) * radius, y = stone.y + Math.sin(angle) * radius;
      if (isClear(scene, x, y, 20)) { position = { x, y }; break; }
    }
    if (position) break;
  }
  if (!position) return;
  const sprite = scene.physics.add.sprite(position.x, position.y, `metin-${kind}-0`);
  sprite.body.setSize(kind === 'yeti' ? 26 : 18, 12).setOffset(kind === 'yeti' ? 10 : 15, 31);
  sprite.setCollideWorldBounds(true);
  scene.metinMobGroup.add(sprite);
  const label = scene.add.text(sprite.x, sprite.y - 29, '', { fontFamily: 'Arial', fontSize: '9px', color: '#ffd8bd', stroke: '#2c2532', strokeThickness: 3 }).setOrigin(0.5).setDepth(30);
  const shadow = scene.add.ellipse(sprite.x, sprite.y + 17, 29, 9, 0x344357, 0.25).setDepth(1);
  const warning = scene.add.graphics().setDepth(2);
  const mob = { sprite, label, shadow, warning, kind, stone, health: (kind === 'yeti' ? 7 : 4) + (stone.level - 1) * 2, alive: true, cooldown: 900, windup: 0, slowUntil: 0 };
  sprite.metinMob = mob;
  scene.metinMobs.push(mob);
}

function scatterGold(scene, stone) {
  for (let i = 0; i < 5; i += 1) {
    const angle = i * Math.PI * 2 / 5;
    let x = stone.x + Math.cos(angle) * 43, y = stone.y + Math.sin(angle) * 30;
    if (!isClear(scene, x, y, 8)) { x = stone.x; y = stone.y; }
    const sprite = scene.add.sprite(stone.x, stone.y, 'gold-coin').setDepth(25);
    const pickup = { sprite, value: 5 * stone.level, level: 2, collected: false, flying: true };
    scene.goldPickups.push(pickup);
    scene.tweens.add({ targets: sprite, x, y: y - 23, duration: 240, ease: 'Cubic.easeOut', onComplete: () => {
      scene.tweens.add({ targets: sprite, y, duration: 230, ease: 'Bounce.easeOut', onComplete: () => { pickup.flying = false; } });
    } });
  }
}

function dropMedallion(scene, stone) {
  scene.luisMedallions ||= [];
  const sprite = scene.add.image(stone.x, stone.y - 7, 'bobita-medallion').setDisplaySize(26, 28).setDepth(24);
  const glow = scene.add.ellipse(stone.x, stone.y + 8, 36, 13, 0xffdc6b, 0.3).setDepth(1);
  scene.tweens.add({ targets: sprite, y: stone.y - 14, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  scene.luisMedallions.push({ sprite, glow, collected: false });
}

export function damageMetinStone(scene, stone, amount, random = Math.random) {
  const result = hitStoneState(stone, amount, random);
  if (!result.broken && !stone.broken) {
    for (let wave = 0; wave < result.waves; wave += 1) {
      spawnMob(scene, stone, stone.spawned++); spawnMob(scene, stone, stone.spawned++);
    }
    stone.sprite.setTint(0xffd8dd);
    scene.time.delayedCall(90, () => { if (!stone.broken) stone.sprite.clearTint(); });
  }
  if (!result.broken) return;
  stone.sprite.setVisible(false); stone.label.setVisible(false); stone.aura.clear(); stone.body.body.enable = false;
  stone.respawn = 25000 + (stone.level - 1) * 5000;
  scene.metinMobs.filter((mob) => mob.alive && mob.stone === stone).forEach(removeMob);
  scatterGold(scene, stone);
  if (result.medal) dropMedallion(scene, stone);
  const burst = scene.add.graphics().setDepth(25).setPosition(stone.x, stone.y);
  for (let i = 0; i < 12; i += 1) {
    const a = i * Math.PI / 6;
    burst.fillStyle(stone.color, 0.8).fillTriangle(Math.cos(a) * 26, Math.sin(a) * 17, Math.cos(a) * 40 + 4, Math.sin(a) * 28, Math.cos(a) * 40 - 3, Math.sin(a) * 28 - 5);
  }
  scene.tweens.add({ targets: burst, alpha: 0, duration: 600, onComplete: () => burst.destroy() });
}

export function damageMetinMob(scene, mob, damage) {
  if (!mob?.alive) return;
  mob.health = Math.max(0, Math.round((mob.health - damage) * 100) / 100);
  if (!mob.health) {
    if (Math.random() < 0.2) dropRevivalBeer(scene, mob.sprite.x, mob.sprite.y);
    removeMob(mob); return;
  }
  mob.sprite.setTint(0xff9d9d);
  scene.time.delayedCall(100, () => { if (mob.alive) mob.sprite.clearTint(); });
}

export function attackMetinTargets(scene, x, y, damage) {
  if (scene.currentLevel !== 2) return false;
  const dx = x - scene.player.x, dy = y - scene.player.y, len = Math.hypot(dx, dy) || 1;
  let hit = false;
  const inRange = (tx, ty, range) => {
    const ex = tx - scene.player.x, ey = ty - scene.player.y;
    return Math.hypot(ex, ey) <= range && (ex * dx + ey * dy) / len > -8;
  };
  scene.metinStones?.forEach((stone) => {
    if (!stone.broken && inRange(stone.x, stone.y - 12, 76)) { damageMetinStone(scene, stone, damage); hit = true; }
  });
  scene.metinMobs?.slice().forEach((mob) => {
    if (mob.alive && inRange(mob.sprite.x, mob.sprite.y, 62)) { damageMetinMob(scene, mob, damage); hit = true; }
  });
  return hit;
}

export function createMetinStones(scene) {
  createMetinTextures(scene);
  scene.metinMobs = []; scene.metinMobGroup = scene.physics.add.group();
  scene.physics.add.collider(scene.metinMobGroup, scene.level2Solids);
  scene.physics.add.collider(scene.metinMobGroup, scene.metinMobGroup);
  scene.metinStones = METIN_LOCATIONS.map(([x, y, level], index) => {
    const type = METIN_TYPES[index % METIN_TYPES.length];
    const sprite = scene.add.image(x, y + 7, type.texture).setOrigin(0.5, 1).setDepth(10 + y / 100);
    const aura = scene.add.graphics().setDepth(1.2);
    const label = scene.add.text(x, y - 74, '', { fontFamily: 'Arial', fontSize: '10px', color: '#eadfff', stroke: '#293240', strokeThickness: 3 }).setOrigin(0.5).setDepth(30);
    const body = scene.add.zone(x, y - 4, 28, 22); scene.level2Solids.add(body);
    const maxHealth = [0, 18, 28, 42][level];
    return { x, y, index, level, name: type.name, color: type.color, sprite, aura, label, body, health: maxHealth, maxHealth, waves: 0, spawned: 0, broken: false, respawn: 0 };
  });
}

export function updateMetinStones(scene) {
  if (scene.currentLevel !== 2 || !scene.metinStones) return;
  const paused = scene.npcDialogueOpen || scene.bookOpen || scene.chapterDialogueOpen || scene.gameOver || !scene.inventoryUi.classList.contains('hidden');
  if (paused) { scene.metinMobs.filter((mob) => mob.alive).forEach(({ sprite }) => sprite.setVelocity(0, 0)); return; }
  const dt = Math.min(scene.game.loop.delta, 50);
  (scene.luisMedallions || []).forEach((drop) => {
    if (!drop.collected && Math.hypot(scene.player.x - drop.sprite.x, scene.player.y - drop.sprite.y) < 30) collectLuisMedallion(scene, drop);
  });
  scene.metinStones.forEach((stone) => {
    if (stone.broken) {
      stone.respawn -= dt;
      if (stone.respawn <= 0 && Math.hypot(scene.player.x - stone.x, scene.player.y - stone.y) > 85 && (!scene.partyTete?.active || Math.hypot(scene.partyTete.x - stone.x, scene.partyTete.y - stone.y) > 60)) {
        stone.broken = false; stone.health = stone.maxHealth; stone.waves = stone.spawned = 0;
        stone.sprite.setVisible(true).clearTint(); stone.label.setVisible(true); stone.body.body.enable = true;
      }
      return;
    }
    stone.label.setText(`${stone.name} · Lv.${stone.level} · ${stone.health}/${stone.maxHealth}`);
    const g = stone.aura.clear();
    const pulse = Math.sin(scene.time.now / 350 + stone.index) * 5;
    g.fillStyle(stone.color, 0.14).fillEllipse(stone.x, stone.y, 92 + pulse, 43);
    g.lineStyle(2, stone.color, 0.55).strokeEllipse(stone.x, stone.y, 72 + pulse, 30);
    for (let i = 0; i < 8; i += 1) {
      const t = (scene.time.now / 1300 + i / 8) % 1, angle = i * Math.PI / 4;
      g.fillStyle(stone.color, 1 - t).fillCircle(stone.x + Math.cos(angle) * 28, stone.y - t * 65 + Math.sin(angle) * 10, 1.5);
    }
  });
  scene.metinMobs = scene.metinMobs.filter(({ alive }) => alive);
  scene.metinMobs.forEach((mob) => {
    if (!mob.alive || scene.gameOver) return;
    const { sprite } = mob;
    const tete = scene.partyTete;
    const canHitTete = tete?.active && !scene.partyTeteSleeping && scene.partyTeteHealth > 0;
    const target = canHitTete && Math.hypot(tete.x - sprite.x, tete.y - sprite.y) < Math.hypot(scene.player.x - sprite.x, scene.player.y - sprite.y) ? tete : scene.player;
    const dx = target.x - sprite.x, dy = target.y - sprite.y, distance = Math.hypot(dx, dy);
    mob.cooldown -= dt; mob.warning.clear();
    const slowed = scene.time.now < sprite.slowUntil;
    const speed = (mob.kind === 'yeti' ? 60 : mob.kind === 'walker' ? 94 : 76) * (1 + (mob.stone.level - 1) * 0.08) * (slowed ? (sprite.slowFactor || 0.5) : 1);
    if (mob.windup > 0) {
      sprite.setVelocity(0, 0); mob.windup -= dt;
      mob.warning.lineStyle(2, 0xf29474, 0.7).strokeEllipse(sprite.x, sprite.y + 14, 55, 27);
      const victim = mob.windupTarget;
      if (mob.windup <= 0 && victim?.active && Math.hypot(victim.x - sprite.x, victim.y - sprite.y) < 48) {
        const damage = (mob.kind === 'yeti' ? 4 : 2) + mob.stone.level - 1;
        if (victim === scene.partyTete) damagePartyTete(scene, damage); else scene.damagePlayer(damage);
      }
    } else if (distance < 43 && mob.cooldown <= 0) { mob.windupTarget = target; mob.windup = mob.kind === 'yeti' ? 650 : 450; mob.cooldown = 1500; sprite.setVelocity(0, 0); }
    else if (distance > 32) {
      const blocked = sprite.body.blocked;
      if (blocked.left || blocked.right) sprite.setVelocity(0, sprite.y < mob.stone.y ? -speed : speed);
      else if (blocked.up || blocked.down) sprite.setVelocity(sprite.x < mob.stone.x ? -speed : speed, 0);
      else sprite.setVelocity(dx / distance * speed, dy / distance * speed);
    }
    else sprite.setVelocity(0, 0);
    if (!mob.alive || scene.gameOver) return;
    sprite.setTexture(`metin-${mob.kind}-${distance > 32 && mob.windup <= 0 ? 1 + Math.floor(scene.time.now / 140) % 2 : 0}`).setDepth(10 + (sprite.y + 17) / 100);
    sprite.setFlipX(dx < 0);
    mob.label.setPosition(sprite.x, sprite.y - 30).setText(`${mob.kind === 'yeti' ? 'Yeti' : mob.kind === 'plague' ? 'Om al ciumei' : 'Penis umblător'} · ${mob.health}`);
    mob.shadow.setPosition(sprite.x, sprite.y + 17);
  });
}

export function showAlpineDeath(scene) {
  scene.gameOver = true;
  scene.metinMobs.filter((mob) => mob.alive).forEach(removeMob);
  showNpcDialogue(scene, 'Gdolf · Ai fost învins', 'Mobii pietrelor m-au pus la pământ. Îmi trag sufletul și revin în sat.');
  scene.dialogOkButton.textContent = 'Reînvie în sat';
  const revive = (event) => {
    event.stopImmediatePropagation(); scene.gameOver = false;
    scene.playerHealth = scene.maxPlayerHealth;
    scene.player.clearTint().setPosition(210, 600).setVelocity(0, 0);
    scene.partyTete?.setPosition(145, 600).setVelocity(0, 0);
    scene.metinStones.filter((stone) => !stone.broken).forEach((stone) => { stone.health = stone.maxHealth; stone.waves = stone.spawned = 0; });
    scene.dialogOkButton.textContent = 'Continuă →';
    hideNpcDialogue(scene); updatePlayerHealth(scene); scene.updatePlayerHeadHealth(); scene.updateHealthHud();
  };
  scene.dialogOkButton.addEventListener('click', revive, { capture: true, once: true });
}
