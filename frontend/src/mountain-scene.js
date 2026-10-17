import { consumeBobitaMedallion } from './bobita-rewards.js';
import { MiganHouseScene } from './migan-house.js';
import { mountainPath, startRescue, breakRescueStone, rescueHint, drawFrozenBobita, showRescuedBobita, SUMMIT_STONES } from './mountain-rescue.js';
import { showWinterDialogue } from './winter-quest.js';
import { createHelmetVisual } from './armor.js';
import { createGearVisual } from './gear.js';
import { createSwordMotion, updateSwordMotion } from './sword-motion.js';
import { updateGdolfAnimation } from './player-art.js';
import { getSelectedItem } from './inventory.js';
import { createHouseSkills, activateHouseSkill, updateHouseSkills } from './house-skills.js';
import { transferSkillState } from './skill-state.js';
import { shiftMenuTimers } from './pause-menu.js';
import { createInteriorName } from './leveling.js';
import { createTavernMinimap } from './quest-minimap.js';
import { showDamage } from './combat-feedback.js';
import { consumeRevivalBeer } from './party-health.js';
import { openBook } from './completion.js';

export class MountainScene extends MiganHouseScene {
  constructor() { super('MountainScene'); }
  create() {
    const farm = this.farm; farm.activeHouse = this;
    this.startedAt = farm.game.loop.now; this.quest = startRescue(farm);
    Object.defineProperties(this, { inventory: { configurable: true, get: () => farm.inventory }, selectedWeapon: { configurable: true, get: () => farm.selectedWeapon } });
    this.physics.world.setBounds(35, 70, 1130, 4070);
    this.cameras.main.setBounds(0, 0, 1200, 4200).setBackgroundColor('#a7bbc9');
    this.solids = this.physics.add.staticGroup(); this.mobs = []; this.gas = [];
    this.drawMountains();
    const y = ['found', 'carrying'].includes(this.quest.status) ? 700 : 3990;
    this.player = this.physics.add.sprite(mountainPath(y).center, y, 'player').setCollideWorldBounds(true);
    this.player.body.setSize(16, 10).setOffset(8, 28); this.physics.add.collider(this.player, this.solids);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1); createInteriorName(this);
    this.playerWeapon = this.add.sprite(0, 0, 'sword').setOrigin(0.5, 46 / 56).setScale(0.78).setVisible(false);
    this.attackTimer = 0; this.isAttacking = false; this.attackDuration = 160;
    createSwordMotion(this); createHelmetVisual(this, farm); createGearVisual(this, farm);
    this.keys = this.input.keyboard.addKeys('W,A,S,D'); this.input.mouse.disableContextMenu();
    this.createDialogue(); this.createStones(); this.createCompanion(); createHouseSkills(this);
    this.partyTete?.setPosition(this.player.x - 45, this.player.y + 15);
    // Tete follows but does not accidentally solve the search while Gdolf is reading.
    this.companionEnemies = [];
    this.hiddenHud = [...document.querySelectorAll('.quest-hud')].map((node) => ({ node, visibility: node.style.visibility }));
    this.hiddenHud.forEach(({ node }) => { node.style.visibility = 'hidden'; }); farm.minimap.style.visibility = 'hidden';
    createTavernMinimap(this);
    this.notice = document.createElement('div'); this.notice.className = 'migan-house-hud';
    this.notice.innerHTML = '<strong>Trecătoarea înghețată</strong><span class="house-objective"></span><span>WASD · E interacțiune · I inventar · J misiuni</span>';
    document.body.appendChild(this.notice);
    this.snow = this.add.graphics().setScrollFactor(0).setDepth(1000); this.snowTime = 0;
    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown() || this.blocked()) return;
      const point = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      if (getSelectedItem(this.farm)?.type === 'gold-medallion' && consumeBobitaMedallion(this.farm, getSelectedItem(this.farm))) return;
      if (this.ice && this.quest.status === 'found' && Math.hypot(point.x - this.ice.x, point.y - this.ice.y) < 45) { this.pickupBobita(); return; }
      const item = getSelectedItem(farm);
      if (item?.type === 'health-potion') { this.usePotion(Number(farm.selectedWeapon.slice(5)) - 1); return; }
      if (item?.type === 'revival-beer') { consumeRevivalBeer(farm, item); return; }
      if (item?.type === 'flashlight') { activateHouseSkill(this, 'flashlight'); return; }
      this.attack(point);
    });
    this.input.keyboard.on('keydown', (event) => {
      if (event.repeat || this.npcDialogueOpen || farm.menuOpen || farm.statsOpen || farm.bookOpen) return;
      const key = event.key.toLowerCase();
      if (/^[1-5]$/.test(key)) { farm.selectedWeapon = `slot-${key}`; farm.updateHotbarState(); return; }
      if (['q', 'f', 'r'].includes(key)) { activateHouseSkill(this, key); return; }
      if (key === 'i') { farm.toggleInventory(); return; }
      if (key !== 'e') return;
      if (!farm.inventoryUi.classList.contains('hidden')) { farm.toggleInventory(false); return; }
      if (this.pickupBobita()) return;
      if (this.player.y > 3910 && Math.abs(this.player.x - mountainPath(3990).center) < 110) { this.leave(); return; }
      if (['book', 'bobita-book'].includes(getSelectedItem(farm)?.type)) { openBook(farm, getSelectedItem(farm)?.type); return; }
      farm.toggleInventory();
    });
    rescueHint(farm);
    this.events.once('shutdown', () => {
      this.dialogBox.remove(); this.notice.remove(); this.hiddenHud.forEach(({ node, visibility }) => { node.style.visibility = visibility; });
      farm.minimap.style.visibility = ''; farm.mountainActive = farm.houseActive = farm.tavernActive = false; farm.activeHouse = null;
      const elapsed = farm.game.loop.now - this.startedAt;
      farm.toggleInventory(false); shiftMenuTimers(farm, elapsed); transferSkillState(this, farm, this.time.now, farm.time.now + elapsed);
    });
  }
  drawMountains() {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x849aaf).fillRect(0, 0, 1200, 4200);
    for (let y = 80; y < 4200; y += 70) {
      const { center, half } = mountainPath(y), left = center - half, right = center + half;
      g.fillStyle(0xdbe8ed).fillRoundedRect(left, y - 30, half * 2, 112, 24);
      g.fillStyle(0xf2f6f4, 0.6).fillEllipse(center, y + 5, half * 1.5, 54);
      for (const [x, width] of [[0, left - 20], [right + 20, 1200 - right - 20]]) {
        if (width <= 0) continue;
        const body = this.add.rectangle(x + width / 2, y + 5, width, 70, 0, 0);
        this.physics.add.existing(body, true); this.solids.add(body);
      }
      for (const side of [-1, 1]) {
        const x = center + side * (half + 24);
        g.fillStyle(0x526e87).fillTriangle(x - 66, y + 60, x + 65, y + 60, x + side * 16, y - 55);
        g.fillStyle(0xe4f0f4).fillTriangle(x - 30, y - 2, x + 35, y - 2, x + side * 16, y - 55);
        if (y % 210 === 80) {
          g.fillStyle(0x334f60).fillTriangle(x - 30, y + 40, x + 30, y + 40, x, y - 30);
          g.fillStyle(0xf0f7f5).fillTriangle(x - 23, y + 10, x + 23, y + 10, x, y - 30);
        }
      }
      for (let i = 0; i < 8; i++) g.fillStyle(0x8faec2, 0.35).fillEllipse(center - half + 45 + (i * 47 + y * 3) % (half * 2 - 90), y + i % 3 * 13, 6, 2);
    }
    const x = mountainPath(3990).center;
    g.fillStyle(0x30436c).fillEllipse(x, 4005, 65, 90); g.lineStyle(4, 0x94eaff).strokeEllipse(x, 4005, 65, 90);
    this.add.text(x, 4065, 'E · Înapoi în sat', { fontSize: '13px', color: '#ffffff', stroke: '#314a60', strokeThickness: 4 }).setOrigin(0.5).setDepth(20);
    this.add.text(600, 130, 'PLATOUL TĂCERII', { fontFamily: 'Georgia', fontSize: '26px', color: '#3c586c' }).setOrigin(0.5);
  }
  createStones() {
    if (!this.textures.exists('rescue-stone')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x678299).fillPoints([{ x: 8, y: 61 }, { x: 1, y: 30 }, { x: 15, y: 6 }, { x: 35, y: 0 }, { x: 56, y: 22 }, { x: 59, y: 54 }, { x: 40, y: 68 }], true);
      g.fillStyle(0xe4f7ff).fillTriangle(15, 6, 35, 0, 49, 20).fillTriangle(8, 28, 19, 10, 25, 38);
      g.lineStyle(2, 0xb0d6e7).lineBetween(35, 7, 28, 35).lineBetween(28, 35, 40, 52);
      g.generateTexture('rescue-stone', 64, 72); g.destroy();
    }
    for (let index = 0; index < SUMMIT_STONES; index++) {
      const x = 200 + index % 6 * 160, y = 280 + Math.floor(index / 6) * 175;
      if (this.quest.broken.includes(index)) { this.add.ellipse(x, y + 20, 48, 14, 0x6d879a, 0.4); continue; }
      const sprite = this.physics.add.staticSprite(x, y, 'rescue-stone').setDepth(10 + y / 100);
      sprite.body.setSize(42, 38).setOffset(9, 29); this.solids.add(sprite);
      const label = this.add.text(x, y - 44, 'Gheață · 4 HP', { fontSize: '10px', color: '#edfaff', stroke: '#31495e', strokeThickness: 3 }).setOrigin(0.5).setDepth(40);
      const mob = { index, sprite, label, hp: 4, alive: true }; sprite.houseMob = mob; this.mobs.push(mob);
    }
    if (this.quest.status === 'found') this.revealBobita();
    if (this.quest.status === 'carrying') this.ice = drawFrozenBobita(this, this.player.x, this.player.y);
  }
  damageIndoorMob(mob, amount) {
    if (!mob?.alive || this.quest.status !== 'searching') return;
    showDamage(this, mob.sprite, Math.min(amount, mob.hp)); mob.hp = Math.max(0, mob.hp - amount);
    mob.label.setText(`Gheață · ${Math.ceil(mob.hp)} HP`);
    if (mob.hp) return;
    mob.alive = false; const { x, y } = mob.sprite;
    mob.sprite.destroy(); mob.label.destroy();
    for (let i = 0; i < 9; i++) {
      const shard = this.add.rectangle(x, y, 5 + i % 3, 8, 0xb4e4f2).setDepth(45);
      this.tweens.add({ targets: shard, x: x + Math.cos(i * 2.4) * 65, y: y + Math.sin(i * 2.4) * 45, alpha: 0, angle: i * 75, duration: 550, onComplete: () => shard.destroy() });
    }
    if (breakRescueStone(this.quest, mob.index)) {
      this.revealBobita(); rescueHint(this.farm);
      showWinterDialogue(this, [['Gdolf', 'Tete... stai! E cineva în piatră! Bobiță?! Doamne, e înghețat bocnă!'], ['Tete', 'Mi-a înghețat sângele! Nu-l lăsăm aici. Ia-l pe sus, îl ducem înapoi în sat!'], ['Gdolf', 'Rezistă, Bobiță! Te scoatem noi de aici.']]);
    }
    this.farm.saveProgress?.();
  }
  revealBobita() {
    const index = this.quest.target;
    this.ice = drawFrozenBobita(this, 200 + index % 6 * 160, 280 + Math.floor(index / 6) * 175);
    this.iceLabel = this.add.text(this.ice.x, this.ice.y + 35, 'Bobiță · E / click pentru a-l ridica', { fontSize: '11px', color: '#ffffff', stroke: '#31495e', strokeThickness: 3 }).setOrigin(0.5).setDepth(51);
  }
  pickupBobita() {
    if (this.quest.status !== 'found' || Math.hypot(this.player.x - this.ice.x, this.player.y - this.ice.y) > 95) return false;
    this.quest.status = 'carrying'; this.iceLabel?.destroy(); rescueHint(this.farm); this.farm.saveProgress?.(); return true;
  }
  updateCompanion() {
    if (this.partyTete?.active && !this.partyTeteSleeping && Math.hypot(this.player.x - this.partyTete.x, this.player.y - this.partyTete.y) > 340) {
      const path = mountainPath(this.player.y + 35);
      this.partyTete.setPosition(Math.max(path.center - path.half + 45, Math.min(path.center + path.half - 45, this.player.x - 40)), this.player.y + 35);
    }
    super.updateCompanion();
  }
  leave() {
    if (this.blocked()) return;
    if (this.quest.status === 'carrying') this.quest.status = 'rescued';
    this.leaving = true; const farm = this.farm;
    this.scene.stop(); this.scene.resume('FarmScene');
    farm.player.setPosition(800, 425).setVelocity(0, 0); farm.partyTete?.setPosition(750, 445).setVelocity(0, 0);
    showRescuedBobita(farm); rescueHint(farm); farm.saveProgress?.();
    if (this.quest.status === 'rescued') showWinterDialogue(farm, [['Gdolf', 'Am ajuns în sat! Bobiță e încă prins în gheață. Îl lăsăm o clipă lângă Luis să ne tragem sufletul.'], ['Tete', 'Trebuie să-l ducem la casa lui F0ngel, în nord-vest. Are șemineu, acolo îl dezghețăm!']]);
  }
  update() {
    if (!this.player) return;
    if (this.blocked()) { this.player.setVelocity(0, 0); this.partyTete?.setVelocity(0, 0); return; }
    const dt = Math.min(this.game.loop.delta, 50), dx = Number(this.keys.D.isDown) - Number(this.keys.A.isDown), dy = Number(this.keys.S.isDown) - Number(this.keys.W.isDown), length = Math.hypot(dx, dy) || 1;
    const speed = updateHouseSkills(this);
    this.player.setVelocity(dx / length * speed, dy / length * speed).setDepth(10 + (this.player.y + 18) / 100);
    updateGdolfAnimation(this, Boolean(dx || dy)); updateSwordMotion(this); this.updateCompanion();
    if (this.quest.status === 'carrying') this.ice.setPosition(this.player.x, this.player.y - 43).setDepth(this.player.depth + 1).setScale(0.8);
    this.notice.querySelector('.house-objective').textContent = this.quest.status === 'carrying' ? 'Îl cari pe Bobiță · Coboară la portal ↓' : this.quest.status === 'found' ? 'E lângă Bobiță · Ridică blocul de gheață' : this.player.y < 900 ? `Sparge pietrele · ${this.quest.broken.length}/${SUMMIT_STONES}` : 'Urcă spre platoul din nord ↑';
    const calls = [{ y: 3450, line: 'Bobițăăă! Unde ești, nebunule?!' }, { y: 2650, line: 'Bobiiiță! Răspunde! Sunt eu, Gdolf!' }, { y: 1750, line: 'Bobiță! Tete, nu-mi place liniștea asta...' }, { y: 900, line: 'Bobițăăă! Numai pietre și gheață... trebuie să fie pe aici.' }];
    if (this.quest.status === 'searching' && this.quest.calls < calls.length && this.player.y < calls[this.quest.calls].y) {
      const call = calls[this.quest.calls++]; showWinterDialogue(this, [['Gdolf', call.line]]);
    }
    this.snowTime += dt / 1000; this.snow.clear();
    const { width, height } = this.cameras.main;
    for (let i = 0; i < 100; i++) {
      const x = (i * 137.7 + this.snowTime * (55 + i % 5 * 7)) % width, y = (i * 97.3 + this.snowTime * (35 + i % 7 * 5)) % height;
      this.snow.fillStyle(0xffffff, 0.3 + i % 4 * 0.12).fillCircle(x, y, 0.8 + i % 3 * 0.55);
    }
  }
}
