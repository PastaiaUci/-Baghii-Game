import { consumeBobitaMedallion } from './bobita-rewards.js';
import { MiganHouseScene } from './migan-house.js';
import { MATEI_DOOR } from './matei-quest.js';
import { drawFrozenBobita, rescueHint } from './mountain-rescue.js';
import { showWinterDialogue } from './winter-quest.js';
import { createHelmetVisual } from './armor.js';
import { createGearVisual } from './gear.js';
import { createSwordMotion, updateSwordMotion } from './sword-motion.js';
import { updateGdolfAnimation } from './player-art.js';
import { createHouseSkills, activateHouseSkill, updateHouseSkills } from './house-skills.js';
import { transferSkillState } from './skill-state.js';
import { shiftMenuTimers } from './pause-menu.js';
import { createInteriorName } from './leveling.js';
import { createTavernMinimap } from './quest-minimap.js';
import { getSelectedItem } from './inventory.js';
import { openBook } from './completion.js';
import { drawBobita } from './bobita-art.js';
import { startFirewoodQuest, deliverFirewood } from './firewood-quest.js';
import { createFongelTexture } from './fongel-art.js';
import { grantBobitaRewards } from './bobita-rewards.js';

export class MateiHouseScene extends MiganHouseScene {
  constructor() { super('MateiHouseScene'); }
  create() {
    const farm = this.farm; farm.activeHouse = this; this.startedAt = farm.game.loop.now;
    this.thawElapsed = 0; this.warming = false; this.mobs = [];
    Object.defineProperties(this, { inventory: { configurable: true, get: () => farm.inventory }, selectedWeapon: { configurable: true, get: () => farm.selectedWeapon } });
    this.physics.world.setBounds(90, 150, 780, 420); this.cameras.main.setBounds(0, 0, 960, 640).setBackgroundColor('#25212a');
    this.solids = this.physics.add.staticGroup(); this.drawRoom();
    this.player = this.physics.add.sprite(480, 520, 'player').setCollideWorldBounds(true);
    this.player.body.setSize(16, 10).setOffset(8, 28); this.physics.add.collider(this.player, this.solids);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1); createInteriorName(this);
    this.playerWeapon = this.add.sprite(0, 0, 'sword').setOrigin(0.5, 46 / 56).setScale(0.78).setVisible(false);
    this.attackTimer = 0; this.isAttacking = false; this.attackDuration = 160;
    createSwordMotion(this); createHelmetVisual(this, farm); createGearVisual(this, farm);
    this.keys = this.input.keyboard.addKeys('W,A,S,D'); this.input.mouse.disableContextMenu();
    this.createDialogue(); this.createCompanion(); createHouseSkills(this); createTavernMinimap(this);
    createFongelTexture(this);
    this.add.image(360, 290, 'fongel-npc').setDepth(20);
    this.add.text(360, 239, 'F0ngel · E / click', { fontSize: '12px', color: '#ffdfab', stroke: '#372c2b', strokeThickness: 3 }).setOrigin(0.5).setDepth(30);
    this.npcPortraits.F0ngel = this.textures.getBase64('fongel-npc');
    this.npcPortraits['Bobiță'] = '/assets/Bobita/Bobita.png';
    this.bobita = drawBobita(this, 660, 280).setDepth(25);
    this.ice = drawFrozenBobita(this, 660, 280);
    this.steam = this.add.graphics().setDepth(51);
    this.bobitaLabel = this.add.text(660, 323, '', { fontSize: '12px', color: '#ffe1ac', stroke: '#372c2b', strokeThickness: 3 }).setOrigin(0.5).setDepth(52);
    this.updateThawVisual();
    this.hiddenHud = [...document.querySelectorAll('.quest-hud')].map((node) => ({ node, visibility: node.style.visibility }));
    this.hiddenHud.forEach(({ node }) => { node.style.visibility = 'hidden'; }); farm.minimap.style.visibility = 'hidden';
    this.notice = document.createElement('div'); this.notice.className = 'migan-house-hud';
    this.notice.innerHTML = '<strong>Casa lui F0ngel</strong><span class="house-objective">E / click lângă F0ngel · Bobiță lângă șemineu</span><button type="button">Înapoi în sat</button>';
    this.notice.querySelector('button').onclick = () => this.leave(); document.body.appendChild(this.notice);
    this.input.keyboard.on('keydown', (event) => {
      if (event.repeat || this.npcDialogueOpen || farm.menuOpen || farm.statsOpen || farm.bookOpen) return;
      const key = event.key.toLowerCase();
      if (key === 'i') { farm.toggleInventory(); return; }
      if (/^[1-5]$/.test(key)) { farm.selectedWeapon = `slot-${key}`; farm.updateHotbarState(); return; }
      if (['q', 'f', 'r'].includes(key)) { activateHouseSkill(this, key); return; }
      if (key !== 'e') return;
      if (!farm.inventoryUi.classList.contains('hidden')) { farm.toggleInventory(false); return; }
      if (Math.hypot(this.player.x - 480, this.player.y - 550) < 65) { this.leave(); return; }
      if (Math.hypot(this.player.x - 360, this.player.y - 290) < 100) { this.talk(); return; }
      if (['book', 'bobita-book'].includes(getSelectedItem(farm)?.type)) openBook(farm, getSelectedItem(farm)?.type); else farm.toggleInventory();
    });
    this.input.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown() || this.blocked()) return;
      const p = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      if (getSelectedItem(this.farm)?.type === 'gold-medallion' && consumeBobitaMedallion(this.farm, getSelectedItem(this.farm))) return;
      if (Math.hypot(p.x - 360, p.y - 290) < 40) { if (Math.hypot(this.player.x - 360, this.player.y - 290) < 100) this.talk(); return; }
      this.attack(p);
    });
    this.events.once('shutdown', () => {
      this.dialogBox.remove(); this.notice.remove(); this.hiddenHud.forEach(({ node, visibility }) => { node.style.visibility = visibility; });
      farm.minimap.style.visibility = ''; farm.houseActive = farm.tavernActive = false; farm.activeHouse = null;
      const elapsed = farm.game.loop.now - this.startedAt; farm.toggleInventory(false); shiftMenuTimers(farm, elapsed);
      transferSkillState(this, farm, this.time.now, farm.time.now + elapsed);
    });
    farm.saveProgress?.();
    if (farm.mountainRescue.status === 'delivered') this.talk();
  }
  drawRoom() {
    const g = this.add.graphics().setDepth(0);
    g.fillStyle(0x544037).fillRoundedRect(65, 85, 830, 505, 14);
    g.fillStyle(0x9b7655).fillRect(90, 150, 780, 420);
    for (let y = 150; y < 570; y += 28) {
      g.lineStyle(2, 0x71533e).lineBetween(90, y, 870, y);
      for (let x = 95 + y % 56; x < 870; x += 105) g.lineBetween(x, y, x, y + 28);
    }
    g.fillStyle(0xbd9464).fillRect(80, 100, 800, 45);
    g.fillStyle(0x4f3b31).fillRect(392, 105, 96, 47);
    g.fillStyle(0xffffff).fillRect(397, 110, 86, 18);
    g.fillStyle(0xd83e4d).fillRect(397, 128, 86, 18);
    for (let x = 90; x < 870; x += 70) g.fillStyle(0x674c38).fillRect(x, 95, 8, 55);
    g.fillStyle(0x39505e).fillRect(160, 100, 100, 60); g.fillStyle(0xd0e4eb).fillRect(166, 106, 88, 48);
    g.fillStyle(0x79553b).fillRect(207, 100, 6, 60).fillRect(160, 127, 100, 5);
    g.fillStyle(0x9f423d).fillRoundedRect(340, 350, 310, 130, 20);
    g.lineStyle(3, 0xd9ab6b).strokeRoundedRect(350, 360, 290, 110, 16);
    g.fillStyle(0x8e8074).fillRoundedRect(585, 110, 170, 116, 8);
    for (let y = 115; y < 225; y += 22) {
      g.lineStyle(2, 0x5f5750).lineBetween(590, y, 750, y);
      for (let x = 595 + y % 44; x < 750; x += 45) g.lineBetween(x, y, x, y + 22);
    }
    g.fillStyle(0x30282b).fillRoundedRect(615, 145, 110, 80, 18);
    g.fillStyle(0x776e67).fillEllipse(670, 214, 80, 10);
    this.fire = this.add.graphics().setDepth(21);
    g.fillStyle(0x5a3f30).fillRoundedRect(130, 235, 100, 65, 6);
    g.fillStyle(0xb18a60).fillRoundedRect(135, 235, 90, 12, 3);
    g.fillStyle(0xeee4d4).fillEllipse(172, 237, 19, 7);
    g.fillStyle(0xb1a08a).fillRect(440, 563, 80, 8);
    this.add.text(480, 592, 'E · Înapoi în sat', { fontSize: '12px', color: '#f6d9b2' }).setOrigin(0.5).setDepth(30);
    for (const [x, y, w, h] of [[670, 175, 170, 100], [180, 269, 100, 65]]) this.solids.add(this.add.zone(x, y, w, h));
  }
  talk() {
    if (this.warming) { showWinterDialogue(this, [['F0ngel', 'Încet, lângă foc. Gheața se topește deja.']]); return; }
    if (this.farm.mountainRescue.status === 'thawed') {
      showWinterDialogue(this, [['F0ngel', 'Bobiță e la căldură și și-a revenit. L-ați adus la timp!']]); return;
    }
    const first = !this.farm.mountainRescue.firewood;
    const wood = startFirewoodQuest(this.farm);
    if (wood.stage === 'collected') {
      if (!deliverFirewood(this.farm)) return;
      showWinterDialogue(this, [['Gdolf', 'Am adus lemnele! Sania Moșului era deja făcută praf, acum măcar ne ajută să-l salvăm pe Bobiță.'], ['F0ngel', 'Perfect. Le pun în șemineu și aprind focul. Stați cu el aici, îl încălzim încet.']], () => { this.warming = true; this.thawElapsed = 0; });
    } else if (wood.stage === 'burning') {
      showWinterDialogue(this, [['F0ngel', 'Focul este aprins. Îl ținem pe Bobiță la căldură până se topește gheața.']], () => { this.warming = true; this.thawElapsed = 0; });
    } else {
      showWinterDialogue(this, first ? [['Gdolf', 'F0ngel, văd că te-ai vindecat! Noi l-am găsit pe Bobiță înghețat în munți. Trebuie să-l dezghețăm!'], ['F0ngel', 'Eu sunt bine acum, dar n-am niciun lemn de foc. Puneți-l lângă șemineu, apoi aduceți lemne.'], ['Tete', 'Moș Crăciun doarme lângă sania ruptă, în vestul satului. Gdolf, o facem lemne cu sabia!'], ['F0ngel', 'Aduceți-mi trei bucăți și facem focul.']] : [['F0ngel', wood.stage === 'chopped' ? 'Lemnele sunt încă lângă sanie. Ridică-le și adu-le aici.' : 'N-am lemne. Sparge cu sabia sania ruptă a lui Moș Crăciun și adu-mi trei bucăți.']]);
    }
    rescueHint(this.farm); this.farm.saveProgress?.();
  }
  updateThawVisual() {
    const done = this.farm.mountainRescue.status === 'thawed', progress = done ? 1 : Math.min(1, this.thawElapsed / 6000);
    this.ice.setAlpha(1 - progress).setScale(1 - progress * 0.18).setVisible(!done);
    this.bobita.setAlpha(progress); this.bobitaLabel.setText(done ? 'Bobiță · La căldură' : `Bobiță · ${Math.round(progress * 100)}% dezghețat`);
    this.steam.clear();
    if (progress > 0 && !done) {
      this.steam.fillStyle(0x95d0e5, 0.35).fillEllipse(660, 302, 50 + progress * 35, 15);
      for (let i = 0; i < 7; i++) {
        const t = (this.thawElapsed / 1300 + i / 7) % 1;
        this.steam.fillStyle(0xfff2e6, (1 - t) * 0.35).fillEllipse(645 + i * 5 + Math.sin(t * 6 + i) * 8, 260 - t * 65, 10 + t * 8, 7 + t * 5);
      }
    }
  }
  leave() {
    if (this.blocked()) return;
    this.leaving = true; const farm = this.farm;
    this.scene.stop(); this.scene.resume('FarmScene');
    farm.player.setPosition(MATEI_DOOR.x, MATEI_DOOR.y + 35).setVelocity(0, 0);
    farm.partyTete?.setPosition(MATEI_DOOR.x + 45, MATEI_DOOR.y + 45).setVelocity(0, 0);
    rescueHint(farm); farm.saveProgress?.();
  }
  update() {
    if (!this.player) return;
    if (this.blocked()) { this.player.setVelocity(0, 0); this.partyTete?.setVelocity(0, 0); return; }
    const dt = Math.min(this.game.loop.delta, 50), dx = Number(this.keys.D.isDown) - Number(this.keys.A.isDown), dy = Number(this.keys.S.isDown) - Number(this.keys.W.isDown), len = Math.hypot(dx, dy) || 1;
    const speed = updateHouseSkills(this); this.player.setVelocity(dx / len * speed, dy / len * speed).setDepth(10 + this.player.y / 100);
    updateGdolfAnimation(this, Boolean(dx || dy)); updateSwordMotion(this); this.updateCompanion();
    this.fire.clear();
    const lit = this.farm.mountainRescue.status === 'thawed' || this.farm.mountainRescue.firewood?.stage === 'burning';
    if (lit) this.fire.fillStyle(0xf9bd65, 0.13).fillEllipse(670, 280, 240, 180).fillStyle(0x6d4835).fillRect(620, 207, 100, 10);
    for (let i = 0; lit && i < 7; i++) {
      const x = 628 + i * 12, h = 28 + Math.sin(this.time.now / 120 + i * 2) * 10;
      this.fire.fillStyle(i % 2 ? 0xffc66b : 0xe9783d).fillTriangle(x - 9, 207, x + 10, 207, x + Math.sin(this.time.now / 200 + i) * 6, 207 - h);
    }
    if (!this.warming && this.farm.mountainRescue.status === 'delivered') {
      const stage = this.farm.mountainRescue.firewood?.stage;
      this.notice.querySelector('.house-objective').textContent = stage === 'collected' ? 'Ai lemnele · Vorbește cu F0ngel' : stage === 'burning' ? 'Foc aprins · Vorbește cu F0ngel' : 'Fără lemne · Sparge sania Moșului și adu lemnele';
    }
    if (this.warming && this.farm.mountainRescue.status === 'delivered') {
      this.thawElapsed += dt; this.updateThawVisual();
      this.notice.querySelector('.house-objective').textContent = `Dezghețare lângă șemineu · ${Math.min(100, Math.floor(this.thawElapsed / 60))}%`;
      if (this.thawElapsed >= 6000) {
        this.warming = false; this.farm.mountainRescue.status = 'thawed'; this.updateThawVisual(); rescueHint(this.farm); grantBobitaRewards(this.farm); this.farm.saveProgress?.();
        showWinterDialogue(this, [['Bobiță', 'Brrr... Unde sunt? Gdolf? Tete?!'], ['Gdolf', 'În casa lui F0ngel. Te-am găsit înghețat în munți și te-am adus înapoi. Ești în siguranță.'], ['Bobiță', 'Vă datorez una! Luați cartea mea și colierul de aur. Vin cu voi: toiagul meu ne poate vindeca pe toți. Dacă mă rănesc, dați-mi un medalion de aur.'], ['F0ngel', 'Stați lângă foc. Are nevoie de puțină odihnă.']]);
        this.notice.querySelector('.house-objective').textContent = 'Bobiță s-a dezghețat · Este în siguranță';
      }
    }
  }
}
