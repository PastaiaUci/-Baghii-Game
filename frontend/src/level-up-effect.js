const DURATION = 2100;

export function playLevelUp(owner, gained = 1) {
  const scene = owner.houseActive && owner.activeHouse?.player ? owner.activeHouse :
    owner.tavernActive && owner.scene?.isActive?.('TavernScene') ? owner.scene.get('TavernScene') : owner;
  if (!scene.add?.graphics || !scene.player || !scene.events) return;
  scene.levelUpEffect?.destroy();
  const ground = scene.add.graphics().setBlendMode('ADD');
  const glow = scene.add.graphics().setBlendMode('ADD');
  const title = scene.add.text(0, 0, 'LEVEL UP', {
    fontFamily: 'Georgia', fontSize: '19px', fontStyle: 'bold', color: '#fff1b0',
    stroke: '#704c23', strokeThickness: 3, align: 'center',
    shadow: { offsetX: 0, offsetY: 0, color: '#f8bd50', blur: 8, fill: true },
  }).setOrigin(0.5);
  const detail = scene.add.text(0, 0, `Lv. ${owner.characterLevel}  ·  +${gained * 2} puncte`, {
    fontFamily: 'Arial', fontSize: '10px', color: '#fff4d0', stroke: '#49361e', strokeThickness: 2,
  }).setOrigin(0.5);
  let elapsed = 0, destroyed = false;
  const effect = { destroy() {
    if (destroyed) return;
    destroyed = true;
    scene.events.off('update', update); scene.events.off('shutdown', effect.destroy);
    ground.destroy(); glow.destroy(); title.destroy(); detail.destroy();
    if (scene.levelUpEffect === effect) scene.levelUpEffect = null;
  } };
  const render = () => {
    const p = elapsed / DURATION;
    const fade = Math.min(1, p / 0.12) * Math.min(1, (1 - p) / 0.3);
    const { x, y, depth = 10 } = scene.player;
    const feet = y + 19;
    ground.clear().setPosition(x, feet).setDepth(depth - 0.1);
    glow.clear().setPosition(x, feet).setDepth(depth + 0.2);
    // Two engraved rings expand below the character while light climbs upward.
    const radius = 26 + Math.min(p / 0.3, 1) * 15;
    ground.fillStyle(0xffc968, fade * 0.12).fillEllipse(0, 0, radius * 2.4, radius);
    for (let ring = 0; ring < 2; ring++) {
      ground.lineStyle(ring ? 1 : 2, ring ? 0xfff0b4 : 0xf8c45f, fade * 0.85)
        .strokeEllipse(0, 0, radius * 2 + ring * 12, radius * 0.8 + ring * 5);
    }
    for (let i = 0; i < 12; i++) {
      const angle = i * Math.PI / 6 + p * 0.8;
      const ax = Math.cos(angle) * radius, ay = Math.sin(angle) * radius * 0.4;
      ground.lineStyle(2, 0xffe5a1, fade * 0.8).lineBetween(ax * 0.84, ay * 0.84, ax, ay);
    }
    for (let i = 0; i < 9; i++) {
      const angle = i * Math.PI * 2 / 9 + p * 1.5;
      const ax = Math.cos(angle) * 27, ay = Math.sin(angle) * 10;
      const height = 42 + Math.sin(p * Math.PI) * 45 + i % 3 * 8;
      glow.lineStyle(7, 0xffb345, fade * 0.06).lineBetween(ax, ay, ax, ay - height);
      glow.lineStyle(2, 0xffe4a0, fade * 0.3).lineBetween(ax, ay, ax, ay - height);
    }
    for (let i = 0; i < 24; i++) {
      const rise = (p * 1.5 + i / 24) % 1;
      const angle = i * 2.4 + p * 2;
      const ax = Math.cos(angle) * (25 + rise * 12), ay = -rise * 102 + Math.sin(angle) * 8;
      const alpha = fade * Math.sin(rise * Math.PI);
      glow.fillStyle(i % 3 ? 0xffd67a : 0xffffe8, alpha).fillCircle(ax, ay, i % 4 ? 1.2 : 2);
      if (i % 4 === 0) glow.lineStyle(1, 0xfff4c7, alpha).lineBetween(ax - 3, ay, ax + 3, ay).lineBetween(ax, ay - 3, ax, ay + 3);
    }
    title.setPosition(x, y - 79 - p * 15).setDepth(85).setAlpha(fade).setScale(0.85 + Math.min(p / 0.2, 1) * 0.15);
    detail.setPosition(x, y - 61 - p * 15).setDepth(85).setAlpha(fade);
  };
  const update = (_time, delta) => {
    if (scene.npcDialogueOpen || owner.menuOpen || owner.statsOpen || owner.bookOpen || owner.chapterDialogueOpen || owner.levelTransitioning || owner.gameOver || scene.dead) return;
    elapsed += Math.min(delta || scene.game.loop.delta, 50);
    if (elapsed >= DURATION) { effect.destroy(); return; }
    render();
  };
  scene.levelUpEffect = effect;
  scene.events.on('update', update); scene.events.once('shutdown', effect.destroy);
  render();
}
