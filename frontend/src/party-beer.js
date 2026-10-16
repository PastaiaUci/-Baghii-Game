export function createPartyBeer(scene) {
  const base = scene.textures.get('tete-boss').getSourceImage();
  for (let frame = 1; frame <= 10; frame += 1) {
    const key = `tete-party-drink-${frame}`;
    if (scene.textures.exists(key)) continue;
    const texture = scene.textures.createCanvas(key, 72, 76);
    const ctx = texture.getContext();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(base, 0, 0);
    ctx.clearRect(52, 40, 20, 21);
    ctx.fillStyle = '#daa98b';
    ctx.fillRect(53, 40, 6, 9);
    const lift = frame / 10;
    const x = 59 - lift * 9, y = 48 - lift * 24;
    ctx.strokeStyle = '#daa98b'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(56, 42); ctx.lineTo(x, y + 5); ctx.stroke();
    ctx.save(); ctx.translate(x, y); ctx.rotate(-lift * 0.9);
    ctx.fillStyle = '#c78524'; ctx.fillRect(-5, -6, 12, 17);
    ctx.fillStyle = '#f3c15c'; ctx.fillRect(-3, -4, 3, 13);
    ctx.strokeStyle = '#d9b66b'; ctx.lineWidth = 2; ctx.strokeRect(7, -3, 5, 10);
    ctx.fillStyle = '#fff0cc'; ctx.fillRect(-6, -9, 14, 5);
    ctx.restore(); texture.refresh();
  }
  scene.partyBeerElapsed = 0;
  scene.partyBurp = scene.add.text(0, 0, 'Bââârp!', {
    fontFamily: 'Arial', fontSize: '8px', fontStyle: 'bold', color: '#f8dfa0', stroke: '#34291e', strokeThickness: 2,
  }).setOrigin(0.5).setDepth(31).setVisible(false);
}

export function updatePartyBeer(scene) {
  if (!scene.partyBurp) return;
  const npc = scene.partyTete;
  if (scene.bookOpen || scene.chapterDialogueOpen || scene.levelTransitioning) {
    scene.partyBurp.setVisible(false);
    return;
  }
  scene.partyBeerElapsed += Math.min(scene.game.loop.delta, 50);
  const phase = scene.partyBeerElapsed % 10000;
  // Lift, hold at the mouth, then lower the tankard before burping.
  let frame = 0;
  if (phase >= 6000 && phase < 6500) frame = Math.ceil((phase - 6000) / 50);
  else if (phase >= 6500 && phase < 7500) frame = 10;
  else if (phase >= 7500 && phase < 8000) frame = Math.ceil((8000 - phase) / 50);
  const key = frame ? `tete-party-drink-${frame}` : 'tete-boss';
  if (npc.texture.key !== key) npc.setTexture(key);
  const burping = phase >= 8100 && phase < 9200;
  scene.partyBurp.setVisible(burping && npc.visible);
  scene.partyBurp.setPosition(npc.x + 12, npc.y - 61 - Math.max(0, phase - 8100) / 140);
  scene.partyBurp.setAlpha(burping ? Math.min(1, (9200 - phase) / 350) : 0);
}
