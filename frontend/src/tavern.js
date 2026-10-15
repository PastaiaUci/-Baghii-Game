export function createTavern(scene) {
  const g = scene.make.graphics();
  g.fillStyle(0x322c2b).fillRect(18, 60, 184, 86);
  g.fillStyle(0xc7ad7d).fillRect(22, 64, 176, 78);
  g.fillStyle(0x71503c).fillRect(22, 64, 8, 78).fillRect(190, 64, 8, 78).fillRect(22, 111, 176, 5);
  g.fillTriangle(30, 68, 80, 108, 72, 108).fillTriangle(190, 68, 140, 108, 148, 108);
  g.fillStyle(0x442f32).fillTriangle(4, 65, 216, 65, 110, 8);
  g.fillStyle(0x8d4d3d).fillTriangle(8, 58, 212, 58, 110, 4);
  g.lineStyle(2, 0xbc7954, 0.8);
  for (let y = 20; y < 58; y += 9) g.lineBetween(110 - (y - 4) * 1.85, y, 110 + (y - 4) * 1.85, y);
  g.fillStyle(0x3e2b26).fillRoundedRect(91, 91, 38, 53, 9);
  g.fillStyle(0x84583b).fillRect(96, 103, 28, 39);
  g.fillStyle(0xe1bd65).fillCircle(119, 124, 2);
  for (const x of [41, 149]) {
    g.fillStyle(0x59412e).fillRect(x - 3, 88, 36, 30);
    g.fillStyle(0xe6b86c).fillRect(x, 91, 30, 23);
    g.fillStyle(0x75553b).fillRect(x + 14, 91, 3, 23).fillRect(x, 101, 30, 3);
  }
  g.fillStyle(0x32281f).fillRoundedRect(47, 64, 126, 22, 3);
  g.lineStyle(1, 0xc59d58).strokeRoundedRect(47, 64, 126, 22, 3);
  g.generateTexture('village-tavern', 220, 150); g.destroy();
  const x = 430, base = 390;
  const shadow = scene.add.ellipse(x + 7, base + 3, 215, 23, 0x203c2b, 0.2).setDepth(1);
  const tavern = scene.add.image(x, base, 'village-tavern').setOrigin(0.5, 1).setDepth(10 + base / 100);
  const sign = scene.add.text(x, base - 75, 'CÂRCIUMA BEȚIVILOR', { fontFamily: 'Arial', fontSize: '9px', fontStyle: 'bold', color: '#f4d89d' }).setOrigin(0.5).setDepth(tavern.depth + 0.01);
  const footprint = scene.add.zone(x, base - 41, 184, 82);
  scene.obstacles.add(footprint);
  const apron = scene.add.rectangle(x, base + 11, 44, 18, 0xb3a380).setDepth(1);
  scene.worldObjects.push(shadow, tavern, sign, footprint, apron);
  scene.tavernDoorHint = scene.add.text(x, base + 36, 'E · Intră în cârciumă', {
    fontFamily: 'Arial', fontSize: '11px', color: '#ffe5a5', stroke: '#29201d', strokeThickness: 3,
  }).setOrigin(0.5).setDepth(25).setVisible(false);
  scene.worldObjects.push(scene.tavernDoorHint);
}
