import Phaser from 'phaser';
import './style.css';

const worldWidth = 1600;
const worldHeight = 1200;

class FarmScene extends Phaser.Scene {
  constructor() {
    super('FarmScene');
  }

  create() {
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    const ground = this.add.graphics();
    ground.fillStyle(0x7acb5d, 1);
    ground.fillRect(0, 0, worldWidth, worldHeight);
    ground.generateTexture('ground', worldWidth, worldHeight);
    ground.destroy();
    this.add.image(0, 0, 'ground').setOrigin(0, 0);

    this.obstacles = this.physics.add.staticGroup();

    this.createPlayerTexture();
    this.createTreeTexture();
    this.createHouseTexture();

    this.player = this.physics.add.sprite(180, 220, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(20);
    this.player.body.setSize(16, 18);
    this.player.body.setOffset(2, 2);

    const treePositions = [
      [260, 240], [420, 200], [530, 430], [760, 180], [980, 320],
      [1050, 720], [820, 840], [1250, 600], [1180, 980], [430, 880],
      [240, 760], [1420, 250], [1400, 820]
    ];

    treePositions.forEach(([x, y]) => {
      const tree = this.obstacles.create(x, y, 'tree');
      tree.setScale(1.1);
      tree.body.setSize(20, 20);
      tree.body.setOffset(14, 24);
    });

    const house = this.obstacles.create(690, 390, 'house');
    house.setScale(1.55);
    house.body.setSize(120, 110);
    house.body.setOffset(20, 28);

    const garden = this.obstacles.create(980, 430, 'garden');
    garden.setScale(1.1);
    garden.body.setSize(90, 70);
    garden.body.setOffset(10, 15);

    this.physics.add.collider(this.player, this.obstacles);

    this.cursors = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.4);
  }

  createPlayerTexture() {
    const graphics = this.make.graphics();
    graphics.fillStyle(0xf1c27d, 1);
    graphics.fillRoundedRect(2, 2, 16, 18, 4);
    graphics.fillStyle(0x7a4a30, 1);
    graphics.fillRect(5, 0, 10, 7);
    graphics.fillStyle(0x2d5d3a, 1);
    graphics.fillRect(4, 6, 12, 3);
    graphics.generateTexture('player', 20, 20);
    graphics.destroy();
  }

  createTreeTexture() {
    const graphics = this.make.graphics();
    graphics.fillStyle(0x2f6a38, 1);
    graphics.fillEllipse(24, 14, 28, 18);
    graphics.fillStyle(0x3f8c46, 1);
    graphics.fillEllipse(16, 18, 26, 20);
    graphics.fillStyle(0x4a2f1d, 1);
    graphics.fillRect(21, 22, 8, 18);
    graphics.generateTexture('tree', 48, 48);
    graphics.destroy();
  }

  createHouseTexture() {
    const graphics = this.make.graphics();
    graphics.fillStyle(0xd9b38c, 1);
    graphics.fillRect(8, 16, 76, 52);
    graphics.fillStyle(0x8c5d3c, 1);
    graphics.fillTriangle(4, 18, 92, 18, 48, 0);
    graphics.fillStyle(0x8f6a51, 1);
    graphics.fillRect(30, 38, 18, 30);
    graphics.fillStyle(0x5e3c2d, 1);
    graphics.fillRect(60, 42, 12, 26);
    graphics.generateTexture('house', 100, 75);
    graphics.destroy();

    const gardenGraphics = this.make.graphics();
    gardenGraphics.fillStyle(0x66d987, 1);
    gardenGraphics.fillRect(0, 0, 60, 40);
    gardenGraphics.fillStyle(0x8d623b, 1);
    gardenGraphics.fillRect(20, 20, 14, 24);
    gardenGraphics.generateTexture('garden', 60, 40);
    gardenGraphics.destroy();
  }

  update() {
    if (!this.player) {
      return;
    }

    const speed = 180;
    const moveX = Number(this.cursors.right.isDown) - Number(this.cursors.left.isDown);
    const moveY = Number(this.cursors.down.isDown) - Number(this.cursors.up.isDown);

    if (moveX !== 0 || moveY !== 0) {
      const length = Math.hypot(moveX, moveY) || 1;
      this.player.setVelocity((moveX / length) * speed, (moveY / length) * speed);
    } else {
      this.player.setVelocity(0, 0);
    }
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: 960,
  height: 540,
  backgroundColor: '#5fa553',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 },
    },
  },
  scene: [FarmScene],
});

window.game = game;
