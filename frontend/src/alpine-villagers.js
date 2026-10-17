import { createFirewoodWorld } from './firewood-quest.js';
// Ambient residents stay separate from the combat villagers and quest counters.
export const WINTER_RESIDENTS = [
  { name: 'Besleaga', x: 440, y: 660, range: 65, coat: 0x537d88, hat: 0xd6af68 },
  { name: 'Dmantion', x: 1000, y: 650, range: 80, coat: 0x954e64, hat: 0xeee0c2 },
  { name: 'Diriga Sniper', x: 820, y: 870, range: 55, vertical: true, coat: 0x6c7353, hat: 0x825c48 },
  { name: 'Rauta', x: 650, y: 1065, range: 65, coat: 0x73648f, hat: 0xd9a473 },
  { name: 'Tomaso', x: 1190, y: 580, range: 45, coat: 0x87674e, hat: 0x4e697c },
];

function drawResident(g, resident, phase) {
  const step = Math.sin(phase) * 2;
  g.clear().fillStyle(0x42596b, 0.2).fillEllipse(0, 2, 23, 7);
  g.fillStyle(0x303a45).fillRoundedRect(-8, -7 + step, 7, 9, 2).fillRoundedRect(2, -7 - step, 7, 9, 2);
  g.fillStyle(resident.coat).fillRoundedRect(-12, -29, 24, 25, 5);
  g.fillStyle(0xe2d5bc).fillRect(-12, -9, 24, 4).fillRoundedRect(-13, -31, 26, 7, 3);
  g.fillStyle(resident.coat).fillRoundedRect(-16, -26 - step, 6, 17, 3).fillRoundedRect(10, -26 + step, 6, 17, 3);
  g.fillStyle(0x3d4652).fillCircle(-13, -10 - step, 3).fillCircle(13, -10 + step, 3);
  g.fillStyle(0xe4b68e).fillRoundedRect(-8, -43, 16, 15, 4);
  g.fillStyle(resident.hat).fillRoundedRect(-10, -47, 20, 10, 4).fillCircle(0, -49, 4);
  g.fillStyle(0xf1e6cf).fillRect(-10, -39, 20, 3);
  g.fillStyle(0x30333e).fillRect(-5, -34, 2, 2).fillRect(3, -34, 2, 2);
  g.fillStyle(resident.hat).fillRect(-9, -28, 18, 4).fillRect(5, -25, 5, 12);
  g.fillStyle(0xd8b77b).fillCircle(0, -19, 1).fillCircle(0, -13, 1);
}

export function createAlpineVillagers(scene) {
  const residents = WINTER_RESIDENTS.map((resident, index) => ({
    ...resident, elapsed: index * 1.7,
    art: scene.add.graphics(),
    label: scene.add.text(resident.x, resident.y - 60, resident.name, { fontFamily: 'Arial', fontSize: '9px', color: '#e9f1ed', stroke: '#344657', strokeThickness: 3 }).setOrigin(0.5).setDepth(30),
  }));
  scene.alpineResidents = residents;
  let santa = scene.add.graphics().setPosition(435, 790).setDepth(17.9);
  scene.santaSleighArt = santa;
  // Snapped runners, scattered planks, a torn sack and the overturned sleigh.
  santa.fillStyle(0x52697c, 0.18).fillEllipse(0, 12, 145, 42);
  santa.lineStyle(4, 0xc4b08b).lineBetween(-62, 16, -12, 26).lineBetween(5, 29, 47, 19).lineBetween(47, 19, 56, 7);
  santa.fillStyle(0x6b4034).fillTriangle(-54, -12, 25, 9, -51, 17);
  santa.fillStyle(0xa44340).fillTriangle(-50, -18, 23, 5, -13, -23);
  santa.lineStyle(3, 0xe2b36e).lineBetween(-50, -18, 23, 5).lineBetween(-51, 17, -54, -12);
  santa.fillStyle(0x8b6246).fillRect(-30, 31, 23, 4).fillRect(34, 34, 20, 4);
  santa.fillStyle(0x876c4e).fillEllipse(44, -5, 34, 25);
  santa.fillStyle(0xd9b46d).fillRect(48, -17, 4, 9);
  santa.fillStyle(0x4b6c45).fillRoundedRect(13, 35, 8, 16, 2).fillRect(15, 30, 4, 7);
  // Fully clothed Santa sprawled in the snow, with a red nose and white beard.
  santa = scene.add.graphics().setPosition(435, 790).setDepth(17.9);
  santa.fillStyle(0x282d37).fillRoundedRect(-50, 47, 20, 10, 3).fillRoundedRect(-45, 62, 20, 10, 3);
  santa.fillStyle(0xb63f43).fillRoundedRect(-32, 43, 43, 28, 9).fillRoundedRect(-5, 65, 25, 8, 3);
  santa.fillStyle(0xf0eadb).fillRect(-29, 44, 6, 26).fillRect(-6, 44, 6, 25);
  santa.fillStyle(0x382d30).fillRect(-17, 43, 5, 28);
  santa.lineStyle(2, 0xe6bd66).strokeRect(-19, 53, 9, 9);
  santa.fillStyle(0xf2dfc6).fillCircle(16, 52, 12);
  santa.fillStyle(0xfff2df).fillEllipse(7, 58, 17, 21);
  santa.fillStyle(0xe57170).fillCircle(22, 53, 4);
  santa.lineStyle(1, 0x554349).lineBetween(17, 47, 21, 48);
  santa.fillStyle(0xc64247).fillTriangle(10, 40, 29, 47, 34, 29);
  santa.lineStyle(5, 0xf6edda).lineBetween(10, 40, 29, 47);
  santa.fillStyle(0xf6edda).fillCircle(34, 29, 4);
  scene.add.text(435, 746, 'Moș Crăciun · mort de beat', { fontSize: '10px', color: '#ffe2b0', stroke: '#344657', strokeThickness: 3 }).setOrigin(0.5).setDepth(30);
  const snore = scene.add.text(477, 816, 'Zzz…', { fontSize: '11px', color: '#e8f3ff', stroke: '#344657', strokeThickness: 2 }).setDepth(30);
  scene.santaSleighCollider = scene.add.zone(430, 795, 108, 40);
  scene.level2Solids.add(scene.santaSleighCollider);
  scene.level2Solids.add(scene.add.zone(425, 848, 74, 23));
  createFirewoodWorld(scene);
  let elapsed = 0;
  const update = () => {
    if (scene.currentLevel !== 2 || scene.physics.world.isPaused || scene.npcDialogueOpen || scene.menuOpen || scene.statsOpen || scene.gameOver || scene.bookOpen || scene.chapterDialogueOpen || scene.levelTransitioning) return;
    const dt = Math.min(scene.game.loop.delta, 50) / 1000;
    elapsed += dt;
    for (const resident of residents) {
      resident.elapsed += dt;
      const offset = Math.sin(resident.elapsed * 0.3) * resident.range;
      const x = resident.x + (resident.vertical ? 0 : offset), y = resident.y + (resident.vertical ? offset : 0);
      drawResident(resident.art, resident, resident.elapsed * 7);
      resident.art.setPosition(x, y).setDepth(10 + y / 100);
      resident.label.setPosition(x, y - 60);
    }
    snore.setPosition(477, 816 - Math.sin(elapsed * 1.8) * 3).setAlpha(0.6 + Math.sin(elapsed * 1.8) * 0.3);
  };
  residents.forEach((resident) => { drawResident(resident.art, resident, 0); resident.art.setPosition(resident.x, resident.y).setDepth(10 + resident.y / 100); });
  scene.events.on('update', update);
  scene.events.once('shutdown', () => scene.events.off('update', update));
}
