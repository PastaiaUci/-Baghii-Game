// Adult NPC with a taller silhouette, long hair and a burgundy evening outfit.
export function createLaviniaTexture(scene) {
  const g = scene.make.graphics();
  g.fillStyle(0x241e29).fillRoundedRect(8, 3, 24, 34, 9);
  g.fillStyle(0x51342e).fillRect(9, 12, 4, 23).fillRect(28, 11, 3, 25);
  // Legs, dark ankle boots and gold heel details.
  g.fillStyle(0xd49b7e).fillRect(13, 38, 5, 12).fillRect(23, 38, 5, 12);
  g.fillStyle(0xf0c0a0).fillRect(14, 40, 2, 9).fillRect(24, 40, 2, 9);
  g.fillStyle(0x292331).fillRect(12, 48, 7, 6).fillRect(22, 48, 8, 6);
  g.fillStyle(0xd7b16f).fillRect(13, 53, 6, 1).fillRect(23, 53, 6, 1);
  // Tailored dress with a fitted waist and asymmetric hem.
  g.fillStyle(0x4f2137).fillTriangle(9, 41, 32, 41, 20, 21);
  g.fillStyle(0x992e52).fillTriangle(11, 39, 29, 39, 20, 22);
  g.fillStyle(0xce5674).fillTriangle(12, 38, 18, 38, 19, 26);
  g.fillStyle(0x74213f).fillRect(14, 22, 13, 9);
  g.fillStyle(0xe9b395).fillRect(11, 19, 18, 5).fillRect(17, 16, 7, 7);
  g.fillStyle(0xa7395c).fillRect(14, 23, 13, 6);
  g.fillStyle(0xe2ba79).fillRect(14, 29, 13, 2);
  g.fillStyle(0xf7dda4).fillRect(19, 29, 3, 2);
  // Arms and bracelets.
  g.fillStyle(0xc88f75).fillRect(8, 22, 4, 14).fillRect(29, 22, 4, 14);
  g.fillStyle(0xefbea0).fillRect(9, 23, 2, 11).fillRect(30, 23, 2, 11);
  g.fillStyle(0xe6c283).fillRect(8, 32, 4, 2).fillRect(29, 32, 4, 2);
  // Face, side-swept hair, eye makeup and earrings.
  g.fillStyle(0xd9a184).fillRoundedRect(13, 6, 14, 13, 4);
  g.fillStyle(0xf3c8a7).fillRect(15, 8, 10, 8);
  g.fillStyle(0x4f3041).fillRect(14, 11, 4, 1).fillRect(22, 11, 4, 1);
  g.fillStyle(0x27303b).fillRect(16, 12, 2, 2).fillRect(23, 12, 2, 2);
  g.fillStyle(0xb56173).fillRect(18, 16, 5, 1);
  g.fillStyle(0x33252b).fillRect(11, 5, 17, 4).fillTriangle(12, 7, 23, 7, 12, 14);
  g.fillStyle(0x795044).fillRect(13, 4, 10, 2).fillRect(10, 10, 2, 18).fillRect(29, 9, 1, 21);
  g.fillStyle(0xf1d28d).fillRect(11, 15, 2, 4).fillRect(28, 15, 2, 4).fillRect(19, 22, 2, 2);
  g.generateTexture('lavinia', 40, 56);
  g.destroy();
}
