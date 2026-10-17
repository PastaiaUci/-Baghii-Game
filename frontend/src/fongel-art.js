export function createFongelTexture(scene) {
  if (scene.textures.exists('fongel-npc')) return;
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0x273040).fillRoundedRect(10, 58, 13, 15, 4).fillRoundedRect(29, 58, 13, 15, 4);
  g.fillStyle(0x8e7659).fillRect(10, 69, 13, 3).fillRect(29, 69, 13, 3);
  g.fillStyle(0x233c3e).fillRoundedRect(9, 29, 34, 35, 7);
  g.fillStyle(0x446260).fillRoundedRect(12, 31, 28, 29, 5);
  g.lineStyle(2, 0xc0a170).lineBetween(26, 36, 26, 61);
  g.fillStyle(0x304849).fillRoundedRect(3, 30, 9, 32, 4).fillRoundedRect(40, 30, 9, 32, 4);
  g.fillStyle(0x513d35).fillCircle(7, 61, 5).fillCircle(45, 61, 5);
  g.fillStyle(0x49312b).fillRoundedRect(13, 6, 26, 28, 7);
  g.fillStyle(0xe4b48c).fillRoundedRect(15, 10, 22, 24, 6);
  g.fillStyle(0xf4d2ae).fillRoundedRect(18, 13, 16, 14, 4);
  g.fillStyle(0x9c624c, 0.4).fillEllipse(18, 26, 5, 4).fillEllipse(34, 26, 5, 4);
  g.lineStyle(2, 0x584139).lineBetween(18, 19, 23, 18).lineBetween(29, 18, 34, 19);
  g.fillStyle(0x26313d).fillCircle(21, 22, 1.4).fillCircle(31, 22, 1.4);
  g.fillStyle(0xbc8970).fillRect(25, 23, 3, 6);
  g.fillStyle(0x704b39).fillRoundedRect(20, 29, 13, 3, 1);
  g.fillStyle(0x303943).fillRoundedRect(10, 3, 32, 12, 4).fillRoundedRect(10, 12, 6, 13, 3).fillRoundedRect(36, 12, 6, 13, 3);
  g.fillStyle(0x7b858a).fillRoundedRect(13, 4, 26, 7, 3);
  g.fillStyle(0xf4f1e7).fillRoundedRect(12, 33, 28, 5, 2).fillRect(32, 38, 7, 19);
  g.fillStyle(0xc93e49).fillRoundedRect(12, 38, 28, 5, 2).fillRect(32, 46, 7, 6);
  // A Polish flag patch on the sleeve.
  g.fillStyle(0xffffff).fillRect(3, 37, 8, 4); g.fillStyle(0xd83e4d).fillRect(3, 41, 8, 4);
  g.generateTexture('fongel-npc', 52, 76); g.destroy();
}
