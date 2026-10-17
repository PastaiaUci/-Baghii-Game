// Use each window's normal close action so quest callbacks and cleanup still run.
export function dismissDialogue(scene) {
  if (!scene?.npcDialogueOpen) return false;
  const later = scene.dialogBox?.querySelector('.tavern-choice-later');
  if (scene.dialogOkButton?.hidden && later) { later.click(); return true; }
  // Finish scripted conversations without buying, betting or selecting a reward.
  for (let step = 0; step < 32 && scene.npcDialogueOpen; step += 1) {
    const button = scene.dialogOkButton;
    if (!button || button.hidden || button.disabled) break;
    button.click();
  }
  return true;
}
