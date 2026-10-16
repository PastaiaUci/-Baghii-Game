import Phaser from 'phaser';
import { drawGdolf, getGdolfIdleTexture } from './player-art.js';
import { createLaviniaTexture } from './lavinia-art.js';
import { joinParty, updateParty, showLevelOneTitle, showLevelComplete, giveVictoryBook, openBook, closeBook } from './completion.js';
import { showVictoryDialogue, beginChapterDialogue, useChapterPortal, clickChapterPortal, updateChapterPortal } from './chapter-two.js';
import { showNpcDialogue, hideNpcDialogue } from './dialogue.js';
import { createGameAudio, unlockAudio, updateGameAudio, playSound } from './audio.js';
import { createVillageCombat, enrageVillage, updateEnragedVillager, updateVillageCombat, showVillageDeath } from './village-combat.js';
import { TavernScene } from './tavern-interior.js';
import { tryEnterTavern, clickTavernDoor, updateTavernDoor } from './tavern-access.js';
import { installPauseMenu } from './pause-menu.js';
import { createPotionHeld, updatePotionHeld, useHealthPotion } from './health-potion.js';
import { getSelectedItem, installInventoryDragging } from './inventory.js';
import { equipmentPanelMarkup, updateEquipmentPanel } from './equipment-panel.js';
import { clickDicePlayer } from './dice-players.js';
import { createCouponKeeperTexture } from './coupon-keeper-art.js';
import { createVillageGoldLayout } from './village-gold.js';
import { createShop } from './shop.js';
import { toggleHelmet, createHelmetVisual, absorbArmorDamage, armorPoints } from './armor.js';
import { clickPartyTete, deployPartyTete } from './party-storage.js';
import { toggleGear, movementMultiplier, absorbShieldDamage, createGearVisual } from './gear.js';
import { createSwordMotion, updateSwordMotion } from './sword-motion.js';
import './style.css';
import { createVillageGround, createVillageProps, createVillageTextures } from './village.js';
import { createRushSkill, activateRush, updateRush } from './rush.js';
import { createArena, createBoss, updateBoss, clearBossAttacks, updatePlayerHealth, updateBossHealth, restartBossFight } from './boss.js';
import { dropBossLoot, consumeNearbyBossLoot, clickBossLoot, updateBossLoot } from './boss-loot.js';
import { createRewardSystem, activateDeathBreath, activateFlashlight, updateRewards, slowMultiplier } from './rewards.js';
import { createSkillbar, createSwordAura, activateSwordAura, updateSwordAura, swordAuraBonus } from './skills.js';
import { createAnimals, hideAnimals, updateAnimals } from './animals.js';

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
    this.bossHealth = 70;
    this.maxBossHealth = 70;
    this.bossFightActive = false;
    this.bossDefeated = false;
    this.bossRoomActive = false;
    this.bossTransitioning = false;
    this.bossRoomBounds = { x: 480, y: 340, width: 640, height: 400 };
    this.gameOver = false;
    this.deathScreen = null;
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackDuration = 160;
  }

  preload() {
    this.load.image('tete-portrait', '/assets/Tete.png');
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
    createVillageTextures(this);
    this.createProjectileTexture();
    this.createVillageProps();
    this.createVillagers();
    createAnimals(this);
    this.createCouponKeeper();
    this.createSwordPickup();
    this.createCoinTexture();
    this.spawnRandomGoldCoins();

    const spawnX = 180;
    const spawnY = 220;

    this.player = this.physics.add.sprite(spawnX, spawnY, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(20);
    this.player.body.setSize(16, 10);
    this.player.body.setOffset(8, 28);
    this.player.walkFrames = this.playerWalkFrames || ['player'];
    createSkillbar(this);
    createRushSkill(this);
    createSwordAura(this);
    createRewardSystem(this);
    createPotionHeld(this);

    this.playerWeapon = this.add.sprite(this.player.x, this.player.y, 'sword');
    this.playerWeapon.setDepth(24);
    this.playerWeapon.setScale(0.78);
    this.playerWeapon.setOrigin(0.5, 46 / 56);
    this.playerWeapon.setVisible(false);
    this.playerWeapon.setAlpha(1);
    createSwordMotion(this);

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
    this.playerHeadHealth = this.add.graphics().setDepth(31);
    this.playerHeadHealthText = this.add.text(0, 0, '', {
      fontFamily: 'Arial', fontSize: '8px', color: '#eaffdf', stroke: '#17211c', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(32);
    this.playerArmorHeadText = this.add.text(0, 0, '', {
      fontFamily: 'Arial', fontSize: '7px', color: '#f1f3f5', stroke: '#303741', strokeThickness: 1,
    }).setOrigin(0.5).setDepth(31);
    this.updatePlayerHeadHealth();

    this.createDialogueBox();
    createShop(this);
    createHelmetVisual(this);
    createGearVisual(this);
    this.input.mouse.disableContextMenu();
    createGameAudio(this);
    installPauseMenu(this);
    createVillageCombat(this);

    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) return;
      if (this.tavernActive) return;
      if (!this.introOverlay.classList.contains('hidden')) return;
      if (this.gameOver) return;
      if (this.npcDialogueOpen || this.chapterDialogueOpen || this.levelTransitioning) return;
      if (this.bookOpen) return;
      if (this.couponDialogueStep) return;
      if (this.inventoryUi && !this.inventoryUi.classList.contains('hidden')) {
        return;
      }

      const selectedItem = getSelectedItem(this);
      if (selectedItem?.type === 'party-tete') {
        deployPartyTete(this, selectedItem);
        return;
      }
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      if (clickPartyTete(this, worldPoint)) return;
      if (clickDicePlayer(this, worldPoint)) return;
      if (clickTavernDoor(this, worldPoint)) return;
      if (clickChapterPortal(this, worldPoint)) return;
      if (clickBossLoot(this, worldPoint)) return;
      if (['wind-boots', 'shield'].includes(selectedItem?.type)) { toggleGear(this, selectedItem); return; }
      if (selectedItem?.type === 'helmet') {
        toggleHelmet(this, selectedItem);
        return;
      }
      if (selectedItem?.type === 'health-potion') {
        useHealthPotion(this, Number(this.selectedWeapon.replace('slot-', '')) - 1);
        return;
      }
      if (selectedItem?.type === 'flashlight') {
        activateFlashlight(this);
        return;
      }

      if (this.abgNpc && !this.abgPicked) {
        const abgDistance = Phaser.Math.Distance.Between(worldPoint.x, worldPoint.y, this.abgNpc.x, this.abgNpc.y);
        if (abgDistance < 45) {
          this.nearbyABG = this.abgNpc;
          this.pickUpABG();
          return;
        }
      }

      if (selectedItem?.type === 'sword') {
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
      if (this.tavernActive || (key === 'e' && event.repeat)) return;
      if (this.gameOver) return;
      if (this.npcDialogueOpen || this.chapterDialogueOpen || this.levelTransitioning) return;
      if (this.bookOpen) {
        if (key === 'escape') closeBook(this);
        return;
      }
      if (key === 'q' && !event.repeat) activateRush(this);
      if (key === 'r' && !event.repeat) activateDeathBreath(this);
      if (key === 'f' && !event.repeat) activateSwordAura(this);
      if (key === '1') this.selectWeapon('slot-1');
      if (key === '2') this.selectWeapon('slot-2');
      if (key === '3') this.selectWeapon('slot-3');
      if (key === '4') this.selectWeapon('slot-4');
      if (key === '5') this.selectWeapon('slot-5');
      if (key === 'e') {
        if (getSelectedItem(this)?.type === 'book') { openBook(this); return; }
        if (tryEnterTavern(this)) return;
        if (!event.repeat && useChapterPortal(this)) return;
        if (!event.repeat && consumeNearbyBossLoot(this)) return;
        if (this.nearbyABG) {
          this.pickUpABG();
          return;
        }
        if (this.nearbyPickup) {
          this.pickUpSword();
          return;
        }
      }
      if (key === 'i') this.toggleInventory();
    });

    this.physics.add.collider(this.player, this.obstacles, null, () => !this.bossRoomActive);
    this.physics.add.collider(this.villagerGroup, this.obstacles, null, () => !this.bossRoomActive);

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
    createVillageGround(this, worldWidth, worldHeight);
  }

  createVillageProps() {
    createVillageProps(this);
  }

  createVillagers() {
    const villagerData = [
      { x: 540, y: 520, name: 'Poe', hair: 0x3d2d25, shirt: 0x7d9c4d, skin: 0xe7c9a1, accent: 0x6d7d9a },
      { x: 720, y: 540, name: 'Dascalu', hair: 0x433a33, shirt: 0x8b6f4d, skin: 0xe4c09e, accent: 0x6e8aa8 },
      { x: 880, y: 430, name: 'Horatiu', hair: 0x2f2520, shirt: 0x6d87c3, skin: 0xe9d0ad, accent: 0x9b7c5d },
      { x: 1010, y: 710, name: 'Mitru', hair: 0x4c382c, shirt: 0x8f5f4d, skin: 0xebc9a6, accent: 0x5b7f5b },
      { x: 340, y: 840, name: 'Lope', hair: 0x1a1a1a, shirt: 0x8e6b4b, skin: 0xd8b38d, accent: 0x739a8b },
    ];

    villagerData.forEach(({ x, y, name, hair, shirt, skin, accent }) => {
      const key = `villager-${name.toLowerCase()}`;
      this.createNpcTexture(key, hair, shirt, skin, accent);

      const npc = this.physics.add.sprite(x, y, key);
      npc.walkFrames = [key, `${key}-walk-1`, `${key}-walk-2`];
      npc.setDepth(15);
      npc.setCollideWorldBounds(true);
      npc.setImmovable(false);
      npc.body.setSize(16, 10);
      npc.body.setOffset(8, 28);
      this.villagerGroup.add(npc);

      const label = this.add.text(x, y - 22, name, {
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
    const keeperX = 260;
    const keeperY = 320;
    createCouponKeeperTexture(this, key);

    this.couponKeeper = this.physics.add.sprite(keeperX, keeperY, key);
    this.couponKeeper.setDepth(15);
    this.couponKeeper.setVisible(true);
    this.couponKeeper.setCollideWorldBounds(true);
    this.couponKeeper.setImmovable(true);
    this.couponKeeper.body.setSize(16, 10);
    this.couponKeeper.body.setOffset(8, 28);

    this.couponKeeperLabel = this.add.text(keeperX, keeperY - 22, 'Cupon Keeper', {
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

    this.couponKeeperMarker = this.add.text(keeperX, keeperY - 50, '!', {
      fontFamily: 'Arial',
      fontSize: '12px',
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

    this.couponKeeper.on('pointerdown', () => {
      if (!this.introOverlay.classList.contains('hidden') || this.gameOver || this.npcDialogueOpen ||
          this.chapterDialogueOpen || this.levelTransitioning || this.bookOpen ||
          !this.inventoryUi.classList.contains('hidden')) return;
      this.nearbyCouponKeeper = this.couponKeeper;
      this.buyCoupon();
    });
  }

  buyCoupon() {
    if (this.couponDialogueStep) return;
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

    this.couponDialogueStep = 'keeper';
    this.showPrompt('Cupon Keeper', 'Poftim, uite un cupon în cotă 500, cum îi place lui Tete.', undefined, undefined, true);
  }

  createIntroScreen() {
    const overlay = document.createElement('div');
    overlay.id = 'intro-overlay';
    overlay.innerHTML = `
      <div class="intro-panel">
        <div class="intro-brand">
          <img src="/assets/Baghii.jpg" alt="Baghii logo" class="intro-logo" />
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
      if (overlay.classList.contains('hidden')) return;
      const camera = this.cameras.main;
      const originalZoom = camera.zoom;

      overlay.classList.add('hidden');
      unlockAudio(this);
      showLevelOneTitle(this);

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
    this.questHud.className = 'quest-hud';
    this.questHud.innerHTML = '<div class="quest-kicker">OBIECTIV CURENT</div><div class="quest-title"></div><div class="quest-detail"></div><div class="quest-progress"></div>';
    this.questTitle = this.questHud.querySelector('.quest-title');
    this.questDetail = this.questHud.querySelector('.quest-detail');
    this.questProgress = this.questHud.querySelector('.quest-progress');
    document.body.appendChild(this.questHud);
    this.setQuest('Găsește-l pe Tete', 'Adună 100 de gold și cumpără un cupon de la Cupon Keeper.');
  }

  setQuest(title, detail = '', progress = '') {
    this.questTitle.textContent = title;
    this.questDetail.textContent = detail;
    this.questProgress.textContent = progress;
    this.questProgress.hidden = !progress;
  }

  showVillagerObjective() {
    const defeated = this.npcs.filter(({ alive }) => !alive).length;
    this.setQuest('Învinge sătenii', 'Caută-i pe hartă și folosește sabia pentru a-i învinge.', `${defeated} / ${this.npcs.length} săteni învinși`);
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
      this.setQuest('Învinge-l pe Tete', 'Evită berea și bălțile albe. Q: Iureș.', `Gdolf ${this.playerHealth}/${this.maxPlayerHealth} · Tete ${this.bossHealth}/${this.maxBossHealth}`);
      return;
    }

    if (this.bossDefeated) {
      return;
    }

    if (this.missionKillVillagers) {
      this.showVillagerObjective();
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
    updateEquipmentPanel(this);
    if (!this.hotbarSlots) {
      return;
    }

    this.hotbarSlots.forEach((slot, index) => {
      const item = this.inventory[index] || { type: 'empty' };
      const itemNode = slot.querySelector('.hotbar-item');
      slot.title = item.label;
      slot.classList.toggle('active', this.selectedWeapon === `slot-${index + 1}`);

      if (item.type === 'sword') {
        itemNode.className = 'hotbar-item hotbar-sword';
        itemNode.innerHTML = `
          <span class="sword-blade"></span>
          <span class="sword-hilt"></span>
        `;
      } else if (item.type === 'wind-boots' || item.type === 'shield') {
        itemNode.className = 'hotbar-item'; itemNode.innerHTML = `<span class="${item.type === 'shield' ? 'shield-icon' : 'boots-icon'}"></span>`;
      } else if (item.type === 'party-tete') {
        itemNode.className = 'hotbar-item'; itemNode.innerHTML = '<img class="tete-item-icon" src="/assets/Tete.png" alt="Tete">';
      } else if (item.type === 'helmet') {
        itemNode.className = 'hotbar-item'; itemNode.innerHTML = '<span class="helmet-icon"></span>';
      } else if (item.type === 'coupon') {
        itemNode.className = 'hotbar-item hotbar-coupon';
        itemNode.innerHTML = `
          <span class="coupon-ticket"></span>
        `;
      } else if (item.type === 'flashlight') {
        itemNode.className = 'hotbar-item';
        itemNode.innerHTML = '<span class="flashlight-icon"></span>';
      } else if (item.type === 'book') {
        itemNode.className = 'hotbar-item';
        itemNode.innerHTML = '<span class="book-icon">I</span>';
      } else if (item.type === 'health-potion') {
        itemNode.className = 'hotbar-item';
        itemNode.innerHTML = '<span class="health-potion-icon">+</span>';
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
          <button class="inventory-close" type="button" aria-label="Închide inventarul" title="Închide (I / Esc)">×</button>
        </div>
        ${equipmentPanelMarkup()}
        <p class="inventory-help">Trage obiectele între sloturi. Primele 5 sloturi formează hotbarul, în aceeași ordine.</p>
        <div class="inventory-list"></div>
      </div>
    `;

    this.inventoryList = this.inventoryUi.querySelector('.inventory-list');
    const helmetSlot = this.inventoryUi.querySelector('[data-equipment="helmet"]');
    for (const [slotName, property] of [['boots', 'equippedBoots'], ['shield', 'equippedShield']]) {
      const slot = this.inventoryUi.querySelector(`[data-equipment="${slotName}"]`);
      slot.setAttribute('role', 'button'); slot.tabIndex = 0;
      slot.addEventListener('click', () => toggleGear(this, this[property]));
      slot.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleGear(this, this[property]); } });
    }
    helmetSlot.setAttribute('role', 'button'); helmetSlot.tabIndex = 0;
    helmetSlot.addEventListener('click', () => toggleHelmet(this, this.equippedHelmet));
    helmetSlot.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleHelmet(this, this.equippedHelmet); } });
    this.inventoryUi.querySelector('.inventory-close').addEventListener('click', () => this.toggleInventory(false));
    installInventoryDragging(this);
    this.inventoryList.addEventListener('click', (event) => {
      if (this.game.loop.now < (this.inventoryClickBlockedUntil || 0)) return;
      const slot = event.target.closest('[data-inventory-index]');
      if (slot && ['wind-boots', 'shield'].includes(this.inventory[Number(slot.dataset.inventoryIndex)]?.type)) toggleGear(this, this.inventory[Number(slot.dataset.inventoryIndex)]);
      if (slot && this.inventory[Number(slot.dataset.inventoryIndex)]?.type === 'book') openBook(this);
      if (slot && this.inventory[Number(slot.dataset.inventoryIndex)]?.type === 'helmet') toggleHelmet(this, this.inventory[Number(slot.dataset.inventoryIndex)]);
      if (slot && this.inventory[Number(slot.dataset.inventoryIndex)]?.type === 'party-tete') deployPartyTete(this, this.inventory[Number(slot.dataset.inventoryIndex)]);
      if (slot && this.inventory[Number(slot.dataset.inventoryIndex)]?.type === 'health-potion') useHealthPotion(this, Number(slot.dataset.inventoryIndex));
    });
    this.inventoryList.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        const slot = event.target.closest('[data-inventory-index]');
        if (slot && ['wind-boots', 'shield'].includes(this.inventory[Number(slot.dataset.inventoryIndex)]?.type)) {
          event.preventDefault(); toggleGear(this, this.inventory[Number(slot.dataset.inventoryIndex)]);
        }
        if (slot && this.inventory[Number(slot.dataset.inventoryIndex)]?.type === 'party-tete') {
          event.preventDefault(); deployPartyTete(this, this.inventory[Number(slot.dataset.inventoryIndex)]);
        }
        if (slot && this.inventory[Number(slot.dataset.inventoryIndex)]?.type === 'helmet') {
          event.preventDefault(); toggleHelmet(this, this.inventory[Number(slot.dataset.inventoryIndex)]);
        }
        if (slot && this.inventory[Number(slot.dataset.inventoryIndex)]?.type === 'book') {
          event.preventDefault();
          openBook(this);
        }
        if (slot && this.inventory[Number(slot.dataset.inventoryIndex)]?.type === 'health-potion') {
          event.preventDefault();
          useHealthPotion(this, Number(slot.dataset.inventoryIndex));
        }
      }
    });
    this.inventoryUi.addEventListener('click', (event) => {
      if (event.target === this.inventoryUi) {
        this.toggleInventory(false);
      }
    });

    document.body.appendChild(this.inventoryUi);
    this.inventoryButton = document.createElement('button');
    this.inventoryButton.className = 'inventory-toggle';
    this.inventoryButton.type = 'button';
    this.inventoryButton.title = 'Inventar (I)';
    this.inventoryButton.setAttribute('aria-label', 'Deschide inventarul');
    this.inventoryButton.setAttribute('aria-expanded', 'false');
    this.inventoryButton.innerHTML = '<svg viewBox="0 0 48 40" aria-hidden="true"><path d="M5 18V12Q5 4 13 4H35Q43 4 43 12V18Z" fill="#a87537"/><path d="M5 18H43V35H5Z" fill="#704821"/><path d="M5 16H43V21H5ZM10 5V35M37 5V35" fill="#d2a850" stroke="#d2a850" stroke-width="3"/><rect x="20" y="16" width="8" height="11" rx="2" fill="#f6d27c"/><path d="M24 20V24" stroke="#533b20" stroke-width="2"/></svg><span>Inventar <small>I</small></span>';
    this.inventoryButton.addEventListener('click', () => {
      if (this.menuOpen || this.tavernActive || this.gameOver || this.npcDialogueOpen || this.chapterDialogueOpen || this.levelTransitioning || this.bookOpen) return;
      this.toggleInventory();
    });
    document.body.appendChild(this.inventoryButton);
    this.events.once('shutdown', () => { this.inventoryButton.remove(); this.inventoryUi.remove(); });
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
            : item.type === 'wind-boots' ? '<span class="boots-icon"></span>' : item.type === 'shield' ? '<span class="shield-icon"></span>' : item.type === 'party-tete' ? '<img class="tete-item-icon" src="/assets/Tete.png" alt="Tete">' : item.type === 'helmet' ? '<span class="helmet-icon"></span>' : item.type === 'flashlight' ? '<span class="flashlight-icon"></span>' : item.type === 'book' ? '<span class="book-icon">I</span>' : item.type === 'health-potion' ? '<span class="health-potion-icon">+</span>' : '';

        return `
          <div class="inventory-slot ${item.type === 'empty' ? 'empty' : ''} ${index < 5 ? 'hotbar-linked' : ''} ${item === this.equippedHelmet ? 'item-equipped' : ''}" data-inventory-index="${index}" draggable="${item.type !== 'empty'}" ${['book', 'health-potion', 'helmet', 'party-tete', 'wind-boots', 'shield'].includes(item.type) ? 'role="button" tabindex="0"' : ''} title="${item.label}">
            ${content}
            ${index < 5 ? '<span class="inventory-hotbar-label">HOTBAR</span>' : ''}
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
    this.inventoryButton?.setAttribute('aria-expanded', String(shouldOpen));
    if (shouldOpen) updateEquipmentPanel(this);
  }

  selectWeapon(slotName) {
    if (this.tavernActive) return;
    if (this.npcDialogueOpen || this.chapterDialogueOpen || this.levelTransitioning) return;
    if (slotName.startsWith('slot-') && !/^slot-[1-5]$/.test(slotName)) return;
    this.selectedWeapon = slotName;
    updateEquipmentPanel(this);
    updatePotionHeld(this);
    this.hotbarSlots?.forEach((slot) => {
      slot.classList.toggle('active', slot.dataset.slot === slotName);
    });
  }

  createPlayerTexture() {
    const buildFrame = (leftLeg, rightLeg, leftArm, rightArm) => drawGdolf(this, leftLeg, rightLeg, leftArm, rightArm);

    const idleGraphics = buildFrame(0, 0, 0, 0);
    idleGraphics.generateTexture('player', 32, 40);
    idleGraphics.destroy();
    const breathingGraphics = drawGdolf(this, 0, 0, 0, 0, true);
    breathingGraphics.generateTexture('player-idle-breath', 32, 40);
    breathingGraphics.destroy();

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

    // Symmetric steel blade with a sharp tip and a bright central ridge.
    graphics.fillStyle(0x344653);
    graphics.fillTriangle(7, 11, 17, 11, 12, 0);
    graphics.fillRect(7, 11, 10, 26);
    graphics.fillStyle(0xb6d0dc);
    graphics.fillTriangle(8, 12, 16, 12, 12, 2);
    graphics.fillRect(8, 12, 8, 24);
    graphics.fillStyle(0xf1fcff);
    graphics.fillTriangle(8, 12, 12, 12, 12, 3);
    graphics.fillRect(8, 12, 4, 23);
    graphics.fillStyle(0x7e9eaf);
    graphics.fillRect(14, 12, 2, 23);
    graphics.fillStyle(0x607d91);
    graphics.fillRect(11, 14, 2, 18);
    // Gold crossguard, leather grip and a blue inset stone.
    graphics.fillStyle(0x71512b);
    graphics.fillRect(3, 36, 18, 5);
    graphics.fillRect(2, 34, 4, 5);
    graphics.fillRect(18, 34, 4, 5);
    graphics.fillStyle(0xe4bd65);
    graphics.fillRect(4, 36, 16, 2);
    graphics.fillRect(3, 34, 2, 4);
    graphics.fillRect(19, 34, 2, 4);
    graphics.fillStyle(0x3f2c2a);
    graphics.fillRect(9, 41, 6, 10);
    graphics.fillStyle(0xa27750);
    for (let y = 42; y < 51; y += 3) graphics.fillRect(10, y, 4, 1);
    graphics.fillStyle(0xd6ad58);
    graphics.fillRect(8, 51, 8, 4);
    graphics.fillStyle(0x69bfd2);
    graphics.fillRect(10, 37, 4, 3);

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
    const obstacles = this.obstacles.getChildren().map(({ body }) => body).filter(Boolean);
    if (this.shopFootprint?.body) obstacles.push(this.shopFootprint.body);
    const positions = createVillageGoldLayout(obstacles);
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
        value: position.value,
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
    const swordSlot = this.inventory.findIndex(({ type }) => type === 'empty');
    if (swordSlot < 0) return;

    pickup.picked = true;
    pickup.sprite.destroy();
    if (pickup.glow) {
      pickup.glow.destroy();
    }
    this.nearbyPickup = null;

    this.inventory[swordSlot] = { type: 'sword', label: 'Sword', key: String(swordSlot + 1) };
    this.updateInventoryList();
    this.updateHotbarState();
    this.selectWeapon(`slot-${swordSlot + 1}`);
    this.hidePrompt();
  }

  pickUpABG() {
    if (!this.abgNpc || this.abgPicked) {
      return;
    }

    this.abgPicked = true;
    this.nearbyABG = null;
    this.abgNpc.destroy();
    if (this.abgNpcLabel) {
      this.abgNpcLabel.destroy();
    }
    this.abgNpcMarker?.destroy();
    this.abgNpcShadow?.destroy();
    this.hidePrompt();

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

  performAttack(targetX, targetY) {
    if (this.isAttacking) return;
    this.attackVariant = ((this.attackVariant ?? -1) + 1) % 3;
    this.attackSwingDirection = this.attackVariant === 1 ? -1 : 1;
    playSound(this, 'swing');
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
        this.damageBoss(2 + swordAuraBonus(this, 'boss'));
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
        this.damageVillager(villager, 1 + swordAuraBonus(this, 'villager'));
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
    if (!this.hasCoupon || !villager.alive) {
      return;
    }

    enrageVillage(this);
    playSound(this, 'hit');
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
    villager.npc.disableBody(true, true);
    villager.weapon.setVisible(false);
    villager.label.setVisible(false);
    villager.marker.setVisible(false);
    if (this.missionKillVillagers && !this.bossRoomActive) this.showVillagerObjective();

    const allVillagersDead = this.npcs.every((entry) => !entry.alive);
    if (this.missionKillVillagers && allVillagersDead) {
      this.villageEnraged = false;
      this.villagerArrows.clear(true, true);
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
    this.worldObjects.push(grave, graveTop, cross);

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
    this.worldObjects.push(ghostText, ghost);

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

    createLaviniaTexture(this);
    const spawnX = 760;
    const spawnY = 650;
    this.abgNpc = this.physics.add.sprite(spawnX, spawnY, 'lavinia');
    this.abgNpc.setScale(1.25);
    this.abgNpc.setDepth(15);
    this.abgNpc.setCollideWorldBounds(true);
    this.abgNpc.setImmovable(true);
    this.abgNpc.body.setSize(14, 8);
    this.abgNpc.body.setOffset(13, 46);
    this.abgNpcShadow = this.add.ellipse(spawnX, spawnY + 32, 28, 9, 0x283b2c, 0.25).setDepth(1);

    this.abgNpcLabel = this.add.text(spawnX, spawnY - 46, 'Lavinia Gauncan', {
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

    this.abgNpcMarker = this.add.text(spawnX, spawnY - 68, '!', {
      fontFamily: 'Arial',
      fontSize: '12px',
      color: '#ffd166',
      stroke: '#1f1f1f',
      strokeThickness: 3,
    });
    this.abgNpcMarker.setOrigin(0.5, 0.5);
    this.abgNpcMarker.setDepth(30);
    this.abgNpcMarker.setVisible(true);

    if (this.questHud) {
      this.setQuest('Găsește-o pe Lavinia Gauncan', 'Te așteaptă în centrul satului, lângă poteca principală. Apropie-te și apasă E.', 'Cupon ✓ · Săteni ✓ · Lavinia de găsit');
    }
  }

  createBossArena() {
    createArena(this);
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

    this.deathScreen = document.createElement('div');
    this.deathScreen.className = 'chapter-dialogue death-dialogue';
    this.deathScreen.innerHTML = '<section role="dialog" aria-modal="true" aria-labelledby="death-dialogue-title"><img src="/assets/Gdolf.png" alt="Gdolf"><div><small>GDOLF · AI MURIT</small><h2 id="death-dialogue-title">Mai încerc o dată</h2><p>Bagamias pula am murit nu mai e vremea de trait dar reincer iara coaie ce as suge pula</p><button type="button">Reîncepe lupta →</button></div></section>';
    document.body.appendChild(this.deathScreen);
    const retryButton = this.deathScreen.querySelector('button');
    retryButton.focus();
    retryButton.addEventListener('click', () => restartBossFight(this));
    const deathScreen = this.deathScreen;
    this.events.once('shutdown', () => deathScreen.remove());
    this.gameOver = true;
    clearBossAttacks(this);
    this.player.setVelocity(0, 0);
    this.bossFightActive = false;
  }

  hasRequiredBossItems() {
    const hasCoupon = this.hasCoupon || this.inventory.some((item) => item.type === 'coupon');
    return hasCoupon && this.abgPicked;
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
    hideAnimals(this);
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
    this.physics.world.setBounds(this.bossRoomBounds.x + 20, this.bossRoomBounds.y + 44, this.bossRoomBounds.width - 40, this.bossRoomBounds.height - 64);
    this.cameras.main.setBounds(this.bossRoomBounds.x, this.bossRoomBounds.y, this.bossRoomBounds.width, this.bossRoomBounds.height);
    this.player.setPosition(this.bossRoomBounds.x + 150, this.bossRoomBounds.y + 260);
    this.player.setVelocity(0, 0);
    this.player.setCollideWorldBounds(true);
    this.cameras.main.setScroll(this.bossRoomBounds.x, this.bossRoomBounds.y);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.flash(250, 180, 0, 0);
    this.showPrompt('Tete, The Gooner', 'GIVE ME LAVINIA AND THE CUPON! Evită petele albe și halbele de bere.');
    this.createBoss();
    this.updateHealthHud();
  }

  createBoss() {
    if (!this.boss) createBoss(this);
  }

  damageBoss(amount) {
    if (!this.bossFightActive || !this.boss) {
      return;
    }

    this.bossHealth = Math.max(0, this.bossHealth - amount);
    this.boss.setTint(0xff7d7d);
    this.time.delayedCall(120, () => this.boss?.active && this.boss.clearTint());
    updateBossHealth(this);
    this.updateHealthHud();

    if (this.bossHealth <= 0) {
      this.finishBossFight();
    }
  }

  showVictoryDialogue() {
    showVictoryDialogue(this);
  }

  beginNextChapter() {
    beginChapterDialogue(this);
  }

  finishBossFight() {
    const dropX = this.boss.x;
    const dropY = this.boss.y + 25;
    clearBossAttacks(this, true);
    this.bossFightActive = false;
    this.bossDefeated = true;
    this.bossRoomActive = true;
    this.bossTransitioning = false;
    this.gameOver = false;
    this.hidePrompt();
    joinParty(this, this.boss);
    this.boss = null;
    giveVictoryBook(this);
    showLevelComplete(this);
    dropBossLoot(this, dropX, dropY);
  }

  damagePlayer(amount) {
    if ((!this.bossFightActive && !this.villageEnraged) || this.gameOver || this.playerHealth <= 0) {
      return;
    }
    if (!this.bossFightActive) {
      if (this.time.now < (this.nextVillagerDamageAt || 0)) return;
      this.nextVillagerDamageAt = this.time.now + 500;
    }
    playSound(this, 'hit');

    this.playerHealth = Math.max(0, this.playerHealth - absorbArmorDamage(this, absorbShieldDamage(this, amount)));
    updatePlayerHealth(this);
    this.updatePlayerHeadHealth();
    this.player.setTint(0xff7d7d);
    this.time.delayedCall(140, () => this.player.clearTint());
    this.updateHealthHud();

    if (this.playerHealth <= 0) {
      this.playerHealth = 0;
      if (this.bossFightActive) {
        this.showDeathScreen();
        this.setQuest('Ai fost învins', 'Tete a câștigat lupta.');
      } else {
        showVillageDeath(this);
        this.setQuest('Ai fost învins', 'Sătenii s-au răsculat. Poți reîncerca.');
      }
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
    if (this.npcDialogueOpen) return;
    if (this.gameOver) {
      updatePotionHeld(this);
      updateRush(this);
      updateRewards(this);
      updateSwordAura(this);
      return;
    }

    this.checkBossTrigger();

    if (this.bossFightActive && this.boss) {
      updateBoss(this);
      if (this.gameOver) {
        this.player.setVelocity(0, 0);
        updateRush(this);
        return;
      }
    }

    this.updateMinimap();
    updateParty(this);
    updateAnimals(this);
    updateVillageCombat(this);
    updateGameAudio(this);
    updateBossLoot(this);
    updateChapterPortal(this);
    updateTavernDoor(this);

    if (!this.player) {
      return;
    }

    // Sort by feet so characters pass behind roofs and foliage naturally.
    if (!this.bossRoomActive) {
      this.player.setDepth(10 + (this.player.y + 18) / 100);
      this.npcs.forEach(({ npc }) => npc.setDepth(10 + (npc.y + 18) / 100));
      this.couponKeeper?.setDepth(10 + (this.couponKeeper.y + 18) / 100);
      this.abgNpc?.setDepth(10 + (this.abgNpc.y + 32) / 100);
    } else {
      this.player.setDepth(10 + (this.player.y + 18) / 100);
    }
    this.playerWeapon?.setDepth(this.player.depth + 0.02);
    this.playerCoupon?.setDepth(this.player.depth + 0.03);

    const speed = updateRush(this) * movementMultiplier(this);
    updateRewards(this);
    const movementLocked = this.bookOpen || this.chapterDialogueOpen || this.levelTransitioning;
    const moveX = movementLocked ? 0 : Number(this.cursors.right.isDown) - Number(this.cursors.left.isDown);
    const moveY = movementLocked ? 0 : Number(this.cursors.down.isDown) - Number(this.cursors.up.isDown);

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
      const idleTexture = getGdolfIdleTexture(this.time.now);
      if (this.player.texture.key !== idleTexture) {
        this.player.setTexture(idleTexture);
      }
    }

    updateSwordMotion(this);
    updateSwordAura(this);

    updatePotionHeld(this);
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
      this.abgNpcLabel.y = this.abgNpc.y - 46;
      this.abgNpcMarker.x = this.abgNpc.x;
      this.abgNpcMarker.y = this.abgNpc.y - 62;
    }

    if (this.nameLabel) {
      this.nameLabel.x = this.player.x;
      this.nameLabel.y = this.player.y - 22;
    }
    this.updatePlayerHeadHealth();

    if (this.couponKeeper) {
      const keeperDistance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.couponKeeper.x, this.couponKeeper.y);
      if (keeperDistance < 65) {
        this.nearbyCouponKeeper = this.couponKeeper;
      } else if (this.nearbyCouponKeeper) {
        this.nearbyCouponKeeper = null;
      }
    }

    if (this.npcs) {
      this.npcs.forEach((villager) => {
        const { npc, label, marker, minimapMarker, alive } = villager;
        if (!alive) return;

        if (this.villageEnraged && !this.bossRoomActive && this.currentLevel !== 2) {
          updateEnragedVillager(this, villager);
        } else {
        villager.wanderTimer += this.game.loop.delta / 1000;
        if (villager.wanderTimer >= villager.wanderDelay) {
          villager.wanderTimer = 0;
          villager.wanderDelay = 1 + Math.random() * 1.8;
          const angle = Math.random() * Math.PI * 2;
          villager.direction.x = Math.cos(angle);
          villager.direction.y = Math.sin(angle);
        }

        if (npc.body.blocked.left) villager.direction.x = Math.abs(villager.direction.x);
        if (npc.body.blocked.right) villager.direction.x = -Math.abs(villager.direction.x);
        if (npc.body.blocked.up) villager.direction.y = Math.abs(villager.direction.y);
        if (npc.body.blocked.down) villager.direction.y = -Math.abs(villager.direction.y);

        const moveX = villager.direction.x;
        const moveY = villager.direction.y;
        const length = Math.hypot(moveX, moveY) || 1;
        const multiplier = slowMultiplier(npc, this.time.now);
        const vx = (moveX / length) * villager.speed * multiplier;
        const vy = (moveY / length) * villager.speed * multiplier;
        npc.setVelocity(vx, vy);

        }

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
      if (this.currentLevel === 2) return;
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
      if (this.currentLevel === 2) return;
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

  updatePlayerHeadHealth() {
    const bar = this.playerHeadHealth;
    if (!bar) return;
    bar.clear().setPosition(this.player.x - 19, this.player.y - 43);
    bar.fillStyle(0x15221c, 0.95).fillRoundedRect(0, 0, 38, 5, 2);
    if (this.equippedHelmet) {
      bar.fillStyle(0xb5bec8).fillTriangle(-7, -7, -1, -7, -4, 0);
      bar.fillStyle(0x353b43, 0.95).fillRoundedRect(0, -10, 38, 8, 2);
      bar.fillStyle(0x909eac).fillRoundedRect(1, -9, 36 * armorPoints(this) / 5, 6, 1);
    }
    this.playerArmorHeadText?.setVisible(Boolean(this.equippedHelmet)).setPosition(this.player.x, this.player.y - 49).setText(`${armorPoints(this)}/5`);
    bar.fillStyle(this.playerHealth <= 10 ? 0xe45a68 : 0x91d591).fillRect(1, 1, 36 * this.playerHealth / this.maxPlayerHealth, 3);
    this.playerHeadHealthText.setPosition(this.player.x, this.player.y - (this.equippedHelmet ? 61 : 49)).setText(`${this.playerHealth}/${this.maxPlayerHealth}`);
  }

  createDialogueBox() {
    this.dialogBox = document.createElement('div');
    this.dialogBox.className = 'chapter-dialogue npc-modal hidden';
    this.dialogBox.hidden = true;
    this.dialogBox.innerHTML = `
      <section role="dialog" aria-modal="true" aria-labelledby="npc-dialog-title">
      <img class="npc-dialog-portrait" src="/assets/CuponKeeper.png" alt="NPC portrait" />
      <div class="npc-dialog-content">
        <small class="npc-dialog-kicker">CONVERSAȚIE</small>
        <h2 class="npc-dialog-name" id="npc-dialog-title">Cupon Keeper</h2>
        <p class="npc-dialog-text">Am nevoie de 100 de lovele pentru un cupon.</p>
        <button type="button" class="npc-dialog-ok">Continuă →</button>
      </div>
      </section>
    `;

    this.dialogName = this.dialogBox.querySelector('.npc-dialog-name');
    this.dialogText = this.dialogBox.querySelector('.npc-dialog-text');
    this.dialogOkButton = this.dialogBox.querySelector('.npc-dialog-ok');
    this.dialogOkButton.addEventListener('click', () => {
      if (this.couponDialogueStep === 'keeper') {
        this.couponDialogueStep = 'gdolf';
        this.showPrompt('Gdolf', 'Merci muistule', undefined, undefined, true);
        return;
      }
      if (this.couponDialogueStep === 'gdolf') {
        this.couponDialogueStep = null;
        this.hidePrompt();
        if (!this.missionKillVillagers) {
          this.missionKillVillagers = true;
          this.showVillagerObjective();
        }
        return;
      }
      this.hidePrompt();
      if (this.dialogName.textContent === 'Cupon Keeper' && this.hasCoupon && !this.missionKillVillagers) {
        this.missionKillVillagers = true;
        this.showVillagerObjective();
      }
    });
    document.body.appendChild(this.dialogBox);
    this.events.once('shutdown', () => this.dialogBox.remove());
  }

  showPrompt(name, message, x, y, persistent = false) {
    showNpcDialogue(this, name, message);
  }

  hidePrompt() {
    hideNpcDialogue(this);
  }

  showThoughtBubble(message) {
    this.showPrompt('Gdolf', message);
  }

  hideThoughtBubble() {
    if (this.dialogName?.textContent === 'Gdolf') this.hidePrompt();
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
  scene: [FarmScene, TavernScene],
});

window.game = game;
