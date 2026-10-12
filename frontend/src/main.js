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
    this.createNpcTexture('tete', 0xd9b3ff, 0x6d4cb3, 0xf4d7b5, 0x3f2f6d);
    this.createNpcTexture('gooner', 0x92d08b, 0x2f7c42, 0xf1d4a7, 0x264c2d);
    this.createNpcTexture('kdp', 0xdf8a7a, 0x7d2a2a, 0xf8d3b4, 0x4b1b1b);
    this.createNpcTexture('grain', 0xaed7ff, 0x2d5a82, 0xf2d1a2, 0x234158);
    this.createTreeTexture();
    this.createHouseTexture();

    const spawnX = 180;
    const spawnY = 220;

    this.player = this.physics.add.sprite(spawnX, spawnY, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(20);
    this.player.body.setSize(16, 18);
    this.player.body.setOffset(2, 2);

    this.nameLabel = this.add.text(this.player.x, this.player.y - 22, 'Gdolf the Betrayer', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#f5f5f5',
      stroke: '#1f1f1f',
      strokeThickness: 3,
      align: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.18)',
      padding: { x: 4, y: 2 },
    });
    this.nameLabel.setOrigin(0.5, 0.5);
    this.nameLabel.setDepth(30);

    this.npcs = [
      this.createNpc('tete', 'Tete, The Gooner', 'Hey, the village still needs a hero.', spawnX - 110, spawnY - 30),
      this.createNpc('kdp', 'KDP, The Mutilated', 'I survived the cracks... now I survive the gossip.', spawnX + 110, spawnY + 90),
      this.createNpc('grain', 'Mr.GraiN, The Fosated', 'A good harvest starts with a good scowl.', spawnX - 120, spawnY + 90),
      this.createNpc('tete', 'Astriz, The Berserker', 'You look lost. The road always starts here.', spawnX + 20, spawnY - 110)
    ];

    this.promptBox = this.add.container(0, 0);
    this.promptBox.setVisible(false);
    this.promptBox.setDepth(50);

    this.promptBackground = this.add.graphics();
    this.promptBackground.fillStyle(0x1d1d1d, 0.85);
    this.promptBackground.fillRoundedRect(0, 0, 260, 90, 12);
    this.promptBackground.generateTexture('promptBox', 260, 90);
    this.promptBackground.destroy();

    this.promptImage = this.add.image(0, 0, 'promptBox');
    this.promptImage.setVisible(false);
    this.promptImage.setOrigin(0, 0);

    this.promptText = this.add.text(16, 18, '', {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#f2f2f2',
      align: 'left',
      wordWrap: { width: 220 },
      lineSpacing: 4,
    });
    this.promptText.setVisible(false);

    this.promptBox.add([this.promptImage, this.promptText]);

    this.input.on('pointerdown', (pointer) => {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

      const clickedNpc = this.npcs.find(({ npc }) => {
        if (!npc) return false;
        return Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, npc.x, npc.y) < 28;
      });

      if (clickedNpc) {
        this.showPrompt(clickedNpc.name, clickedNpc.message, clickedNpc.npc.x, clickedNpc.npc.y);
      } else {
        this.hidePrompt();
      }
    });

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

    graphics.fillStyle(0x4d3629, 1);
    graphics.fillRect(7, 2, 18, 6);
    graphics.fillRect(5, 3, 22, 3);

    graphics.fillStyle(0xe9c59c, 1);
    graphics.fillRect(7, 6, 18, 13);
    graphics.fillRect(9, 9, 14, 10);

    graphics.fillStyle(0x2a2a2a, 1);
    graphics.fillRect(10, 10, 3, 2);
    graphics.fillRect(19, 10, 3, 2);
    graphics.fillRect(9, 14, 4, 2);
    graphics.fillRect(19, 14, 4, 2);
    graphics.fillRect(12, 15, 8, 2);

    graphics.fillStyle(0x7e5841, 1);
    graphics.fillRect(8, 17, 16, 3);
    graphics.fillRect(12, 19, 8, 3);

    graphics.fillStyle(0x58769a, 1);
    graphics.fillRect(6, 20, 20, 8);
    graphics.fillRect(10, 18, 12, 2);

    graphics.fillStyle(0x3e2a20, 1);
    graphics.fillRect(10, 15, 12, 2);
    graphics.fillRect(11, 17, 10, 1);
    graphics.fillRect(9, 19, 14, 1);

    graphics.generateTexture('player', 32, 32);
    graphics.destroy();
  }

  createNpcTexture(key, hairColor, shirtColor, skinColor, accentColor) {
    const graphics = this.make.graphics();

    graphics.fillStyle(hairColor, 1);
    graphics.fillRect(8, 2, 16, 8);
    graphics.fillRect(6, 4, 20, 5);

    graphics.fillStyle(skinColor, 1);
    graphics.fillRect(8, 7, 16, 12);
    graphics.fillRect(10, 10, 12, 9);

    graphics.fillStyle(0x1c1c1c, 1);
    graphics.fillRect(11, 10, 3, 2);
    graphics.fillRect(18, 10, 3, 2);
    graphics.fillRect(11, 15, 4, 2);
    graphics.fillRect(17, 15, 4, 2);
    graphics.fillRect(13, 17, 6, 2);

    graphics.fillStyle(accentColor, 1);
    graphics.fillRect(10, 18, 12, 3);
    graphics.fillRect(12, 20, 8, 3);

    graphics.fillStyle(shirtColor, 1);
    graphics.fillRect(6, 21, 20, 8);
    graphics.fillRect(10, 19, 12, 2);

    graphics.generateTexture(key, 32, 32);
    graphics.destroy();
  }

  createNpc(key, name, message, x, y) {
    const npc = this.physics.add.sprite(x, y, key);
    npc.setCollideWorldBounds(true);
    npc.setDepth(20);
    npc.body.setSize(16, 18);
    npc.body.setOffset(8, 10);
    npc.setInteractive();

    npc.on('pointerover', () => {
      this.game.canvas.style.cursor = 'pointer';
    });

    npc.on('pointerout', () => {
      this.game.canvas.style.cursor = 'default';
    });

    const label = this.add.text(x, y - 20, name, {
      fontFamily: 'Arial',
      fontSize: '11px',
      color: '#f5f5f5',
      stroke: '#1f1f1f',
      strokeThickness: 3,
      align: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
      padding: { x: 4, y: 2 },
    });
    label.setOrigin(0.5, 0.5);
    label.setDepth(30);

    const marker = this.add.text(x, y - 30, '!', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffd166',
      stroke: '#1f1f1f',
      strokeThickness: 4,
      align: 'center',
    });
    marker.setOrigin(0.5, 0.5);
    marker.setDepth(40);

    return { npc, label, marker, name, message };
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

    if (this.nameLabel) {
      this.nameLabel.x = this.player.x;
      this.nameLabel.y = this.player.y - 22;
    }

    if (this.npcs) {
      this.npcs.forEach(({ npc, label, marker }) => {
        label.x = npc.x;
        label.y = npc.y - 20;
        marker.x = npc.x;
        marker.y = npc.y - 30;
      });
    }

    if (this.promptBox && this.promptBox.visible) {
      this.promptBox.x = this.player.x - 120;
      this.promptBox.y = this.player.y - 110;
    }
  }

  showPrompt(name, message, x, y) {
    const boxX = x - 120;
    const boxY = y - 120;
    this.promptText.setText(`${name}\n${message}`);
    this.promptText.setVisible(true);
    this.promptImage.setVisible(true);
    this.promptBox.setPosition(boxX, boxY);
    this.promptBox.setVisible(true);
  }

  hidePrompt() {
    this.promptText.setVisible(false);
    this.promptImage.setVisible(false);
    this.promptBox.setVisible(false);
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
