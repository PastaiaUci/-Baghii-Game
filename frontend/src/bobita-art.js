export function drawBobita(scene, x, y, frozen = false) {
  const g = scene.add.graphics().setPosition(x, y).setDepth(50);
  g.fillStyle(0x253549, 0.2).fillEllipse(1, 22, 46, 13);
  // Heavy boots, fitted blue jacket and a long burgundy scarf.
  g.fillStyle(0x252c39).fillRoundedRect(-15, 8, 13, 16, 4).fillRoundedRect(3, 8, 13, 16, 4);
  g.fillStyle(0x9d8568).fillRect(-15, 19, 13, 3).fillRect(3, 19, 13, 3);
  g.fillStyle(0x1d3047).fillRoundedRect(-19, -27, 38, 43, 8);
  g.fillStyle(0x456e8d).fillRoundedRect(-16, -25, 32, 36, 6);
  g.fillStyle(0x7699ac).fillRect(-13, -21, 3, 25).fillRect(10, -21, 3, 25);
  g.lineStyle(2, 0xb6a37d).lineBetween(0, -18, 0, 9);
  g.fillStyle(0xd7b16e).fillCircle(3, -9, 1.5).fillCircle(3, 0, 1.5);
  g.fillStyle(0x263c55).fillRoundedRect(-24, -24, 9, 31, 4).fillRoundedRect(15, -24, 9, 31, 4);
  g.fillStyle(0x3b303b).fillCircle(-20, 7, 5).fillCircle(20, 7, 5);
  g.fillStyle(0x322b31).fillRoundedRect(-14, -53, 28, 29, 8);
  g.fillStyle(frozen ? 0xb6bcd0 : 0xd8a07b).fillRoundedRect(-12, -50, 24, 25, 7);
  g.fillStyle(frozen ? 0xd4dce6 : 0xf0c7a1).fillRoundedRect(-9, -47, 18, 17, 5);
  g.fillStyle(frozen ? 0x899fbd : 0xcc7c72, 0.65).fillEllipse(-8, -34, 6, 4).fillEllipse(8, -34, 6, 4);
  g.lineStyle(2, 0x3b3034).lineBetween(-8, -40, -3, -41).lineBetween(3, -41, 8, -40);
  if (frozen) g.lineStyle(1, 0x3b3b4e).lineBetween(-7, -36, -3, -36).lineBetween(3, -36, 7, -36);
  else g.fillStyle(0x27313d).fillCircle(-5, -37, 1.5).fillCircle(5, -37, 1.5);
  g.fillStyle(0xbb8d79).fillRoundedRect(-2, -36, 4, 7, 2);
  g.lineStyle(1, 0x775d63).lineBetween(-4, -27, 4, -27);
  g.fillStyle(0x372b2b).fillEllipse(0, -53, 30, 15).fillCircle(-12, -48, 6).fillCircle(11, -48, 6);
  g.fillStyle(0x735342).fillEllipse(-5, -55, 14, 6).fillEllipse(7, -53, 9, 5);
  g.fillStyle(0x833b50).fillRoundedRect(-15, -26, 30, 8, 3).fillRoundedRect(8, -20, 8, 23, 2);
  g.fillStyle(0xc47b83).fillRect(-11, -24, 22, 2).fillRect(10, -17, 2, 17);
  if (frozen) {
    const outline = [{ x: -32, y: -64 }, { x: 17, y: -70 }, { x: 34, y: -48 }, { x: 32, y: 27 }, { x: -29, y: 31 }, { x: -37, y: -16 }];
    g.fillStyle(0x8fd8f1, 0.27).fillPoints(outline, true);
    g.lineStyle(2, 0xe8fbff, 0.9).strokePoints(outline, true);
    g.fillStyle(0xc8f2ff, 0.24).fillTriangle(-32, -64, -22, 22, -37, -16).fillTriangle(17, -70, 34, -48, 30, 24);
    g.lineStyle(2, 0xf1fdff, 0.55).lineBetween(-23, -50, -20, -5).lineBetween(22, -45, 26, 8);
    g.lineStyle(1, 0xe0f7ff, 0.8).lineBetween(-28, 7, -16, 1).lineBetween(-16, 1, -11, -12).lineBetween(29, -26, 18, -18).lineBetween(18, -18, 23, -3);
    for (const [sx, sy] of [[-25, -55], [22, 15], [-24, 20]]) {
      g.lineStyle(1, 0xffffff, 0.8).lineBetween(sx - 4, sy, sx + 4, sy).lineBetween(sx, sy - 4, sx, sy + 4);
    }
  }
  return g;
}
