import { showNpcDialogue } from './dialogue.js';

export function hasGambledAwayLevel(scene) {
  return !scene.hasCoupon && !scene.bossRoomActive && scene.currentLevel !== 2 &&
    scene.gold < 100 && scene.goldPickups?.length > 0 &&
    scene.goldPickups.every((pickup) => pickup.collected);
}

export function showDiceDefeat(scene) {
  if (!hasGambledAwayLevel(scene) || scene.gameOver) return false;
  scene.gameOver = true;
  scene.player?.setVelocity(0, 0);
  showNpcDialogue(scene, 'Gdolf · Nivel pierdut', 'Degenratu pulii ai jucat tot\n\nAi strâns toți bănuții de pe hartă și nu mai ai destul gold pentru cupon. Trebuie să reîncepi nivelul.');
  scene.dialogBox.querySelector('.dice-game')?.remove();
  scene.dialogOkButton.textContent = 'Reîncepe nivelul 1';
  scene.dialogOkButton.disabled = false;
  scene.dialogOkButton.addEventListener('click', (event) => {
    event.stopImmediatePropagation();
    scene.resetSavedGame?.();
    window.location.reload();
  }, { capture: true, once: true });
  scene.dialogOkButton.focus();
  return true;
}
