export const INTERACTION_RANGE = 90;

export function canInteract(scene, target, range = INTERACTION_RANGE) {
  const player = scene.player;
  return Boolean(player && target && target.visible !== false &&
    Math.hypot(player.x - target.x, player.y - target.y) <= range);
}
