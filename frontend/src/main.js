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
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackDuration = 160;
  }

  create() {
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    this.createIntroScreen();
    this.createWorldGround();
    this.setupQuestHud();
    this.createMinimap();
    this.createHotbar();
    this.createInventoryUi();

    this.obstacles = this.physics.add.staticGroup();
    this.villagerGroup = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.itemGroup = this.physics.add.group();
    this.npcs = [];
    this.pickupItems = [];
    this.nearbyPickup = null;

    this.createPlayerTexture();
    this.createSwordTexture();
    this.createTreeTexture();
    this.createHouseTexture();
    this.createProjectileTexture();
    this.createVillageProps();
    this.createVillagers();
    this.createSwordPickup();

    const spawnX = 180;
    const spawnY = 220;

    this.player = this.physics.add.sprite(spawnX, spawnY, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(20);
    this.player.body.setSize(16, 18);
    this.player.body.setOffset(2, 2);

    this.playerWeapon = this.add.sprite(this.player.x, this.player.y, 'sword');
    this.playerWeapon.setDepth(24);
    this.playerWeapon.setScale(0.75);
    this.playerWeapon.setOrigin(0.5, 0.8);
    this.playerWeapon.setVisible(false);
    this.playerWeapon.setAlpha(1);

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
      if (this.inventoryUi && !this.inventoryUi.classList.contains('hidden')) {
        return;
      }

      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

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
    this.add.image(0, 0, 'ground').setOrigin(0, 0);
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
    });

    const gate = this.obstacles.create(1170, 368, 'house');
    gate.setScale(0.55);
    gate.body.setSize(130, 90);
    gate.body.setOffset(12, 12);

    const well = this.add.circle(1240, 520, 22, 0x6c8088, 1);
    well.setDepth(4);
    const wellTop = this.add.circle(1240, 502, 16, 0x9aa7a8, 1);
    wellTop.setDepth(5);
    const marker = this.add.rectangle(1238, 548, 48, 10, 0x7d7e72, 1);
    marker.setDepth(3);
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

  createIntroScreen() {
    const overlay = document.createElement('div');
    overlay.id = 'intro-overlay';
    overlay.innerHTML = `
      <div class="intro-panel">
        <p class="intro-kicker">The story begins</p>
        <h1>Gdolf the Betrayer</h1>
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
      .map((item, index) => `
        <div class="inventory-slot ${item.type === 'empty' ? 'empty' : ''}" title="${item.label}">
          ${item.type === 'empty' ? '' : item.label}
          <span class="slot-number">${index + 1}</span>
        </div>
      `)
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

  createSwordTexture() {
    const graphics = this.make.graphics();
    graphics.fillStyle(0xd9d7d1, 1);
    graphics.fillRect(6, 10, 4, 18);
    graphics.fillRect(8, 2, 4, 12);
    graphics.fillRect(10, 0, 2, 8);
    graphics.fillStyle(0x8d7a4b, 1);
    graphics.fillRect(4, 24, 12, 4);
    graphics.fillStyle(0x8d8d8d, 1);
    graphics.fillRect(8, 27, 4, 8);
    graphics.generateTexture('sword', 20, 40);
    graphics.destroy();
  }

  createSwordPickup() {
    const sword = this.physics.add.sprite(240, 260, 'sword');
    sword.setDepth(12);
    sword.setScale(0.9);
    sword.setImmovable(true);
    this.itemGroup.add(sword);

    this.pickupItems.push({
      id: 'sword',
      sprite: sword,
      picked: false,
      x: sword.x,
      y: sword.y,
    });
  }

  pickUpSword() {
    const pickup = this.pickupItems.find((item) => item.id === 'sword' && !item.picked);
    if (!pickup) {
      return;
    }

    pickup.picked = true;
    pickup.sprite.destroy();
    this.nearbyPickup = null;

    this.inventory[0] = { type: 'sword', label: 'Sword', key: '1' };
    this.updateInventoryList();
    this.updateHotbarState();
    this.selectWeapon('slot-1');
    this.hidePrompt();
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

  createProjectileTexture() {
    const graphics = this.make.graphics();
    graphics.fillStyle(0xffd166, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture('projectile', 16, 16);
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

  performAttack(targetX, targetY) {
    const attackAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
    this.isAttacking = true;
    this.attackTimer = 0;
    this.attackOriginAngle = attackAngle + Math.PI / 2;

    let hit = false;

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
    } else {
      this.player.setVelocity(0, 0);
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

    if (this.nameLabel) {
      this.nameLabel.x = this.player.x;
      this.nameLabel.y = this.player.y - 22;
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
