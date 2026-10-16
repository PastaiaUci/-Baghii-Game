// A spring in the quiet north-east corner, clear of houses and quest routes.
export function createVillageWater(scene) {
  const banks = scene.add.graphics().setDepth(1);
  const water = scene.add.graphics().setDepth(1.1);
  const motion = scene.add.graphics().setDepth(1.2);
  scene.worldObjects.push(banks, water, motion);

  banks.fillStyle(0x527044).fillRoundedRect(1280, 154, 260, 182, 55);
  banks.fillStyle(0xaaa17c).fillRoundedRect(1290, 160, 240, 164, 49);
  banks.fillStyle(0x777d65).fillRoundedRect(1298, 165, 224, 150, 44);
  water.fillStyle(0x377d87).fillRoundedRect(1305, 172, 210, 134, 40);
  water.fillStyle(0x429da3).fillRoundedRect(1310, 176, 200, 119, 37);
  water.fillStyle(0x2d7487).fillEllipse(1420, 231, 140, 91);
  water.fillStyle(0x63b5b2, 0.5).fillEllipse(1350, 255, 56, 46);

  // Layered rock ledge and moss framing the falling water.
  banks.fillStyle(0x42504c).fillRoundedRect(1334, 77, 151, 116, 18);
  banks.fillStyle(0x67746a).fillRoundedRect(1340, 78, 139, 100, 15);
  banks.fillStyle(0x899080).fillRoundedRect(1346, 78, 127, 26, 9);
  [[1341, 110, 26, 23], [1450, 108, 25, 30], [1338, 145, 30, 30], [1453, 148, 29, 34]].forEach(([x, y, w, h]) => {
    banks.fillStyle(0x7e8876).fillRoundedRect(x, y, w, h, 5);
    banks.fillStyle(0xa4ab90, 0.6).fillRect(x + 3, y + 2, w - 6, 3);
    banks.fillStyle(0x4d7947).fillRect(x + 2, y + h - 5, w - 4, 6);
  });
  water.fillStyle(0x367f8a).fillRoundedRect(1371, 81, 74, 32, 9);
  water.fillStyle(0x72c6d0).fillRect(1374, 101, 68, 91);
  water.fillStyle(0xa8e0df).fillRect(1381, 102, 12, 92);
  water.fillStyle(0xdbf2df, 0.7).fillRect(1426, 103, 7, 89);

  // Reeds and shoreline pebbles stay outside the swimming area.
  [[1298, 235], [1314, 296], [1489, 299], [1519, 221]].forEach(([x, y]) => {
    banks.fillStyle(0x7f8872).fillEllipse(x + 4, y + 3, 17, 9);
    banks.lineStyle(2, 0x416542);
    banks.lineBetween(x, y, x - 4, y - 18);
    banks.lineBetween(x + 4, y, x + 8, y - 23);
    banks.lineBetween(x + 2, y, x + 1, y - 26);
    banks.fillStyle(0xb79a57).fillRect(x - 5, y - 22, 3, 7);
    banks.fillRect(x + 7, y - 26, 3, 7);
  });

  // Stepped footprints follow the rounded shoreline rather than its bounding box.
  [[1410, 119, 150, 90], [1410, 233, 190, 94], [1410, 233, 150, 134], [1410, 233, 210, 54]].forEach(([x, y, w, h]) => {
    const solid = scene.add.zone(x, y, w, h);
    scene.obstacles.add(solid);
    scene.worldObjects.push(solid);
  });

  const animate = () => {
    if (!motion.visible) return;
    const time = scene.time.now;
    motion.clear();
    // Thin highlights travel downward, while foam spreads into the pool.
    for (let i = 0; i < 10; i += 1) {
      const y = 105 + ((time * 0.075 + i * 19) % 78);
      const x = 1378 + (i * 17 % 58);
      motion.fillStyle(0xe0f9ef, 0.55).fillRoundedRect(x, y, 2 + i % 3, 9 + i % 5, 1);
    }
    for (let i = 0; i < 4; i += 1) {
      const phase = (time / 1700 + i / 4) % 1;
      motion.lineStyle(2, 0xc9f2df, (1 - phase) * 0.6);
      motion.strokeEllipse(1408, 196 + phase * 20, 35 + phase * 85, 10 + phase * 20);
    }
    motion.fillStyle(0xe7f5e5, 0.8);
    for (let i = 0; i < 8; i += 1) {
      motion.fillCircle(1378 + i * 9, 193 + Math.sin(time / 220 + i * 2) * 3, 2 + i % 2);
    }
    for (let i = 0; i < 9; i += 1) {
      const x = 1335 + i * 18;
      const y = 239 + Math.sin(i * 5) * 34;
      motion.lineStyle(1, 0x9ad8cd, 0.25 + (Math.sin(time / 700 + i) + 1) * 0.15);
      motion.lineBetween(x, y, x + 8 + Math.sin(time / 900 + i) * 3, y);
    }
  };
  animate();
  scene.events.on('update', animate);
  scene.events.once('shutdown', () => scene.events.off('update', animate));
}
