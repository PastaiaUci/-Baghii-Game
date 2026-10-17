function drawTete(g, bob, lift) {
  g.fillStyle(0x321e2e).fillTriangle(5, 69, 63, 69, 34, 19 + bob);
  g.fillStyle(0x842e45).fillRect(17, 28 + bob, 34, 31);
  g.fillStyle(0xb95060).fillRect(20, 29 + bob, 5, 25);
  g.fillStyle(0x33303d).fillRect(21, 56, 10, 13).fillRect(39, 56, 10, 13);
  g.fillStyle(0x171820).fillRect(18, 67, 15, 5).fillRect(38, 67, 15, 5);
  g.fillStyle(0x8b929b).fillRoundedRect(10, 29 + bob, 14, 13, 3).fillRoundedRect(47, 29 + bob, 14, 13, 3);
  g.fillStyle(0xc5c9cc).fillRect(12, 30 + bob, 10, 3).fillRect(49, 30 + bob, 10, 3);
  g.fillStyle(0xdaa98b).fillRect(24, 11 + bob, 23, 22).fillRect(12, 42 + bob, 7, 11);
  g.fillStyle(0x352936).fillRect(22, 10 + bob, 27, 7).fillRect(24, 25 + bob, 23, 9);
  g.fillStyle(0xff706c).fillRect(27, 20 + bob, 5, 3).fillRect(39, 20 + bob, 5, 3);
  g.fillStyle(0xe6b863).fillRect(23, 7 + bob, 25, 5);
  g.fillTriangle(23, 9 + bob, 31, 9 + bob, 23, 1 + bob).fillTriangle(30, 9 + bob, 41, 9 + bob, 35, bob).fillTriangle(40, 9 + bob, 48, 9 + bob, 48, 1 + bob);
  g.fillRect(21, 49 + bob, 29, 5);
  g.fillStyle(0xffe0a0).fillRect(32, 48 + bob, 7, 7);
  const x = 59 - lift * 9, y = 48 - lift * 24 + bob;
  g.lineStyle(6, 0xdaa98b).lineBetween(56, 42 + bob, x, y + 5);
  g.save().translateCanvas(x, y).rotateCanvas(-lift * 0.9);
  g.fillStyle(0xc78524).fillRect(-5, -6, 12, 17);
  g.fillStyle(0xf3c15c).fillRect(-3, -4, 3, 13);
  g.lineStyle(2, 0xd9b66b).strokeRect(7, -3, 5, 10);
  g.fillStyle(0xfff0cc).fillRoundedRect(-6, -9, 14, 5, 2);
  g.restore();
}

export function createPartyBeer(scene) {
  scene.partyBeerElapsed = 0; scene.partyIdleElapsed = 0; scene.partyBreathBob = 0;
  const npc = scene.partyTete;
  scene.partyVisual = scene.add.graphics().setScale(npc.scaleX, npc.scaleY);
  scene.partyVisual.save().translateCanvas(-36, -38); drawTete(scene.partyVisual, 0, 0); scene.partyVisual.restore();
  const sync = () => {
    scene.partyVisual.setVisible(Boolean(npc.active && npc.visible && !npc.isTinted)).setPosition(npc.x, npc.y).setDepth(npc.depth + 0.001);
    npc.setAlpha(npc.isTinted ? 1 : 0);
  };
  scene.events.on('postupdate', sync);
  sync();
  scene.events.once('shutdown', () => scene.events.off('postupdate', sync));
  scene.partyBurp = scene.add.text(0, 0, 'Bââârp!', {
    fontFamily: 'Arial', fontSize: '8px', fontStyle: 'bold', color: '#f8dfa0', stroke: '#34291e', strokeThickness: 2,
  }).setOrigin(0.5).setDepth(31).setVisible(false);
}

export function updatePartyBeer(scene) {
  if (!scene.partyBurp) return;
  const npc = scene.partyTete;
  if (scene.bookOpen || scene.chapterDialogueOpen || scene.levelTransitioning) { scene.partyBurp.setVisible(false); return; }
  const dt = Math.min(scene.game.loop.delta, 50);
  scene.partyBeerElapsed += dt; scene.partyIdleElapsed += dt;
  const phase = scene.partyBeerElapsed % 10000;
  const ease = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  const lift = phase < 6000 ? 0 : phase < 6500 ? ease((phase - 6000) / 500) : phase < 7500 ? 1 : phase < 8000 ? 1 - ease((phase - 7500) / 500) : 0;
  const resting = Math.hypot(npc.body?.velocity?.x || 0, npc.body?.velocity?.y || 0) < 4;
  const desiredBob = resting ? -(1 - Math.cos(scene.partyIdleElapsed / 2400 * Math.PI * 2)) * 0.3 : 0;
  scene.partyBreathBob += (desiredBob - scene.partyBreathBob) * (1 - Math.exp(-dt / 55));
  const g = scene.partyVisual.clear().setScale(npc.scaleX * (npc.flipX ? -1 : 1), npc.scaleY);
  g.save().translateCanvas(-36, -38);
  drawTete(g, scene.partyBreathBob, lift); g.restore();
  const burping = phase >= 8100 && phase < 9200;
  scene.partyBurp.setVisible(burping && npc.visible);
  scene.partyBurp.setPosition(npc.x + 12, npc.y - 61 - Math.max(0, phase - 8100) / 140);
  scene.partyBurp.setAlpha(burping ? Math.min(1, (9200 - phase) / 350) : 0);
}
