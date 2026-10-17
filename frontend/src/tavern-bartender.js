const BOTTLES = [
  { x: 238, label: "JACK\nDANIEL'S", glass: 0x4b3422, liquid: 0xb57a31, paper: 0x202126, ink: '#f5e8ca' },
  { x: 284, label: 'JOHNNIE\nWALKER', glass: 0x6b4929, liquid: 0xc28e3b, paper: 0xb74939, ink: '#ffe0a2' },
  { x: 330, label: 'JÄGER\nMEISTER', glass: 0x284b35, liquid: 0x638147, paper: 0xd8c9a0, ink: '#314631' },
  { x: 634, label: 'BACARDÍ', glass: 0x809a8b, liquid: 0xc0b979, paper: 0xe8dec3, ink: '#4e332b' },
  { x: 680, label: 'ABSOLUT', glass: 0x8aa7b3, liquid: 0xc2d4d4, paper: 0x456581, ink: '#eaf0ed' },
  { x: 726, label: 'ROMUL\nCASEI', glass: 0x493e2e, liquid: 0xa77337, paper: 0xbd9e64, ink: '#372d26' },
];

function bottle(g, { glass, liquid, paper }, small = false) {
  g.fillStyle(glass).fillRoundedRect(-7, -24, 14, 24, 3).fillRect(-3, -33, 6, 12);
  g.fillStyle(liquid).fillRoundedRect(-5, -19, 10, 17, 2);
  g.fillStyle(paper).fillRoundedRect(-6, -17, 12, 11, 1);
  g.fillStyle(0xe7d7ac).fillRect(-4, -35, 8, 4);
  g.fillStyle(0xffffff, 0.24).fillRect(-5, -23, 2, 19);
  if (!small) g.lineStyle(1, 0xd3c08c).strokeRect(-6, -17, 12, 11);
}

export function createTavernBartender(scene) {
  const shelf = scene.add.graphics().setDepth(2);
  shelf.fillStyle(0x261f20).fillRoundedRect(217, 95, 132, 40, 3).fillRoundedRect(613, 95, 132, 40, 3);
  shelf.lineStyle(2, 0x9a754b).lineBetween(216, 134, 350, 134).lineBetween(612, 134, 746, 134);
  BOTTLES.forEach((drink) => {
    const art = scene.add.graphics().setPosition(drink.x, 130).setDepth(3);
    bottle(art, drink);
    scene.add.text(drink.x, 145, drink.label, {
      fontFamily: 'Arial', fontSize: '7px', fontStyle: 'bold', color: drink.ink,
      backgroundColor: `#${drink.paper.toString(16).padStart(6, '0')}`, padding: { x: 2, y: 2 }, align: 'center',
    }).setOrigin(0.5).setDepth(19);
  });

  const shadow = scene.add.graphics().setDepth(4);
  const body = scene.add.graphics().setDepth(10);
  // The counter hides the lower body; the hands and served drinks sit above it.
  const counter = scene.add.graphics().setDepth(16);
  counter.fillStyle(0x432e25).fillRect(210, 150, 540, 52);
  counter.fillStyle(0x69482e).fillRect(215, 154, 530, 6).fillRect(215, 194, 530, 4);
  for (const x of [224, 350, 476, 602, 732]) counter.fillStyle(0x946c40).fillRect(x, 161, 3, 31);
  counter.fillStyle(0x2c2523).fillRoundedRect(445, 174, 70, 18, 3);
  counter.lineStyle(1, 0xc3a265).strokeRoundedRect(445, 174, 70, 18, 3);
  scene.add.text(480, 183, 'BARMAN', { fontFamily: 'Georgia', fontSize: '8px', color: '#e5cb8d', letterSpacing: 1 }).setOrigin(0.5).setDepth(18);
  const hands = scene.add.graphics().setDepth(18);
  const heldBottle = scene.add.graphics().setDepth(19);
  bottle(heldBottle, BOTTLES[0], true); heldBottle.setScale(0.65);
  const glass = scene.add.graphics().setDepth(18);
  let elapsed = 0, service = null;
  scene.bartender = {
    x: 380,
    serve(visitor, done) {
      if (service) return false;
      const targetX = visitor.group.x - 21;
      service = { visitor, done, elapsed: 0, from: this.x, targetX, approach: Math.max(500, Math.abs(targetX - this.x) / 90 * 1000) };
      return true;
    },
  };
  const render = () => {
    let cycle = elapsed % 18000;
    let serviceTravel = 0, passing = 0;
    if (service) {
      serviceTravel = Math.min(1, service.elapsed / service.approach);
      cycle = serviceTravel < 1 ? 0 : Math.min(8000, 4000 + service.elapsed - service.approach);
      passing = Math.max(0, Math.min(1, (service.elapsed - service.approach - 4000) / 900));
    }
    const pouring = cycle >= 4000 && cycle < 8000;
    const wiping = cycle >= 12000 && cycle < 17000;
    const walking = service ? serviceTravel < 1 : cycle < 4000 || cycle >= 8000 && cycle < 12000;
    const travel = cycle < 4000 ? cycle / 4000 : cycle < 8000 ? 1 : cycle < 12000 ? 1 - (cycle - 8000) / 4000 : 0;
    const eased = travel * travel * (3 - 2 * travel);
    const x = service ? service.from + (service.targetX - service.from) * serviceTravel : 380 + 180 * eased, y = 127;
    scene.bartender.x = x;
    const bob = walking ? Math.sin(elapsed / 95) * 0.9 : Math.sin(elapsed / 350) * 0.4;
    shadow.clear().fillStyle(0x161419, 0.35).fillEllipse(x, y + 10, 39, 10);
    body.clear().setPosition(x, y + bob);
    body.fillStyle(0x262b36).fillRoundedRect(-14, -21, 28, 37, 5);
    body.fillStyle(0xd8cdb9).fillRoundedRect(-16, -20, 8, 22, 3).fillRoundedRect(8, -20, 8, 22, 3);
    body.fillStyle(0xf0e4cc).fillTriangle(-8, -22, 0, -12, -1, -22).fillTriangle(8, -22, 0, -12, 1, -22);
    body.fillStyle(0x973d3c).fillTriangle(-2, -16, 2, -16, 0, -6);
    body.fillStyle(0x39333a).fillRect(-9, -2, 18, 18);
    body.lineStyle(1, 0xae976f).strokeRect(-5, 2, 10, 7);
    body.fillStyle(0xd9a77f).fillRoundedRect(-9, -41, 18, 20, 5).fillRect(-4, -23, 8, 4);
    body.fillStyle(0x382a28).fillRoundedRect(-10, -45, 20, 10, 4).fillRect(-10, -37, 3, 7).fillRect(7, -37, 3, 7);
    body.fillStyle(0x22232b).fillRect(-5, -33, 2, 2).fillRect(3, -33, 2, 2);
    body.fillStyle(0x574035).fillRect(-4, -27, 8, 2);
    body.fillStyle(0xf3d0a6).fillRect(-6, -37, 4, 2);

    hands.clear().setPosition(x, y);
    const wipe = wiping ? Math.sin(elapsed / 115) * 7 : 0;
    hands.lineStyle(5, 0xd7cbb6).lineBetween(-13, -9, -18, 7).lineBetween(13, -9, pouring ? 27 : 15 + wipe, pouring ? -4 : 8);
    hands.fillStyle(0xdbb18b).fillCircle(-18, 8, 3).fillCircle(pouring ? 27 : 15 + wipe, pouring ? -4 : 8, 3);
    glass.clear().setPosition(x + 21, y + 12);
    if (service && passing > 0) glass.setPosition(x + 21 + (service.visitor.group.x + 16 - x - 21) * passing, y + 12 + (service.visitor.group.y + 4 - y - 12) * passing);
    glass.fillStyle(0x201c22, 0.25).fillEllipse(0, 2, 21, 5);
    glass.fillStyle(0xbdced1, 0.35).fillRoundedRect(-6, -13, 12, 15, 2);
    const fill = service && cycle >= 8000 ? 1 : pouring ? Math.min(1, (cycle - 4000) / 2600) : wiping ? 0 : 0.25;
    glass.fillStyle(0xc48a37, 0.85).fillRect(-4, 0 - fill * 10, 8, fill * 10);
    glass.lineStyle(1, 0xe5e1cc).strokeRoundedRect(-6, -13, 12, 15, 2).lineBetween(-4, -10, -4, -2);
    if (wiping) {
      hands.fillStyle(0xe7dfcb).fillRoundedRect(9 + wipe, 4, 14, 8, 3);
      hands.lineStyle(1, 0xa2a99c).lineBetween(12 + wipe, 5, 18 + wipe, 10);
    }
    const tilt = pouring ? Math.min(1, (cycle - 4000) / 350, (8000 - cycle) / 350) : 0;
    heldBottle.setVisible(pouring).setPosition(x + 40, y - 5).setRotation(-1.15 * tilt);
    if (pouring && tilt > 0.9 && cycle < 7100) hands.lineStyle(1.5, 0xf4c16e, 0.85).lineBetween(20, -13, 21, 0);
  };
  const update = () => {
    if (scene.npcDialogueOpen || scene.leaving || scene.farm.menuOpen || scene.farm.statsOpen || scene.farm.bookOpen || !scene.farm.inventoryUi.classList.contains('hidden')) return;
    const dt = Math.min(scene.game.loop.delta, 50);
    if (service) {
      service.elapsed += dt;
      if (service.elapsed >= service.approach + 4900) {
        const done = service.done;
        service = null; elapsed = 8000; done();
      }
    } else elapsed += dt;
    render();
  };
  render(); scene.events.on('update', update);
  scene.events.once('shutdown', () => scene.events.off('update', update));
}
