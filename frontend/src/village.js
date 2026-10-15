// Visuals and solid footprints share world coordinates; roofs and foliage are decorative.
export function createVillageGround(scene, width, height) {
  const g = scene.make.graphics();
  g.fillStyle(0x79aa58);
  g.fillRect(0, 0, width, height);
  for (let y = 8; y < height; y += 24) {
    for (let x = 8; x < width; x += 24) {
      const seed = (x * 17 + y * 31) % 97;
      g.fillStyle(seed % 3 ? 0x65964a : 0x91ba68, 0.55);
      g.fillRect(x + seed % 13, y + seed % 9, 3, 2);
      if (seed % 7 === 0) {
        g.fillStyle(0xe9d99a, 0.8);
        g.fillRect(x + 4, y + 6, 2, 2);
      }
    }
  }
  const paths = [
    [130, 202, 950, 46], [608, 220, 46, 820],
    [608, 682, 790, 46], [1022, 220, 46, 828],
    [230, 1020, 1140, 40], [230, 690, 40, 350],
    [790, 592, 42, 130], [1160, 590, 42, 115],
    [860, 852, 40, 190], [1320, 816, 40, 240],
    [1040, 398, 130, 36], [250, 960, 380, 36],
  ];
  paths.forEach(([x, y, w, h]) => {
    g.fillStyle(0x9e855c);
    g.fillRoundedRect(x - 4, y - 4, w + 8, h + 8, 12);
    g.fillStyle(0xd3bb88);
    g.fillRoundedRect(x, y, w, h, 9);
  });
  // Open village square with a paved apron around the well.
  g.fillStyle(0xbaa986);
  g.fillRoundedRect(1198, 462, 105, 130, 12);
  g.lineStyle(1, 0x9b927d, 0.6);
  for (let y = 470; y < 585; y += 16) {
    g.lineBetween(1204, y, 1296, y);
    for (let x = 1208 + (y % 32 ? 8 : 0); x < 1296; x += 22) g.lineBetween(x, y, x, y + 14);
  }
  // Small cultivated plots, kept clear of the main routes.
  [[140, 780, 150, 90], [1140, 870, 150, 110]].forEach(([x, y, w, h]) => {
    g.fillStyle(0x9b7950);
    g.fillRect(x - 5, y - 5, w + 10, h + 10);
    g.fillStyle(0x715239);
    g.fillRect(x, y, w, h);
    for (let row = y + 8; row < y + h; row += 18) {
      g.fillStyle(0x4e3829);
      g.fillRect(x + 4, row + 5, w - 8, 3);
      for (let col = x + 10; col < x + w; col += 18) {
        g.fillStyle(0x4f793d);
        g.fillEllipse(col, row, 10, 5);
        g.fillStyle(0x9ab75b);
        g.fillRect(col, row - 3, 2, 5);
      }
    }
  });
  g.generateTexture('ground', width, height);
  g.destroy();
  scene.worldGround = scene.add.image(0, 0, 'ground').setOrigin(0).setDepth(0);
}

export function createVillageProps(scene) {
  const solid = (x, y, width, height) => {
    const zone = scene.add.zone(x, y, width, height);
    scene.obstacles.add(zone);
    scene.worldObjects.push(zone);
    return zone;
  };
  createVillageWalls(scene, scene.physics.world.bounds.width, scene.physics.world.bounds.height);
  const decoration = scene.add.graphics().setDepth(1);
  scene.worldObjects.push(decoration);
  const houses = [
    [1150, 520, 0.9, 'house'], [820, 540, 1, 'house-blue'],
    [880, 790, 0.95, 'house'], [260, 900, 1.1, 'house-blue'],
    [1340, 760, 0.9, 'house'], [1160, 340, 0.75, 'house-blue'],
  ];
  houses.forEach(([x, y, scale, texture]) => {
    const baseY = y + 62 * scale;
    decoration.fillStyle(0x355039, 0.2);
    decoration.fillEllipse(x + 7, baseY + 3, 142 * scale, 24 * scale);
    decoration.fillStyle(0xb9aa87);
    decoration.fillRect(x - 16 * scale, baseY, 32 * scale, 14 * scale);
    const house = scene.add.image(x, baseY, texture).setOrigin(0.5, 1).setScale(scale);
    house.setDepth(10 + baseY / 100);
    scene.worldObjects.push(house);
    // Only the walls occupy ground; the roof overhang can be walked behind.
    solid(x, baseY - 27 * scale, 120 * scale, 54 * scale);
  });
  const fences = [[150, 700, 180], [1100, 1020, 180], [280, 1100, 120], [1130, 440, 120], [760, 170, 180]];
  fences.forEach(([x, y, width]) => {
    const fence = scene.add.graphics().setDepth(10 + y / 100);
    fence.fillStyle(0x67462e);
    fence.fillRect(x - width / 2, y - 16, width, 4);
    fence.fillRect(x - width / 2, y - 7, width, 4);
    for (let post = x - width / 2; post <= x + width / 2; post += 20) {
      fence.fillStyle(0x936b42);
      fence.fillRect(post - 3, y - 23, 6, 25);
      fence.fillStyle(0xc69b65);
      fence.fillRect(post - 3, y - 23, 6, 3);
    }
    scene.worldObjects.push(fence);
    solid(x, y - 2, width + 6, 8);
  });
  [[90, 420], [180, 570], [360, 650], [400, 940], [90, 1030], [480, 1130],
    [750, 330], [950, 150], [1430, 390], [1450, 600], [1480, 900], [1390, 1110],
    [780, 1130], [440, 130]].forEach(([x, y], index) => {
    const scale = 0.85 + (index % 3) * 0.12;
    decoration.fillStyle(0x355039, 0.2);
    decoration.fillEllipse(x + 4, y + 2, 48 * scale, 14 * scale);
    const tree = scene.add.image(x, y, 'tree').setOrigin(0.5, 1).setScale(scale);
    tree.setDepth(10 + y / 100);
    scene.worldObjects.push(tree);
    solid(x, y - 6 * scale, 12 * scale, 12 * scale);
  });
  const well = scene.add.graphics().setDepth(10 + 544 / 100);
  well.fillStyle(0x47585a);
  well.fillEllipse(1248, 534, 44, 24);
  well.fillStyle(0x899794);
  well.fillRect(1226, 513, 44, 20);
  well.fillEllipse(1248, 515, 44, 24);
  well.fillStyle(0x304e55);
  well.fillEllipse(1248, 514, 28, 13);
  well.fillStyle(0x715137);
  well.fillRect(1227, 484, 5, 34);
  well.fillRect(1264, 484, 5, 34);
  well.fillStyle(0xa86443);
  well.fillTriangle(1219, 486, 1277, 486, 1248, 468);
  scene.worldObjects.push(well);
  solid(1248, 528, 44, 24);
}

export function createVillageWalls(scene, width, height) {
  // Four continuous bodies close the corners as well as the visible stone border.
  const walls = [
    { x: 0, y: 0, w: width, h: 44 },
    { x: 0, y: height - 32, w: width, h: 32 },
    { x: 0, y: 44, w: 32, h: height - 76 },
    { x: width - 32, y: 44, w: 32, h: height - 76 },
  ];
  walls.forEach(({ x, y, w, h }) => {
    const zone = scene.add.zone(x + w / 2, y + h / 2, w, h);
    scene.obstacles.add(zone);
    scene.worldObjects.push(zone);
    const g = scene.add.graphics().setDepth(10 + (y + h) / 100);
    scene.worldObjects.push(g);
    g.fillStyle(0x3c4648).fillRect(x, y, w, h);
    for (let row = 0; row < h; row += 12) {
      for (let col = 0; col < w; col += 24) {
        const offset = row % 24 ? -12 : 0;
        const left = Math.max(0, col + offset);
        const right = Math.min(w, col + offset + 22);
        if (right <= left) continue;
        g.fillStyle((row + col) % 48 ? 0x79847a : 0x899184);
        g.fillRect(x + left, y + row + 1, right - left, Math.min(10, h - row - 1));
        g.fillStyle(0xa4ac97, 0.55).fillRect(x + left + 1, y + row + 1, Math.max(1, right - left - 2), 2);
      }
    }
    g.fillStyle(0xa6aa92).fillRect(x, y, w, 3);
    g.fillStyle(0x263c2d, 0.5).fillRect(x, y + h - 3, w, 3);
    // Small moss patches soften the stone without obscuring its edge.
    for (let col = x + 7; col < x + w - 3; col += 53) {
      g.fillStyle(0x5b7848).fillRect(col, y + h - 5, Math.min(8, x + w - col), 3);
    }
  });
}

export function createVillageTextures(scene) {
  const tree = scene.make.graphics();
  tree.fillStyle(0x67472d);
  tree.fillRect(27, 43, 10, 28);
  tree.fillStyle(0x9b7042);
  tree.fillRect(29, 45, 3, 23);
  tree.fillStyle(0x315d3e);
  tree.fillEllipse(32, 35, 58, 48);
  tree.fillStyle(0x437d47);
  tree.fillEllipse(23, 27, 38, 38);
  tree.fillEllipse(43, 30, 35, 35);
  tree.fillStyle(0x63974f);
  tree.fillEllipse(29, 18, 34, 26);
  tree.fillStyle(0x89ae5b);
  tree.fillEllipse(25, 14, 18, 9);
  tree.generateTexture('tree', 64, 72);
  tree.destroy();
  [['house', 0xa95b43, 0xd38257], ['house-blue', 0x466776, 0x7396a0]].forEach(([key, roof, highlight]) => {
    const g = scene.make.graphics();
    g.fillStyle(0x5a4231);
    g.fillRect(16, 66, 120, 60);
    g.fillStyle(0xebd6ab);
    g.fillRect(20, 66, 112, 54);
    g.fillStyle(0xc5ae83);
    g.fillRect(118, 66, 14, 54);
    g.fillStyle(0x947451);
    g.fillRect(20, 114, 112, 6);
    g.fillRect(20, 72, 5, 42);
    g.fillRect(113, 72, 5, 42);
    g.fillStyle(0x765c4c);
    g.fillRect(106, 14, 14, 29);
    g.fillStyle(0xb2a08a);
    g.fillRect(104, 12, 18, 6);
    g.fillStyle(0x523e36);
    g.fillTriangle(6, 73, 146, 73, 76, 19);
    g.fillStyle(roof);
    g.fillTriangle(9, 66, 143, 66, 76, 16);
    for (let row = 30; row < 64; row += 9) {
      const half = (row - 16) * 1.34;
      g.lineStyle(2, highlight, 0.8);
      g.lineBetween(76 - half, row, 76 + half, row);
      g.lineStyle(1, 0x392f2b, 0.3);
      for (let x = 76 - half + 10; x < 76 + half; x += 16) g.lineBetween(x, row, x - 3, row + 7);
    }
    g.fillStyle(highlight);
    g.fillRect(9, 66, 134, 4);
    g.fillStyle(0x644732);
    g.fillRect(62, 82, 28, 38);
    g.fillStyle(0x997044);
    g.fillRect(66, 86, 20, 34);
    g.fillStyle(0xc4a067);
    g.fillRect(68, 87, 2, 31);
    g.fillStyle(0xf0cc70);
    g.fillCircle(82, 104, 2);
    [32, 96].forEach((x) => {
      g.fillStyle(0x75563b);
      g.fillRect(x, 81, 23, 24);
      g.fillStyle(0x94c2c4);
      g.fillRect(x + 3, 84, 17, 16);
      g.fillStyle(0xd7ede0);
      g.fillRect(x + 5, 85, 3, 10);
      g.fillStyle(0xe5c791);
      g.fillRect(x + 10, 84, 2, 17);
      g.fillRect(x + 3, 92, 17, 2);
      g.fillStyle(0x745038);
      g.fillRect(x - 2, 103, 27, 5);
      g.fillStyle(0x56814a);
      g.fillRect(x + 1, 101, 22, 3);
      g.fillStyle(0xe3aa82);
      g.fillRect(x + 4, 99, 3, 3);
      g.fillRect(x + 15, 99, 3, 3);
    });
    g.generateTexture(key, 152, 128);
    g.destroy();
  });
}
