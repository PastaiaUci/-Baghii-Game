import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseHouseChest, giveWinterCoat, enterMiganHouse, attemptMountainPortal, advanceWinterDialogue, handleWinterLuis } from '../src/winter-quest.js';
import { toggleGear } from '../src/gear.js';

function scene() {
  return { currentLevel: 2, player: { x: 800, y: 360, setVelocity() {} }, mountainPortal: { x: 800, y: 330 }, time: { now: 10 }, inventory: [{ type: 'empty' }],
    inventoryUi: { classList: { contains: () => true } }, physics: { world: { pause() {}, resume() {} } },
    dialogBox: { classList: { add() {}, remove() {} }, querySelector: () => ({}) }, dialogName: {}, dialogText: {}, dialogOkButton: { focus() {} },
    setQuest(title, text) { this.quest = { title, text }; }, updateInventoryList() {}, updateHotbarState() {},
  };
}
test('portal failure directs player back to Luis, who unlocks the house quest', () => {
  const s = scene(); assert.equal(attemptMountainPortal(s), true); assert.equal(s.winterQuest.status, 'blocked');
  while (s.winterDialogue) advanceWinterDialogue(s);
  assert.match(s.quest.text, /Luis/); handleWinterLuis(s);
  while (s.winterDialogue) advanceWinterDialogue(s);
  assert.equal(s.winterQuest.status, 'seek-migan'); assert.match(s.quest.text, /Miganul/);
});
test('chest outcome stays fixed and opened traps cannot be farmed repeatedly', () => {
  const s = scene(); s.winterQuest = { status: 'searching', opened: [], correctChest: null };
  assert.equal(chooseHouseChest(s, 0, () => 0.5), 'trap'); assert.equal(s.winterQuest.correctChest, 3);
  assert.equal(chooseHouseChest(s, 0), 'inactive'); assert.equal(chooseHouseChest(s, 7), 'inactive');
  assert.equal(chooseHouseChest(s, 3), 'ointment'); assert.equal(s.inventory[0].type, 'migan-ointment');
  assert.equal(s.winterQuest.status, 'ointment-found');
});
test('a full inventory never loses the ointment; hand-in replaces it with exactly one coat', () => {
  const s = scene(); s.inventory[0] = { type: 'sword' }; s.winterQuest = { status: 'searching', opened: [], correctChest: 2 };
  assert.equal(chooseHouseChest(s, 2), 'full'); assert.deepEqual(s.winterQuest.opened, []);
  s.inventory[0] = { type: 'empty' }; chooseHouseChest(s, 2); assert.equal(giveWinterCoat(s), true);
  assert.equal(s.inventory[0].type, 'winter-coat'); assert.equal(giveWinterCoat(s), false);
  const coat = s.inventory[0]; toggleGear(s, coat); assert.equal(s.equippedArmor, coat); assert.equal(s.inventory[0].type, 'empty');
  s.player.x = 800; s.player.y = 360; s.npcDialogueOpen = false;
  attemptMountainPortal(s); assert.equal(s.winterQuest.status, 'ready');
});
test('house cannot open before Luis explains the winter coat and opens only near its door', () => {
  const s = scene(); let launched = false;
  s.scene = { launch() { launched = true; }, pause() {} };
  assert.equal(enterMiganHouse(s), false);
  s.winterQuest = { status: 'blocked' }; assert.equal(enterMiganHouse(s), false);
  s.winterQuest.status = 'seek-migan'; assert.equal(enterMiganHouse(s), false);
  s.player.x = 420; s.player.y = 1055; assert.equal(enterMiganHouse(s), true); assert.equal(launched, true);
  assert.equal(s.houseActive, true); assert.equal(enterMiganHouse(s), false);
});
