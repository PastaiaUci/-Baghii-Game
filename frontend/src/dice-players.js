import { canInteract } from './interaction-range.js';
import { showNpcDialogue } from './dialogue.js';
import { openDiceGame } from './dice-game.js';

// These peaceful NPCs never enter the villager combat group or quest counter.
export function createDicePlayers(scene) {
  const table = scene.add.graphics().setDepth(19.5);
  table.fillStyle(0x34442e, 0.22).fillEllipse(950, 955, 114, 23);
  table.fillStyle(0x62442d).fillRect(926, 935, 7, 20).fillRect(969, 935, 7, 20);
  table.fillStyle(0x987045).fillRoundedRect(917, 913, 66, 37, 5);
  table.lineStyle(2, 0xc59c60).strokeRoundedRect(917, 913, 66, 37, 5);
  table.fillStyle(0x365f49).fillRoundedRect(922, 917, 56, 27, 3);
  table.fillStyle(0xe4ba59);
  [[929, 924], [969, 937], [966, 922], [930, 938]].forEach(([x, y]) => table.fillCircle(x, y, 3));
  const dice = scene.add.graphics().setDepth(19.6);
  scene.worldObjects.push(table, dice);
  scene.dicePlayers = [
    { name: 'Buza', x: 903, shirt: 0x8b514c, hair: 0x382d29, message: 'Hai, Straton, dă cu zarul! De trei ture zici că-ți vine norocul. Gdolf, stai să vezi cum îi iau și ultimul bănuț!' },
    { name: 'Straton', x: 997, shirt: 0x536b90, hair: 0x7b583a, message: 'Nu te lua după Buza, Gdolf. A câștigat de două ori și deja se crede regele barbutului. Acum vine dubla mea!' },
  ].map((person) => {
    const key = `dice-npc-${person.name.toLowerCase()}`;
    scene.createNpcTexture(key, person.hair, person.shirt, 0xe2b48b, 0xc5a866);
    const sprite = scene.add.image(person.x, 929, key).setDepth(19.7);
    const label = scene.add.text(person.x, 902, person.name, {
      fontFamily: 'Arial', fontSize: '11px', color: '#ffe0a0', stroke: '#29251c', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);
    const marker = scene.add.text(person.x, 883, '!', {
      fontFamily: 'Arial', fontSize: '12px', fontStyle: 'bold', color: '#ffdc83', stroke: '#392819', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(30);
    const footprint = scene.add.zone(person.x, 944, 18, 12);
    scene.obstacles.add(footprint);
    scene.worldObjects.push(sprite, label, marker, footprint);
    scene.npcPortraits ||= {};
    scene.npcPortraits[person.name] = scene.textures.get(key).getSourceImage().toDataURL();
    return { ...person, sprite };
  });
  const solid = scene.add.zone(950, 938, 66, 25);
  scene.obstacles.add(solid);
  scene.worldObjects.push(solid);
  let lastRound = -1, values = [1, 1];
  const pips = {
    1: [[0, 0]], 2: [[-2, -2], [2, 2]], 3: [[-2, -2], [0, 0], [2, 2]],
    4: [[-2, -2], [2, -2], [-2, 2], [2, 2]],
    5: [[-2, -2], [2, -2], [0, 0], [-2, 2], [2, 2]],
    6: [[-2, -2], [2, -2], [-2, 0], [2, 0], [-2, 2], [2, 2]],
  };
  const animate = () => {
    if (!dice.visible || scene.npcDialogueOpen || scene.chapterDialogueOpen) return;
    const round = Math.floor(scene.time.now / 3200);
    const rolling = scene.time.now % 3200 < 650;
    if (round !== lastRound) {
      values = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
      lastRound = round;
    }
    dice.clear();
    values.forEach((value, index) => {
      const x = 944 + index * 14 + (rolling ? Math.sin(scene.time.now / 60 + index) * 5 : 0);
      const y = 930 + (rolling ? Math.cos(scene.time.now / 70 + index) * 4 : 0);
      dice.fillStyle(0x183f30, 0.5).fillRoundedRect(x - 4, y - 3, 10, 10, 2);
      dice.fillStyle(0xffefce).fillRoundedRect(x - 5, y - 5, 10, 10, 2);
      dice.fillStyle(0x44332a);
      const face = rolling ? 1 + Math.floor(scene.time.now / 80 + index) % 6 : value;
      pips[face].forEach(([px, py]) => dice.fillCircle(x + px, y + py, 0.8));
    });
    scene.dicePlayers.forEach(({ sprite }, index) => sprite.setAngle(rolling ? Math.sin(scene.time.now / 150 + index * Math.PI) * 3 : 0));
  };
  animate();
  scene.events.on('update', animate);
  scene.events.once('shutdown', () => scene.events.off('update', animate));
}

export function clickDicePlayer(scene, point) {
  const person = scene.dicePlayers?.find(({ sprite }) => sprite.visible && Math.abs(point.x - sprite.x) < 24 && point.y > sprite.y - 61 && point.y < sprite.y + 25);
  if (!person) return false;
  if (!canInteract(scene, person.sprite)) return true;
  showNpcDialogue(scene, person.name, person.message);
  openDiceGame(scene, person);
  return true;
}
