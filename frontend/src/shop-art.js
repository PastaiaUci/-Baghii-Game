export function drawShopBuilding(g) {
  g.fillStyle(0x26382c, 0.25).fillEllipse(5, 4, 192, 27);
  g.fillStyle(0x4e3931).fillRect(-78, -88, 156, 88);
  g.fillStyle(0xe0c99d).fillRect(-73, -87, 146, 80);
  g.fillStyle(0xb99c75).fillRect(59, -84, 14, 77);
  g.fillStyle(0x776758).fillRect(-79, -8, 158, 9);
  for (const x of [-75, -26, 23, 68]) {
    g.fillStyle(0x755038).fillRect(x, -87, 5, 80);
    g.fillStyle(0xa27b50).fillRect(x + 1, -86, 1, 77);
  }
  g.fillStyle(0x76503b).fillRect(-74, -53, 148, 5);
  g.lineStyle(3, 0x86633f).lineBetween(-68, -82, -30, -55).lineBetween(30, -55, 65, -82);
  // Chimney, layered tiled roof and copper ridge.
  g.fillStyle(0x6c635b).fillRect(48, -140, 16, 45);
  g.fillStyle(0xa29b82).fillRect(46, -141, 20, 5);
  g.fillStyle(0x243f40).fillTriangle(-95, -88, 95, -88, 0, -153);
  g.fillStyle(0x3d7771).fillTriangle(-91, -95, 91, -95, 0, -150);
  for (let y = -138; y < -95; y += 9) {
    const half = (y + 150) * 1.65;
    g.lineStyle(2, 0x72a28a).lineBetween(-half, y, half, y);
    g.lineStyle(1, 0x244e4b);
    for (let x = -half + 8; x < half - 4; x += 17) g.lineBetween(x, y, x - 3, y + 7);
  }
  g.fillStyle(0xd3af66).fillRect(-94, -95, 188, 5);
  // Display windows, shelves and a merchant behind the open counter.
  for (const x of [-62, 35]) {
    g.fillStyle(0x4b382e).fillRect(x - 3, -72, 31, 36);
    g.fillStyle(0x496a65).fillRect(x, -69, 25, 27);
    g.fillStyle(0xb39a67).fillRect(x, -56, 25, 2).fillRect(x + 11, -69, 2, 28);
    g.fillStyle(0xe3c378).fillRect(x + 4, -65, 4, 7);
    g.fillStyle(0x8a4f64).fillRect(x + 16, -50, 5, 7);
    g.fillStyle(0xb88d52).fillRect(x - 4, -38, 33, 4);
  }
  g.fillStyle(0x302a2c).fillRoundedRect(-23, -67, 46, 58, 5);
  // Tailored plum waistcoat, embroidered collar, spectacles and a curled moustache.
  g.fillStyle(0x3f304e).fillRect(-15, -39, 30, 24);
  g.fillStyle(0x8d628b).fillRect(-11, -38, 22, 20);
  g.fillStyle(0xdac6a0).fillTriangle(-8, -39, 8, -39, 0, -27);
  g.fillStyle(0xd2ab65).fillRect(-11, -35, 2, 16).fillRect(9, -35, 2, 16);
  g.fillStyle(0xf0c776).fillCircle(1, -25, 1).fillCircle(1, -20, 1);
  g.fillStyle(0xc9906c).fillRect(-11, -58, 22, 20);
  g.fillStyle(0xe8b68a).fillRect(-9, -57, 16, 15);
  g.fillStyle(0x382c35).fillRect(-12, -60, 24, 7).fillRect(-12, -53, 3, 9).fillRect(9, -53, 3, 9);
  g.fillStyle(0x52415d).fillRoundedRect(-14, -67, 28, 11, 3);
  g.fillStyle(0xcda76a).fillRect(-15, -58, 30, 3);
  g.fillStyle(0x62b4ad).fillRect(4, -65, 5, 5);
  g.lineStyle(1, 0xe6c580).strokeCircle(-5, -49, 4).strokeCircle(5, -49, 4).lineBetween(-1, -49, 1, -49);
  g.fillStyle(0x30292d).fillRect(-6, -50, 2, 2).fillRect(4, -50, 2, 2);
  g.fillStyle(0x52332c).fillRect(-7, -42, 6, 2).fillRect(1, -42, 6, 2).fillRect(-8, -44, 2, 3).fillRect(6, -44, 2, 3);
  g.fillStyle(0xf1c99b).fillRect(-2, -39, 4, 1);
  g.fillStyle(0xe8b68a).fillRect(-19, -28, 7, 6).fillRect(12, -28, 7, 6);
  g.fillStyle(0xa07846).fillRect(-31, -20, 62, 21);
  g.fillStyle(0xd3a969).fillRect(-34, -23, 68, 5);
  g.fillStyle(0xa7b5bf).fillRoundedRect(-24, -32, 15, 9, 4);
  g.fillStyle(0xe8c46c).fillCircle(18, -26, 3).fillCircle(24, -26, 3);
  // Hanging lanterns, stock crate and a barrel.
  for (const x of [-68, 68]) {
    g.fillStyle(0x534735).fillRect(x - 2, -40, 3, 14);
    g.fillStyle(0xf0c56b).fillRect(x - 5, -30, 9, 11);
    g.lineStyle(1, 0x725334).strokeRect(x - 6, -31, 11, 13);
  }
  g.fillStyle(0x926c43).fillRoundedRect(80, -22, 19, 24, 4);
  g.fillStyle(0x5c6061).fillRect(79, -18, 21, 3).fillRect(79, -5, 21, 3);
  g.fillStyle(0xb68b50).fillRect(-98, -19, 20, 20);
  g.lineStyle(2, 0x755237).strokeRect(-98, -19, 20, 20).lineBetween(-96, -17, -80, -1);
  g.fillStyle(0x362d27).fillRoundedRect(-48, -89, 96, 17, 3);
  g.lineStyle(1, 0xd3af66).strokeRoundedRect(-48, -89, 96, 17, 3);
}
