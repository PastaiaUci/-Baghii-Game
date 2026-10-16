export const VILLAGE_GOLD_TOTAL = 350;

export function createVillageGoldLayout(obstacles, random = Math.random) {
  // The shop is created after pickups, so reserve its village footprint here too.
  obstacles = [...obstacles, { left: 772, right: 928, top: 345, bottom: 405 }];
  const positions = [
    [260, 420], [440, 860], [640, 430], [900, 840], [1000, 260], [1320, 620],
    [1240, 930], [380, 1060], [154, 840], [740, 1010], [1070, 1080], [1200, 760],
  ];
  while (positions.length < 18) positions.push([80 + random() * 1440, 80 + random() * 1040]);
  const blocked = (x, y) => {
    // The whole enclosure is excluded, including the walkable space between fences.
    if (x > 45 && x < 380 && y > 44 && y < 204) return true;
    return obstacles.some((b) => x > b.left - 18 && x < b.right + 18 && y > b.top - 18 && y < b.bottom + 28);
  };
  return positions.map(([x, y], index) => {
    if (blocked(x, y)) {
      let free;
      search: for (let radius = 32; radius <= 320; radius += 32) {
        for (let step = 0; step < 16; step += 1) {
          const angle = step * Math.PI / 8;
          const px = Math.max(40, Math.min(1560, x + Math.cos(angle) * radius));
          const py = Math.max(60, Math.min(1160, y + Math.sin(angle) * radius));
          if (!blocked(px, py)) { free = [px, py]; break search; }
        }
      }
      if (!free) {
        search: for (let py = 240; py < 1120; py += 32) {
          for (let px = 64; px < 1536; px += 32) {
            if (!blocked(px, py)) { free = [px, py]; break search; }
          }
        }
      }
      if (!free) throw new Error('No reachable space for village gold');
      [x, y] = free;
    }
    // 16 × 20 + 2 × 15 = 350 gold, independently of randomized positions.
    return { x, y, value: index < 16 ? 20 : 15 };
  });
}
