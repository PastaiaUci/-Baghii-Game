import { showNpcDialogue, hideNpcDialogue } from './dialogue.js';
import { grantHealthPotion } from './health-potion.js';
import { playSound } from './audio.js';

export const WAKE_ROUNDS = [
  { prompt: 'Sniku mormăie: „Miruna… unde mergem, mă?”', answer: 'mall', choices: [
    { id: 'beer', text: 'Mai dormi, îți păstrez eu berea.' },
    { id: 'mall', text: 'Miruna a zis: „Mergem la mall nebun!”' },
    { id: 'dream', text: 'Lasă, continuă visul ăla despre sex.' },
  ] },
  { prompt: 'Deschide un ochi: „Pavel… iar face o prostie… ce-i zicem?”', answer: 'pavel', choices: [
    { id: 'pavel', text: 'Pavel, nu fi prost! Sniku, hai sus!' },
    { id: 'sleep', text: 'Pavel rezolvă, tu culcă-te la loc.' },
    { id: 'round', text: 'Pavel, încă un rând de băutură!' },
  ] },
  { prompt: 'Sniku se sprijină într-un cot: „Și Daria… de unde o știu pe Daria?”', answer: 'daria', choices: [
    { id: 'austria', text: 'Din Austria, de la Bobiță.' },
    { id: 'parking', text: 'Din parcarea mall-ului, cred.' },
    { id: 'daria', text: 'Daria de la Robosapiens! Hai, trezește-te!' },
  ] },
];

export function getTavernQuest(farm) {
  farm.tavernQuest ||= { status: 'inactive', step: 0, correct: 0 };
  return farm.tavernQuest;
}

export function answerWakeQuest(quest, answer) {
  if (quest.status !== 'active') return 'inactive';
  const round = WAKE_ROUNDS[quest.step];
  if (!round?.choices.some(({ id }) => id === answer)) return 'invalid';
  if (quest.step === 0) quest.correct = 0;
  if (answer === round.answer) quest.correct = (quest.correct || 0) + 1;
  quest.step += 1;
  if (quest.step === WAKE_ROUNDS.length) {
    quest.lastScore = quest.correct;
    if (quest.correct === WAKE_ROUNDS.length) { quest.status = 'walking'; return 'awake'; }
    quest.step = 0; quest.correct = 0;
    return 'failed';
  }
  return 'next';
}

export function updateTavernQuestHint(scene) {
  if (!scene.questHint) return;
  const status = getTavernQuest(scene.farm).status;
  const text = {
    inactive: 'Misiune opțională · Vorbește cu Haralamb sau Chinezu.',
    active: 'Trezește-l pe Sniku · Alege replicile potrivite, apoi revino la Haralamb.',
    walking: 'Sniku s-a trezit · Așteaptă să ajungă la bar și să comande o bere.',
    ready: 'Înapoi la Haralamb · Recompensă: o poțiune de +10 viață.',
    completed: 'Misiune încheiată · Sniku s-a trezit, poțiunea a fost primită.',
  };
  scene.questHint.textContent = text[status];
}

export function talkToTavernNpc(scene, name, fallback) {
  const quest = getTavernQuest(scene.farm);
  scene.dialogChoices.replaceChildren(); scene.dialogChoices.hidden = true;
  scene.dialogOkButton.hidden = false;
  let line = fallback;
  if (name === 'Haralamb' || name === 'Chinezu') {
    if (quest.status === 'inactive') {
      quest.status = 'active'; quest.step = 0;
      line = name === 'Haralamb' ? 'Gdolf, eu și Chinezu avem o rugăminte: trezește-l pe Sniku! Întreabă-l de Miruna, de mall, de Pavel și de Daria de la Robosapiens. Dacă-l aduci pe picioare, întoarce-te la mine și primești o poțiune care reface 10 viață.' : 'Eu și Haralamb nu-l putem trezi pe Sniku. Poate reușești tu cu niște replici cunoscute! După ce se ridică și comandă o bere, Haralamb îți dă o poțiune de 10 viață.';
    } else if (quest.status === 'active') line = 'Sniku e încă pe jos. Încearcă replicile despre Miruna și mall, „Pavel, nu fi prost!” și Daria de la Robosapiens.';
    else if (quest.status === 'walking') line = 'L-ai trezit! Lasă-l să ajungă la bar și să comande berea, apoi vorbim de recompensă.';
    else if (quest.status === 'ready' && name === 'Haralamb') {
      if (grantHealthPotion(scene.farm)) {
        quest.status = 'completed';
        line = 'Ai reușit, Gdolf! Sniku s-a trezit și deja cere o bere. Poftim poțiunea promisă: îți reface 10 viață. O găsești în inventar, pe I.';
      } else line = 'Am poțiunea ta, dar inventarul e plin. Eliberează un loc și revino la mine.';
    } else if (quest.status === 'ready') line = 'Bravo, l-ai pus pe picioare! Mergi la Haralamb pentru poțiunea promisă.';
    else line = 'Mulțumim că l-ai trezit pe Sniku! Haralamb ți-a dat deja poțiunea.';
  } else if (name === 'Sniku') {
    if (quest.status === 'active') { showWakeChoices(scene); return; }
    if (quest.status === 'walking') line = 'Mergem la mall, nebun… dar mai întâi la bar. Am de comandat o bere!';
    else if (quest.status === 'ready' || quest.status === 'completed') line = 'O bere, șefu’! Miruna și mall-ul pot să mai aștepte un minut. Pavel, nu fi prost!';
    else line = 'Mmm… Miruna… mall… încă cinci minute…';
  }
  showNpcDialogue(scene, name, line);
  updateTavernQuestHint(scene);
}

function showWakeChoices(scene) {
  const quest = getTavernQuest(scene.farm);
  const round = WAKE_ROUNDS[quest.step];
  showNpcDialogue(scene, 'Sniku', `${round.prompt}\n\nReplica ${quest.step + 1} / ${WAKE_ROUNDS.length}`);
  scene.dialogOkButton.hidden = true;
  scene.dialogChoices.hidden = false;
  scene.dialogChoices.replaceChildren();
  round.choices.forEach(({ id, text }) => {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = text;
    button.addEventListener('click', () => {
      const result = answerWakeQuest(quest, id);
      if (result === 'next') showWakeChoices(scene);
      else if (result === 'failed') {
        scene.dialogChoices.replaceChildren(); scene.dialogChoices.hidden = true;
        scene.dialogOkButton.hidden = false;
        scene.wakeWalkPending = false;
        showNpcDialogue(scene, 'Sniku', `Doar ${quest.lastScore}/3… nu m-ai convins. Mă culc la loc! Mai încearcă după ce-ți amintești replicile.`);
        updateTavernQuestHint(scene);
      }
      else if (result === 'awake') {
        scene.dialogChoices.replaceChildren(); scene.dialogChoices.hidden = true;
        scene.dialogOkButton.hidden = false;
        scene.wakeWalkPending = true;
        showNpcDialogue(scene, 'Sniku', 'Miruna?! Mall?! Gata, m-am trezit! Pavel, nu fi prost! Merg la bar să comand o bere și după vedem noi de Daria de la Robosapiens.');
        updateTavernQuestHint(scene);
      }
    });
    scene.dialogChoices.appendChild(button);
  });
  const later = document.createElement('button');
  later.type = 'button'; later.className = 'tavern-choice-later'; later.textContent = 'Mai încerc mai târziu';
  later.addEventListener('click', () => { quest.step = 0; quest.correct = 0; hideNpcDialogue(scene); });
  scene.dialogChoices.appendChild(later);
  scene.dialogChoices.querySelector('button').focus();
}

export function startSnikuWalk(scene) {
  const quest = getTavernQuest(scene.farm);
  if (quest.status !== 'walking' || scene.snikuWalking) return;
  const visitor = scene.tavernVisitors.Sniku;
  const { sprite, group, zone, label } = visitor;
  scene.snikuWalking = true;
  scene.wakeWalkPending = false;
  scene.tweens.killTweensOf(group);
  sprite.setRotation(0).setScale(1);
  label.setText('Sniku · la bar');
  const update = () => {
    quest.position = { x: group.x, y: group.y };
    zone.setPosition(group.x, group.y + 14); zone.body.updateFromGameObject();
    group.setDepth(10 + (group.y + 18) / 100);
    label.setPosition(group.x, group.y - 34);
  };
  scene.tweens.add({
    targets: group, x: 680, y: 218, duration: Math.max(300, Math.hypot(group.x - 680, group.y - 218) / 75 * 1000),
    onUpdate: () => { update(); sprite.setTexture(`tavern-sniku-walk-${Math.floor(scene.time.now / 160) % 2 + 1}`); },
    onComplete: () => {
      quest.status = 'ready'; scene.snikuWalking = false;
      sprite.setTexture('tavern-sniku'); update();
      addSnikuBeer(scene);
      const order = scene.add.text(group.x, group.y - 57, 'O bere, șefu’!', { fontFamily: 'Arial', fontSize: '12px', color: '#ffe7b0', stroke: '#30221c', strokeThickness: 3 }).setOrigin(0.5).setDepth(30);
      scene.time.delayedCall(3200, () => order.destroy());
      playSound(scene.farm, 'clink');
      updateTavernQuestHint(scene);
    },
  });
}

export function addSnikuBeer(scene) {
  const visitor = scene.tavernVisitors.Sniku;
  if (visitor.beer) return;
  const mug = scene.add.graphics().setPosition(16, 4);
  mug.fillStyle(0xd9a33f).fillRoundedRect(-4, -8, 9, 13, 2);
  mug.fillStyle(0xffefd0).fillRect(-4, -9, 9, 3);
  visitor.group.add(mug); visitor.beer = mug;
}
