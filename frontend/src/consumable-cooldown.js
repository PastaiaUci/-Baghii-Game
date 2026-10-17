export const POTION_COOLDOWN_MS = 3000;
const now = (scene) => scene.game?.loop?.now ?? scene.time?.now ?? 0;
export function potionCooldownRemaining(scene) {
  return Math.max(0, (scene.potionReadyAt || 0) - now(scene));
}
export function startPotionCooldown(scene) { scene.potionReadyAt = now(scene) + POTION_COOLDOWN_MS; }
