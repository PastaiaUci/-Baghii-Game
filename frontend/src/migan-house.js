import Phaser from 'phaser';
import { showNpcDialogue, hideNpcDialogue } from './dialogue.js';
import { chooseHouseChest, giveWinterCoat, winterHint, showWinterDialogue, advanceWinterDialogue } from './winter-quest.js';
import { createHelmetVisual, absorbArmorDamage } from './armor.js';
import { createGearVisual, absorbShieldDamage } from './gear.js';
import { derivedStats, physicalDamage } from './character-stats.js';
import { createSwordMotion, updateSwordMotion } from './sword-motion.js';
import { getGdolfIdleTexture } from './player-art.js';
import { getSelectedItem } from './inventory.js';
import { applyHealthPotion } from './health-potion.js';
import { updatePlayerHealth } from './boss.js';
import { shiftMenuTimers } from './pause-menu.js';
import { createTavernMinimap } from './quest-minimap.js';
import { closeBook } from './completion.js';
import { updatePartyCombat } from './party-combat.js';
import { damagePartyTete, consumeRevivalBeer } from './party-health.js';
import { deployPartyTete } from './party-storage.js';

export class MiganHouseScene extends Phaser.Scene {
  constructor() { super('MiganHouseScene'); }
  init({ farm }) { this.farm = farm; this.npcDialogueOpen = false; this.leaving = false; this.dead = false; }
  create() {
    const farm = this.farm; farm.activeHouse = this;
    this.startedAt = farm.game.loop.now;
    Object.defineProperties(this, { inventory: { configurable: true, get: () => farm.inventory }, selectedWeapon: { configurable: true, get: () => farm.selectedWeapon } });
    this.physics.world.setBounds(80, 115, 800, 455);
    this.cameras.main.setBounds(0, 0, 960, 640).setBackgroundColor('#1b1b25');
    this.solids = this.physics.add.staticGroup();
    this.drawRoom();
    this.player = this.physics.add.sprite(480, 520, 'player').setCollideWorldBounds(true);
    this.player.body.setSize(16, 10).setOffset(8, 28);
    this.physics.add.collider(this.player, this.solids);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.playerWeapon = this.add.sprite(0, 0, 'sword').setOrigin(0.5, 46 / 56).setScale(0.78).setVisible(false);
    this.attackTimer = 0; this.isAttacking = false; this.attackDuration = 160;
    createSwordMotion(this); createHelmetVisual(this, farm); createGearVisual(this, farm);
    this.keys = this.input.keyboard.addKeys('W,A,S,D'); this.input.mouse.disableContextMenu();
    this.mobGroup = this.physics.add.group(); this.mobs = []; this.gas = []; this.poison = 0; this.poisonTick = 1000;
    this.physics.add.collider(this.mobGroup, this.solids); this.physics.add.collider(this.mobGroup, this.mobGroup);
    this.createDialogue(); this.createChests(); this.createCompanion(); createTavernMinimap(this);
    this.hiddenHud = [...document.querySelectorAll('.quest-hud, .skillbar, .party-hud')].map((node) => ({ node, visibility: node.style.visibility }));
    this.hiddenHud.forEach(({ node }) => { node.style.visibility = 'hidden'; });
    farm.minimap.style.visibility = 'hidden';
    this.notice = document.createElement('div'); this.notice.className = 'migan-house-hud';
    this.notice.innerHTML = '<strong>Casa lui Miganul</strong><span class="house-objective">Vorbește cu Miganul · E interacțiune · I inventar</span><span class="house-poison"></span><button type="button">Înapoi în sat</button>';
    this.notice.querySelector('button').addEventListener('click', () => this.leave()); document.body.appendChild(this.notice);
    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown() || this.blocked()) return;
      const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      if (this.mobs.some((mob) => mob.alive && Math.hypot(point.x - mob.sprite.x, point.y - mob.sprite.y) < 28)) { this.attack(point); return; }
      if (Math.abs(point.x - 200) < 30 && Math.abs(point.y - 270) < 45) { if (Math.hypot(this.player.x - 200, this.player.y - 280) < 100) this.talk(); return; }
      const chest = this.chests.find((chest) => Math.hypot(point.x - chest.x, point.y - chest.y) < 30);
      if (chest) { if (Math.hypot(this.player.x - chest.x, this.player.y - chest.y) < 80) this.openChest(chest); return; }
      if (getSelectedItem(farm)?.type === 'health-potion') { this.usePotion(Number(farm.selectedWeapon.slice(5)) - 1); return; }
      if (getSelectedItem(farm)?.type === 'party-tete') { deployPartyTete(farm, getSelectedItem(farm)); return; }
      if (getSelectedItem(farm)?.type === 'revival-beer') { consumeRevivalBeer(farm, getSelectedItem(farm)); return; }
      this.attack(point);
    });
    this.input.keyboard.on('keydown', (event) => {
      if (farm.bookOpen) { if (event.key === 'Escape') closeBook(farm); return; }
      if (event.repeat || this.npcDialogueOpen || this.dead || farm.menuOpen || farm.statsOpen || farm.bookOpen) return;
      const key = event.key.toLowerCase();
      if (/^[1-5]$/.test(key)) { farm.selectedWeapon = `slot-${key}`; farm.updateHotbarState(); }
      if (key === 'i') farm.toggleInventory();
      if (key !== 'e') return;
      if (!farm.inventoryUi.classList.contains('hidden')) { farm.toggleInventory(false); return; }
      if (Math.hypot(this.player.x - 480, this.player.y - 550) < 65) { this.leave(); return; }
      if (Math.hypot(this.player.x - 200, this.player.y - 280) < 100) { this.talk(); return; }
      const chest = this.chests.find((chest) => Math.hypot(this.player.x - chest.x, this.player.y - chest.y) < 75 && !farm.winterQuest.opened.includes(chest.index));
      if (chest) this.openChest(chest); else farm.toggleInventory();
    });
    this.events.once('shutdown', () => {
      this.dialogBox.remove(); this.notice.remove(); this.hiddenHud.forEach(({ node, visibility }) => { node.style.visibility = visibility; });
      farm.minimap.style.visibility = ''; farm.houseActive = farm.tavernActive = false; farm.activeHouse = null;
      farm.toggleInventory(false); shiftMenuTimers(farm, farm.game.loop.now - this.startedAt);
    });
  }
  blocked() { return this.npcDialogueOpen || this.dead || this.leaving || this.farm.bookOpen || this.farm.menuOpen || this.farm.statsOpen || !this.farm.inventoryUi.classList.contains('hidden'); }
  drawRoom() {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x3a3335).fillRect(65, 85, 830, 500); g.fillStyle(0x826951).fillRect(80, 115, 800, 455);
    for (let y = 115; y < 570; y += 24) {
      g.lineStyle(1, 0x4f4541).lineBetween(80, y, 880, y);
      for (let x = 90 + y % 48; x < 880; x += 90) g.lineBetween(x, y, x, y + 23);
    }
    g.fillStyle(0x4d4545).fillRect(80, 85, 800, 30);
    g.fillStyle(0xbfa478).fillRect(440, 563, 80, 8);
    g.fillStyle(0x432e32).fillRoundedRect(130, 226, 130, 94, 8);
    g.fillStyle(0xafa3b0).fillRoundedRect(137, 233, 116, 78, 5);
    g.fillStyle(0xeee7d8).fillRoundedRect(141, 236, 105, 20, 3);
    g.fillStyle(0x725a83).fillRect(138, 267, 112, 42);
    g.fillStyle(0x554d49).fillRect(120, 125, 150, 65); g.fillStyle(0xc29351).fillRect(126, 131, 138, 7);
    for (let i = 0; i < 9; i += 1) g.fillStyle(i % 2 ? 0x47685b : 0xac925e).fillRect(134 + i * 14, 146, 9, 23);
    this.solids.add(this.add.zone(195, 160, 150, 62));
    if (!this.textures.exists('migan-npc')) {
      const p = this.make.graphics();
      p.fillStyle(0x252d3b).fillRect(11, 42, 26, 18);
      p.fillStyle(0x555c8b).fillEllipse(25, 47, 30, 18);
      p.fillStyle(0x906998).fillEllipse(27, 48, 20, 12);
      p.lineStyle(4, 0xe1dac8).lineBetween(19, 41, 33, 53).lineBetween(17, 46, 29, 57);
      p.fillStyle(0x547c76).fillRoundedRect(9, 24, 30, 22, 5);
      p.fillStyle(0xdfb18a).fillRect(5, 31, 6, 14).fillRect(37, 31, 6, 14).fillRoundedRect(14, 7, 22, 21, 5);
      p.fillStyle(0x46362f).fillRect(12, 4, 25, 10).fillRect(14, 22, 21, 7);
      p.fillStyle(0x2a2b34).fillRect(18, 15, 3, 2).fillRect(29, 15, 3, 2);
      p.generateTexture('migan-npc', 48, 64); p.destroy();
    }
    this.add.image(200, 274, 'migan-npc').setDepth(14);
    this.add.text(200, 226, 'Miganul · !', { fontSize: '12px', color: '#f2ddb0', stroke: '#292333', strokeThickness: 3 }).setOrigin(0.5).setDepth(30);
    this.add.text(480, 76, 'CASA LUI MIGANUL', { fontFamily: 'Georgia', fontSize: '21px', color: '#e5d3ae' }).setOrigin(0.5);
    this.solids.add(this.add.zone(200, 290, 80, 45));
  }
  createDialogue() {
    this.dialogBox = document.createElement('div'); this.dialogBox.className = 'chapter-dialogue npc-modal hidden'; this.dialogBox.hidden = true;
    this.dialogBox.innerHTML = '<section role="dialog" aria-modal="true"><div><small class="npc-dialog-kicker">CONVERSAȚIE</small><h2 class="npc-dialog-name"></h2><p class="npc-dialog-text"></p><button class="npc-dialog-ok" type="button">Continuă →</button></div><img class="npc-dialog-portrait" alt=""></section>';
    this.dialogName = this.dialogBox.querySelector('.npc-dialog-name'); this.dialogText = this.dialogBox.querySelector('.npc-dialog-text'); this.dialogOkButton = this.dialogBox.querySelector('button');
    this.npcPortraits = { Miganul: this.textures.getBase64('migan-npc') };
    this.dialogOkButton.addEventListener('click', () => { if (!advanceWinterDialogue(this)) hideNpcDialogue(this); }); document.body.appendChild(this.dialogBox);
  }
  talk() {
    const farm = this.farm, status = farm.winterQuest.status;
    if (status === 'seek-migan') {
      showWinterDialogue(this, [['Gdolf', 'Luis m-a trimis după o Scurtă de Iarnă. Mă poți ajuta?'], ['Miganul', 'Am una, dar m-am lovit la pulă, e toată mov și bandajată. Găsește-mi alifia într-unul dintre cufere și îți dau scurta.']], () => { farm.winterQuest.status = 'searching'; winterHint(farm); });
    } else if (status === 'ointment-found') {
      giveWinterCoat(farm);
      showNpcDialogue(this, 'Miganul', 'Asta e alifia! Mulțumesc, acum pot să mă îngrijesc. Poftim Scurta de Iarnă. Echipeaz-o și mergi la portal.');
    } else showNpcDialogue(this, 'Miganul', status === 'searching' ? 'Alifia e într-unul dintre cele șase cufere. Nu mai știu în care am pus-o.' : 'Drum bun! Pune-ți scurta înainte să încerci trecătoarea.');
  }
  createChests() {
    this.chests = [[410, 215], [640, 220], [780, 330], [520, 370], [285, 430], [670, 470]].map(([x, y], index) => {
      const art = this.add.graphics().setPosition(x, y).setDepth(10 + y / 100);
      const chest = { x, y, index, art }; this.drawChest(chest); return chest;
    });
  }
  drawChest(chest) {
    const g = chest.art.clear(), opened = this.farm.winterQuest.opened.includes(chest.index);
    g.fillStyle(0x614326).fillRoundedRect(-22, -12, 44, 28, 4);
    g.fillStyle(opened ? 0x2d2523 : 0xa27d41).fillRoundedRect(-21, opened ? -24 : -16, 42, opened ? 13 : 16, 4);
    g.fillStyle(0xd0b16a).fillRect(-15, -14, 4, 30).fillRect(11, -14, 4, 30);
    if (!opened) g.fillStyle(0xe3c574).fillRect(-4, -3, 8, 8);
  }
  openChest(chest) {
    const result = chooseHouseChest(this.farm, chest.index);
    if (result === 'full') { showNpcDialogue(this, 'Gdolf', 'Am găsit alifia, dar inventarul este plin. Trebuie să eliberez un slot.'); return; }
    if (result === 'inactive') return;
    this.drawChest(chest);
    if (result === 'ointment') showNpcDialogue(this, 'Gdolf', 'Am găsit alifia! Înapoi la Miganul.');
    else {
      const cloud = this.add.graphics().setDepth(2); this.gas.push({ x: chest.x, y: chest.y, remaining: 5500, art: cloud });
      for (let i = 0, count = 3 + Math.floor(Math.random() * 2); i < count; i += 1) this.spawnBandit(chest, i);
    }
  }
  spawnBandit(chest, index) {
    const key = `migan-bandit-${index % 2}`;
    if (!this.textures.exists(key)) this.farm.createNpcTexture(key, 0x302c31, index % 2 ? 0x375a60 : 0x45475c, 0xd2aa87, 0x222d3b);
    const x = Math.max(110, Math.min(850, chest.x + Math.cos(index * 2) * 46)), y = Math.max(155, Math.min(520, chest.y + Math.sin(index * 2) * 46));
    const sprite = this.physics.add.sprite(x, y, key).setCollideWorldBounds(true); sprite.body.setSize(16, 10).setOffset(8, 28); this.mobGroup.add(sprite);
    const label = this.add.text(x, y - 27, 'Bandit · 5 HP', { fontSize: '9px', color: '#ffdcb3', stroke: '#222632', strokeThickness: 2 }).setOrigin(0.5).setDepth(30);
    const shout = this.add.text(x, y - 43, 'Fierul tău e al nostru!', { fontSize: '9px', color: '#e6c984', stroke: '#222632', strokeThickness: 2 }).setOrigin(0.5).setDepth(30);
    this.mobs.push({ sprite, label, shout, key, hp: 5, cooldown: 900, windup: 0, warning: this.add.graphics().setDepth(2), alive: true });
  }
  createCompanion() {
    this.currentLevel = 2; this.inventoryUi = this.farm.inventoryUi;
    this.level2Solids = this.solids; this.companionEnemies = this.mobs;
    for (const key of ['partyTeteHealth', 'partyTeteSleeping']) Object.defineProperty(this, key, { get: () => this.farm[key] });
    if (!this.farm.partyTete) return;
    this.partyTete = this.physics.add.sprite(435, 520, this.farm.partyTete.texture.key).setScale(0.9).setCollideWorldBounds(true);
    this.partyTete.body.setSize(28, 14).setOffset(22, 56);
    this.physics.add.collider(this.partyTete, this.solids);
    this.companionLabel = this.add.text(435, 477, '', { fontSize: '10px', color: '#bce6cb', stroke: '#17231f', strokeThickness: 3 }).setOrigin(0.5).setDepth(30);
    this.damageCompanionTarget = (mob, amount) => { mob.hp = Math.max(0, mob.hp - amount); if (!mob.hp) this.killMob(mob); };
  }
  updateCompanion() {
    const tete = this.partyTete;
    if (!tete) return;
    if (this.partyTeteSleeping || this.partyTeteHealth <= 0) {
      tete.disableBody(true, true); this.companionLabel.setVisible(false); updatePartyCombat(this); return;
    }
    if (!tete.active) tete.enableBody(true, this.player.x - 40, this.player.y, true, true);
    const dx = this.player.x - tete.x, dy = this.player.y - tete.y, distance = Math.hypot(dx, dy);
    tete.setVelocity(distance > 55 ? dx / distance * 145 : 0, distance > 55 ? dy / distance * 145 : 0).setDepth(10 + (tete.y + 28) / 100).setFlipX(dx < 0);
    this.companionLabel.setVisible(true).setPosition(tete.x, tete.y - 43).setText(`Tete · ${this.partyTeteHealth}/25 HP`);
    updatePartyCombat(this);
  }
  killMob(mob) { mob.alive = false; mob.sprite.destroy(); mob.label.destroy(); mob.shout.destroy(); mob.warning.destroy(); }
  attack(point) {
    if (getSelectedItem(this.farm)?.type !== 'sword' || this.isAttacking) return;
    this.attackVariant = ((this.attackVariant ?? -1) + 1) % 3; this.attackSwingDirection = this.attackVariant === 1 ? -1 : 1;
    this.attackOriginAngle = Math.atan2(point.y - this.player.y, point.x - this.player.x) + Math.PI / 2;
    this.attackDuration = derivedStats(this.farm).attackMs; this.isAttacking = true; this.attackTimer = 0;
    const dx = point.x - this.player.x, dy = point.y - this.player.y, length = Math.hypot(dx, dy) || 1;
    this.mobs.filter(({ alive }) => alive).forEach((mob) => {
      const ex = mob.sprite.x - this.player.x, ey = mob.sprite.y - this.player.y;
      if (Math.hypot(ex, ey) < 62 && (ex * dx + ey * dy) / length > -8) {
        mob.hp = Math.round((mob.hp - physicalDamage(this.farm, 1)) * 100) / 100;
        if (mob.hp <= 0) this.killMob(mob);
      }
    });
  }
  usePotion(slot) {
    if (this.npcDialogueOpen || this.dead || this.farm.menuOpen || this.farm.statsOpen) return false;
    if (!applyHealthPotion(this.farm, slot)) return false;
    this.farm.updateInventoryList(); this.farm.updateHotbarState(); updatePlayerHealth(this.farm); return true;
  }
  damage(amount, poison = false) {
    if (this.dead) return;
    const farm = this.farm;
    const remaining = poison ? amount : absorbArmorDamage(farm, absorbShieldDamage(farm, amount, this.input.activePointer.rightButtonDown()));
    farm.playerHealth = Math.max(0, farm.playerHealth - remaining); updatePlayerHealth(farm);
    if (!farm.playerHealth) {
      this.dead = true; this.mobs.filter(({ alive }) => alive).forEach((mob) => this.killMob(mob));
      this.gas.forEach(({ art }) => art.destroy()); this.gas = []; this.poison = 0;
      showWinterDialogue(this, [['Gdolf', 'Capcanele m-au pus la pământ. Îmi trag sufletul și mai încerc o dată.']], () => { farm.playerHealth = farm.maxPlayerHealth; this.player.setPosition(480, 520).setVelocity(0, 0); this.dead = false; updatePlayerHealth(farm); });
    }
  }
  leave() { if (this.npcDialogueOpen || this.dead || this.leaving) return; this.leaving = true; this.scene.stop(); this.scene.resume('FarmScene'); }
  update() {
    if (this.notice) {
      const text = { 'seek-migan': 'Vorbește cu Miganul · E / click', searching: 'Caută alifia în cufere · E / click', 'ointment-found': 'Ai alifia · Înapoi la Miganul', 'coat-owned': 'Scurta este în inventar · Întoarce-te la portal', ready: 'Pregătit pentru munți' };
      this.notice.querySelector('.house-objective').textContent = text[this.farm.winterQuest.status] || 'Casa lui Miganul';
    }
    if (!this.player || this.blocked()) { this.player?.setVelocity(0, 0); this.partyTete?.setVelocity(0, 0); this.mobs?.filter(({ alive }) => alive).forEach(({ sprite }) => sprite.setVelocity(0, 0)); return; }
    const dt = Math.min(this.game.loop.delta, 50);
    const dx = Number(this.keys.D.isDown) - Number(this.keys.A.isDown), dy = Number(this.keys.S.isDown) - Number(this.keys.W.isDown), length = Math.hypot(dx, dy) || 1;
    this.player.setVelocity(dx / length * derivedStats(this.farm).walkSpeed, dy / length * derivedStats(this.farm).walkSpeed);
    this.player.setTexture(dx || dy ? this.farm.player.walkFrames[Math.floor(this.time.now / 140) % 3] : getGdolfIdleTexture(this.time.now)).setDepth(10 + (this.player.y + 18) / 100);
    updateSwordMotion(this); this.updateCompanion();
    this.gas = this.gas.filter((cloud) => {
      cloud.remaining -= dt;
      if (cloud.remaining <= 0) { cloud.art.destroy(); return false; }
      cloud.art.clear().fillStyle(0x8bb955, 0.22).fillEllipse(cloud.x, cloud.y, 110, 75);
      if (Math.hypot(this.player.x - cloud.x, this.player.y - cloud.y) < 56) this.poison = 4000;
      return true;
    });
    if (this.poison > 0) {
      this.poison -= dt; this.poisonTick -= dt;
      if (this.poisonTick <= 0) { this.poisonTick = 1000; this.damage(1, true); }
    } else this.poisonTick = 1000;
    this.notice.querySelector('.house-poison').textContent = this.poison > 0 ? `Poison · ${Math.ceil(this.poison / 1000)}s` : '';
    this.mobs.filter(({ alive }) => alive).forEach((mob) => {
      if (!mob.alive || this.dead) return;
      const target = this.partyTete?.active && Math.hypot(this.partyTete.x - mob.sprite.x, this.partyTete.y - mob.sprite.y) < Math.hypot(this.player.x - mob.sprite.x, this.player.y - mob.sprite.y) ? this.partyTete : this.player;
      const { sprite } = mob, x = target.x - sprite.x, y = target.y - sprite.y, distance = Math.hypot(x, y);
      mob.cooldown -= dt; mob.warning.clear();
      if (mob.windup > 0) {
        mob.windup -= dt; sprite.setVelocity(0, 0);
        mob.warning.lineStyle(2, 0xe2a36c, 0.7).strokeEllipse(sprite.x, sprite.y + 12, 50, 25);
        if (mob.windup <= 0 && distance < 45) { if (target === this.player) this.damage(2); else damagePartyTete(this.farm, 2); }
      } else if (distance < 40 && mob.cooldown <= 0) { mob.windup = 500; mob.cooldown = 1700; }
      else if (distance > 30) sprite.setVelocity(x / distance * 65, y / distance * 65);
      else sprite.setVelocity(0, 0);
      if (!mob.alive || this.dead) return;
      sprite.setDepth(10 + (sprite.y + 18) / 100).setFlipX(x < 0);
      mob.label.setPosition(sprite.x, sprite.y - 27).setText(`Bandit · ${mob.hp} HP`); mob.shout.setPosition(sprite.x, sprite.y - 42);
    });
  }
}
