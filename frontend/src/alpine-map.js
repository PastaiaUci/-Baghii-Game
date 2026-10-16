import { createAlpineVillagers } from './alpine-villagers.js';

export const ALPINE_GOLD = [
  [280, 610], [390, 610], [520, 620], [680, 615], [810, 610], [970, 620],
  [1150, 610], [1370, 615], [810, 480], [800, 360], [810, 760], [800, 920],
  [800, 1070], [370, 510], [1120, 535], [1100, 1000], [420, 1050], [250, 820],
].map(([x, y], index) => ({ x, y, value: index < 16 ? 40 : 30 }));

export function createAlpineMap(scene) {
  const ground = scene.add.graphics().setDepth(0);
  ground.fillStyle(0xdbe7ed).fillRect(0, 0, 1600, 1200);
  // Wind-sculpted snow and scattered ice crystals.
  for (let i = 0; i < 310; i += 1) {
    const x = 37 + i * 137 % 1520, y = 295 + i * 83 % 850;
    ground.fillStyle(i % 3 ? 0xecf2f3 : 0xbaccd7, 0.5).fillEllipse(x, y, 14 + i % 37, 3 + i % 8);
    if (i % 4 === 0) ground.fillStyle(0xffffff, 0.7).fillRect(x + 4, y, 2, 2);
  }
  // The summit ridge is scenery backed by a continuous collision boundary.
  for (let layer = 0; layer < 3; layer += 1) {
    for (let i = 0; i < 9; i += 1) {
      const x = i * 215 - 120 + layer * 40, base = 220 + layer * 39;
      const peak = 15 + (i * 37 + layer * 53) % 90;
      const center = x + 130;
      ground.fillStyle([0x9cabbc, 0x788c9f, 0x566e83][layer]).fillTriangle(x, base, x + 280, base, center, peak);
      ground.fillStyle([0xf0f4f6, 0xe3ecf0, 0xd5e3ec][layer]).fillTriangle(center - 46, peak + 72, center + 51, peak + 72, center, peak);
      ground.fillStyle(0xb2c5d5).fillTriangle(center, peak + 6, center + 51, peak + 72, center + 14, peak + 58);
      ground.lineStyle(2, 0x415c75, 0.4).lineBetween(center + 12, peak + 82, x + 211, base - 8);
    }
  }
  scene.level2Solids = scene.physics.add.staticGroup();
  const solid = (x, y, w, h) => scene.level2Solids.add(scene.add.zone(x, y, w, h));
  solid(800, 140, 1600, 280);
  [[800, 1184, 1600, 32], [20, 600, 40, 1200], [1580, 600, 40, 1200]].forEach(([x, y, w, h]) => solid(x, y, w, h));
  // Rock shelves around the valley, with snow resting on the upper edges.
  for (const side of [0, 1]) {
    for (let i = 0; i < 10; i += 1) {
      const x = side ? 1530 : 70, y = 335 + i * 84;
      ground.fillStyle(0x6a7a85).fillRoundedRect(x - 42, y - 34, 84, 78, 14);
      ground.fillStyle(0x9caab3).fillRoundedRect(x - 35, y - 30, 66, 22, 9);
      ground.fillStyle(0xf0f4f3).fillRoundedRect(x - 39, y - 35, 78, 13, 6);
      solid(x, y + 4, 72, 62);
    }
  }
  const path = (x, y, w, h) => {
    ground.fillStyle(0xf7f8f4).fillRoundedRect(x - 9, y - 7, w + 18, h + 14, 18);
    ground.fillStyle(0xabb8bb).fillRoundedRect(x, y, w, h, 14);
    ground.fillStyle(0xc3c9c4).fillRoundedRect(x + 5, y + 4, w - 10, h - 8, 10);
    for (let i = 12; i < Math.max(w, h); i += 22) {
      const px = x + (w > h ? i : w * 0.45), py = y + (w > h ? h * 0.45 : i);
      ground.fillStyle(0x87979e, 0.45).fillEllipse(px, py, 4, 2).fillEllipse(px + 6, py + 7, 4, 2);
    }
  };
  path(115, 582, 1360, 65); path(774, 302, 60, 820);
  path(350, 455, 45, 156); path(1100, 485, 45, 130);
  path(790, 985, 335, 43); path(395, 1025, 410, 43);
  path(225, 612, 42, 240);

  const chalet = (x, base, blue = false) => {
    const g = scene.add.graphics().setDepth(10 + base / 100);
    g.fillStyle(0x5f7783, 0.2).fillEllipse(x + 9, base + 4, 180, 27);
    g.fillStyle(0x5b463b).fillRect(x - 72, base - 81, 144, 81);
    g.fillStyle(blue ? 0x93aeb5 : 0xd4b596).fillRect(x - 67, base - 77, 134, 70);
    g.fillStyle(0x775a42).fillRect(x - 68, base - 20, 136, 5);
    for (const post of [-66, -24, 21, 62]) g.fillRect(x + post, base - 77, 4, 70);
    g.lineStyle(2, 0x806447).lineBetween(x - 61, base - 72, x - 28, base - 38).lineBetween(x + 28, base - 38, x + 60, base - 72);
    g.fillStyle(0x777a78).fillRect(x + 36, base - 134, 16, 47);
    g.fillStyle(0xe7edf0).fillRect(x + 33, base - 137, 22, 6);
    g.fillStyle(0x434e59).fillTriangle(x - 88, base - 77, x + 88, base - 77, x, base - 143);
    g.fillStyle(0xf0f4f3).fillTriangle(x - 84, base - 83, x + 84, base - 83, x, base - 144);
    g.fillStyle(0xc0d4df).fillTriangle(x, base - 140, x + 80, base - 84, x + 14, base - 91);
    g.fillStyle(0xffffff).fillRect(x - 82, base - 84, 164, 6);
    for (let i = -70; i < 76; i += 17) g.fillStyle(0xc1dbe6).fillTriangle(x + i, base - 78, x + i + 4, base - 78, x + i + 2, base - 67 + i % 5);
    for (const wx of [-48, 30]) {
      g.fillStyle(0x604a37).fillRect(x + wx - 3, base - 65, 27, 29);
      g.fillStyle(0xefc878).fillRect(x + wx, base - 62, 21, 22);
      g.fillStyle(0xffe7ac).fillRect(x + wx + 2, base - 60, 6, 17);
      g.fillStyle(0x8a6843).fillRect(x + wx + 9, base - 62, 2, 22).fillRect(x + wx, base - 53, 21, 2);
      g.fillStyle(0xf0f3ef).fillRect(x + wx - 4, base - 38, 29, 4);
    }
    g.fillStyle(0x5c4132).fillRoundedRect(x - 13, base - 42, 27, 36, 4);
    g.fillStyle(0x9c7750).fillRect(x - 9, base - 37, 19, 30);
    g.fillStyle(0xe5bf70).fillCircle(x + 6, base - 20, 1.5);
    g.fillStyle(0xb0b8b8).fillRect(x - 21, base - 4, 43, 8);
    g.fillStyle(0xf1f4ee).fillRect(x - 23, base - 5, 47, 3);
    solid(x, base - 30, 136, 60);
  };
  chalet(370, 460); chalet(1130, 490, true); chalet(1100, 975); chalet(420, 1020, true);
  const miganLabel = scene.add.text(420, 1044, '', { fontFamily: 'Arial', fontSize: '10px', color: '#fff0bf', stroke: '#344657', strokeThickness: 3 }).setOrigin(0.5).setDepth(30);
  const updateMiganDoor = () => miganLabel.setText(scene.winterQuest && scene.winterQuest.status !== 'blocked' ? 'Casa lui Miganul · E' : 'Casa lui Miganul');
  scene.events.on('update', updateMiganDoor); updateMiganDoor();
  scene.events.once('shutdown', () => scene.events.off('update', updateMiganDoor));

  // Frozen mountain lake, with a stepped shoreline collider.
  ground.fillStyle(0xf8fbf7).fillRoundedRect(1240, 755, 220, 258, 64);
  ground.fillStyle(0x829dac).fillRoundedRect(1250, 765, 200, 238, 59);
  ground.fillStyle(0x9ec8dc).fillRoundedRect(1256, 770, 188, 226, 55);
  ground.fillStyle(0xd3ebee, 0.6).fillEllipse(1335, 837, 113, 66);
  ground.lineStyle(2, 0xe5f5f3, 0.7).lineBetween(1294, 854, 1366, 891).lineBetween(1366, 891, 1338, 935).lineBetween(1366, 891, 1413, 880);
  solid(1350, 884, 146, 220); solid(1350, 884, 192, 150);

  const pine = (x, y, scale) => {
    const g = scene.add.graphics().setPosition(x, y).setScale(scale).setDepth(10 + y / 100);
    g.fillStyle(0x536e79, 0.2).fillEllipse(8, 3, 67, 17);
    g.fillStyle(0x665348).fillRect(-5, -23, 10, 27);
    for (let tier = 0; tier < 3; tier += 1) {
      const top = -108 + tier * 25, half = 22 + tier * 9;
      g.fillStyle(0x315654).fillTriangle(-half, top + 51, half, top + 51, 0, top);
      g.fillStyle(0xdeedf0).fillTriangle(-half + 3, top + 40, half - 3, top + 40, 0, top - 1);
      g.fillStyle(0xb5d2dc).fillTriangle(0, top, half - 3, top + 40, 7, top + 35);
    }
    solid(x, y - 2, 12 * scale, 13 * scale);
  };
  [[190, 400], [260, 430], [620, 410], [710, 350], [910, 390], [1000, 350], [1370, 440], [1450, 510],
    [160, 780], [330, 830], [580, 870], [660, 980], [930, 835], [970, 1080], [1220, 1100], [1410, 1080],
    [180, 1080], [280, 1130], [550, 1130], [1430, 690], [1200, 700], [1290, 350], [500, 330]].forEach(([x, y], i) => pine(x, y, 0.75 + i % 4 * 0.13));
  for (const [x, y] of [[210, 940], [660, 730], [1000, 730], [1400, 660], [600, 1080]]) {
    const g = scene.add.graphics().setDepth(10 + y / 100);
    g.fillStyle(0x778b99).fillRoundedRect(x - 23, y - 25, 46, 29, 10);
    g.fillStyle(0xeef4f5).fillRoundedRect(x - 22, y - 27, 44, 12, 6);
    solid(x, y - 7, 42, 21);
  }
  // Lanterns guide the main crossing without narrowing its walkable corridor.
  for (const [x, y] of [[300, 565], [710, 565], [910, 565], [1240, 565], [860, 1040]]) {
    const g = scene.add.graphics().setDepth(10 + y / 100);
    g.fillStyle(0xf4d49a, 0.12).fillEllipse(x, y - 12, 70, 33);
    g.fillStyle(0x4f5459).fillRect(x - 2, y - 43, 4, 45);
    g.fillStyle(0xf0c16e).fillRoundedRect(x - 6, y - 52, 12, 15, 2);
    g.fillStyle(0xf9f6e9).fillTriangle(x - 10, y - 52, x + 10, y - 52, x, y - 59);
    solid(x, y, 7, 7);
  }
  createAlpineVillagers(scene);
  createSnowfall(scene);
}

function createSnowfall(scene) {
  const snow = scene.add.graphics().setDepth(80).setScrollFactor(0);
  const render = () => {
    const camera = scene.cameras.main;
    const width = (camera.width || 960) / (camera.zoom || 1), height = (camera.height || 640) / (camera.zoom || 1);
    const time = (scene.time.now || 0) / 1000;
    snow.clear();
    for (let i = 0; i < 150; i += 1) {
      const speed = 13 + i % 5 * 7;
      const x = ((i * 83.7 + time * (5 + i % 4) + Math.sin(time + i) * 5) % (width + 40) + width + 40) % (width + 40) - 20;
      const y = (i * 51.3 + time * speed) % (height + 30) - 15;
      snow.fillStyle(0xffffff, 0.3 + i % 4 * 0.15).fillCircle(x, y, i % 7 ? 0.8 : 1.6);
    }
  };
  render(); scene.events.on('update', render);
  scene.events.once('shutdown', () => scene.events.off('update', render));
}

export function createAlpineGold(scene) {
  for (const pickup of scene.goldPickups || []) {
    scene.tweens.killTweensOf(pickup.sprite); pickup.sprite.destroy();
  }
  scene.goldPickups = ALPINE_GOLD.map(({ x, y, value }, index) => {
    const sprite = scene.add.sprite(x, y, 'gold-coin').setDepth(18).setScale(1.1);
    scene.tweens.add({ targets: sprite, y: y - 8, duration: 800 + index % 4 * 80, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return { sprite, value, level: 2, collected: false };
  });
}
