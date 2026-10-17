import test from 'node:test';
import assert from 'node:assert/strict';
import { recordReceivedDamage, deathSummary, appendDeathSummary } from '../src/death-summary.js';

test('death summary identifies the last damaging source and ignores fully blocked hits', () => {
  const scene = {};
  recordReceivedDamage(scene, { enemy: 'Tete', attack: 'Bere aruncată' }, 4);
  recordReceivedDamage(scene, { enemy: 'Tete', attack: 'Baltă albă' }, 0);
  assert.match(deathSummary(scene), /Tete\nAtac: Bere aruncată/);
  assert.match(deathSummary(scene), /4 HP/);
  recordReceivedDamage(scene, { enemy: 'Cufărul 3', attack: 'Gaz otrăvitor · Poison' }, 1);
  assert.match(deathSummary(scene), /Cufărul 3/); assert.doesNotMatch(deathSummary(scene), /Bere/);
});

test('summary preserves the existing death dialogue and inserts names safely as text', () => {
  const scene = {}, p = { textContent: 'Mai încerc o dată.', style: {} };
  recordReceivedDamage(scene, { enemy: '<test>', attack: 'Săgeată' }, 2.25);
  appendDeathSummary({ querySelector: () => p }, scene);
  assert.match(p.textContent, /^Mai încerc o dată\./);
  assert.match(p.textContent, /<test>/); assert.match(p.textContent, /2.25 HP/);
  assert.equal(p.style.whiteSpace, 'pre-line');
  assert.match(deathSummary({}), /nu a putut fi identificată/);
});
