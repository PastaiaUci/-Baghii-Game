export function createMetinTextures(scene) {
  if (!scene.textures.exists('metin-stone')) {
    const g = scene.make.graphics();
    g.fillStyle(0x242d43).fillTriangle(5, 64, 57, 64, 31, 3);
    g.fillStyle(0x555b78).fillTriangle(10, 60, 31, 3, 34, 64);
    g.fillStyle(0x7d8195).fillTriangle(13, 43, 31, 3, 28, 47);
    g.fillStyle(0x363c59).fillTriangle(31, 3, 55, 59, 33, 64);
    g.fillStyle(0x171f32).fillRect(17, 59, 30, 7);
    g.lineStyle(2, 0xe0bdff).lineBetween(30, 14, 27, 28).lineBetween(27, 28, 37, 37).lineBetween(37, 37, 28, 50).lineBetween(28, 50, 34, 60);
    g.lineStyle(1, 0x9bcfff).lineBetween(18, 36, 27, 28).lineBetween(37, 37, 45, 45);
    g.fillStyle(0x763f55).fillTriangle(16, 25, 25, 16, 10, 2).fillTriangle(39, 16, 47, 25, 55, 2);
    g.fillStyle(0xffa36d).fillTriangle(21, 30, 28, 33, 23, 35).fillTriangle(36, 33, 43, 30, 41, 35);
    g.generateTexture('metin-stone', 64, 72); g.destroy();
  }
  if (!scene.textures.exists('metin-jealous-stone')) {
    const g = scene.make.graphics();
    g.fillStyle(0x233b37).fillTriangle(4, 63, 58, 63, 32, 2);
    g.fillStyle(0x3f7265).fillTriangle(7, 59, 32, 2, 30, 64);
    g.fillStyle(0x709780).fillTriangle(13, 43, 32, 2, 29, 39);
    g.fillStyle(0x335649).fillTriangle(32, 2, 56, 62, 30, 64);
    g.lineStyle(2, 0x8affbe).lineBetween(32, 13, 23, 29).lineBetween(23, 29, 36, 42).lineBetween(36, 42, 28, 61);
    g.lineStyle(1, 0xe0ffd2).strokeEllipse(32, 34, 16, 9);
    g.fillStyle(0xa4ffba).fillRect(31, 30, 2, 8);
    g.generateTexture('metin-jealous-stone', 64, 72); g.destroy();
  }
  if (!scene.textures.exists('metin-penis-stone')) {
    const g = scene.make.graphics();
    // A clearly stylized stone sculpture, with angular facets and glowing cracks.
    g.fillStyle(0x524363).fillRoundedRect(21, 10, 22, 48, 10).fillEllipse(18, 56, 29, 26).fillEllipse(46, 56, 29, 26);
    g.fillStyle(0x8a6e95).fillRoundedRect(24, 15, 8, 38, 4).fillEllipse(16, 53, 18, 16).fillEllipse(43, 53, 18, 16);
    g.fillStyle(0xa68aac).fillRoundedRect(19, 3, 26, 19, 9);
    g.fillStyle(0xc2a4c1).fillRect(23, 7, 7, 6);
    g.lineStyle(2, 0xdca4ff).lineBetween(34, 23, 29, 34).lineBetween(29, 34, 36, 43).lineBetween(36, 43, 30, 58);
    g.lineStyle(1, 0xf4d1ff).lineBetween(10, 55, 20, 60).lineBetween(44, 47, 49, 57);
    g.generateTexture('metin-penis-stone', 64, 72); g.destroy();
  }
  for (const kind of ['plague', 'yeti', 'walker']) {
    for (let frame = 0; frame < 3; frame += 1) {
      const key = `metin-${kind}-${frame}`;
      if (scene.textures.exists(key)) continue;
      const g = scene.make.graphics();
      const step = frame === 1 ? 2 : frame === 2 ? -2 : 0;
      if (kind === 'plague') {
        g.fillStyle(0x313c36).fillRect(12 + step, 31, 6, 11).fillRect(27 - step, 31, 6, 11);
        g.fillStyle(0x596a42).fillTriangle(7, 35, 38, 35, 23, 10);
        g.fillStyle(0x92a76b).fillRect(17, 12, 14, 13).fillRect(7, 24, 5, 10).fillRect(34, 24, 5, 10);
        g.fillStyle(0x343c30).fillRoundedRect(13, 6, 21, 12, 4);
        g.fillStyle(0xd5b759).fillRect(20, 17, 3, 2).fillRect(28, 17, 3, 2);
        g.fillStyle(0x3c4230).fillRect(22, 23, 7, 2);
      } else if (kind === 'yeti') {
        g.fillStyle(0xa9c7ce).fillRect(9 + step, 30, 10, 13).fillRect(27 - step, 30, 10, 13);
        g.fillStyle(0xe4f0e9).fillEllipse(23, 25, 36, 30).fillRect(3, 20, 8, 18).fillRect(35, 20, 8, 18);
        g.fillStyle(0xb3d0d7).fillEllipse(24, 20, 22, 18);
        g.fillStyle(0xf2f5e7).fillCircle(15, 11, 6).fillCircle(31, 11, 6);
        g.fillStyle(0x3b5465).fillRect(16, 17, 5, 3).fillRect(27, 17, 5, 3).fillRect(19, 25, 12, 4);
        g.fillStyle(0xffffff).fillTriangle(20, 25, 23, 25, 22, 31).fillTriangle(27, 25, 30, 25, 28, 31);
      } else {
        // Cartoon walking prop with an angry face and tiny boots.
        g.fillStyle(0xa66c81).fillRect(14 + step, 31, 5, 11).fillRect(27 - step, 31, 5, 11);
        g.fillStyle(0xd99aab).fillRoundedRect(15, 8, 17, 26, 8).fillEllipse(16, 31, 18, 15).fillEllipse(31, 31, 18, 15);
        g.fillStyle(0xeab2bd).fillRoundedRect(14, 4, 19, 13, 6);
        g.fillStyle(0x663d54).fillRect(18, 19, 3, 3).fillRect(27, 19, 3, 3).fillRect(21, 25, 6, 2);
        g.fillStyle(0x39303b).fillRect(12 + step, 39, 9, 4).fillRect(26 - step, 39, 9, 4);
      }
      g.generateTexture(key, 48, 48); g.destroy();
    }
  }
}
