export function createCouponKeeperTexture(scene, key) {
  const g = scene.make.graphics();
  // Keep the original frame and foot position for the existing collision body.
  g.fillStyle(0x263246).fillRect(8, 27, 7, 10).fillRect(18, 27, 7, 10);
  g.fillStyle(0x4a6077).fillRect(9, 28, 2, 7).fillRect(19, 28, 2, 7);
  g.fillStyle(0xeee8d9).fillRect(7, 35, 9, 4).fillRect(18, 35, 9, 4);
  g.fillStyle(0x992e33).fillRect(8, 36, 5, 1).fillRect(19, 36, 5, 1);
  // Red branded T-shirt, contrasting sleeves and collar.
  g.fillStyle(0x9d2332).fillRect(5, 19, 23, 12).fillRect(2, 20, 5, 6).fillRect(27, 20, 4, 6);
  g.fillStyle(0xe63c49).fillRect(7, 20, 19, 10);
  g.fillStyle(0xf45a5d).fillRect(8, 20, 3, 8);
  g.fillStyle(0x671e2a).fillRect(12, 18, 9, 3);
  g.fillStyle(0xe5ae80).fillRect(14, 17, 5, 3).fillRect(2, 26, 4, 6).fillRect(27, 25, 4, 6);
  // Rolled betting slip and a gold watch.
  g.fillStyle(0xd4ae56).fillRect(2, 27, 4, 2);
  g.fillStyle(0xf4e8b9).fillRect(25, 25, 5, 9);
  g.fillStyle(0xc34a43).fillRect(26, 26, 3, 2);
  g.fillStyle(0x8e8c75).fillRect(26, 30, 3, 1).fillRect(26, 32, 2, 1);
  // Styled hair, dark shades and a short beard.
  g.fillStyle(0x30282b).fillRoundedRect(7, 3, 18, 15, 3);
  g.fillStyle(0xe2aa7b).fillRect(8, 7, 16, 10);
  g.fillStyle(0xf1c299).fillRect(9, 7, 12, 6);
  g.fillStyle(0x342b2d).fillRect(7, 4, 18, 4).fillRect(9, 1, 14, 5);
  g.fillStyle(0x685041).fillRect(10, 2, 10, 2);
  g.fillStyle(0x202a32).fillRect(8, 9, 7, 4).fillRect(17, 9, 7, 4).fillRect(14, 10, 4, 1);
  g.fillStyle(0x84b5b9).fillRect(9, 9, 3, 1).fillRect(18, 9, 3, 1);
  g.fillStyle(0x634032).fillRect(9, 16, 14, 3).fillRect(11, 15, 3, 2).fillRect(19, 15, 3, 2);
  g.fillStyle(0xf2d1a8).fillRect(14, 16, 5, 1);
  const baseKey = `${key}-base`;
  g.generateTexture(baseKey, 32, 40);
  g.destroy();
  const texture = scene.textures.createCanvas(key, 32, 40);
  const ctx = texture.getContext();
  ctx.drawImage(scene.textures.get(baseKey).getSourceImage(), 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 5px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('superbet', 16, 26, 21);
  texture.refresh();
  scene.textures.remove(baseKey);
}
