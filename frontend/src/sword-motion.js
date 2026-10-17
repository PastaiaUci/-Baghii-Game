import { getSelectedItem } from './inventory.js';
import { getGdolfPose } from './player-art.js';

export function createSwordMotion(scene) {
  scene.swordTrail = scene.add.graphics().setVisible(false);
  scene.swordHand = scene.add.graphics().setVisible(false);
}

export function updateSwordMotion(scene) {
  const sword = scene.playerWeapon;
  const equipped = getSelectedItem(scene)?.type === 'sword';
  const player = scene.player;
  sword.setVisible(equipped);
  scene.swordTrail.clear().setVisible(equipped && scene.isAttacking);
  scene.swordHand.clear().setVisible(equipped);
  if (!equipped) { scene.isAttacking = false; return; }
  const target = scene.cameras.main.getWorldPoint(scene.input.activePointer.x, scene.input.activePointer.y);
  const aim = scene.isAttacking ? scene.attackOriginAngle - Math.PI / 2 : Math.atan2(target.y - player.y, target.x - player.x);
  const side = Math.cos(aim) < 0 ? -1 : 1;
  const bob = getGdolfPose(player).bob;
  let rotation = side * 0.38;
  let extension = 0;
  let handLift = 0;
  let horizontalOffset = 0;
  if (scene.isAttacking) {
    const progress = Math.min(scene.attackTimer / scene.attackDuration, 1);
    // A short wind-up, fast cut, then a relaxed return to the carrying pose.
    const cut = Math.max(0, Math.min(1, (progress - 0.18) / 0.52));
    const eased = 1 - (1 - cut) ** 3;
    const direction = scene.attackSwingDirection || 1;
    const horizontal = scene.attackVariant === 2;
    const swing = horizontal ? Math.PI / 2 + (side < 0 ? Math.PI : 0) + (eased - 0.5) * 0.25 : aim + Math.PI / 2 + direction * (-1.15 + eased * 2.3);
    const recovery = Math.max(0, (progress - 0.78) / 0.22);
    rotation = swing + (rotation - swing) * recovery;
    extension = Math.sin(progress * Math.PI) * 4;
    handLift = direction < 0 ? -Math.sin(progress * Math.PI) * 5 : Math.sin(progress * Math.PI) * 2;
    if (horizontal) {
      horizontalOffset = (eased * 2 - 1) * 12 * (1 - recovery);
      handLift = -5 * Math.sin(progress * Math.PI);
      extension = 0;
    }
    if (progress > 0.18 && progress < 0.78) {
      const trail = scene.swordTrail;
      trail.setDepth(player.depth + 0.01);
      const x = player.x + side * (14 + extension) + horizontalOffset, y = player.y + 9 + bob + handLift;
      if (horizontal) {
        for (let i = 0; i < 3; i += 1) {
          trail.lineStyle(3 - i * 0.7, 0xd9f5ff, 0.35 - i * 0.09);
          trail.lineBetween(x - 18, y - 2 + i * 2, x + 28, y - 2 + i * 2);
        }
      }
      for (let i = 0; i < 5; i += 1) {
        if (horizontal) break;
        const end = rotation - Math.PI / 2 - direction * i * 0.11;
        trail.lineStyle(3 - i * 0.4, 0xd9f5ff, (1 - i / 5) * 0.35);
        trail.beginPath(); trail.arc(x, y, 27 + extension, end - direction * 0.45, end, direction < 0); trail.strokePath();
      }
    }
    scene.attackTimer += Math.min(scene.game.loop.delta, 50);
    if (progress >= 1) { scene.isAttacking = false; scene.attackTimer = 0; }
  }
  const handX = player.x + side * (14 + extension) + horizontalOffset;
  const handY = player.y + 9 + bob + handLift;
  sword.setPosition(handX, handY).setRotation(rotation).setDepth(player.depth + 0.03);
  const hand = scene.swordHand;
  hand.setDepth(player.depth + 0.04);
  hand.lineStyle(4, 0x537f9b).lineBetween(player.x + side * 11, player.y + 3 + bob, handX, handY - 1);
  hand.fillStyle(0x392c2d).fillRoundedRect(handX - 2, handY - 2, 4, 5, 1);
  hand.fillStyle(0xb58c65).fillRect(handX - 1, handY - 2, 2, 1);
}
