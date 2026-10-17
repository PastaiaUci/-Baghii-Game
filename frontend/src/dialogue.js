import { shiftSkillTimers } from './skill-state.js';

export function showNpcDialogue(scene, name, message) {
  if (!scene.dialogBox) return;
  if (!scene.npcDialogueOpen) {
    scene.npcDialogueStartedAt = scene.time.now;
    scene.physics.world.pause();
  }
  scene.npcDialogueOpen = true;
  scene.dialogName.textContent = name;
  scene.dialogText.textContent = message;
  scene.dialogBox.querySelector('.npc-dialog-kicker').textContent = name.startsWith('Gdolf') ? 'GDOLF · GÂNDURI' : 'CONVERSAȚIE';
  const portrait = scene.dialogBox.querySelector('.npc-dialog-portrait');
  portrait.src = scene.npcPortraits?.[name] || (name.startsWith('Tete') ? '/assets/Tete.png' : name.startsWith('Gdolf') ? '/assets/Gdolf.png' : '/assets/CuponKeeper.png');
  portrait.alt = name;
  scene.dialogBox.classList.remove('hidden');
  scene.dialogBox.hidden = false;
  scene.player?.setVelocity(0, 0);
  scene.boss?.setVelocity(0, 0);
  scene.partyTete?.setVelocity(0, 0);
  scene.dialogOkButton.focus();
}

export function hideNpcDialogue(scene) {
  if (!scene.dialogBox) return;
  scene.dialogBox.classList.add('hidden');
  scene.dialogBox.hidden = true;
  if (!scene.npcDialogueOpen) return;
  const elapsed = scene.time.now - scene.npcDialogueStartedAt;
  shiftSkillTimers(scene, elapsed);
  scene.mobs?.forEach(({ sprite }) => { if (sprite.slowUntil > 0) sprite.slowUntil += elapsed; });
  // Reading a dialogue must not let the boss's attack timers expire in the background.
  if (scene.bossFightActive) {
    scene.nextBeerAt += elapsed;
    scene.nextPuddleAt += elapsed;
    scene.bossPuddles?.forEach((puddle) => { puddle.createdAt += elapsed; });
    scene.bossProjectiles?.getChildren().forEach((beer) => { beer.expiresAt += elapsed; });
  }
  if (scene.villageEnraged) {
    scene.npcs.forEach((villager) => {
      villager.nextAttackAt += elapsed;
      if (villager.windingUp) villager.windupUntil += elapsed;
    });
    scene.villagerArrows.getChildren().forEach((arrow) => { arrow.expiresAt += elapsed; });
  }
  scene.npcDialogueOpen = false;
  scene.physics.world.resume();
}
