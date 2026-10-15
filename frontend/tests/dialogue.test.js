import test from 'node:test';
import assert from 'node:assert/strict';
import { showNpcDialogue, hideNpcDialogue } from '../src/dialogue.js';

function scene() {
  const portrait = {}, kicker = {};
  const s = {
    time: { now: 100 }, pauses: 0, resumes: 0,
    physics: { world: { pause() { s.pauses += 1; }, resume() { s.resumes += 1; } } },
    dialogBox: { classList: { add() {}, remove() {} }, querySelector: (selector) => selector === '.npc-dialog-portrait' ? portrait : kicker },
    dialogName: {}, dialogText: {}, dialogOkButton: { focus() {} }, portrait, kicker,
  };
  return s;
}

test('keeper and Gdolf share the focused dialogue without resuming between replies', () => {
  const s = scene();
  showNpcDialogue(s, 'Cupon Keeper', 'Poftim, uite un cupon.');
  assert.equal(s.npcDialogueOpen, true);
  assert.equal(s.pauses, 1);
  assert.equal(s.portrait.src, '/assets/CuponKeeper.png');
  s.time.now = 500;
  showNpcDialogue(s, 'Gdolf', 'Merci muistule');
  assert.equal(s.pauses, 1);
  assert.equal(s.resumes, 0);
  assert.equal(s.portrait.src, '/assets/Gdolf.png');
  assert.equal(s.kicker.textContent, 'GDOLF · GÂNDURI');
  assert.equal(s.dialogText.textContent, 'Merci muistule');
  hideNpcDialogue(s);
  assert.equal(s.npcDialogueOpen, false);
  assert.equal(s.resumes, 1);
  hideNpcDialogue(s);
  assert.equal(s.resumes, 1);
});

test('reading Tete dialogue preserves the remaining attack warning times', () => {
  const s = scene();
  s.bossFightActive = true;
  s.nextBeerAt = 1000;
  s.nextPuddleAt = 2000;
  s.bossPuddles = [{ createdAt: 50 }];
  const beer = { expiresAt: 3000 };
  s.bossProjectiles = { getChildren: () => [beer] };
  showNpcDialogue(s, 'Tete, The Gooner', 'Pregătește-te!');
  s.time.now = 5100;
  hideNpcDialogue(s);
  assert.equal(s.nextBeerAt, 6000);
  assert.equal(s.nextPuddleAt, 7000);
  assert.equal(s.bossPuddles[0].createdAt, 5050);
  assert.equal(beer.expiresAt, 8000);
  assert.equal(s.portrait.src, '/assets/Tete.png');
});
