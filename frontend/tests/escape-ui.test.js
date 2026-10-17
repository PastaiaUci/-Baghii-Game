import test from 'node:test';
import assert from 'node:assert/strict';
import { dismissDialogue } from '../src/escape-ui.js';

test('Escape completes conversation cleanup through its existing callbacks', () => {
  let steps = 0;
  const scene = { npcDialogueOpen: true, dialogOkButton: { click() { if (++steps === 3) scene.npcDialogueOpen = false; } } };
  assert.equal(dismissDialogue(scene), true);
  assert.equal(steps, 3);
  assert.equal(scene.npcDialogueOpen, false);
  assert.equal(dismissDialogue(scene), false);
});

test('Escape cancels dialogue choices without selecting an answer', () => {
  let cancelled = false;
  const scene = { npcDialogueOpen: true, dialogOkButton: { hidden: true }, dialogBox: { querySelector() { return { click() { cancelled = true; } }; } } };
  dismissDialogue(scene);
  assert.equal(cancelled, true);
});

test('Escape respects a pending dice roll and never invokes disabled actions', () => {
  const scene = { npcDialogueOpen: true, dialogOkButton: { disabled: true, click() { assert.fail('disabled action'); } } };
  assert.equal(dismissDialogue(scene), true);
});
