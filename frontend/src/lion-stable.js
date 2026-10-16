export function createLionStable(scene) {
  const ground = scene.add.graphics().setDepth(1);
  const barn = scene.add.graphics().setDepth(11.25);
  const backFence = scene.add.graphics().setDepth(10.8);
  const frontFence = scene.add.graphics().setDepth(11.9);
  scene.worldObjects.push(ground, barn, backFence, frontFence);
  ground.fillStyle(0xa49160).fillRoundedRect(61, 60, 303, 132, 8);
  ground.fillStyle(0xb8a775).fillRoundedRect(68, 67, 289, 117, 6);
  for (let i = 0; i < 45; i += 1) {
    ground.fillStyle(i % 2 ? 0xcdb777 : 0x938454, 0.65);
    ground.fillRect(75 + i * 47 % 273, 75 + i * 31 % 98, 5, 2);
  }
  // Open timber shelter with hay inside.
  barn.fillStyle(0x4f382b).fillRect(78, 91, 102, 43);
  barn.fillStyle(0x8e6841).fillRect(81, 87, 96, 18);
  for (let x = 84; x < 178; x += 12) {
    barn.fillStyle(0xb08850).fillRect(x, 89, 2, 20);
  }
  barn.fillStyle(0xd3b45d).fillEllipse(128, 127, 83, 14);
  barn.lineStyle(1, 0xf2d784);
  for (let i = 0; i < 16; i += 1) barn.lineBetween(90 + i * 5, 130, 94 + i * 5, 123);
  barn.fillStyle(0x805238).fillRect(78, 90, 7, 45).fillRect(173, 90, 7, 45);
  barn.fillStyle(0x4e3630).fillTriangle(68, 96, 190, 96, 129, 58);
  barn.fillStyle(0x9d5941).fillTriangle(71, 90, 187, 90, 129, 55);
  barn.lineStyle(2, 0xc28658);
  for (let y = 68; y < 90; y += 7) barn.lineBetween(129 - (y - 55) * 1.65, y, 129 + (y - 55) * 1.65, y);
  const sign = scene.add.text(129, 99, 'GRAJDUL LEILOR', {
    fontFamily: 'Arial', fontSize: '7px', fontStyle: 'bold', color: '#ffe1a0', backgroundColor: '#433023', padding: { x: 3, y: 2 },
  }).setOrigin(0.5).setDepth(11.26);
  scene.worldObjects.push(sign);
  const fence = (g, x, y, length, vertical = false) => {
    g.lineStyle(3, 0x775032);
    for (const offset of [-10, -3]) g.lineBetween(x, y + offset, x + (vertical ? 0 : length), y + (vertical ? length : 0) + offset);
    for (let i = 0; i <= length; i += 24) {
      const px = x + (vertical ? 0 : i), py = y + (vertical ? i : 0);
      g.fillStyle(0xa97e49).fillRect(px - 3, py - 17, 6, 22);
      g.fillStyle(0xd1aa67).fillRect(px - 3, py - 17, 6, 3);
    }
  };
  fence(backFence, 68, 76, 288);
  fence(backFence, 68, 76, 108, true);
  fence(frontFence, 356, 76, 108, true);
  fence(frontFence, 68, 184, 288);
  // Enclosure and barn footprints also block villagers and roaming animals.
  [[212, 72, 296, 8], [68, 130, 8, 116], [356, 130, 8, 116], [212, 184, 296, 8], [129, 111, 104, 44]].forEach(([x, y, w, h]) => {
    const solid = scene.add.zone(x, y, w, h);
    scene.obstacles.add(solid);
    scene.worldObjects.push(solid);
  });
  const lions = [
    { x: 219, y: 113, targetX: 315, targetY: 150, speed: 18 },
    { x: 310, y: 151, targetX: 218, targetY: 113, speed: 15 },
    { x: 269, y: 134, targetX: 300, targetY: 111, speed: 21 },
  ].map((lion, index) => {
    lion.art = scene.add.graphics();
    lion.phase = index * 2;
    scene.worldObjects.push(lion.art);
    return lion;
  });
  const animate = (_time, delta = 0) => {
    if (!ground.visible) return;
    lions.forEach((lion) => {
      let dx = lion.targetX - lion.x, dy = lion.targetY - lion.y;
      let distance = Math.hypot(dx, dy);
      if (distance < 2) {
        lion.targetX = 211 + Math.random() * 118;
        lion.targetY = 108 + Math.random() * 51;
        dx = lion.targetX - lion.x; dy = lion.targetY - lion.y;
        distance = Math.hypot(dx, dy);
      }
      const travel = Math.min(distance, lion.speed * Math.min(delta, 50) / 1000);
      if (distance) { lion.x += dx / distance * travel; lion.y += dy / distance * travel; }
      const g = lion.art;
      const step = Math.sin(scene.time.now / 110 + lion.phase) * 1.7;
      g.clear().setPosition(lion.x, lion.y).setScale(dx < 0 ? -1 : 1, 1).setDepth(10 + lion.y / 100);
      g.fillStyle(0x3d3526, 0.22).fillEllipse(0, 7, 38, 10);
      g.lineStyle(2, 0xbb8b42).lineBetween(-15, -2, -23, -8);
      g.fillStyle(0x67402b).fillEllipse(-24, -9, 6, 5);
      g.fillStyle(0xb78235).fillRect(-12 + step, 0, 5, 11).fillRect(6 - step, 0, 5, 11);
      g.fillStyle(0xd8aa50).fillEllipse(-1, -3, 34, 18);
      g.fillStyle(0xe8bf6b).fillEllipse(-3, -6, 25, 11);
      g.fillStyle(0x805031).fillCircle(13, -9, 12);
      g.fillStyle(0xa76a32).fillCircle(13, -10, 10);
      g.fillStyle(0xd6a34c).fillCircle(8, -18, 4).fillCircle(18, -18, 4);
      g.fillStyle(0xe8bc67).fillEllipse(15, -10, 14, 15);
      g.fillStyle(0xf5dda0).fillEllipse(19, -5, 10, 6);
      g.fillStyle(0x302b27).fillRect(15, -12, 2, 2).fillRect(22, -7, 3, 2);
    });
  };
  animate();
  scene.events.on('update', animate);
  scene.events.once('shutdown', () => scene.events.off('update', animate));
}
