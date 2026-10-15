const species = {
  chicken: { speed: 42, bodyWidth: 12, bodyHeight: 7 },
  sheep: { speed: 28, bodyWidth: 22, bodyHeight: 10 },
  cow: { speed: 24, bodyWidth: 28, bodyHeight: 12 },
};

function createAnimalTextures(scene) {
  for (const kind of Object.keys(species)) {
    for (let frame = 0; frame < 3; frame += 1) {
      const g = scene.make.graphics();
      const step = frame === 1 ? 2 : frame === 2 ? -2 : 0;
      if (kind === 'chicken') {
        g.fillStyle(0xd79840).fillRect(18 + step, 28, 2, 7).fillRect(26 - step, 28, 2, 7);
        g.fillStyle(0xf4e8cb).fillEllipse(23, 23, 19, 17).fillCircle(30, 16, 6);
        g.fillTriangle(12, 25, 17, 18, 10, 16);
        g.fillStyle(0xd95044).fillRect(28, 7, 3, 5).fillRect(32, 8, 3, 4).fillRect(33, 21, 3, 4);
        g.fillStyle(0xf6b94b).fillTriangle(35, 15, 40, 18, 35, 20);
        g.fillStyle(0xcbbb99).fillEllipse(21, 24, 10, 8);
        g.fillStyle(0x292832).fillRect(32, 14, 2, 2);
      } else {
        const cow = kind === 'cow';
        g.fillStyle(0x443d3c).fillRect(12 + step, 27, 5, 9).fillRect(29 - step, 27, 5, 9);
        g.fillStyle(cow ? 0xe0d8bb : 0xd4d2c3).fillEllipse(23, 21, cow ? 34 : 30, 22);
        g.fillStyle(cow ? 0xf4ebd2 : 0xf3edda).fillEllipse(21, 18, 29, 18);
        if (cow) {
          g.fillStyle(0x4b4141).fillEllipse(15, 16, 12, 9).fillEllipse(28, 24, 10, 8);
          g.fillStyle(0xc4ae7e).fillRect(31, 7, 3, 8).fillRect(40, 8, 3, 8);
          g.fillStyle(0xeee3c6).fillEllipse(36, 18, 16, 16);
          g.fillStyle(0xd8a8a1).fillEllipse(38, 25, 14, 8);
          g.fillStyle(0x72534e).fillRect(35, 25, 2, 2).fillRect(41, 25, 2, 2);
        } else {
          g.fillStyle(0x6b6259).fillEllipse(35, 22, 14, 16).fillEllipse(31, 14, 9, 5).fillEllipse(41, 15, 9, 5);
          g.fillStyle(0xfff4de).fillCircle(31, 11, 5).fillCircle(36, 11, 5);
          g.lineStyle(1, 0xc5c2af).strokeCircle(15, 16, 4).strokeCircle(24, 14, 4);
        }
        g.fillStyle(0x242733).fillRect(38, 18, 2, 3);
      }
      g.generateTexture(`animal-${kind}-${frame}`, 48, 40);
      g.destroy();
    }
  }
}

export function createAnimals(scene) {
  createAnimalTextures(scene);
  scene.animalGroup = scene.physics.add.group();
  scene.animals = [
    ['chicken', 360, 370], ['chicken', 430, 400], ['chicken', 320, 490],
    ['sheep', 430, 780], ['sheep', 520, 850],
    ['cow', 1160, 800], ['cow', 1370, 970],
  ].map(([kind, x, y], index) => {
    const config = species[kind];
    const sprite = scene.physics.add.sprite(x, y, `animal-${kind}-0`);
    scene.animalGroup.add(sprite);
    sprite.setCollideWorldBounds(true);
    sprite.body.setSize(config.bodyWidth, config.bodyHeight).setOffset((48 - config.bodyWidth) / 2, 35 - config.bodyHeight);
    const shadow = scene.add.ellipse(x, y + 14, config.bodyWidth + 4, 8, 0x2c462e, 0.2).setDepth(1);
    return { sprite, shadow, kind, homeX: x, homeY: y, direction: index * 1.3, nextDecision: 0, resting: false, speed: config.speed };
  });
  scene.physics.add.collider(scene.animalGroup, scene.obstacles);
}

export function hideAnimals(scene) {
  scene.animals?.forEach(({ sprite, shadow }) => {
    sprite.disableBody(true, true);
    shadow.setVisible(false);
  });
}

export function updateAnimals(scene) {
  if (scene.bossRoomActive || scene.gameOver) return;
  const now = scene.time.now;
  scene.animals.forEach((animal) => {
    const { sprite, shadow } = animal;
    if (now >= animal.nextDecision) {
      animal.resting = Math.random() < 0.25;
      animal.direction = Math.random() * Math.PI * 2;
      animal.nextDecision = now + 900 + Math.random() * 1800;
    }
    let dx = Math.cos(animal.direction), dy = Math.sin(animal.direction);
    if (Math.hypot(sprite.x - animal.homeX, sprite.y - animal.homeY) > 180) {
      animal.direction = Math.atan2(animal.homeY - sprite.y, animal.homeX - sprite.x);
      dx = Math.cos(animal.direction); dy = Math.sin(animal.direction);
      animal.resting = false;
    }
    const blocked = sprite.body.blocked;
    if (blocked.left) dx = Math.abs(dx);
    if (blocked.right) dx = -Math.abs(dx);
    if (blocked.up) dy = Math.abs(dy);
    if (blocked.down) dy = -Math.abs(dy);
    animal.direction = Math.atan2(dy, dx);
    sprite.setVelocity(animal.resting ? 0 : dx * animal.speed, animal.resting ? 0 : dy * animal.speed);
    if (!animal.resting && Math.abs(dx) > 0.1) sprite.setFlipX(dx < 0);
    const frame = animal.resting ? 0 : Math.floor(now / 180) % 3;
    sprite.setTexture(`animal-${animal.kind}-${frame}`).setDepth(10 + (sprite.y + 15) / 100);
    shadow.setPosition(sprite.x, sprite.y + 14);
  });
}
