import Phaser from 'phaser';
import './style.css';

const worldWidth = 1600;
const worldHeight = 1200;

class FarmScene extends Phaser.Scene {
  constructor() {
    super('FarmScene');
    this.selectedWeapon = 'slot-1';
    this.inventory = Array.from({ length: 27 }, (_, index) => ({
      type: 'empty',
      label: `Slot ${index + 1}`,
      key: String(index + 1),
    }));
    this.hotbarSlotKeys = ['1', '2', '3', '4', '5'];
    this.gold = 0;
    this.goldPickups = [];
    this.hasCoupon = false;
    this.missionKillVillagers = false;
    this.nearbyCouponKeeper = null;
    this.nearbyABG = null;
    this.abgPicked = false;
    this.dialogHideTimeout = null;
    this.thoughtBubbleTimeout = null;
    this.playerHealth = 30;
    this.maxPlayerHealth = 30;
    this.bossHealth = 50;
    this.maxBossHealth = 50;
    this.bossFightActive = false;
    this.bossDefeated = false;
    this.bossRoomActive = false;
    this.bossTransitioning = false;
    this.bossAttackCooldown = 0;
    this.bossRoomBounds = { x: 560, y: 400, width: 460, height: 260 };
    this.gameOver = false;
    this.victoryDialog = null;
    this.deathScreen = null;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackDuration = 160;
  }

  preload() {
  }

  create() {
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    this.createIntroScreen();
    this.createWorldGround();
    this.createBossArena();
    this.setupQuestHud();
    this.createGoldHud();
    this.createMinimap();
    this.createHotbar();
    this.createInventoryUi();

    this.obstacles = this.physics.add.staticGroup();
    this.villagerGroup = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.bossProjectiles = this.physics.add.group();
    this.itemGroup = this.physics.add.group();
    this.npcs = [];
    this.worldObjects = [];
    this.pickupItems = [];
    this.nearbyPickup = null;

    this.createPlayerTexture();
    this.createSwordTexture();
    this.createTreeTexture();
    this.createHouseTexture();
    this.createProjectileTexture();
    this.createVillageProps();
    this.createVillagers();
    this.createCouponKeeper();
    this.createBossTesterNpc();
    this.createSwordPickup();
    this.createCoinTexture();
    this.spawnRandomGoldCoins();

    const spawnX = 180;
    const spawnY = 220;

    this.player = this.physics.add.sprite(spawnX, spawnY, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(20);
    this.player.body.setSize(16, 18);
    this.player.body.setOffset(2, 2);
    this.player.walkFrames = this.playerWalkFrames || ['player'];

    this.playerWeapon = this.add.sprite(this.player.x, this.player.y, 'sword');
    this.playerWeapon.setDepth(24);
    this.playerWeapon.setScale(1.1);
    this.playerWeapon.setOrigin(0.5, 0.75);
    this.playerWeapon.setVisible(false);
    this.playerWeapon.setAlpha(1);

    this.createCouponTexture();
    this.playerCoupon = this.add.sprite(this.player.x + 14, this.player.y + 10, 'coupon-item');
    this.playerCoupon.setDepth(25);
    this.playerCoupon.setScale(1.2);
    this.playerCoupon.setVisible(false);

    this.nameLabel = this.add.text(this.player.x, this.player.y - 22, 'Gdolf, The Betrayer', {
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

    this.createDialogueBox();

    this.input.on('pointerdown', (pointer) => {
      if (this.inventoryUi && !this.inventoryUi.classList.contains('hidden')) {
        return;
      }

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

      if (this.couponKeeper) {
        const keeperDistance = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, this.couponKeeper.x, this.couponKeeper.y);
        if (keeperDistance < 60) {
          this.nearbyCouponKeeper = this.couponKeeper;
          this.buyCoupon();
          return;
        }
      }

      if (this.abgNpc && !this.abgPicked) {
        const abgDistance = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, this.abgNpc.x, this.abgNpc.y);
        if (abgDistance < 45) {
          this.nearbyABG = this.abgNpc;
          this.pickUpABG();
          return;
        }
      }

      if (this.selectedWeapon === 'slot-1' && this.inventory[0]?.type === 'sword') {
        this.performAttack(worldPoint.x, worldPoint.y);
        return;
      }

      if (this.selectedWeapon === 'stick') {
        this.performAttack(worldPoint.x, worldPoint.y);
        return;
      }

      if (this.selectedWeapon === 'pistol') {
        this.firePistolProjectile(worldPoint.x, worldPoint.y);
        return;
      }

      this.hidePrompt();
    });

    this.input.keyboard.on('keydown', (event) => {
      const key = event.key ? event.key.toLowerCase() : '';
      if (key === '1') this.selectWeapon('slot-1');
      if (key === '2') this.selectWeapon('slot-2');
      if (key === '3') this.selectWeapon('slot-3');
      if (key === '4') this.selectWeapon('slot-4');
      if (key === '5') this.selectWeapon('slot-5');
      if (key === 'e') {
        if (this.nearbyABG) {
          this.pickUpABG();
          return;
        }
        if (this.nearbyPickup) {
          this.pickUpSword();
          return;
        }
        this.toggleInventory();
      }
      if (key === 'i') this.toggleInventory();
    });

    const roadBlocks = [
      { x: 420, y: 260, width: 440, height: 28 },
      { x: 610, y: 260, width: 28, height: 220 },
      { x: 610, y: 600, width: 28, height: 230 },
      { x: 820, y: 710, width: 520, height: 28 },
      { x: 1040, y: 360, width: 28, height: 250 },
    ];

    roadBlocks.forEach(({ x, y, width, height }) => {
      const road = this.add.rectangle(x, y, width, height, 0x8d8f97, 1);
      road.setOrigin(0.5, 0.5);
      road.setDepth(1);
      this.obstacles.add(road);
    });

    const gate = this.obstacles.create(1160, 360, 'house');
    gate.setScale(0.75);
    gate.body.setSize(120, 110);
    gate.body.setOffset(20, 28);

    const wallLeft = this.obstacles.create(220, 900, 'tree');
    wallLeft.setScale(0.8);
    wallLeft.body.setSize(80, 80);
    wallLeft.body.setOffset(10, 10);

    const wallRight = this.obstacles.create(1330, 940, 'tree');
    wallRight.setScale(0.8);
    wallRight.body.setSize(80, 80);
    wallRight.body.setOffset(10, 10);

    this.physics.add.collider(this.player, this.obstacles);
    this.physics.add.collider(this.villagerGroup, this.obstacles);
    this.physics.add.overlap(this.projectiles, this.villagerGroup, this.handleProjectileHit, null, this);

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

  createWorldGround() {
    const ground = this.add.graphics();
    ground.fillStyle(0x7ec85a, 1);
    ground.fillRect(0, 0, worldWidth, worldHeight);

    for (let x = 0; x < worldWidth; x += 32) {
      for (let y = 0; y < worldHeight; y += 32) {
        const noise = ((x * 13 + y * 17) % 11) * 2;
        ground.fillStyle(0x6bbf4c + noise, 0.18);
        ground.fillRect(x, y, 16, 16);
      }
    }

    ground.fillStyle(0x88a0a8, 1);
    ground.fillRoundedRect(330, 200, 520, 36, 8);
    ground.fillRoundedRect(610, 260, 36, 420, 8);
    ground.fillRoundedRect(610, 610, 36, 260, 8);
    ground.fillRoundedRect(820, 680, 500, 36, 8);
    ground.fillRoundedRect(1030, 360, 36, 280, 8);

    ground.fillStyle(0x6d8c4c, 1);
    ground.fillRect(1180, 310, 140, 100);
    ground.fillStyle(0x95a66a, 1);
    ground.fillRect(1200, 330, 100, 64);
    ground.fillStyle(0x4e3d2e, 1);
    ground.fillRect(1232, 305, 36, 30);

    ground.fillStyle(0x74b65a, 1);
    ground.fillRect(130, 760, 200, 180);
    ground.fillRect(150, 980, 160, 120);
    ground.fillRect(1180, 840, 240, 160);

    ground.fillStyle(0x7a7f85, 1);
    ground.fillRoundedRect(520, 150, 120, 18, 8);
    ground.fillRoundedRect(470, 1040, 210, 20, 8);
    ground.fillRoundedRect(1060, 980, 220, 18, 8);

    ground.generateTexture('ground', worldWidth, worldHeight);
    ground.destroy();
    this.worldGround = this.add.image(0, 0, 'ground').setOrigin(0, 0);
    this.worldGround.setDepth(0);
  }

  createVillageProps() {
    const newHouses = [
      { x: 1180, y: 520, scale: 0.9 },
      { x: 820, y: 540, scale: 1.0 },
      { x: 880, y: 850, scale: 0.95 },
      { x: 260, y: 900, scale: 1.1 },
      { x: 1340, y: 760, scale: 0.9 },
    ];

    newHouses.forEach(({ x, y, scale }) => {
      const house = this.obstacles.create(x, y, 'house');
      house.setScale(scale);
      house.body.setSize(110, 90);
      house.body.setOffset(18, 18);
      this.worldObjects.push(house);
    });

    const fencePositions = [
      { x: 150, y: 700, w: 180, h: 10 },
      { x: 1100, y: 1020, w: 180, h: 10 },
      { x: 280, y: 1060, w: 120, h: 10 },
      { x: 1100, y: 440, w: 150, h: 10 },
      { x: 760, y: 240, w: 180, h: 10 },
    ];

    fencePositions.forEach(({ x, y, w, h }) => {
      const fence = this.add.rectangle(x, y, w, h, 0x6b4b2e, 1);
      fence.setDepth(2);
      this.obstacles.add(fence);
      this.worldObjects.push(fence);
    });

    const gate = this.obstacles.create(1170, 368, 'house');
    gate.setScale(0.55);
    gate.body.setSize(130, 90);
    gate.body.setOffset(12, 12);
    this.worldObjects.push(gate);

    const well = this.add.circle(1240, 520, 22, 0x6c8088, 1);
    well.setDepth(4);
    this.worldObjects.push(well);
    const wellTop = this.add.circle(1240, 502, 16, 0x9aa7a8, 1);
    wellTop.setDepth(5);
    this.worldObjects.push(wellTop);
    const marker = this.add.rectangle(1238, 548, 48, 10, 0x7d7e72, 1);
    marker.setDepth(3);
    this.worldObjects.push(marker);
  }

  createVillagers() {
    const villagerData = [
      { x: 540, y: 520, name: 'Nina', hair: 0x3d2d25, shirt: 0x7d9c4d, skin: 0xe7c9a1, accent: 0x6d7d9a },
      { x: 720, y: 540, name: 'Toma', hair: 0x433a33, shirt: 0x8b6f4d, skin: 0xe4c09e, accent: 0x6e8aa8 },
      { x: 880, y: 430, name: 'Iris', hair: 0x2f2520, shirt: 0x6d87c3, skin: 0xe9d0ad, accent: 0x9b7c5d },
      { x: 1010, y: 710, name: 'Beni', hair: 0x4c382c, shirt: 0x8f5f4d, skin: 0xebc9a6, accent: 0x5b7f5b },
      { x: 340, y: 840, name: 'Milo', hair: 0x1a1a1a, shirt: 0x8e6b4b, skin: 0xd8b38d, accent: 0x739a8b },
    ];

    villagerData.forEach(({ x, y, name, hair, shirt, skin, accent }) => {
      const key = `villager-${name.toLowerCase()}`;
      this.createNpcTexture(key, hair, shirt, skin, accent);

      const npc = this.physics.add.sprite(x, y, key);
      npc.walkFrames = [key, `${key}-walk-1`, `${key}-walk-2`];
      npc.setDepth(15);
      npc.setCollideWorldBounds(true);
      npc.setImmovable(true);
      npc.body.setSize(18, 18);
      npc.body.setOffset(7, 10);
      this.villagerGroup.add(npc);

      const label = this.add.text(x, y - 22, 'Villiger', {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#f5f5f5',
        stroke: '#1f1f1f',
        strokeThickness: 3,
        align: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.16)',
        padding: { x: 4, y: 2 },
      });
      label.setOrigin(0.5, 0.5);
      label.setDepth(30);

      const marker = this.add.text(x, y - 36, '!', {
        fontFamily: 'Arial',
        fontSize: '10px',
        color: '#ffd166',
        stroke: '#1f1f1f',
        strokeThickness: 3,
      });
      marker.setOrigin(0.5, 0.5);
      marker.setDepth(30);
      marker.setVisible(false);

      const minimapMarker = document.createElement('div');
      minimapMarker.className = 'minimap-villager';
      this.minimapSurface.appendChild(minimapMarker);

      const wanderSpeed = 45 + Math.random() * 28;
      const direction = {
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
      };

      this.npcs.push({
        npc,
        label,
        marker,
        minimapMarker,
        name,
        health: 4,
        maxHealth: 4,
        alive: true,
        speed: wanderSpeed,
        direction,
        wanderTimer: 0,
        wanderDelay: 1 + Math.random() * 1.4,
      });
    });
  }

  createCouponKeeper() {
    const key = 'coupon-keeper';
    this.createNpcTexture(key, 0x3a2d27, 0x7d9c4d, 0xeac99b, 0xd8a15c);

    this.couponKeeper = this.physics.add.sprite(140, 220, key);
    this.couponKeeper.setDepth(15);
    this.couponKeeper.setVisible(true);
    this.couponKeeper.setCollideWorldBounds(true);
    this.couponKeeper.setImmovable(true);
    this.couponKeeper.body.setSize(18, 18);
    this.couponKeeper.body.setOffset(7, 10);

    this.couponKeeperLabel = this.add.text(140, 198, 'Cupon Keeper', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#f5f5f5',
      stroke: '#1f1f1f',
      strokeThickness: 3,
      align: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.16)',
      padding: { x: 4, y: 2 },
    });
    this.couponKeeperLabel.setOrigin(0.5, 0.5);
    this.couponKeeperLabel.setDepth(30);

    this.couponKeeperMarker = this.add.text(140, 170, '!', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#ffd166',
      stroke: '#1f1f1f',
      strokeThickness: 3,
    });
    this.couponKeeperMarker.setOrigin(0.5, 0.5);
    this.couponKeeperMarker.setDepth(30);
    this.couponKeeperMarker.setVisible(true);

    this.couponKeeper.setInteractive({ useHandCursor: true });
    this.couponKeeper.on('pointerover', () => {
      this.game.canvas.style.cursor = 'pointer';
    });
    this.couponKeeper.on('pointerout', () => {
      this.game.canvas.style.cursor = 'default';
    });

    this.input.on('gameobjectdown', (pointer, gameObject) => {
      if (gameObject === this.couponKeeper) {
        this.nearbyCouponKeeper = this.couponKeeper;
        this.buyCoupon();
      }
    });
  }

  buyCoupon() {
    if (!this.nearbyCouponKeeper) {
      return;
    }

    if (this.hasCoupon) {
      this.showPrompt('Cupon Keeper', 'Ai deja un cupon.', this.nearbyCouponKeeper.x, this.nearbyCouponKeeper.y);
      return;
    }

    if (this.gold < 100) {
      this.showPrompt('Cupon Keeper', 'Am nevoie de 100 de lovele pentru un cupon.', this.nearbyCouponKeeper.x, this.nearbyCouponKeeper.y);
      return;
    }

    this.gold -= 100;
    this.hasCoupon = true;
    this.updateGoldHud();

    const emptySlotIndex = this.inventory.findIndex((item) => item.type === 'empty');
    const targetIndex = emptySlotIndex !== -1 ? emptySlotIndex : 0;
    this.inventory[targetIndex] = { type: 'coupon', label: 'Cupon', key: String(targetIndex + 1) };
    this.updateInventoryList();
    this.updateHotbarState();

    this.showPrompt('Cupon Keeper', 'Ai primit un cupon!', this.nearbyCouponKeeper.x, this.nearbyCouponKeeper.y);
    this.showThoughtBubble('Am un cupon acum, am nevoie si de o ABG... sigur un muist de-asta e casatorit cu una, ii execut pe toti');
  }

  createBossTesterNpc() {
    const key = 'boss-tester';
    this.createNpcTexture(key, 0x362915, 0x7a3d82, 0xeac99b, 0xf4d35d);

    this.bossTesterNpc = this.physics.add.sprite(260, 220, key);
    this.bossTesterNpc.setDepth(15);
    this.bossTesterNpc.setVisible(true);
    this.bossTesterNpc.setCollideWorldBounds(true);
    this.bossTesterNpc.setImmovable(true);
    this.bossTesterNpc.body.setSize(18, 18);
    this.bossTesterNpc.body.setOffset(7, 10);

    this.bossTesterLabel = this.add.text(260, 198, 'Boss Test', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#f5f5f5',
      stroke: '#1f1f1f',
      strokeThickness: 3,
      align: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.16)',
      padding: { x: 4, y: 2 },
    });
    this.bossTesterLabel.setOrigin(0.5, 0.5);
    this.bossTesterLabel.setDepth(30);

    this.bossTesterMarker = this.add.text(260, 170, '!', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#ffd166',
      stroke: '#1f1f1f',
      strokeThickness: 3,
    });
    this.bossTesterMarker.setOrigin(0.5, 0.5);
    this.bossTesterMarker.setDepth(30);
    this.bossTesterMarker.setVisible(true);

    this.bossTesterNpc.setInteractive({ useHandCursor: true });
    this.bossTesterNpc.on('pointerover', () => {
      this.game.canvas.style.cursor = 'pointer';
    });
    this.bossTesterNpc.on('pointerout', () => {
      this.game.canvas.style.cursor = 'default';
    });

    this.input.on('gameobjectdown', (pointer, gameObject) => {
      if (gameObject === this.bossTesterNpc) {
        this.startBossFight();
      }
    });
  }

  startBossFight() {
    if (!this.player || this.bossFightActive || this.bossRoomActive || this.bossTransitioning) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.bossTesterNpc?.x ?? this.player.x, this.bossTesterNpc?.y ?? this.player.y);
    if (this.bossTesterNpc && distance > 90) {
      return;
    }

    this.bossTransitioning = true;
    this.showPrompt('Boss Test', 'Teleporting to boss fight...');
    this.enterBossRoom();
  }

  createIntroScreen() {
    const overlay = document.createElement('div');
    overlay.id = 'intro-overlay';
    overlay.innerHTML = `
      <div class="intro-panel">
        <div class="intro-brand">
          <img src="/assets/a034172d413676cfdf5469245999fb2fdc683105_full.jpg" alt="Baghii logo" class="intro-logo" />
        </div>
        <p class="intro-kicker">The story begins</p>
        <h1>Gdolf, The Betrayer</h1>
        <p class="intro-text">
          Gdolf kept refusing his friends. Every time they asked him to come to CS2, to play with them,
          to join the squad, he said no. He always had another excuse, another grind, another match to prepare for.
        </p>
        <p class="intro-text">
          He kept saying he would come later, but he never did. One by one, the friends he abandoned disappeared,
          and the village slowly turned cold around him.
        </p>
        <p class="intro-subtext">
          Now Gdolf is alone, and the only thing left is to search the town and find out what happened to the ones he refused.
        </p>
        <button id="start-game-btn" type="button">Start the story</button>
      </div>
    `;

    const startButton = overlay.querySelector('#start-game-btn');
    startButton.addEventListener('click', () => {
      const camera = this.cameras.main;
      const originalZoom = camera.zoom;

      overlay.classList.add('hidden');

      this.time.delayedCall(180, () => {
        this.tweens.add({
          targets: camera,
          zoom: originalZoom + 0.12,
          duration: 700,
          ease: 'Sine.easeInOut',
          yoyo: true,
          repeat: 0,
        });
      });
    });

    document.body.appendChild(overlay);
    this.introOverlay = overlay;
  }

  setupQuestHud() {
    this.questHud = document.createElement('div');
    this.questHud.textContent = 'Level 1 - Find Tete, The Gooner';
    this.questHud.className = 'quest-hud';
    document.body.appendChild(this.questHud);
  }

  createGoldHud() {
    this.goldHud = document.createElement('div');
    this.goldHud.className = 'gold-hud';
    this.goldHud.innerHTML = `
      <span class="gold-label">Gold</span>
      <span class="gold-value">0</span>
    `;
    this.goldValueNode = this.goldHud.querySelector('.gold-value');
    document.body.appendChild(this.goldHud);
    this.updateGoldHud();
  }

  updateGoldHud() {
    if (!this.goldValueNode) {
      return;
    }

    this.goldValueNode.textContent = String(this.gold);
  }

  updateHealthHud() {
    if (!this.questHud) {
      return;
    }

    if (this.bossFightActive) {
      this.questHud.textContent = `Boss Fight - Gdolf ${this.playerHealth}/${this.maxPlayerHealth} | Tete ${this.bossHealth}/${this.maxBossHealth}`;
      return;
    }

    if (this.bossDefeated) {
      this.questHud.textContent = 'Boss defeated - Tete is down';
      return;
    }

    if (this.missionKillVillagers) {
      this.questHud.textContent = 'Next Mission - Kill all villagers';
    }
  }

  createMinimap() {
    this.minimap = document.createElement('div');
    this.minimap.className = 'minimap';
    this.minimap.innerHTML = `
      <div class="minimap-label">Map</div>
      <div class="minimap-surface"></div>
    `;

    this.minimapSurface = this.minimap.querySelector('.minimap-surface');
    this.minimapPlayer = document.createElement('div');
    this.minimapPlayer.className = 'minimap-player';
    this.minimapSurface.appendChild(this.minimapPlayer);

    this.minimapVillagerMarkers = [];
    document.body.appendChild(this.minimap);
    this.updateMinimap();
  }

  updateMinimap() {
    if (!this.minimap || !this.player) {
      return;
    }

    const playerX = (this.player.x / worldWidth) * 100;
    const playerY = (this.player.y / worldHeight) * 100;
    this.minimapPlayer.style.left = `${playerX}%`;
    this.minimapPlayer.style.top = `${playerY}%`;
  }

  createHotbar() {
    this.hotbar = document.createElement('div');
    this.hotbar.className = 'hotbar';
    this.hotbar.innerHTML = this.hotbarSlotKeys.map((key, index) => `
      <div class="hotbar-slot ${index === 0 ? 'active' : ''}" data-slot="slot-${index + 1}">
        <span class="hotbar-key">${key}</span>
        <div class="hotbar-item hotbar-empty"></div>
      </div>
    `).join('');

    this.hotbarSlots = this.hotbar.querySelectorAll('.hotbar-slot');
    this.hotbarSlots.forEach((slot) => {
      slot.addEventListener('click', () => this.selectWeapon(slot.dataset.slot));
    });

    document.body.appendChild(this.hotbar);
    this.updateHotbarState();
    this.selectWeapon('slot-1');
  }

  updateHotbarState() {
    if (!this.hotbarSlots) {
      return;
    }

    this.hotbarSlots.forEach((slot, index) => {
      const item = this.inventory[index] || { type: 'empty' };
      const itemNode = slot.querySelector('.hotbar-item');

      if (item.type === 'sword') {
        itemNode.className = 'hotbar-item hotbar-sword';
        itemNode.innerHTML = `
          <span class="sword-blade"></span>
          <span class="sword-hilt"></span>
        `;
      } else if (item.type === 'coupon') {
        itemNode.className = 'hotbar-item hotbar-coupon';
        itemNode.innerHTML = `
          <span class="coupon-ticket"></span>
        `;
      } else if (item.type === 'abg') {
        itemNode.className = 'hotbar-item hotbar-abg';
        itemNode.textContent = 'ABG';
      } else {
        itemNode.className = 'hotbar-item hotbar-empty';
        itemNode.innerHTML = '';
      }
    });
  }

  createInventoryUi() {
    this.inventoryUi = document.createElement('div');
    this.inventoryUi.className = 'inventory-ui hidden';
    this.inventoryUi.innerHTML = `
      <div class="inventory-panel">
        <div class="inventory-header">
          <h2>Inventory</h2>
          <span>Press E</span>
        </div>
        <div class="inventory-list"></div>
      </div>
    `;

    this.inventoryList = this.inventoryUi.querySelector('.inventory-list');
    this.inventoryUi.addEventListener('click', (event) => {
      if (event.target === this.inventoryUi) {
        this.toggleInventory(false);
      }
    });

    document.body.appendChild(this.inventoryUi);
    this.updateInventoryList();
  }

  updateInventoryList() {
    if (!this.inventoryList) {
      return;
    }

    this.inventoryList.innerHTML = this.inventory
      .map((item, index) => {
        const content = item.type === 'sword'
          ? `
            <div class="inventory-sword">
              <span class="sword-blade"></span>
              <span class="sword-hilt"></span>
            </div>
          `
          : item.type === 'coupon'
            ? `
              <div class="inventory-coupon">
                <span class="coupon-ticket"></span>
              </div>
            `
            : item.type === 'abg'
              ? `
                <div class="inventory-abg">ABG</div>
              `
              : '';

        return `
          <div class="inventory-slot ${item.type === 'empty' ? 'empty' : ''}" title="${item.label}">
            ${content}
            <span class="slot-number">${index + 1}</span>
          </div>
        `;
      })
      .join('');
  }

  toggleInventory(forceState) {
    if (!this.inventoryUi) {
      return;
    }

    const shouldOpen = typeof forceState === 'boolean' ? forceState : this.inventoryUi.classList.contains('hidden');
    this.inventoryUi.classList.toggle('hidden', !shouldOpen);
  }

  selectWeapon(slotName) {
    this.selectedWeapon = slotName;
    this.hotbarSlots?.forEach((slot) => {
      slot.classList.toggle('active', slot.dataset.slot === slotName);
    });
  }

  createPlayerTexture() {
    const buildFrame = (leftLegOffset, rightLegOffset, leftArmOffset, rightArmOffset) => {
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

      graphics.fillStyle(0xe9c59c, 1);
      graphics.fillRect(3 + leftArmOffset, 20, 4, 9);
      graphics.fillRect(25 + rightArmOffset, 20, 4, 9);
      graphics.fillRect(9 + leftLegOffset, 28, 5, 10);
      graphics.fillRect(18 + rightLegOffset, 28, 5, 10);

      graphics.fillStyle(0x3d2f2a, 1);
      graphics.fillRect(6 + leftLegOffset, 28, 5, 4);
      graphics.fillRect(21 + rightLegOffset, 28, 5, 4);
      graphics.fillRect(9 + leftLegOffset, 37, 7, 2);
      graphics.fillRect(16 + rightLegOffset, 37, 7, 2);

      return graphics;
    };

    const idleGraphics = buildFrame(0, 0, 0, 0);
    idleGraphics.generateTexture('player', 32, 40);
    idleGraphics.destroy();

    const walkOneGraphics = buildFrame(1, -1, 1, -1);
    walkOneGraphics.generateTexture('player-walk-1', 32, 40);
    walkOneGraphics.destroy();

    const walkTwoGraphics = buildFrame(-1, 1, -1, 1);
    walkTwoGraphics.generateTexture('player-walk-2', 32, 40);
    walkTwoGraphics.destroy();

    this.playerWalkFrames = ['player', 'player-walk-1', 'player-walk-2'];
  }

  createSwordTexture() {
    const graphics = this.make.graphics();

    graphics.fillStyle(0xe6edf3, 1);
    graphics.fillRect(11, 0, 3, 18);
    graphics.fillRect(9, 18, 7, 22);
    graphics.fillRect(7, 35, 11, 4);

    graphics.fillStyle(0xb9c4d0, 1);
    graphics.fillRect(10, 3, 5, 16);
    graphics.fillRect(8, 20, 9, 18);

    graphics.fillStyle(0x3b2c20, 1);
    graphics.fillRect(6, 38, 13, 4);
    graphics.fillRect(9, 42, 7, 6);
    graphics.fillRect(8, 48, 9, 8);

    graphics.fillStyle(0xccb067, 1);
    graphics.fillRect(5, 38, 3, 14);
    graphics.fillRect(17, 38, 3, 14);

    graphics.fillStyle(0x9aa7b2, 1);
    graphics.fillRect(12, 0, 2, 18);
    graphics.fillRect(11, 18, 4, 24);

    graphics.generateTexture('sword', 24, 56);
    graphics.destroy();
  }

  createSwordPickup() {
    const sword = this.physics.add.sprite(240, 260, 'sword');
    sword.setDepth(12);
    sword.setScale(0.9);
    sword.setImmovable(true);
    this.itemGroup.add(sword);

    const pickupGlow = this.add.circle(sword.x, sword.y, 26, 0x7fe7ff, 0.38);
    pickupGlow.setDepth(11);
    pickupGlow.setBlendMode(Phaser.BlendModes.SCREEN);
    this.tweens.add({
      targets: pickupGlow,
      scale: { from: 0.8, to: 1.35 },
      alpha: { from: 0.35, to: 0.8 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.pickupItems.push({
      id: 'sword',
      sprite: sword,
      glow: pickupGlow,
      picked: false,
      x: sword.x,
      y: sword.y,
    });
  }

  createCoinTexture() {
    const graphics = this.make.graphics();
    graphics.fillStyle(0xf5c451, 1);
    graphics.fillCircle(10, 10, 9);
    graphics.lineStyle(2, 0xfde7a1, 1);
    graphics.strokeCircle(10, 10, 8);
    graphics.fillStyle(0xe3a31a, 1);
    graphics.fillRect(8, 4, 4, 11);
    graphics.fillRect(12, 4, 4, 11);
    graphics.generateTexture('gold-coin', 20, 20);
    graphics.destroy();
  }

  createCouponTexture() {
    const graphics = this.make.graphics();
    graphics.clear();
    graphics.fillStyle(0xf0d777, 1);
    graphics.fillRoundedRect(2, 2, 20, 24, 5);
    graphics.fillStyle(0xf7f4d1, 1);
    graphics.fillRoundedRect(6, 6, 12, 16, 3);
    graphics.fillStyle(0x8c6826, 1);
    graphics.fillRect(9, 8, 2, 12);
    graphics.fillStyle(0x8c6826, 1);
    graphics.fillRect(14, 8, 2, 12);
    graphics.generateTexture('coupon-item', 24, 28);
    graphics.destroy();
  }

  spawnRandomGoldCoins() {
    const positions = [
      { x: 260, y: 420 },
      { x: 440, y: 860 },
      { x: 640, y: 430 },
      { x: 900, y: 840 },
      { x: 1000, y: 260 },
      { x: 1320, y: 620 },
      { x: 1240, y: 930 },
      { x: 380, y: 1060 },
      { x: 154, y: 840 },
      { x: 740, y: 1010 },
      { x: 1070, y: 1080 },
      { x: 1200, y: 760 },
    ];

    while (positions.length < 18) {
      positions.push({
        x: 80 + Math.random() * (worldWidth - 160),
        y: 80 + Math.random() * (worldHeight - 160),
      });
    }

    positions.forEach((position, index) => {
      const coin = this.add.sprite(position.x, position.y, 'gold-coin');
      coin.setDepth(18);
      coin.setScale(1.1);

      this.tweens.add({
        targets: coin,
        y: position.y - 10,
        duration: 700 + (index % 5) * 80,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.goldPickups.push({
        sprite: coin,
        value: 10 + (index % 4) * 5,
        collected: false,
      });
    });
  }

  collectGoldPickup(pickup) {
    if (!pickup || pickup.collected) {
      return;
    }

    pickup.collected = true;
    this.gold += pickup.value;
    this.updateGoldHud();
    pickup.sprite.destroy();

    const goldText = this.add.text(this.player.x, this.player.y - 26, `+${pickup.value} Gold`, {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffd166',
      stroke: '#1f1f1f',
      strokeThickness: 4,
      align: 'center',
    });
    goldText.setOrigin(0.5, 0.5);
    goldText.setDepth(60);
    this.tweens.add({
      targets: goldText,
      y: this.player.y - 50,
      alpha: 0,
      duration: 500,
      ease: 'Sine.easeOut',
      onComplete: () => goldText.destroy(),
    });
  }

  pickUpSword() {
    const pickup = this.pickupItems.find((item) => item.id === 'sword' && !item.picked);
    if (!pickup) {
      return;
    }

    pickup.picked = true;
    pickup.sprite.destroy();
    if (pickup.glow) {
      pickup.glow.destroy();
    }
    this.nearbyPickup = null;

    this.inventory[0] = { type: 'sword', label: 'Sword', key: '1' };
    this.updateInventoryList();
    this.updateHotbarState();
    this.selectWeapon('slot-1');
    this.hidePrompt();
  }

  pickUpABG() {
    if (!this.abgNpc || this.abgPicked) {
      return;
    }

    this.abgPicked = true;
    this.nearbyABG = null;
    const emptySlotIndex = this.inventory.findIndex((item) => item.type === 'empty');
    const targetIndex = emptySlotIndex !== -1 ? emptySlotIndex : 0;
    this.inventory[targetIndex] = { type: 'abg', label: 'ABG', key: String(targetIndex + 1) };
    this.updateInventoryList();
    this.updateHotbarState();
    this.abgNpc.destroy();
    if (this.abgNpcLabel) {
      this.abgNpcLabel.destroy();
    }
    this.hidePrompt();
    this.showThoughtBubble('ABG luata. E time to move on.');

    if (this.hasRequiredBossItems() && !this.bossFightActive && !this.bossTransitioning) {
      this.bossTransitioning = true;
      this.enterBossRoom();
    }
  }

  createNpcTexture(key, hairColor, shirtColor, skinColor, accentColor) {
    const buildFrame = (leftLegOffset, rightLegOffset, leftArmOffset, rightArmOffset) => {
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

      graphics.fillStyle(skinColor, 1);
      graphics.fillRect(3 + leftArmOffset, 20, 4, 9);
      graphics.fillRect(25 + rightArmOffset, 20, 4, 9);
      graphics.fillRect(9 + leftLegOffset, 28, 5, 8);
      graphics.fillRect(18 + rightLegOffset, 28, 5, 8);

      graphics.fillStyle(0x3e2f2b, 1);
      graphics.fillRect(6 + leftLegOffset, 28, 5, 4);
      graphics.fillRect(21 + rightLegOffset, 28, 5, 4);
      graphics.fillRect(9 + leftLegOffset, 36, 7, 2);
      graphics.fillRect(16 + rightLegOffset, 36, 7, 2);

      return graphics;
    };

    const idleGraphics = buildFrame(0, 0, 0, 0);
    idleGraphics.generateTexture(key, 32, 40);
    idleGraphics.destroy();

    const walkOneGraphics = buildFrame(1, -1, 1, -1);
    walkOneGraphics.generateTexture(`${key}-walk-1`, 32, 40);
    walkOneGraphics.destroy();

    const walkTwoGraphics = buildFrame(-1, 1, -1, 1);
    walkTwoGraphics.generateTexture(`${key}-walk-2`, 32, 40);
    walkTwoGraphics.destroy();
  }

  createProjectileTexture() {
    const graphics = this.make.graphics();
    graphics.fillStyle(0xf6f7ff, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture('projectile', 16, 16);
    graphics.destroy();

    const beerGraphics = this.make.graphics();
    beerGraphics.fillStyle(0xf0b64a, 1);
    beerGraphics.fillRoundedRect(2, 2, 12, 12, 4);
    beerGraphics.fillStyle(0xd79b34, 1);
    beerGraphics.fillRect(6, 1, 4, 3);
    beerGraphics.generateTexture('beer-projectile', 16, 16);
    beerGraphics.destroy();
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

  performAttack(targetX, targetY) {
    const attackAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
    this.isAttacking = true;
    this.attackTimer = 0;
    this.attackOriginAngle = attackAngle + Math.PI / 2;

    let hit = false;

    if (this.bossFightActive && this.boss) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boss.x, this.boss.y);
      const aimVectorX = targetX - this.player.x;
      const aimVectorY = targetY - this.player.y;
      const aimLength = Math.hypot(aimVectorX, aimVectorY) || 1;
      const facingX = aimVectorX / aimLength;
      const facingY = aimVectorY / aimLength;
      const toBossX = this.boss.x - this.player.x;
      const toBossY = this.boss.y - this.player.y;
      const dot = (toBossX * facingX) + (toBossY * facingY);

      if (distance <= 80 && dot > -0.2) {
        this.damageBoss(2);
        hit = true;
      }
    }

    this.npcs.forEach((villager) => {
      if (!villager.alive) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, villager.npc.x, villager.npc.y);
      const aimVectorX = targetX - this.player.x;
      const aimVectorY = targetY - this.player.y;
      const aimLength = Math.hypot(aimVectorX, aimVectorY) || 1;
      const facingX = aimVectorX / aimLength;
      const facingY = aimVectorY / aimLength;
      const toVillagerX = villager.npc.x - this.player.x;
      const toVillagerY = villager.npc.y - this.player.y;
      const dot = (toVillagerX * facingX) + (toVillagerY * facingY);

      if (distance <= 58 && dot > -0.2) {
        this.damageVillager(villager, 1);
        hit = true;
      }
    });

    if (!hit) {
      this.hidePrompt();
    }
  }

  firePistolProjectile(targetX, targetY) {
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
    const projectile = this.physics.add.image(this.player.x, this.player.y, 'projectile');
    projectile.setDepth(25);
    projectile.setScale(0.9);
    projectile.setVelocity(Math.cos(angle) * 460, Math.sin(angle) * 460);
    projectile.setCollideWorldBounds(true);
    projectile.setBounce(0);
    this.projectiles.add(projectile);
  }

  damageVillager(villager, amount) {
    if (!villager.alive) {
      return;
    }

    villager.health -= amount;
    villager.npc.setTint(0xff7d7d);
    this.time.delayedCall(120, () => villager.npc.clearTint());

    const hitText = this.add.text(villager.npc.x, villager.npc.y - 26, 'HIT!', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffd166',
      stroke: '#1f1f1f',
      strokeThickness: 4,
      align: 'center',
    });
    hitText.setOrigin(0.5, 0.5);
    hitText.setDepth(50);
    this.tweens.add({
      targets: hitText,
      y: villager.npc.y - 48,
      alpha: 0,
      duration: 400,
      ease: 'Sine.easeOut',
      onComplete: () => hitText.destroy(),
    });

    if (villager.health <= 0) {
      this.killVillager(villager);
      return;
    }

    villager.label.setText(`${villager.name} (${villager.health}/${villager.maxHealth})`);
    villager.marker.setText('!');
  }

  killVillager(villager) {
    villager.alive = false;
    villager.npc.setVisible(false);
    villager.label.setVisible(false);
    villager.marker.setVisible(false);

    const allVillagersDead = this.npcs.every((entry) => !entry.alive);
    if (this.missionKillVillagers && allVillagersDead) {
      this.spawnABGNpc();
    }

    const grave = this.add.rectangle(villager.npc.x, villager.npc.y + 20, 22, 10, 0x7c7c7c, 0.9);
    grave.setDepth(9);

    const graveTop = this.add.rectangle(villager.npc.x, villager.npc.y + 12, 18, 8, 0x9d9d9d, 0.9);
    graveTop.setDepth(10);

    const cross = this.add.text(villager.npc.x, villager.npc.y + 8, '✝', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#f6f2e8',
      stroke: '#1f1f1f',
      strokeThickness: 4,
      align: 'center',
    });
    cross.setOrigin(0.5, 0.5);
    cross.setDepth(50);

    const ghostText = this.add.text(villager.npc.x, villager.npc.y - 30, 'Nu mai e bah vremea de trait!', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#dfe9ff',
      stroke: '#1f1f1f',
      strokeThickness: 4,
      align: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.08)',
      padding: { x: 4, y: 2 },
    });
    ghostText.setOrigin(0.5, 0.5);
    ghostText.setDepth(50);

    const ghost = this.add.text(villager.npc.x, villager.npc.y - 54, '👻', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#dfe9ff',
      stroke: '#1f1f1f',
      strokeThickness: 4,
      align: 'center',
    });
    ghost.setOrigin(0.5, 0.5);
    ghost.setDepth(50);

    this.tweens.add({
      targets: ghost,
      y: villager.npc.y - 70,
      alpha: 0.9,
      duration: 900,
      ease: 'Sine.easeInOut',
      repeat: -1,
      yoyo: true,
    });
    ghostText.setAlpha(1);
    cross.setAlpha(1);
    ghost.setAlpha(1);
    grave.setAlpha(1);
    graveTop.setAlpha(1);
  }

  spawnABGNpc() {
    if (this.abgNpc || this.abgPicked) {
      return;
    }

    this.createNpcTexture('abg-female', 0x2a1d2a, 0x9d233a, 0xe5b08d, 0xa15967);
    this.abgNpc = this.physics.add.sprite(1280, 920, 'abg-female');
    this.abgNpc.setDepth(15);
    this.abgNpc.setCollideWorldBounds(true);
    this.abgNpc.setImmovable(true);
    this.abgNpc.body.setSize(18, 18);
    this.abgNpc.body.setOffset(7, 10);

    this.abgNpcLabel = this.add.text(1280, 900, 'ABG', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffced9',
      stroke: '#1f1f1f',
      strokeThickness: 3,
      align: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.16)',
      padding: { x: 4, y: 2 },
    });
    this.abgNpcLabel.setOrigin(0.5, 0.5);
    this.abgNpcLabel.setDepth(30);

    this.abgNpcMarker = this.add.text(1280, 886, '!', {
      fontFamily: 'Arial',
      fontSize: '10px',
      color: '#ffd166',
      stroke: '#1f1f1f',
      strokeThickness: 3,
    });
    this.abgNpcMarker.setOrigin(0.5, 0.5);
    this.abgNpcMarker.setDepth(30);
    this.abgNpcMarker.setVisible(true);

    this.showThoughtBubble('ABG e aici. E timpul sa o iau.');
    if (this.questHud) {
      this.questHud.textContent = 'Final objective - Take ABG';
    }
  }

  createBossArena() {
    this.bossRoomLayer = this.add.container();

    const roomBg = this.add.rectangle(830, 610, 500, 300, 0x290d18, 1);
    roomBg.setDepth(0);
    this.bossRoomLayer.add(roomBg);

    const floor = this.add.rectangle(830, 610, 420, 190, 0x4b2e39, 1);
    floor.setDepth(1);
    this.bossRoomLayer.add(floor);

    const wallTop = this.add.rectangle(830, 500, 420, 22, 0x582534, 1);
    wallTop.setDepth(2);
    this.bossRoomLayer.add(wallTop);

    const wallBottom = this.add.rectangle(830, 720, 420, 22, 0x582534, 1);
    wallBottom.setDepth(2);
    this.bossRoomLayer.add(wallBottom);

    const wallLeft = this.add.rectangle(620, 610, 22, 220, 0x582534, 1);
    wallLeft.setDepth(2);
    this.bossRoomLayer.add(wallLeft);

    const wallRight = this.add.rectangle(1040, 610, 22, 220, 0x582534, 1);
    wallRight.setDepth(2);
    this.bossRoomLayer.add(wallRight);

    const altar = this.add.rectangle(830, 675, 120, 48, 0x7f1d2d, 1);
    altar.setDepth(3);
    this.bossRoomLayer.add(altar);

    this.bossRoomLayer.setVisible(false);
  }

  showFullscreenDialog(title, message, type = 'default') {
    const overlay = document.createElement('div');
    overlay.className = `fullscreen-dialog ${type}`;
    overlay.innerHTML = `
      <div class="fullscreen-panel">
        <div class="fullscreen-title">${title}</div>
        <div class="fullscreen-text">${message}</div>
        <button type="button" class="fullscreen-button">OK</button>
      </div>
    `;

    const button = overlay.querySelector('.fullscreen-button');
    button.addEventListener('click', () => {
      overlay.remove();
    });

    document.body.appendChild(overlay);
    return overlay;
  }

  showDeathScreen() {
    if (this.deathScreen) {
      return;
    }

    this.deathScreen = this.showFullscreenDialog('MUIE', 'Tete, The Gooner a te-a rupt in piept. Ai murit.', 'death');
    this.gameOver = true;
    this.player.setVelocity(0, 0);
    this.bossFightActive = false;
  }

  showBossVictoryDialog() {
    if (this.victoryDialog) {
      return;
    }

    this.victoryDialog = this.showFullscreenDialog('Tete, The Gooner', 'Asta e tot. Ai luat ce era al meu. Acum pleci cu ABG-ul si cuponul, dar nu uita: am sa te caut si data viitoare.', 'victory');
  }

  hasRequiredBossItems() {
    const hasCoupon = this.hasCoupon || this.inventory.some((item) => item.type === 'coupon');
    const hasABG = this.abgPicked || this.inventory.some((item) => item.type === 'abg');
    return hasCoupon && hasABG;
  }

  checkBossTrigger() {
    if (this.bossFightActive || this.bossDefeated || this.bossRoomActive || this.bossTransitioning) {
      return;
    }

    if (this.hasRequiredBossItems() && this.player) {
      this.bossTransitioning = true;
      this.enterBossRoom();
    }
  }

  enterBossRoom() {
    if (this.bossRoomActive || this.bossFightActive) {
      return;
    }

    this.bossTransitioning = false;
    this.bossFightActive = true;
    this.bossRoomActive = true;
    this.worldGround.setVisible(false);
    this.worldObjects.forEach((obj) => obj.setVisible(false));
    this.npcs.forEach((villager) => {
      villager.npc.setVisible(false);
      villager.label.setVisible(false);
      villager.marker.setVisible(false);
      if (villager.minimapMarker) {
        villager.minimapMarker.style.display = 'none';
      }
    });
    this.goldPickups.forEach((pickup) => {
      pickup.sprite.setVisible(false);
    });
    if (this.couponKeeper) {
      this.couponKeeper.setVisible(false);
      this.couponKeeperLabel.setVisible(false);
      this.couponKeeperMarker.setVisible(false);
    }
    this.bossRoomLayer.setVisible(true);
    this.physics.world.setBounds(this.bossRoomBounds.x, this.bossRoomBounds.y, this.bossRoomBounds.width, this.bossRoomBounds.height);
    this.cameras.main.setBounds(this.bossRoomBounds.x, this.bossRoomBounds.y, this.bossRoomBounds.width, this.bossRoomBounds.height);
    this.player.setPosition(this.bossRoomBounds.x + 140, this.bossRoomBounds.y + 170);
    this.player.setVelocity(0, 0);
    this.player.setCollideWorldBounds(true);
    this.cameras.main.setScroll(this.bossRoomBounds.x, this.bossRoomBounds.y);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.flash(250, 180, 0, 0);
    this.showPrompt('Tete, The Gooner', 'GIVE ME THE ABG AND THE CUPON');
    this.questHud.textContent = 'Boss Fight - Gdolf 30/30 | Tete 50/50';
    this.createBoss();
    this.updateHealthHud();
  }

  createBoss() {
    if (this.boss) {
      return;
    }

    const graphics = this.make.graphics();
    graphics.fillStyle(0x5f1d2c, 1);
    graphics.fillRect(0, 0, 34, 50);
    graphics.fillStyle(0xc7c9d1, 1);
    graphics.fillRect(7, 7, 20, 12);
    graphics.fillStyle(0x2d1a1a, 1);
    graphics.fillRect(9, 9, 4, 4);
    graphics.fillRect(20, 9, 4, 4);
    graphics.fillStyle(0x8c0d1b, 1);
    graphics.fillRect(10, 18, 14, 6);
    graphics.fillStyle(0x3d2a2a, 1);
    graphics.fillRect(6, 28, 6, 16);
    graphics.fillRect(22, 28, 6, 16);
    graphics.fillStyle(0x7f1a2d, 1);
    graphics.fillRect(14, 40, 6, 8);
    graphics.generateTexture('tete-boss', 34, 50);
    graphics.destroy();

    this.boss = this.physics.add.sprite(920, 610, 'tete-boss');
    this.boss.setDepth(30);
    this.boss.setScale(1.9);
    this.boss.setCollideWorldBounds(true);
    this.boss.setImmovable(true);
    this.boss.body.setSize(48, 68);
    this.boss.body.setOffset(8, 14);

    this.bossLabel = this.add.text(920, 560, 'Tete, The Gooner', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffe0ee',
      stroke: '#1f1f1f',
      strokeThickness: 3,
      align: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
      padding: { x: 4, y: 2 },
    });
    this.bossLabel.setOrigin(0.5, 0.5);
    this.bossLabel.setDepth(35);
    this.bossHealthText = this.add.text(920, 580, '50/50', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffd166',
      stroke: '#1f1f1f',
      strokeThickness: 4,
      align: 'center',
    });
    this.bossHealthText.setOrigin(0.5, 0.5);
    this.bossHealthText.setDepth(35);
  }

  damageBoss(amount) {
    if (!this.bossFightActive || !this.boss) {
      return;
    }

    this.bossHealth = Math.max(0, this.bossHealth - amount);
    this.boss.setTint(0xff7d7d);
    this.time.delayedCall(120, () => this.boss.clearTint());
    this.bossHealthText.setText(`${this.bossHealth}/${this.maxBossHealth}`);
    this.questHud.textContent = `Boss Fight - Gdolf ${this.playerHealth}/${this.maxPlayerHealth} | Tete ${this.bossHealth}/${this.maxBossHealth}`;

    if (this.bossHealth <= 0) {
      this.finishBossFight();
    }
  }

  finishBossFight() {
    this.bossFightActive = false;
    this.bossDefeated = true;
    this.bossRoomActive = false;
    this.bossTransitioning = false;
    this.gameOver = false;
    this.bossRoomLayer.setVisible(false);
    this.worldGround.setVisible(true);
    this.worldObjects.forEach((obj) => obj.setVisible(true));
    this.npcs.forEach((villager) => {
      villager.npc.setVisible(true);
      villager.label.setVisible(true);
      villager.marker.setVisible(true);
      if (villager.minimapMarker) {
        villager.minimapMarker.style.display = 'block';
      }
    });
    this.goldPickups.forEach((pickup) => {
      pickup.sprite.setVisible(true);
    });
    if (this.couponKeeper) {
      this.couponKeeper.setVisible(true);
      this.couponKeeperLabel.setVisible(true);
      this.couponKeeperMarker.setVisible(true);
    }
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.player.setPosition(180, 220);
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.questHud.textContent = 'Boss defeated - Tete is down';
    this.showBossVictoryDialog();
    this.showPrompt('Tete, The Gooner', 'NO... the ABG and coupon were never yours.');
    this.boss.destroy();
    if (this.bossLabel) this.bossLabel.destroy();
    if (this.bossHealthText) this.bossHealthText.destroy();
    this.boss = null;
  }

  damagePlayer(amount) {
    if (!this.bossFightActive || this.playerHealth <= 0) {
      return;
    }

    this.playerHealth = Math.max(0, this.playerHealth - amount);
    this.player.setTint(0xff7d7d);
    this.time.delayedCall(140, () => this.player.clearTint());
    this.questHud.textContent = `Boss Fight - Gdolf ${this.playerHealth}/${this.maxPlayerHealth} | Tete ${this.bossHealth}/${this.maxBossHealth}`;

    if (this.playerHealth <= 0) {
      this.playerHealth = 0;
      this.showDeathScreen();
      this.questHud.textContent = 'You died - Tete wins';
    }
  }

  handleProjectileHit(projectile, targetNpc) {
    const villager = this.npcs.find((entry) => entry.npc === targetNpc);
    if (!villager) {
      projectile.destroy();
      return;
    }

    projectile.destroy();
    this.damageVillager(villager, 1);
  }

  update() {
    if (this.gameOver) {
      return;
    }

    this.checkBossTrigger();

    if (this.bossFightActive && this.boss) {
      const bossSpeed = 42;
      const dx = this.player.x - this.boss.x;
      const dy = this.player.y - this.boss.y;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance > 60) {
        this.boss.setVelocity((dx / distance) * bossSpeed, (dy / distance) * bossSpeed);
      } else {
        this.boss.setVelocity(0, 0);
      }

      this.player.x = Phaser.Math.Clamp(this.player.x, this.bossRoomBounds.x + 40, this.bossRoomBounds.x + this.bossRoomBounds.width - 40);
      this.player.y = Phaser.Math.Clamp(this.player.y, this.bossRoomBounds.y + 40, this.bossRoomBounds.y + this.bossRoomBounds.height - 40);

      this.bossAttackCooldown -= this.game.loop.delta;
      if (this.bossAttackCooldown <= 0) {
        this.bossAttackCooldown = 1400;

        const shots = 3;
        const baseAngle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);

        for (let i = 0; i < shots; i += 1) {
          const offset = (i - (shots - 1) / 2) * 0.12;
          const angle = baseAngle + offset;
          const projectileType = i % 2 === 0 ? 'projectile' : 'beer-projectile';
          const projectile = this.physics.add.image(this.boss.x, this.boss.y, projectileType);
          projectile.setDepth(26);
          projectile.setScale(1.15);
          projectile.setAlpha(0.96);
          projectile.setTint(i % 2 === 0 ? 0xffffff : 0xf0b64a);
          projectile.setCircle(6);
          projectile.body.setAllowGravity(false);
          projectile.body.setSize(12, 12);
          projectile.setVelocity(Math.cos(angle) * 230, Math.sin(angle) * 230);
          this.bossProjectiles.add(projectile);

          this.time.delayedCall(2200, () => {
            if (projectile && projectile.active) {
              projectile.destroy();
            }
          });
        }
      }

      this.bossProjectiles.children.each((projectile) => {
        if (!projectile || !projectile.active) {
          return;
        }

        const playerDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, projectile.x, projectile.y);
        if (playerDistance < 18) {
          projectile.destroy();
          this.damagePlayer(4);
        }

        if (projectile.x < 0 || projectile.x > worldWidth || projectile.y < 0 || projectile.y > worldHeight) {
          projectile.destroy();
        }
      });
    }

    this.updateMinimap();

    if (!this.player) {
      return;
    }

    const speed = 180;
    const moveX = Number(this.cursors.right.isDown) - Number(this.cursors.left.isDown);
    const moveY = Number(this.cursors.down.isDown) - Number(this.cursors.up.isDown);

    if (moveX !== 0 || moveY !== 0) {
      const length = Math.hypot(moveX, moveY) || 1;
      this.player.setVelocity((moveX / length) * speed, (moveY / length) * speed);
      const walkFrameIndex = Math.floor((this.time.now / 140) % this.player.walkFrames.length);
      const nextTexture = this.player.walkFrames[walkFrameIndex];
      if (this.player.texture.key !== nextTexture) {
        this.player.setTexture(nextTexture);
      }
    } else {
      this.player.setVelocity(0, 0);
      if (this.player.texture.key !== 'player') {
        this.player.setTexture('player');
      }
    }

    if (this.playerWeapon) {
      const pointerWorld = this.cameras.main.getWorldPoint(this.input.activePointer.x, this.input.activePointer.y);
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointerWorld.x, pointerWorld.y);
      const offsetX = Math.cos(angle) * 14;
      const offsetY = Math.sin(angle) * 14;
      this.playerWeapon.x = this.player.x + offsetX;
      this.playerWeapon.y = this.player.y + offsetY;

      if (this.isAttacking) {
        const swingProgress = Math.min(this.attackTimer / this.attackDuration, 1);
        const swingAmount = Math.sin(swingProgress * Math.PI) * (Math.PI * 0.7);
        this.playerWeapon.rotation = this.attackOriginAngle + swingAmount;
        this.attackTimer += this.game.loop.delta;

        if (swingProgress >= 1) {
          this.isAttacking = false;
          this.attackTimer = 0;
        }
      } else {
        this.playerWeapon.rotation = angle + Math.PI / 2;
      }

      this.playerWeapon.setVisible(this.inventory[0]?.type === 'sword' && this.selectedWeapon === 'slot-1');
    }

    if (this.playerCoupon) {
      const selectedSlotIndex = Number(this.selectedWeapon.replace('slot-', '')) - 1;
      const selectedItem = this.inventory[selectedSlotIndex] || { type: 'empty' };
      const shouldShowCoupon = selectedItem.type === 'coupon';
      this.playerCoupon.setVisible(shouldShowCoupon);
      this.playerCoupon.x = this.player.x + 14;
      this.playerCoupon.y = this.player.y + 12;
      const pointerWorld = this.cameras.main.getWorldPoint(this.input.activePointer.x, this.input.activePointer.y);
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointerWorld.x, pointerWorld.y);
      this.playerCoupon.rotation = angle + Math.PI / 2;
    }

    if (this.thoughtBubble) {
      const bubbleX = this.player.x - this.cameras.main.scrollX;
      const bubbleY = this.player.y - 42 - this.cameras.main.scrollY;
      const screenX = bubbleX * this.cameras.main.zoom;
      const screenY = bubbleY * this.cameras.main.zoom;
      this.thoughtBubble.style.left = `${screenX + 480}px`;
      this.thoughtBubble.style.top = `${screenY + 220}px`;
    }

    if (this.abgNpc && !this.abgPicked) {
      const abgDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.abgNpc.x, this.abgNpc.y);
      if (abgDistance < 60) {
        this.nearbyABG = this.abgNpc;
      } else if (this.nearbyABG) {
        this.nearbyABG = null;
      }

      this.abgNpcLabel.x = this.abgNpc.x;
      this.abgNpcLabel.y = this.abgNpc.y - 20;
      this.abgNpcMarker.x = this.abgNpc.x;
      this.abgNpcMarker.y = this.abgNpc.y - 30;
    }

    if (this.nameLabel) {
      this.nameLabel.x = this.player.x;
      this.nameLabel.y = this.player.y - 22;
    }

    if (this.couponKeeper) {
      const keeperDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.couponKeeper.x, this.couponKeeper.y);
      if (keeperDistance < 65) {
        this.nearbyCouponKeeper = this.couponKeeper;
      } else if (this.nearbyCouponKeeper) {
        this.nearbyCouponKeeper = null;
      }
    }

    if (this.bossTesterNpc) {
      const testerDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.bossTesterNpc.x, this.bossTesterNpc.y);
      if (testerDistance < 60) {
        this.game.canvas.style.cursor = 'pointer';
      }
    }

    if (this.npcs) {
      this.npcs.forEach((villager) => {
        const { npc, label, marker, minimapMarker, alive } = villager;
        if (!alive) return;

        villager.wanderTimer += this.game.loop.delta / 1000;
        if (villager.wanderTimer >= villager.wanderDelay) {
          villager.wanderTimer = 0;
          villager.wanderDelay = 1 + Math.random() * 1.8;
          const angle = Math.random() * Math.PI * 2;
          villager.direction.x = Math.cos(angle);
          villager.direction.y = Math.sin(angle);
        }

        const moveX = villager.direction.x;
        const moveY = villager.direction.y;
        const length = Math.hypot(moveX, moveY) || 1;
        const vx = (moveX / length) * villager.speed;
        const vy = (moveY / length) * villager.speed;
        npc.setVelocity(vx, vy);

        const walkFrameIndex = Math.floor((this.time.now / 150) % npc.walkFrames.length);
        const nextTexture = npc.walkFrames[walkFrameIndex];
        if (npc.texture.key !== nextTexture) {
          npc.setTexture(nextTexture);
        }

        if (npc.x <= 40 || npc.x >= worldWidth - 40) {
          villager.direction.x *= -1;
        }
        if (npc.y <= 50 || npc.y >= worldHeight - 50) {
          villager.direction.y *= -1;
        }

        label.x = npc.x;
        label.y = npc.y - 20;
        marker.x = npc.x;
        marker.y = npc.y - 30;

        const minimapX = (npc.x / worldWidth) * 100;
        const minimapY = (npc.y / worldHeight) * 100;
        minimapMarker.style.left = `${minimapX}%`;
        minimapMarker.style.top = `${minimapY}%`;
        minimapMarker.style.display = 'block';
      });
    }

    if (this.projectiles) {
      this.projectiles.children.each((projectile) => {
        if (!projectile || !projectile.active) return;
        const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, projectile.x, projectile.y);
        if (distance > 500) {
          projectile.destroy();
        }
      });
    }

    if (this.promptBox && this.promptBox.visible) {
      this.promptBox.x = this.player.x - 120;
      this.promptBox.y = this.player.y - 110;
    }

    this.goldPickups.forEach((pickup) => {
      if (pickup.collected) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, pickup.sprite.x, pickup.sprite.y);
      if (distance < 28) {
        this.collectGoldPickup(pickup);
      }
    });

    this.nearbyPickup = null;
    this.pickupItems.forEach((pickup) => {
      if (pickup.picked) {
        return;
      }

      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, pickup.sprite.x, pickup.sprite.y);
      if (distance < 55) {
        this.nearbyPickup = pickup;
        this.pickUpSword();
        return;
      }
    });
  }

  createDialogueBox() {
    this.dialogBox = document.createElement('div');
    this.dialogBox.className = 'npc-dialog hidden';
    this.dialogBox.innerHTML = `
      <div class="npc-dialog-avatar">
        <img src="/assets/CuponKeeper.png" alt="NPC portrait" />
      </div>
      <div class="npc-dialog-content">
        <div class="npc-dialog-name">Cupon Keeper</div>
        <div class="npc-dialog-text">Am nevoie de 100 de lovele pentru un cupon.</div>
      </div>
      <button type="button" class="npc-dialog-ok">OK</button>
    `;

    this.dialogName = this.dialogBox.querySelector('.npc-dialog-name');
    this.dialogText = this.dialogBox.querySelector('.npc-dialog-text');
    this.dialogOkButton = this.dialogBox.querySelector('.npc-dialog-ok');
    this.dialogOkButton.addEventListener('click', () => {
      this.hidePrompt();
      if (this.hasCoupon && !this.missionKillVillagers) {
        this.missionKillVillagers = true;
        this.questHud.textContent = 'Next Mission - Kill all villagers';
      }
    });
    document.body.appendChild(this.dialogBox);
  }

  showPrompt(name, message, x, y) {
    if (!this.dialogBox) {
      return;
    }

    if (this.dialogHideTimeout) {
      clearTimeout(this.dialogHideTimeout);
    }

    this.dialogName.textContent = name;
    this.dialogText.textContent = message;
    this.dialogBox.classList.remove('hidden');
    this.dialogHideTimeout = setTimeout(() => {
      this.hidePrompt();
    }, 5000);
  }

  hidePrompt() {
    if (!this.dialogBox) {
      return;
    }

    if (this.dialogHideTimeout) {
      clearTimeout(this.dialogHideTimeout);
      this.dialogHideTimeout = null;
    }
    this.dialogBox.classList.add('hidden');
  }

  showThoughtBubble(message) {
    if (!this.thoughtBubble) {
      this.thoughtBubble = document.createElement('div');
      this.thoughtBubble.className = 'thought-bubble hidden';
      document.body.appendChild(this.thoughtBubble);
    }

    this.thoughtBubble.textContent = message;
    this.thoughtBubble.classList.remove('hidden');

    if (this.thoughtBubbleTimeout) {
      clearTimeout(this.thoughtBubbleTimeout);
    }
    this.thoughtBubbleTimeout = setTimeout(() => {
      this.hideThoughtBubble();
    }, 5000);
  }

  hideThoughtBubble() {
    if (this.thoughtBubble) {
      this.thoughtBubble.classList.add('hidden');
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
