import { showNpcDialogue, hideNpcDialogue } from './dialogue.js';
import { startLuisQuest, updateLuisQuestHint, completeLuisQuest, revealBobitaTrail } from './luis-quest.js';
import { handleWinterLuis } from './winter-quest.js';
import { canInteract } from './interaction-range.js';

export const LUIS_CONVERSATION = [
  ['Gdolf', 'Măria Ta, îl caut pe Bobiță… Mr. Grain. L-ai văzut pe aici?'],
  ['Împăratul Luis al XIV-lea', 'L-am văzut acum câteva săptămâni, când am stat împreună la un păhărel de pișdă. Era foarte supărat. Nu prea voia să spună ce avea pe suflet.'],
  ['Gdolf', 'Și după aia unde s-a dus? Trebuie să dau de el.'],
  ['Împăratul Luis al XIV-lea', 'L-am văzut cum a urcat singur în munți… și fără haine! Adu-mi 3 medalioane de aur din pietrele cu aură și îți arăt exact drumul. Ai 50% șansă să găsești un medalion când spargi o piatră. Ai grijă la mobii chemați: poți să-i bați sau să spargi piatra ca să moară toți cei chemați de ea.'],
  ['Gdolf', 'Bine, îți aduc cele 3 medalioane. Dar după aia îmi arăți exact pe unde a plecat Bobiță!'],
];

export function createEmperorLuis(scene) {
  const key = 'emperor-luis';
  if (!scene.textures.exists(key)) {
    const g = scene.make.graphics();
    // Fur-lined royal cloak, powdered wig, gold crown and sceptre.
    g.fillStyle(0x543049).fillTriangle(3, 60, 45, 60, 24, 20);
    g.fillStyle(0x963e55).fillTriangle(6, 58, 42, 58, 24, 22);
    g.fillStyle(0xc1616f).fillRect(10, 35, 4, 20);
    g.fillStyle(0xe7e7d7).fillRect(7, 54, 35, 5);
    g.fillStyle(0xeeeadd).fillEllipse(13, 29, 13, 10).fillEllipse(34, 29, 13, 10);
    g.fillStyle(0x354a76).fillRect(16, 30, 17, 23);
    g.fillStyle(0x6380a3).fillRect(18, 31, 5, 17);
    g.fillStyle(0xe0b866).fillRect(22, 32, 2, 19).fillRect(15, 46, 18, 3);
    g.fillStyle(0x322c34).fillRect(15, 54, 8, 8).fillRect(26, 54, 8, 8);
    g.fillStyle(0xefd4a1).fillRect(17, 58, 3, 2).fillRect(28, 58, 3, 2);
    g.fillStyle(0xe2e1d6).fillRoundedRect(10, 10, 29, 18, 6);
    for (const x of [12, 35]) for (let y = 15; y < 31; y += 5) g.fillStyle(0xfaf4e4).fillCircle(x, y, 4);
    g.fillStyle(0xe4b68d).fillRect(16, 13, 17, 15);
    g.fillStyle(0xf2cfa5).fillRect(17, 14, 12, 9);
    g.fillStyle(0x49322e).fillRect(19, 18, 2, 2).fillRect(28, 18, 2, 2).fillRect(21, 24, 7, 1);
    g.fillStyle(0xdcae53).fillRect(12, 8, 25, 5);
    g.fillTriangle(12, 9, 19, 9, 13, 1).fillTriangle(20, 9, 29, 9, 24, 0).fillTriangle(30, 9, 37, 9, 36, 1);
    g.fillStyle(0xffe5a0).fillRect(13, 9, 23, 2);
    g.fillStyle(0x76c5c8).fillRect(23, 9, 3, 3);
    g.fillStyle(0xd6ae60).fillRect(40, 25, 2, 33).fillCircle(41, 23, 4);
    g.fillStyle(0xf4d99d).fillCircle(40, 22, 2);
    g.fillStyle(0xe4b68d).fillRect(34, 36, 7, 5);
    g.generateTexture(key, 48, 64); g.destroy();
  }
  const x = 930, y = 550;
  const sprite = scene.add.image(x, y, key).setOrigin(0.5, 1).setDepth(10 + y / 100);
  scene.add.ellipse(x, y, 40, 12, 0x536e79, 0.25).setDepth(1);
  scene.add.text(x, y - 78, 'Împăratul Luis al XIV-lea', { fontFamily: 'Arial', fontSize: '10px', color: '#ffe0a0', stroke: '#253342', strokeThickness: 3 }).setOrigin(0.5).setDepth(30);
  scene.add.text(x, y - 94, '!', { fontFamily: 'Arial', fontSize: '12px', color: '#ffe0a0', stroke: '#253342', strokeThickness: 3 }).setOrigin(0.5).setDepth(30);
  scene.level2Solids.add(scene.add.zone(x, y - 6, 24, 14));
  scene.emperorLuis = sprite;
  scene.npcPortraits ||= {};
  scene.npcPortraits['Împăratul Luis al XIV-lea'] = '/assets/Bobita/Luis.png';
}

export function clickEmperorLuis(scene, point) {
  const npc = scene.emperorLuis;
  if (scene.currentLevel !== 2 || !npc?.visible || Math.abs(point.x - npc.x) > 32 || point.y < npc.y - 102 || point.y > npc.y + 12) return false;
  if (!canInteract(scene, npc)) return true;
  if (handleWinterLuis(scene)) return true;
  if (scene.luisQuest) {
    if (completeLuisQuest(scene)) {
      scene.luisRewardPending = true;
      showNpcDialogue(scene, 'Împăratul Luis al XIV-lea', 'Ai adus toate cele 3 medalioane! Cum am promis: Bobiță a trecut prin răscrucea din mijlocul satului, apoi a urcat drept spre trecătoarea din nord. Îți marchez exact drumul cu urme aurii.');
    } else if (scene.luisQuest.status === 'completed') {
      showNpcDialogue(scene, 'Împăratul Luis al XIV-lea', 'Urmează urmele aurii spre trecătoarea din nord. Pe acolo a urcat Bobiță, singur și fără haine.');
    } else {
      updateLuisQuestHint(scene);
      showNpcDialogue(scene, 'Împăratul Luis al XIV-lea', `Ai ${scene.luisQuest.count}/3 medalioane de aur. Adu-mi-le pe toate trei și îți arăt exact drumul lui Bobiță.`);
    }
    return true;
  }
  scene.luisDialogueStep = 0;
  showNpcDialogue(scene, ...LUIS_CONVERSATION[0]);
  return true;
}

export function advanceLuisDialogue(scene) {
  if (scene.luisRewardPending) {
    scene.luisRewardPending = false; hideNpcDialogue(scene); revealBobitaTrail(scene); return true;
  }
  if (scene.luisDialogueStep == null) return false;
  scene.luisDialogueStep += 1;
  const line = LUIS_CONVERSATION[scene.luisDialogueStep];
  if (line) showNpcDialogue(scene, ...line);
  else {
    scene.luisDialogueStep = null;
    scene.metEmperorLuis = true;
    hideNpcDialogue(scene);
    startLuisQuest(scene);
  }
  return true;
}
