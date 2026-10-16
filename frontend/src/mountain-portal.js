export function createMountainPortal(scene) {
  if (scene.mountainPortal || scene.luisQuest?.status !== 'completed') return false;
  const x = 800, y = 330;
  const graphic = scene.add.graphics().setDepth(25);
  const label = scene.add.text(x, y + 39, 'Portal spre munți · În curând', {
    fontFamily: 'Arial', fontSize: '11px', color: '#dcf7ff', stroke: '#293b52', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(30);
  scene.mountainPortal = { x, y, graphic, label };
  // Scenery only: no interaction zone, transition or teleport handler.
  const update = () => {
    const t = (scene.time.now || 0) / 700;
    graphic.clear();
    graphic.fillStyle(0x72d4ee, 0.16).fillEllipse(x, y + 16, 95, 27);
    graphic.fillStyle(0x293e66, 0.95).fillEllipse(x, y - 15, 52, 77);
    for (let i = 0; i < 5; i += 1) {
      graphic.lineStyle(2, i % 2 ? 0xd4efff : 0x67b7ed, 0.4 + i * 0.1);
      graphic.strokeEllipse(x, y - 15, 58 - i * 7 + Math.sin(t + i) * 3, 83 - i * 9);
    }
    for (let i = 0; i < 12; i += 1) {
      const angle = t + i * Math.PI / 6;
      graphic.fillStyle(0xe7f6ff, 0.7).fillCircle(x + Math.cos(angle) * 34, y - 15 + Math.sin(angle) * 48, 1.5);
    }
  };
  scene.events.on('update', update); update();
  scene.events.once('shutdown', () => scene.events.off('update', update));
  return true;
}
