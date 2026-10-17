import { grantXp } from './leveling.js';
import { showNpcDialogue, hideNpcDialogue } from './dialogue.js';

export const MIGAN_DOOR = { x: 420, y: 1035 };
export function winterHint(scene) {
  const status = scene.winterQuest?.status;
  const hints = {
    blocked: ['Portalul refuză trecerea', 'Întoarce-te la Luis și întreabă de ce nu puteți intra.'],
    'seek-migan': ['O Scurtă de Iarnă', 'Intră în casa lui Miganul, în sud-vestul satului.'],
    searching: ['Alifia lui Miganul', 'Caută alifia în cuferele casei și du-o lui Miganul.'],
    'ointment-found': ['Înapoi la Miganul', 'Du-i alifia pentru a primi Scurta de Iarnă.'],
    'coat-owned': ['Echipează Scurta de Iarnă', 'Click pe scurtă în inventar, apoi întoarce-te la portalul din nord.'],
    ready: ['Pregătit pentru munți', 'Scurta de Iarnă te protejează. Destinația portalului va fi disponibilă în continuarea poveștii.'],
  };
  if (hints[status]) scene.setQuest(...hints[status]);
}
export function showWinterDialogue(scene, lines, done = null) {
  scene.winterDialogue = { lines, index: 0, done };
  showNpcDialogue(scene, ...lines[0]);
}
export function advanceWinterDialogue(scene) {
  const dialogue = scene.winterDialogue;
  if (!dialogue) return false;
  dialogue.index += 1;
  if (dialogue.lines[dialogue.index]) showNpcDialogue(scene, ...dialogue.lines[dialogue.index]);
  else { scene.winterDialogue = null; hideNpcDialogue(scene); dialogue.done?.(); }
  return true;
}
export function attemptMountainPortal(scene) {
  if (scene.currentLevel !== 2 || !scene.mountainPortal || scene.npcDialogueOpen || scene.chapterDialogueOpen || scene.bookOpen || scene.gameOver || scene.tavernActive || !scene.inventoryUi.classList.contains('hidden')) return false;
  if (Math.hypot(scene.player.x - scene.mountainPortal.x, scene.player.y - scene.mountainPortal.y) > 75) return false;
  if (!scene.winterQuest) {
    scene.winterQuest = { status: 'blocked', opened: [], correctChest: null };
    showWinterDialogue(scene, [
      ['Gdolf', 'Ce naiba? Încerc să intru și portalul mă împinge înapoi. Tete, tu poți trece?'],
      ['Tete', 'Nici eu nu pot. Dinspre munți vine un frig de îți îngheață și berea. Hai înapoi la Luis să vedem ce lipsește.'],
      ['Gdolf', 'Bine. Luis, sper că nu ne mai trimiți după alte medalioane!'],
    ], () => winterHint(scene));
  } else if (scene.equippedArmor?.type === 'winter-coat') {
    scene.winterQuest.status = 'ready'; winterHint(scene);
    showNpcDialogue(scene, 'Gdolf', 'Acum am Scurta de Iarnă și sunt pregătit pentru frig. Portalul este pregătit; drumul prin munți urmează în continuarea poveștii.');
  } else {
    showNpcDialogue(scene, 'Gdolf', scene.winterQuest.status === 'coat-owned' ? 'Trebuie să-mi pun Scurta de Iarnă. O echipez din inventar.' : 'Tot nu putem trece. Mai întâi trebuie să rezolvăm cu echipamentul de iarnă.');
  }
  return true;
}
export function handleWinterLuis(scene) {
  if (!scene.winterQuest) return false;
  if (scene.winterQuest.status === 'blocked') {
    showWinterDialogue(scene, [
      ['Gdolf', 'Luis, am ajuns la portal, dar nu ne lasă să trecem. De ce?'],
      ['Împăratul Luis al XIV-lea', 'Ah, da! Ai nevoie de o Scurtă de Iarnă ca să poți merge pe vârful munților. Am uitat să-ți spun.'],
      ['Împăratul Luis al XIV-lea', 'Mergi la Miganul, în casa din sud-vestul satului. Are o scurtă zdravănă. Sigur va vrea să-l ajuți cu ceva înainte să ți-o dea.'],
    ], () => { scene.winterQuest.status = 'seek-migan'; winterHint(scene); });
  } else {
    showNpcDialogue(scene, 'Împăratul Luis al XIV-lea', 'Pentru munți îți trebuie Scurta de Iarnă. Vorbește cu Miganul în casa din sud-vest și ajută-l.');
    winterHint(scene);
  }
  return true;
}
export function chooseHouseChest(scene, index, random = Math.random) {
  const quest = scene.winterQuest;
  if (!quest || quest.status !== 'searching' || !Number.isInteger(index) || index < 0 || index >= 6 || quest.opened.includes(index)) return 'inactive';
  quest.correctChest ??= Math.floor(random() * 6);
  if (index === quest.correctChest) {
    const slot = scene.inventory.findIndex(({ type }) => type === 'empty');
    if (slot < 0) return 'full';
    scene.inventory[slot] = { type: 'migan-ointment', key: String(slot + 1), label: 'Alifia lui Miganul · Obiect de misiune' };
    quest.opened.push(index); quest.status = 'ointment-found';
    scene.updateInventoryList(); scene.updateHotbarState(); winterHint(scene);
    return 'ointment';
  }
  quest.opened.push(index);
  return 'trap';
}
export function giveWinterCoat(scene) {
  if (scene.winterQuest?.status !== 'ointment-found') return false;
  const slot = scene.inventory.findIndex(({ type }) => type === 'migan-ointment');
  if (slot < 0) return false;
  scene.inventory[slot] = { type: 'winter-coat', label: 'Scurta de Iarnă · Protecție pentru munți · Click pentru echipare', key: String(slot + 1) };
  scene.winterQuest.status = 'coat-owned';
  grantXp(scene, 80);
  scene.updateInventoryList(); scene.updateHotbarState(); winterHint(scene); return true;
}
export function enterMiganHouse(scene) {
  if (scene.currentLevel !== 2 || !scene.winterQuest || scene.winterQuest.status === 'blocked' || scene.tavernActive || scene.npcDialogueOpen || scene.bookOpen || scene.gameOver || scene.chapterDialogueOpen || scene.levelTransitioning || !scene.inventoryUi.classList.contains('hidden')) return false;
  if (Math.hypot(scene.player.x - MIGAN_DOOR.x, scene.player.y - MIGAN_DOOR.y) > 78) return false;
  scene.houseActive = scene.tavernActive = true;
  scene.player.setVelocity(0, 0); scene.partyTete?.setVelocity(0, 0);
  scene.scene.launch('MiganHouseScene', { farm: scene }); scene.scene.pause(); return true;
}
export function clickWinterObject(scene, point) {
  if (scene.currentLevel !== 2) return false;
  if (scene.mountainPortal && Math.hypot(point.x - scene.mountainPortal.x, point.y - scene.mountainPortal.y) < 45) { attemptMountainPortal(scene); return true; }
  if (Math.abs(point.x - MIGAN_DOOR.x) < 25 && Math.abs(point.y - MIGAN_DOOR.y) < 36) return enterMiganHouse(scene);
  return false;
}
