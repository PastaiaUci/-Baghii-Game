import Phaser from 'phaser';
import { showNpcDialogue, hideNpcDialogue } from './dialogue.js';
import { playSound } from './audio.js';
import { shiftVillageTimers } from './tavern-access.js';
import { getTavernQuest, updateTavernQuestHint, talkToTavernNpc, startSnikuWalk, addSnikuBeer } from './tavern-quest.js';
import { getGdolfIdleTexture } from './player-art.js';

export class TavernScene extends Phaser.Scene {
  constructor() { super('TavernScene'); }

  init({ farm }) {
    this.farm = farm;
    this.leaving = false;
    this.npcDialogueOpen = false;
    this.nextClinkAt = 0;
    this.nextStepAt = 0;
    this.wakeWalkPending = false;
    this.snikuWalking = false;
  }

  create() {
    this.enteredAt = this.game.loop.now;
    this.hiddenHud = [...document.querySelectorAll('.quest-hud, .gold-hud, .player-health-hud, .skillbar, .hotbar, .minimap, .party-hud')]
      .map((element) => { const visibility = element.style.visibility; element.style.visibility = 'hidden'; return { element, visibility }; });
    this.physics.world.setBounds(80, 105, 800, 465);
    this.cameras.main.setBackgroundColor('#171312').setBounds(0, 0, 960, 640);
    this.solids = this.physics.add.staticGroup();
    this.drawRoom();
    this.player = this.physics.add.sprite(480, 500, 'player');
    this.player.body.setSize(16, 10).setOffset(8, 28);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.solids);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.keys = this.input.keyboard.addKeys('W,A,S,D,E,ESC');
    this.createVisitors();
    this.createDialogue();
    this.hint = document.createElement('div');
    this.hint.className = 'tavern-hud';
    this.hint.innerHTML = '<strong>Cârciuma Bețivilor</strong><span>Click pe personaje pentru dialog · E lângă ușă pentru a ieși</span>';
    document.body.appendChild(this.hint);
    this.questHint = document.createElement('span');
    this.questHint.className = 'tavern-quest-hint';
    this.hint.appendChild(this.questHint);
    updateTavernQuestHint(this);
    if (getTavernQuest(this.farm).status === 'walking') startSnikuWalk(this);
    this.exitButton = document.createElement('button');
    this.exitButton.className = 'tavern-exit';
    this.exitButton.textContent = 'Înapoi în sat →';
    this.exitButton.addEventListener('click', () => { if (!this.npcDialogueOpen) this.leave(); });
    document.body.appendChild(this.exitButton);
    this.input.keyboard.on('keydown-E', (event) => {
      if (!event.repeat && !this.npcDialogueOpen && Math.hypot(this.player.x - 480, this.player.y - 550) < 80) this.leave();
    });
    this.events.once('shutdown', () => {
      this.dialogBox.remove(); this.hint.remove(); this.exitButton.remove();
      this.hiddenHud.forEach(({ element, visibility }) => { element.style.visibility = visibility; });
      shiftVillageTimers(this.farm, this.game.loop.now - this.enteredAt);
      this.farm.tavernActive = false;
      this.farm.player.setVelocity(0, 0);
    });
  }

  solid(x, y, w, h) { const zone = this.add.zone(x, y, w, h); this.solids.add(zone); return zone; }

  drawRoom() {
    const g = this.add.graphics();
    g.fillStyle(0x241b1b).fillRect(0, 0, 960, 640);
    g.fillStyle(0x795538).fillRect(64, 92, 832, 496);
    for (let y = 96; y < 588; y += 22) {
      g.lineStyle(2, 0x513c2e).lineBetween(64, y, 896, y);
      for (let x = 70 + (y % 44 ? 50 : 0); x < 890; x += 100) g.lineBetween(x, y, x, y + 20);
    }
    g.fillStyle(0x48312c).fillRect(64, 50, 832, 54);
    g.fillStyle(0xb78d53).fillRect(64, 100, 832, 5);
    g.fillStyle(0x3b2b27).fillRect(64, 104, 16, 484).fillRect(880, 104, 16, 484);
    g.fillRect(64, 572, 376, 18).fillRect(520, 572, 376, 18);
    g.fillStyle(0xc5a571).fillRect(440, 568, 80, 20);
    g.fillStyle(0x432e25).fillRect(210, 138, 540, 64);
    g.fillStyle(0xa67b49).fillRect(202, 132, 556, 18);
    this.solid(480, 171, 556, 66);
    for (let x = 240; x <= 720; x += 56) {
      g.fillStyle(0x253d2e).fillRoundedRect(x, 112, 8, 20, 2);
      g.fillStyle(0xbfa36d).fillRect(x + 1, 119, 6, 7);
    }
    // Table, stools, scattered bottles and warm pools of light.
    for (const x of [318, 422]) {
      g.fillStyle(0x493328).fillEllipse(x, 320, 34, 17);
      g.fillStyle(0xb2824b).fillEllipse(x, 314, 32, 15);
    }
    g.fillStyle(0x33221c, 0.35).fillEllipse(374, 375, 220, 45);
    g.fillStyle(0x4a3125).fillRect(281, 344, 190, 37);
    g.fillStyle(0xa17442).fillRoundedRect(276, 327, 200, 40, 9);
    g.lineStyle(2, 0xc79c63).strokeRoundedRect(280, 330, 192, 32, 7);
    this.solid(376, 353, 196, 44);
    [306, 366, 434].forEach((x) => {
      g.fillStyle(0xe3b45d).fillRoundedRect(x, 329, 10, 13, 2);
      g.fillStyle(0xffefc2).fillRect(x, 328, 10, 3);
    });
    g.fillStyle(0x2b4934).fillRoundedRect(636, 450, 22, 8, 2).fillRoundedRect(723, 423, 18, 8, 2);
    g.fillStyle(0xd6bf98).fillRect(625, 471, 15, 10);
    for (const x of [135, 820]) {
      g.fillStyle(0xf0bd61, 0.12).fillCircle(x, 170, 64);
      g.fillStyle(0xe9b865).fillRoundedRect(x - 10, 132, 20, 29, 4);
      g.fillStyle(0xffe5a2).fillRect(x - 3, 136, 6, 20);
    }
    this.add.text(480, 76, 'CÂRCIUMA BEȚIVILOR', { fontFamily: 'Georgia', fontSize: '22px', color: '#edd6a5' }).setOrigin(0.5);
    this.exitLabel = this.add.text(480, 555, 'IEȘIRE · SAT', { fontFamily: 'Arial', fontSize: '12px', color: '#ffdf9f' }).setOrigin(0.5).setDepth(30);
  }

  createVisitors() {
    const specs = [
      ['Haralamb', 'tavern-haralamb', 318, 294, 0x56372a, 0x56784a, 'Încă o bere, Chinezule! Sau… am băut-o deja?'],
      ['Chinezu', 'tavern-chinezu', 422, 294, 0x28272b, 0x8c6941, 'Haralamb, masa se mișcă! Mai adu una, poate se oprește.'],
      ['Sniku', 'tavern-sniku', 686, 442, 0x211e26, 0x745579, 'Sunt mort de beat și drogat… lăsați-mă puțin pe jos.'],
    ];
    this.npcPortraits = {};
    this.tavernVisitors = {};
    const quest = getTavernQuest(this.farm);
    specs.forEach(([name, key, x, y, hair, shirt, line], index) => {
      const awake = name === 'Sniku' && ['walking', 'ready', 'completed'].includes(quest.status);
      if (awake) { x = quest.position?.x ?? 680; y = quest.position?.y ?? 218; }
      if (!this.textures.exists(key)) this.farm.createNpcTexture(key, hair, shirt, 0xe2b490, 0xa98b61);
      this.npcPortraits[name] = this.textures.getBase64(key);
      const sprite = this.add.sprite(0, 0, key).setInteractive({ useHandCursor: true });
      const group = this.add.container(x, y, [sprite]);
      group.setDepth(10 + (y + 20) / 100);
      let zone;
      if (name === 'Sniku') {
        if (!awake) {
          sprite.setRotation(Math.PI / 2).setScale(1.2);
          this.tweens.add({ targets: group, y: y + 1.5, duration: 1800, yoyo: true, repeat: -1 });
        }
        zone = this.solid(x, y + (awake ? 14 : 4), 42, 14);
      } else {
        const mug = this.add.graphics().setPosition(16, 4);
        mug.fillStyle(0xd9a33f).fillRoundedRect(-4, -8, 9, 13, 2);
        mug.fillStyle(0xffefd0).fillRect(-4, -9, 9, 3);
        mug.lineStyle(2, 0xdcca9e).strokeRect(4, -5, 5, 7);
        group.add(mug);
        this.tweens.add({ targets: group, angle: index ? -7 : 7, duration: 1500 + index * 300, yoyo: true, repeat: -1 });
        this.tweens.add({ targets: mug, y: -7, duration: 1000 + index * 400, yoyo: true, repeat: -1, hold: 900 });
        zone = this.solid(x, y + 14, 18, 12);
      }
      const label = this.add.text(x, y - (name === 'Sniku' ? 26 : 34), name, {
        fontFamily: 'Arial', fontSize: '12px', color: '#ffe1ac', stroke: '#281e1b', strokeThickness: 3,
      }).setOrigin(0.5).setDepth(30).setInteractive({ useHandCursor: true });
      this.tavernVisitors[name] = { sprite, group, zone, label };
      if (name === 'Sniku' && ['ready', 'completed'].includes(quest.status)) addSnikuBeer(this);
      const talk = () => { if (!this.npcDialogueOpen && !this.leaving) talkToTavernNpc(this, name, line); };
      sprite.on('pointerdown', talk); label.on('pointerdown', talk);
    });
  }

  createDialogue() {
    this.dialogBox = document.createElement('div');
    this.dialogBox.className = 'chapter-dialogue npc-modal tavern-quest-dialog hidden'; this.dialogBox.hidden = true;
    this.dialogBox.innerHTML = '<section role="dialog" aria-modal="true" aria-labelledby="tavern-speaker"><img class="npc-dialog-portrait" alt=""><div><small class="npc-dialog-kicker">CONVERSAȚIE</small><h2 id="tavern-speaker" class="npc-dialog-name"></h2><p class="npc-dialog-text"></p><div class="tavern-choice-actions" hidden></div><button type="button" class="tavern-dialog-continue">Continuă →</button></div></section>';
    this.dialogName = this.dialogBox.querySelector('.npc-dialog-name');
    this.dialogText = this.dialogBox.querySelector('.npc-dialog-text');
    this.dialogChoices = this.dialogBox.querySelector('.tavern-choice-actions');
    this.dialogOkButton = this.dialogBox.querySelector('.tavern-dialog-continue');
    this.dialogOkButton.addEventListener('click', () => { hideNpcDialogue(this); if (this.wakeWalkPending) startSnikuWalk(this); });
    document.body.appendChild(this.dialogBox);
  }

  leave() {
    if (this.leaving || this.npcDialogueOpen) return;
    this.leaving = true;
    this.scene.stop();
    this.scene.resume('FarmScene');
  }

  update() {
    if (this.leaving || this.npcDialogueOpen) return;
    const dx = Number(this.keys.D.isDown) - Number(this.keys.A.isDown);
    const dy = Number(this.keys.S.isDown) - Number(this.keys.W.isDown);
    const length = Math.hypot(dx, dy) || 1;
    this.player.setVelocity(dx / length * 180, dy / length * 180);
    this.player.setTexture(dx || dy ? this.farm.player.walkFrames[Math.floor(this.time.now / 140) % 3] : getGdolfIdleTexture(this.time.now));
    this.player.setDepth(10 + (this.player.y + 18) / 100);
    if ((dx || dy) && this.time.now >= this.nextStepAt) { this.nextStepAt = this.time.now + 290; playSound(this.farm, 'step'); }
    this.exitLabel.setText(Math.hypot(this.player.x - 480, this.player.y - 550) < 80 ? 'E · Înapoi în sat' : 'IEȘIRE · SAT');
  }
}
