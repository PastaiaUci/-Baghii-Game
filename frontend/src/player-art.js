// Keep the original 32×40 frame and foot position so collision and equipment stay aligned.
export function drawGdolf(scene, leftStep, rightStep, leftArm, rightArm, breathing = false, motion = {}) {
  const g = motion.graphics || scene.make.graphics();
  const bob = motion.bob ?? (leftStep ? 1 : breathing ? -1 : 0);
  const leftLift = motion.leftLift || 0, rightLift = motion.rightLift || 0;
  // Boots and trousers: alternating knees give the walking frames a clear gait.
  g.fillStyle(0x202b3c);
  g.fillRect(9 + leftStep, 27 - leftLift, 6, 10);
  g.fillRect(18 + rightStep, 27 - rightLift, 6, 10);
  g.fillStyle(0x46576c);
  g.fillRect(10 + leftStep, 29 - leftLift, 2, 6);
  g.fillRect(19 + rightStep, 29 - rightLift, 2, 6);
  g.fillStyle(0x231f25);
  g.fillRect(8 + leftStep, 35 - leftLift, 8, 4);
  g.fillRect(17 + rightStep, 35 - rightLift, 8, 4);
  g.fillStyle(0x8c6c4e);
  g.fillRect(9 + leftStep, 35 - leftLift, 5, 1);
  g.fillRect(18 + rightStep, 35 - rightLift, 5, 1);
  g.fillStyle(0x48383a);
  g.fillRect(8 + leftStep, 38 - leftLift, 8, 1);
  g.fillRect(17 + rightStep, 38 - rightLift, 8, 1);
  // Short navy coat, leather belt and diagonal shoulder strap.
  g.fillStyle(0x1b2636);
  g.fillRect(6, 19 + bob, 20, 11);
  g.fillStyle(0x3c6688);
  g.fillRect(8, 20 + bob, 16, 8);
  g.fillStyle(0x5f91ac);
  g.fillRect(8, 20 + bob, 5, 6);
  g.fillStyle(0x294963);
  g.fillRect(19, 21 + bob, 5, 7);
  g.fillStyle(0x172434);
  g.fillRect(15, 23 + bob, 2, 5);
  g.fillStyle(0x70503b);
  for (let i = 0; i < 8; i += 1) g.fillRect(10 + i, 19 + bob + i, 3, 2);
  g.fillRect(7, 28, 18, 3);
  g.fillStyle(0xd7b575);
  g.fillRect(15, 28, 4, 3);
  g.fillStyle(0x40362e);
  g.fillRect(16, 29, 2, 1);
  // Sleeves, bracers and gloved hands.
  [[3 + leftArm, 20 + (motion.armSwing || 0)], [25 + rightArm, 20 - (motion.armSwing || 0)]].forEach(([x, y]) => {
    g.fillStyle(0x202c3d).fillRect(x, y + bob, 4, 11);
    g.fillStyle(0x537f9b).fillRect(x, y + bob, 3, 5);
    g.fillStyle(0x74513b).fillRect(x, y + 5 + bob, 4, 3);
    g.fillStyle(0x392c2d).fillRect(x, y + 8 + bob, 4, 3);
  });
  // Defined face with warm highlights, dark brows and a short beard.
  g.fillStyle(0x332b2d).fillRect(7, 4 + bob, 18, 14);
  g.fillStyle(0xc78d67).fillRect(7, 9 + bob, 18, 6);
  g.fillStyle(0xe4b48a).fillRect(9, 7 + bob, 14, 10);
  g.fillStyle(0xf3d0a3).fillRect(10, 8 + bob, 10, 4);
  g.fillStyle(0x5a3b30).fillRect(9, 11 + bob, 5, 1).fillRect(18, 11 + bob, 4, 1);
  g.fillStyle(0x202830).fillRect(11, 12 + bob, 2, 2).fillRect(19, 12 + bob, 2, 2);
  g.fillStyle(0xb77d5e).fillRect(15, 13 + bob, 2, 3);
  g.fillStyle(0x674332).fillRect(9, 16 + bob, 14, 3).fillRect(11, 19 + bob, 10, 1);
  g.fillStyle(0xa8734c).fillRect(11, 17 + bob, 3, 1).fillRect(19, 17 + bob, 2, 1);
  g.fillStyle(0xe2ac83).fillRect(14, 16 + bob, 4, 1);
  // Swept chestnut hair, with a distinct outline and a copper highlight.
  g.fillStyle(0x29252a).fillRect(6, 4 + bob, 20, 5).fillRect(8, 1 + bob, 15, 4);
  g.fillStyle(0x543b32).fillRect(7, 4 + bob, 17, 4).fillRect(10, 2 + bob, 12, 3);
  g.fillRect(7, 8 + bob, 3, 4).fillRect(22, 7 + bob, 3, 5);
  g.fillStyle(0x926047).fillRect(10, 3 + bob, 10, 2).fillRect(8, 5 + bob, 6, 1);
  g.fillStyle(0x543b32).fillRect(11, 7 + bob, 4, 2);
  // Burgundy scarf adds a recognizable accent at game scale.
  g.fillStyle(0x642d3b).fillRect(9, 20 + bob, 14, 3).fillRect(20, 23 + bob, 3, 4);
  g.fillStyle(0xb65c5c).fillRect(10, 20 + bob, 11, 1).fillRect(21, 23 + bob, 1, 3);
  return g;
}

export function getGdolfPose(player) {
  return player?.visualPose || { bob: 0, step: 0, leftLift: 0, rightLift: 0, armSwing: 0 };
}

export function gdolfMotionPose(elapsed, moving) {
  const phase = elapsed / (moving ? 512 : 2400) * Math.PI * 2;
  return moving ? { bob: (1 - Math.cos(phase * 2)) * 0.3, step: Math.sin(phase) * 1.25,
    leftLift: Math.max(0, Math.sin(phase)) * 1.7, rightLift: Math.max(0, -Math.sin(phase)) * 1.7, armSwing: Math.sin(phase) * 0.6 } :
    { bob: -(1 - Math.cos(phase)) * 0.3, step: 0, leftLift: 0, rightLift: 0, armSwing: Math.sin(phase) * 0.12 };
}

export function updateGdolfAnimation(scene, moving) {
  const player = scene.player;
  if (!scene.gdolfVisual) {
    scene.gdolfVisual = scene.add.graphics();
    const sync = () => {
      const visible = player.active && player.visible && !player.isTinted;
      scene.gdolfVisual.setVisible(visible).setPosition(player.x - 16, player.y - 20).setDepth(player.depth + 0.001);
      player.setAlpha(player.isTinted ? 1 : 0);
    };
    scene.events.on('postupdate', sync);
    scene.events.once('shutdown', () => { scene.events.off('postupdate', sync); scene.gdolfVisual = null; });
  }
  const dt = Math.min(scene.game.loop.delta, 50);
  const pace = Math.max(0.6, Math.min(1.8, Math.hypot(player.body.velocity.x, player.body.velocity.y) / 180));
  player.motionElapsed = (player.motionElapsed || 0) + dt * (moving ? pace : 1);
  const desired = gdolfMotionPose(player.motionElapsed, moving);
  player.visualPose ||= { ...desired };
  const blend = 1 - Math.exp(-dt / 55);
  for (const key of Object.keys(desired)) player.visualPose[key] += (desired[key] - player.visualPose[key]) * blend;
  const pose = player.visualPose;
  drawGdolf(scene, pose.step, -pose.step, -pose.step * 0.7, pose.step * 0.7, false, { ...pose, graphics: scene.gdolfVisual.clear() });
}
