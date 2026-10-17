import test from 'node:test';
import assert from 'node:assert/strict';
import { clickEmperorLuis, advanceLuisDialogue, LUIS_CONVERSATION } from '../src/emperor-luis.js';

function setup() {
  const chain = () => { let result; result = new Proxy({}, { get: () => () => result }); return result; };
  return { currentLevel: 2, player: { x: 930, y: 600, setVelocity() {} }, emperorLuis: { x: 930, y: 550, visible: true }, time: { now: 100 },
    add: { ellipse: chain, image: chain }, tweens: { add() {} }, events: { on() {}, once() {} },
    physics: { world: { pause() {}, resume() {} } }, dialogBox: { querySelector: () => ({}), classList: { add() {}, remove() {} } },
    dialogName: {}, dialogText: {}, dialogOkButton: { focus() {} }, setQuest(title, text) { this.quest = { title, text }; },
  };
}
test('Luis dialogue begins only on click in level two and advances through both speakers', () => {
  const s = setup();
  assert.equal(advanceLuisDialogue(s), false);
  assert.equal(clickEmperorLuis(s, { x: 0, y: 0 }), false);
  assert.equal(clickEmperorLuis(s, { x: 930, y: 515 }), true);
  assert.equal(s.dialogName.textContent, 'Gdolf');
  for (const line of LUIS_CONVERSATION.slice(1)) {
    assert.equal(advanceLuisDialogue(s), true);
    assert.equal(s.dialogName.textContent, line[0]); assert.equal(s.dialogText.textContent, line[1]);
    assert.equal(s.npcDialogueOpen, true);
  }
  advanceLuisDialogue(s);
  assert.equal(s.npcDialogueOpen, false); assert.equal(s.metEmperorLuis, true);
  assert.match(s.quest.text, /3 medalioane/);
  assert.equal(s.luisQuest.status, 'active'); assert.equal(s.luisQuest.count, 0);
  assert.equal(advanceLuisDialogue(s), false);
});
test('Luis cannot be interacted with from level one', () => {
  const s = setup(); s.currentLevel = 1;
  assert.equal(clickEmperorLuis(s, { x: 930, y: 515 }), false);
  assert.equal(s.luisDialogueStep, undefined);
});

test('clicking Luis from across the map does not open or advance dialogue', () => {
  const s = setup(); s.player = { x: 200, y: 200 };
  assert.equal(clickEmperorLuis(s, { x: 930, y: 515 }), true);
  assert.equal(s.luisDialogueStep, undefined);
  assert.equal(s.npcDialogueOpen, undefined);
  s.player = { x: 930, y: 600, setVelocity() {} };
  clickEmperorLuis(s, { x: 930, y: 515 });
  assert.equal(s.npcDialogueOpen, true);
});
