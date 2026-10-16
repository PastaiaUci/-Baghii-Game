import { damageMetinMob } from './metin-stones.js';

export function chooseTeteTarget(scene) {
  const tete = scene.partyTete;
  if (scene.currentLevel !== 2 || !tete?.active || !tete.visible || scene.partyTeteSleeping || scene.partyTeteHealth <= 0) return null;
  return (scene.companionEnemies || scene.metinMobs || []).filter((mob) => mob.alive && Math.hypot(mob.sprite.x - tete.x, mob.sprite.y - tete.y) <= 310)
    .sort((a, b) => Math.hypot(a.sprite.x - tete.x, a.sprite.y - tete.y) - Math.hypot(b.sprite.x - tete.x, b.sprite.y - tete.y))[0] || null;
}

export function updatePartyCombat(scene) {
  if (scene.currentLevel !== 2) return;
  if (scene.npcDialogueOpen || scene.bookOpen || scene.chapterDialogueOpen || scene.levelTransitioning || scene.gameOver || !scene.inventoryUi.classList.contains('hidden')) return;
  const dt = Math.min(scene.game.loop.delta, 50);
  scene.partyBeerCooldown = Math.max(0, (scene.partyBeerCooldown || 0) - dt);
  scene.partyBeerShots ||= [];
  if (scene.partyTeteSleeping || !scene.partyTete?.active) {
    scene.partyBeerShots.forEach(({ sprite }) => sprite.destroy()); scene.partyBeerShots = []; return;
  }
  if (!scene.partyBeerCooldown) {
    const target = chooseTeteTarget(scene);
    if (target) {
      const sprite = scene.add.image(scene.partyTete.x + 15, scene.partyTete.y, 'boss-beer').setScale(0.65).setDepth(25);
      scene.partyBeerShots.push({ sprite, target, life: 2200 });
      scene.partyBeerCooldown = 4200;
    }
  }
  scene.partyBeerShots = scene.partyBeerShots.filter((shot) => {
    shot.life -= dt;
    if (!shot.target.alive || shot.life <= 0) { shot.sprite.destroy(); return false; }
    const dx = shot.target.sprite.x - shot.sprite.x, dy = shot.target.sprite.y - shot.sprite.y;
    const distance = Math.hypot(dx, dy), step = 270 * dt / 1000;
    if (distance < step + 12) {
      if (scene.damageCompanionTarget) scene.damageCompanionTarget(shot.target, 3);
      else damageMetinMob(scene, shot.target, 3);
      shot.sprite.destroy(); return false;
    }
    const x = shot.sprite.x + dx / distance * step, y = shot.sprite.y + dy / distance * step;
    const blocked = scene.level2Solids.getChildren().some(({ body }) => body && body.enable !== false && x > body.left && x < body.right && y > body.top && y < body.bottom);
    if (blocked) { shot.sprite.destroy(); return false; }
    shot.sprite.setPosition(x, y).setRotation(shot.sprite.rotation + dt / 120);
    return true;
  });
}
