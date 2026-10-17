import { attemptMountainPortal } from './winter-quest.js';

export function portalWindStrength(distance, equipped = false) {
  const nearby = Math.max(0, 1 - distance / 180);
  return Math.min(1, 0.3 + nearby * 0.55 + (equipped ? 0.15 : 0));
}

export function createMountainPortal(scene) {
  if (scene.mountainPortal || scene.luisQuest?.status !== 'completed') return false;
  const x = 800, y = 330;
  const graphic = scene.add.graphics().setDepth(25);
  const wind = scene.add.graphics().setDepth(24);
  let windTime = 0;
  const label = scene.add.text(x, y + 39, 'Portal spre munți · În curând', {
    fontFamily: 'Arial', fontSize: '11px', color: '#dcf7ff', stroke: '#293b52', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(30);
  scene.mountainPortal = { x, y, graphic, label };
  // The winter quest owns proximity checks and the mountain transition.
  const update = () => {
    const t = (scene.time.now || 0) / 700;
    if (!scene.npcDialogueOpen && !scene.menuOpen && !scene.statsOpen && !scene.journalOpen && !scene.bookOpen && !scene.gameOver) windTime += Math.min(scene.game?.loop?.delta || 16, 50) / 1000;
    const strength = portalWindStrength(scene.player ? Math.hypot(scene.player.x - x, scene.player.y - y) : 300, scene.equippedArmor?.type === 'winter-coat');
    wind.clear();
    for (let i = 0; i < 28; i++) {
      const progress = (windTime * (0.2 + i % 4 * 0.035) + i * 0.173) % 1;
      const wx = x - 145 + progress * 290;
      const wy = y - 20 + i % 7 * 15 + Math.sin(progress * Math.PI * 2 + i) * 10;
      const fade = Math.sin(progress * Math.PI) * strength;
      wind.lineStyle(i % 3 ? 1 : 1.5, 0xe1f6ff, fade * 0.4);
      wind.lineBetween(wx - 20, wy + 5, wx - 10, wy + 1).lineBetween(wx - 10, wy + 1, wx, wy);
      wind.fillStyle(0xffffff, fade * 0.75).fillCircle(wx + 3, wy, i % 5 ? 0.9 : 1.6);
    }
    if (!scene.winterQuest && scene.player && Math.hypot(scene.player.x - x, scene.player.y - y) < 42) attemptMountainPortal(scene);
    label.setText(scene.equippedArmor?.type === 'winter-coat' ? 'Portal spre munți · Echipat pentru frig' : scene.winterQuest ? 'Portal spre munți · E' : 'Portal spre munți');
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
