export function canEnterTavern(scene) {
  return !scene.tavernActive && !scene.gameOver && !scene.bossRoomActive && scene.currentLevel !== 2 &&
    !scene.bookOpen && !scene.npcDialogueOpen && !scene.chapterDialogueOpen && !scene.levelTransitioning &&
    scene.introOverlay.classList.contains('hidden') && scene.inventoryUi.classList.contains('hidden') &&
    Math.hypot(scene.player.x - 430, scene.player.y - 410) <= 78;
}

export function tryEnterTavern(scene) {
  if (!canEnterTavern(scene)) return false;
  scene.tavernActive = true;
  scene.player.setVelocity(0, 0);
  scene.scene.launch('TavernScene', { farm: scene });
  scene.scene.pause();
  return true;
}

export function clickTavernDoor(scene, point) {
  if (point.x < 408 || point.x > 452 || point.y < 335 || point.y > 410) return false;
  return tryEnterTavern(scene);
}

export function updateTavernDoor(scene) {
  scene.tavernDoorHint?.setVisible(!scene.tavernActive && !scene.bossRoomActive && scene.currentLevel !== 2 &&
    Math.hypot(scene.player.x - 430, scene.player.y - 410) <= 100);
}

export function shiftVillageTimers(scene, elapsed) {
  if (!scene.villageEnraged) return;
  scene.npcs.forEach((v) => {
    v.nextAttackAt += elapsed;
    if (v.windingUp) v.windupUntil += elapsed;
  });
  scene.villagerArrows.getChildren().forEach((arrow) => { arrow.expiresAt += elapsed; });
}
